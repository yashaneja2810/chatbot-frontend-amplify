# Amazon DynamoDB Schema Design

## Overview
DynamoDB will replace Qdrant for vector storage. This document outlines the table design for storing embeddings and performing similarity search.

## Why DynamoDB for Vectors?

While DynamoDB isn't a native vector database, it can effectively store vectors for small to medium-scale applications:
- **Free Tier**: 25 GB storage, 25 WCU, 25 RCU
- **Low Latency**: Single-digit millisecond response times
- **Scalability**: Auto-scaling within free tier limits
- **Cost**: $0 for most small applications

## Table Design

### Table 1: VectorEmbeddings

Stores document chunks and their embeddings.

```
Table Name: VectorEmbeddings
Partition Key: bot_id (String)
Sort Key: chunk_id (String)
```

#### Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| bot_id | String | Bot identifier (Partition Key) |
| chunk_id | String | Unique chunk ID (Sort Key) |
| embedding | List<Number> | 384-dimensional vector |
| text | String | Original text chunk |
| filename | String | Source document name |
| file_size | Number | File size in bytes |
| chunk_index | Number | Position in document |
| created_at | String | ISO timestamp |
| metadata | Map | Additional metadata |

#### Global Secondary Index (GSI)

```
Index Name: filename-index
Partition Key: bot_id
Sort Key: filename
```

This allows querying all chunks from a specific document.

### Table 2: BotCollections

Stores bot metadata and statistics.

```
Table Name: BotCollections
Partition Key: bot_id (String)
```

#### Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| bot_id | String | Bot identifier (Partition Key) |
| user_id | String | Owner user ID |
| name | String | Bot/company name |
| total_chunks | Number | Total document chunks |
| total_documents | Number | Number of documents |
| embedding_dimension | Number | Vector dimension (384) |
| created_at | String | ISO timestamp |
| updated_at | String | ISO timestamp |
| status | String | active/inactive |

## DynamoDB Table Creation

### Via AWS Console

1. Go to DynamoDB Console
2. Click "Create table"
3. Configure:
   - **Table name**: VectorEmbeddings
   - **Partition key**: bot_id (String)
   - **Sort key**: chunk_id (String)
   - **Table settings**: Default settings
   - **Read/write capacity**: On-demand (or Provisioned with auto-scaling)

4. Create GSI:
   - **Index name**: filename-index
   - **Partition key**: bot_id
   - **Sort key**: filename
   - **Projected attributes**: All

5. Repeat for BotCollections table

### Via AWS CLI

```bash
# Create VectorEmbeddings table
aws dynamodb create-table \
    --table-name VectorEmbeddings \
    --attribute-definitions \
        AttributeName=bot_id,AttributeType=S \
        AttributeName=chunk_id,AttributeType=S \
        AttributeName=filename,AttributeType=S \
    --key-schema \
        AttributeName=bot_id,KeyType=HASH \
        AttributeName=chunk_id,KeyType=RANGE \
    --billing-mode PAY_PER_REQUEST \
    --global-secondary-indexes \
        "[{
            \"IndexName\": \"filename-index\",
            \"KeySchema\": [
                {\"AttributeName\":\"bot_id\",\"KeyType\":\"HASH\"},
                {\"AttributeName\":\"filename\",\"KeyType\":\"RANGE\"}
            ],
            \"Projection\": {\"ProjectionType\":\"ALL\"}
        }]" \
    --region us-east-1

# Create BotCollections table
aws dynamodb create-table \
    --table-name BotCollections \
    --attribute-definitions \
        AttributeName=bot_id,AttributeType=S \
    --key-schema \
        AttributeName=bot_id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region us-east-1
```

### Via CloudFormation

See `aws/cloudformation/dynamodb-tables.yaml`

## Vector Similarity Search Implementation

Since DynamoDB doesn't have native vector search, we implement it in application code:

### Strategy 1: Scan and Compute (Small Scale)

For bots with < 1000 chunks:

```python
import numpy as np
from typing import List, Dict
import boto3
from boto3.dynamodb.conditions import Key

class DynamoDBVectorStore:
    def __init__(self):
        self.dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
        self.table = self.dynamodb.Table('VectorEmbeddings')
    
    def cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Calculate cosine similarity between two vectors"""
        vec1 = np.array(vec1)
        vec2 = np.array(vec2)
        return np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))
    
    def search(self, bot_id: str, query_embedding: List[float], limit: int = 5) -> List[Dict]:
        """Search for similar vectors"""
        # Query all chunks for this bot
        response = self.table.query(
            KeyConditionExpression=Key('bot_id').eq(bot_id)
        )
        
        items = response['Items']
        
        # Calculate similarity scores
        results = []
        for item in items:
            embedding = item['embedding']
            score = self.cosine_similarity(query_embedding, embedding)
            results.append({
                'text': item['text'],
                'score': float(score),
                'metadata': {
                    'filename': item.get('filename'),
                    'chunk_index': item.get('chunk_index')
                }
            })
        
        # Sort by score and return top results
        results.sort(key=lambda x: x['score'], reverse=True)
        return results[:limit]
```

### Strategy 2: Parallel Scan (Medium Scale)

For bots with 1000-10000 chunks:

```python
import concurrent.futures

class DynamoDBVectorStoreOptimized:
    def __init__(self):
        self.dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
        self.table = self.dynamodb.Table('VectorEmbeddings')
    
    def search_parallel(self, bot_id: str, query_embedding: List[float], 
                       limit: int = 5, segments: int = 4) -> List[Dict]:
        """Parallel scan for better performance"""
        
        def scan_segment(segment_num):
            response = self.table.query(
                KeyConditionExpression=Key('bot_id').eq(bot_id),
                Segment=segment_num,
                TotalSegments=segments
            )
            return response['Items']
        
        # Parallel scan
        with concurrent.futures.ThreadPoolExecutor(max_workers=segments) as executor:
            futures = [executor.submit(scan_segment, i) for i in range(segments)]
            all_items = []
            for future in concurrent.futures.as_completed(futures):
                all_items.extend(future.result())
        
        # Calculate similarities
        results = []
        for item in all_items:
            score = self.cosine_similarity(query_embedding, item['embedding'])
            results.append({
                'text': item['text'],
                'score': float(score),
                'metadata': {
                    'filename': item.get('filename'),
                    'chunk_index': item.get('chunk_index')
                }
            })
        
        results.sort(key=lambda x: x['score'], reverse=True)
        return results[:limit]
```

### Strategy 3: Hybrid with Caching (Large Scale)

For bots with > 10000 chunks, consider:
- Use ElastiCache (Redis) for caching frequent queries
- Implement approximate nearest neighbor (ANN) algorithms
- Consider AWS OpenSearch Service (has vector search capabilities)

## Data Operations

### Insert Vectors

```python
def add_vectors(self, bot_id: str, chunks: List[Dict]):
    """Batch insert vectors"""
    with self.table.batch_writer() as batch:
        for chunk in chunks:
            batch.put_item(Item={
                'bot_id': bot_id,
                'chunk_id': chunk['chunk_id'],
                'embedding': chunk['embedding'],
                'text': chunk['text'],
                'filename': chunk['filename'],
                'file_size': chunk['file_size'],
                'chunk_index': chunk['chunk_index'],
                'created_at': chunk['created_at'],
                'metadata': chunk.get('metadata', {})
            })
```

### Delete Bot Vectors

```python
def delete_bot_vectors(self, bot_id: str):
    """Delete all vectors for a bot"""
    # Query all chunks
    response = self.table.query(
        KeyConditionExpression=Key('bot_id').eq(bot_id),
        ProjectionExpression='bot_id, chunk_id'
    )
    
    # Batch delete
    with self.table.batch_writer() as batch:
        for item in response['Items']:
            batch.delete_item(Key={
                'bot_id': item['bot_id'],
                'chunk_id': item['chunk_id']
            })
```

### Get Bot Documents

```python
def get_bot_documents(self, bot_id: str) -> List[Dict]:
    """Get all documents for a bot"""
    response = self.table.query(
        IndexName='filename-index',
        KeyConditionExpression=Key('bot_id').eq(bot_id),
        ProjectionExpression='filename, file_size, created_at'
    )
    
    # Group by filename
    documents = {}
    for item in response['Items']:
        filename = item['filename']
        if filename not in documents:
            documents[filename] = {
                'filename': filename,
                'file_size': item['file_size'],
                'created_at': item['created_at'],
                'chunk_count': 0
            }
        documents[filename]['chunk_count'] += 1
    
    return list(documents.values())
```

## Performance Optimization

### 1. Use Batch Operations
- Batch write up to 25 items at once
- Batch get for reading multiple items

### 2. Projection Expressions
- Only retrieve needed attributes
- Reduces data transfer and costs

### 3. Consistent Reads
- Use eventually consistent reads (cheaper)
- Use strongly consistent only when necessary

### 4. Caching
- Cache frequently accessed vectors
- Use ElastiCache for Redis

### 5. Compression
- Compress large text fields
- Use quantization for embeddings (reduce precision)

## Cost Optimization

### Free Tier Usage
- 25 GB storage (≈ 65,000 vectors with metadata)
- 25 WCU (Write Capacity Units)
- 25 RCU (Read Capacity Units)

### Estimations
- **1 vector write**: ~1 WCU (1 KB item)
- **1 vector read**: ~0.5 RCU (eventually consistent)
- **1000 vectors/day**: ~30 WCU/month (within free tier)

### Beyond Free Tier
- On-demand pricing: $1.25 per million write requests
- Provisioned capacity: $0.00065 per WCU-hour

## Migration from Qdrant

See `aws/migration-scripts/migrate_vectors.py` for migration script.

## Monitoring

### CloudWatch Metrics
- ConsumedReadCapacityUnits
- ConsumedWriteCapacityUnits
- UserErrors
- SystemErrors
- ThrottledRequests

### Alarms
- Set alarm for throttled requests
- Monitor consumed capacity vs provisioned

## Alternative: AWS OpenSearch

If vector search performance is critical and you exceed DynamoDB's capabilities:

**AWS OpenSearch Service** (formerly Elasticsearch):
- Native k-NN vector search
- Better for large-scale vector operations
- Free tier: 750 hours of t2.small.search or t3.small.search
- Supports approximate nearest neighbor (ANN) algorithms

## Next Steps

1. Create DynamoDB tables
2. Implement vector store service
3. Test similarity search performance
4. Migrate vectors from Qdrant
5. Monitor performance and costs
6. Optimize based on usage patterns
