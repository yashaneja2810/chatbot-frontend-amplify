"""
AWS Lambda Handler for Chat
Handles chat queries with vector similarity search and AI response generation
"""

import json
import boto3
import os
import numpy as np
from typing import List, Dict
from boto3.dynamodb.conditions import Key

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb', region_name=os.environ['AWS_REGION'])
bedrock_runtime = boto3.client('bedrock-runtime', region_name=os.environ['AWS_REGION'])

# Environment variables
VECTORS_TABLE = os.environ['DYNAMODB_VECTORS_TABLE']
GOOGLE_API_KEY = os.environ.get('GOOGLE_API_KEY')

# DynamoDB table
vectors_table = dynamodb.Table(VECTORS_TABLE)


def lambda_handler(event, context):
    """Main Lambda handler for chat"""
    
    try:
        # Parse request
        body = json.loads(event.get('body', '{}'))
        
        bot_id = body.get('bot_id')
        query = body.get('query')
        
        if not bot_id:
            return response(400, {'error': 'bot_id is required'})
        
        if not query:
            return response(400, {'error': 'query is required'})
        
        # Generate query embedding
        query_embedding = generate_embedding(query)
        
        # Search for similar vectors
        similar_chunks = search_similar_vectors(bot_id, query_embedding, limit=5)
        
        if not similar_chunks:
            return response(200, {
                'response': "I don't have enough information to answer that question. Please try rephrasing or ask something else."
            })
        
        # Build context from similar chunks
        context = build_context(similar_chunks)
        
        # Generate AI response
        ai_response = generate_ai_response(query, context)
        
        return response(200, {
            'response': ai_response,
            'sources': [
                {
                    'filename': chunk['metadata'].get('filename'),
                    'score': chunk['score']
                }
                for chunk in similar_chunks[:3]
            ]
        })
        
    except Exception as e:
        print(f"Error in chat handler: {str(e)}")
        return response(500, {'error': f'Chat failed: {str(e)}'})


def generate_embedding(text: str) -> List[float]:
    """
    Generate embedding for text
    Note: In production, use SageMaker endpoint or Lambda Layer with sentence-transformers
    """
    # Placeholder: Returns dummy embedding
    # In production, use sentence-transformers model
    import random
    random.seed(hash(text) % (2**32))
    return [random.random() for _ in range(384)]


def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """Calculate cosine similarity between two vectors"""
    vec1 = np.array(vec1)
    vec2 = np.array(vec2)
    
    dot_product = np.dot(vec1, vec2)
    norm1 = np.linalg.norm(vec1)
    norm2 = np.linalg.norm(vec2)
    
    if norm1 == 0 or norm2 == 0:
        return 0.0
    
    return float(dot_product / (norm1 * norm2))


def search_similar_vectors(bot_id: str, query_embedding: List[float], 
                          limit: int = 5) -> List[Dict]:
    """
    Search for similar vectors in DynamoDB
    Uses cosine similarity for ranking
    """
    
    try:
        # Query all vectors for this bot
        query_response = vectors_table.query(
            KeyConditionExpression=Key('bot_id').eq(bot_id)
        )
        
        items = query_response['Items']
        
        # Handle pagination if needed
        while 'LastEvaluatedKey' in query_response:
            query_response = vectors_table.query(
                KeyConditionExpression=Key('bot_id').eq(bot_id),
                ExclusiveStartKey=query_response['LastEvaluatedKey']
            )
            items.extend(query_response['Items'])
        
        # Calculate similarity scores
        results = []
        for item in items:
            embedding = item.get('embedding', [])
            if not embedding:
                continue
            
            score = cosine_similarity(query_embedding, embedding)
            
            results.append({
                'text': item.get('text', ''),
                'score': score,
                'metadata': {
                    'filename': item.get('filename', ''),
                    'chunk_index': item.get('chunk_index', 0),
                    'created_at': item.get('created_at', '')
                }
            })
        
        # Sort by score (descending) and return top results
        results.sort(key=lambda x: x['score'], reverse=True)
        
        return results[:limit]
        
    except Exception as e:
        print(f"Error searching vectors: {str(e)}")
        return []


def build_context(chunks: List[Dict]) -> str:
    """Build context string from similar chunks"""
    
    context_parts = []
    for i, chunk in enumerate(chunks, 1):
        text = chunk['text']
        filename = chunk['metadata'].get('filename', 'Unknown')
        context_parts.append(f"[Source {i} - {filename}]\n{text}\n")
    
    return "\n".join(context_parts)


def generate_ai_response(query: str, context: str) -> str:
    """
    Generate AI response using Google Gemini API
    Note: This requires GOOGLE_API_KEY environment variable
    """
    
    if not GOOGLE_API_KEY:
        return "AI service not configured. Please contact support."
    
    try:
        # Use Google Gemini API
        import google.generativeai as genai
        
        genai.configure(api_key=GOOGLE_API_KEY)
        model = genai.GenerativeModel('gemini-pro')
        
        prompt = f"""You are a helpful AI assistant. Answer the user's question based on the provided context.
If the context doesn't contain relevant information, politely say so.

Context:
{context}

Question: {query}

Answer:"""
        
        response = model.generate_content(prompt)
        return response.text
        
    except ImportError:
        # Fallback: Use simple template-based response
        return generate_fallback_response(query, context)
    except Exception as e:
        print(f"Error generating AI response: {str(e)}")
        return generate_fallback_response(query, context)


def generate_fallback_response(query: str, context: str) -> str:
    """
    Fallback response when AI service is unavailable
    Returns relevant context chunks
    """
    
    # Simple keyword matching
    query_lower = query.lower()
    context_lower = context.lower()
    
    if any(word in context_lower for word in query_lower.split()):
        # Extract most relevant paragraph
        paragraphs = context.split('\n\n')
        for para in paragraphs:
            if any(word in para.lower() for word in query_lower.split()):
                return f"Based on the available information: {para[:500]}..."
    
    return "I found some relevant information, but I'm unable to generate a detailed response at the moment. Please try rephrasing your question."


def response(status_code, body):
    """Format API Gateway response"""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        'body': json.dumps(body)
    }


# Additional helper for batch processing (if needed)
def search_similar_vectors_parallel(bot_id: str, query_embedding: List[float], 
                                   limit: int = 5, segments: int = 4) -> List[Dict]:
    """
    Parallel scan for better performance with large datasets
    Uses DynamoDB parallel scan
    """
    
    import concurrent.futures
    
    def scan_segment(segment_num):
        response = vectors_table.query(
            KeyConditionExpression=Key('bot_id').eq(bot_id),
            Segment=segment_num,
            TotalSegments=segments
        )
        return response['Items']
    
    # Parallel scan
    all_items = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=segments) as executor:
        futures = [executor.submit(scan_segment, i) for i in range(segments)]
        for future in concurrent.futures.as_completed(futures):
            try:
                all_items.extend(future.result())
            except Exception as e:
                print(f"Error in parallel scan: {str(e)}")
    
    # Calculate similarities
    results = []
    for item in all_items:
        embedding = item.get('embedding', [])
        if not embedding:
            continue
        
        score = cosine_similarity(query_embedding, embedding)
        results.append({
            'text': item.get('text', ''),
            'score': score,
            'metadata': {
                'filename': item.get('filename', ''),
                'chunk_index': item.get('chunk_index', 0)
            }
        })
    
    results.sort(key=lambda x: x['score'], reverse=True)
    return results[:limit]
