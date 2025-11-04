"""
Migrate vector embeddings from Qdrant to DynamoDB
"""

import boto3
import os
from qdrant_client import QdrantClient
from dotenv import load_dotenv
import uuid
from datetime import datetime

load_dotenv()

# Qdrant client
qdrant_url = os.getenv('QDRANT_URL')
qdrant_api_key = os.getenv('QDRANT_API_KEY')
qdrant_client = QdrantClient(url=qdrant_url, api_key=qdrant_api_key)

# AWS DynamoDB
dynamodb = boto3.resource('dynamodb', region_name=os.getenv('AWS_REGION', 'us-east-1'))
vectors_table = dynamodb.Table(os.getenv('DYNAMODB_VECTORS_TABLE', 'VectorEmbeddings'))
bots_table = dynamodb.Table(os.getenv('DYNAMODB_BOTS_TABLE', 'BotCollections'))


def list_qdrant_collections():
    """List all collections in Qdrant"""
    try:
        collections = qdrant_client.get_collections()
        return [col.name for col in collections.collections]
    except Exception as e:
        print(f"Error listing Qdrant collections: {str(e)}")
        return []


def get_collection_points(collection_name, limit=100):
    """Get all points from a Qdrant collection"""
    try:
        points = []
        offset = None
        
        while True:
            result = qdrant_client.scroll(
                collection_name=collection_name,
                limit=limit,
                offset=offset,
                with_payload=True,
                with_vectors=True
            )
            
            batch_points, next_offset = result
            
            if not batch_points:
                break
            
            points.extend(batch_points)
            
            if next_offset is None:
                break
            
            offset = next_offset
        
        return points
        
    except Exception as e:
        print(f"Error getting points from {collection_name}: {str(e)}")
        return []


def migrate_collection(collection_name, bot_id=None, user_id=None):
    """Migrate a single collection from Qdrant to DynamoDB"""
    
    if not bot_id:
        bot_id = collection_name  # Use collection name as bot_id
    
    print(f"\nMigrating collection: {collection_name}")
    print(f"Bot ID: {bot_id}")
    
    # Get all points from Qdrant
    points = get_collection_points(collection_name)
    
    if not points:
        print(f"No points found in collection {collection_name}")
        return
    
    print(f"Found {len(points)} points to migrate")
    
    # Migrate points to DynamoDB in batches
    batch_size = 25  # DynamoDB batch write limit
    migrated = 0
    failed = 0
    
    for i in range(0, len(points), batch_size):
        batch = points[i:i+batch_size]
        
        try:
            with vectors_table.batch_writer() as writer:
                for point in batch:
                    # Extract data from Qdrant point
                    vector = point.vector
                    payload = point.payload or {}
                    
                    # Create DynamoDB item
                    item = {
                        'bot_id': bot_id,
                        'chunk_id': str(uuid.uuid4()),
                        'embedding': vector,
                        'text': payload.get('text', ''),
                        'filename': payload.get('filename', 'unknown'),
                        'file_size': payload.get('file_size', 0),
                        'chunk_index': payload.get('chunk_index', 0),
                        'created_at': payload.get('created_at', datetime.utcnow().isoformat()),
                        'metadata': {
                            'original_id': str(point.id),
                            'user_id': user_id or payload.get('user_id', ''),
                            **{k: v for k, v in payload.items() 
                               if k not in ['text', 'filename', 'file_size', 'chunk_index', 'created_at']}
                        }
                    }
                    
                    writer.put_item(Item=item)
                    migrated += 1
            
            print(f"  Migrated batch {i//batch_size + 1}: {len(batch)} points")
            
        except Exception as e:
            print(f"  Error migrating batch: {str(e)}")
            failed += len(batch)
    
    print(f"\nMigration summary for {collection_name}:")
    print(f"  Migrated: {migrated}")
    print(f"  Failed: {failed}")
    
    # Create bot record in DynamoDB
    if user_id:
        create_bot_record(bot_id, user_id, collection_name, migrated)
    
    return migrated, failed


def create_bot_record(bot_id, user_id, name, total_chunks):
    """Create bot record in DynamoDB"""
    try:
        bots_table.put_item(Item={
            'bot_id': bot_id,
            'user_id': user_id,
            'name': name,
            'total_chunks': total_chunks,
            'total_documents': 0,  # Unknown from Qdrant
            'embedding_dimension': 384,
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat(),
            'status': 'active',
            'migrated_from': 'qdrant'
        })
        print(f"✓ Created bot record for {bot_id}")
    except Exception as e:
        print(f"✗ Error creating bot record: {str(e)}")


def migrate_all_collections(user_mapping=None):
    """
    Migrate all collections from Qdrant to DynamoDB
    
    Args:
        user_mapping: Dict mapping collection_name to user_id
                     e.g., {'collection1': 'user123', 'collection2': 'user456'}
    """
    collections = list_qdrant_collections()
    
    if not collections:
        print("No collections found in Qdrant")
        return
    
    print(f"Found {len(collections)} collections to migrate:")
    for col in collections:
        print(f"  - {col}")
    
    total_migrated = 0
    total_failed = 0
    
    for collection_name in collections:
        user_id = user_mapping.get(collection_name) if user_mapping else None
        migrated, failed = migrate_collection(collection_name, user_id=user_id)
        total_migrated += migrated
        total_failed += failed
    
    print(f"\n{'='*50}")
    print(f"Total migration summary:")
    print(f"  Collections: {len(collections)}")
    print(f"  Points migrated: {total_migrated}")
    print(f"  Points failed: {total_failed}")
    print(f"{'='*50}")


def verify_migration(bot_id):
    """Verify that migration was successful"""
    
    print(f"\nVerifying migration for bot: {bot_id}")
    
    # Count points in DynamoDB
    try:
        response = vectors_table.query(
            KeyConditionExpression='bot_id = :bot_id',
            ExpressionAttributeValues={':bot_id': bot_id},
            Select='COUNT'
        )
        
        dynamodb_count = response['Count']
        print(f"  DynamoDB points: {dynamodb_count}")
        
        # Get sample point
        sample_response = vectors_table.query(
            KeyConditionExpression='bot_id = :bot_id',
            ExpressionAttributeValues={':bot_id': bot_id},
            Limit=1
        )
        
        if sample_response['Items']:
            sample = sample_response['Items'][0]
            print(f"  Sample point:")
            print(f"    Text: {sample.get('text', '')[:100]}...")
            print(f"    Embedding dimension: {len(sample.get('embedding', []))}")
            print(f"    Filename: {sample.get('filename', 'N/A')}")
        
        return dynamodb_count
        
    except Exception as e:
        print(f"  Error verifying migration: {str(e)}")
        return 0


def export_collection_mapping():
    """Export collection to user mapping template"""
    collections = list_qdrant_collections()
    
    mapping = {}
    for col in collections:
        mapping[col] = "USER_ID_HERE"
    
    import json
    with open('collection_mapping.json', 'w') as f:
        json.dump(mapping, f, indent=2)
    
    print(f"Exported collection mapping template to collection_mapping.json")
    print("Please edit this file to map collections to user IDs")


if __name__ == '__main__':
    import sys
    import json
    
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python migrate_vectors.py list")
        print("  python migrate_vectors.py export-mapping")
        print("  python migrate_vectors.py migrate-all [mapping.json]")
        print("  python migrate_vectors.py migrate <collection_name> [user_id]")
        print("  python migrate_vectors.py verify <bot_id>")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == 'list':
        collections = list_qdrant_collections()
        print(f"Qdrant collections ({len(collections)}):")
        for col in collections:
            print(f"  - {col}")
    
    elif command == 'export-mapping':
        export_collection_mapping()
    
    elif command == 'migrate-all':
        user_mapping = None
        if len(sys.argv) > 2:
            mapping_file = sys.argv[2]
            with open(mapping_file, 'r') as f:
                user_mapping = json.load(f)
        
        migrate_all_collections(user_mapping)
    
    elif command == 'migrate':
        if len(sys.argv) < 3:
            print("Error: collection_name required")
            sys.exit(1)
        
        collection_name = sys.argv[2]
        user_id = sys.argv[3] if len(sys.argv) > 3 else None
        
        migrate_collection(collection_name, user_id=user_id)
    
    elif command == 'verify':
        if len(sys.argv) < 3:
            print("Error: bot_id required")
            sys.exit(1)
        
        bot_id = sys.argv[2]
        verify_migration(bot_id)
    
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)
