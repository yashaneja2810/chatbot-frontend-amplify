"""
AWS Lambda Handler for Bot Management
Handles bot CRUD operations
"""

import json
import boto3
import os
from boto3.dynamodb.conditions import Key, Attr
from datetime import datetime

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb', region_name=os.environ['AWS_REGION'])
s3_client = boto3.client('s3', region_name=os.environ['AWS_REGION'])

# Environment variables
VECTORS_TABLE = os.environ['DYNAMODB_VECTORS_TABLE']
BOTS_TABLE = os.environ['DYNAMODB_BOTS_TABLE']
S3_BUCKET = os.environ['S3_BUCKET_NAME']

# DynamoDB tables
vectors_table = dynamodb.Table(VECTORS_TABLE)
bots_table = dynamodb.Table(BOTS_TABLE)


def lambda_handler(event, context):
    """Main Lambda handler for bot operations"""
    
    try:
        # Get user from Cognito authorizer
        user_id = event['requestContext']['authorizer']['claims']['sub']
        
        # Parse request
        http_method = event.get('httpMethod')
        path = event.get('path', '')
        path_parameters = event.get('pathParameters', {})
        query_parameters = event.get('queryStringParameters', {}) or {}
        
        # Route to appropriate handler
        if http_method == 'GET' and '/bots' in path and not path_parameters:
            # GET /api/bots - List user's bots
            return handle_list_bots(user_id)
        
        elif http_method == 'GET' and '/bots/' in path and 'bot_id' in path_parameters:
            # GET /api/bots/{bot_id} - Get bot details
            bot_id = path_parameters['bot_id']
            return handle_get_bot(bot_id, user_id)
        
        elif http_method == 'GET' and '/documents' in path:
            # GET /api/bots/{bot_id}/documents - Get bot documents
            bot_id = path_parameters.get('bot_id')
            return handle_get_documents(bot_id, user_id)
        
        elif http_method == 'DELETE' and '/bots/' in path:
            # DELETE /api/bots/{bot_id} - Delete bot
            bot_id = path_parameters['bot_id']
            return handle_delete_bot(bot_id, user_id)
        
        elif http_method == 'GET' and '/stats' in path:
            # GET /api/bots/stats - Get aggregated stats
            return handle_get_stats(user_id)
        
        else:
            return response(404, {'error': 'Not found'})
        
    except Exception as e:
        print(f"Error in bots handler: {str(e)}")
        return response(500, {'error': str(e)})


def handle_list_bots(user_id: str):
    """List all bots for a user"""
    
    try:
        # Query bots by user_id using GSI
        # Note: You need to create a GSI on user_id
        query_response = bots_table.scan(
            FilterExpression=Attr('user_id').eq(user_id)
        )
        
        bots = query_response['Items']
        
        # Format response
        formatted_bots = []
        for bot in bots:
            formatted_bots.append({
                'bot_id': bot['bot_id'],
                'name': bot['name'],
                'total_chunks': bot.get('total_chunks', 0),
                'total_documents': bot.get('total_documents', 0),
                'created_at': bot.get('created_at', ''),
                'updated_at': bot.get('updated_at', ''),
                'status': bot.get('status', 'active')
            })
        
        return response(200, formatted_bots)
        
    except Exception as e:
        print(f"Error listing bots: {str(e)}")
        return response(500, {'error': 'Failed to list bots'})


def handle_get_bot(bot_id: str, user_id: str):
    """Get details of a specific bot"""
    
    try:
        # Get bot from DynamoDB
        bot_response = bots_table.get_item(Key={'bot_id': bot_id})
        
        if 'Item' not in bot_response:
            return response(404, {'error': 'Bot not found'})
        
        bot = bot_response['Item']
        
        # Verify ownership
        if bot.get('user_id') != user_id:
            return response(403, {'error': 'Access denied'})
        
        return response(200, bot)
        
    except Exception as e:
        print(f"Error getting bot: {str(e)}")
        return response(500, {'error': 'Failed to get bot'})


def handle_get_documents(bot_id: str, user_id: str):
    """Get all documents for a bot"""
    
    try:
        # Verify bot ownership
        bot_response = bots_table.get_item(Key={'bot_id': bot_id})
        
        if 'Item' not in bot_response:
            return response(404, {'error': 'Bot not found'})
        
        bot = bot_response['Item']
        
        if bot.get('user_id') != user_id:
            return response(403, {'error': 'Access denied'})
        
        # Get documents from bot metadata
        documents = bot.get('documents', [])
        
        # Alternatively, query vectors table with filename index
        # This gives real-time document list
        vector_response = vectors_table.query(
            IndexName='filename-index',
            KeyConditionExpression=Key('bot_id').eq(bot_id),
            ProjectionExpression='filename, file_size, created_at'
        )
        
        # Group by filename
        doc_map = {}
        for item in vector_response['Items']:
            filename = item['filename']
            if filename not in doc_map:
                doc_map[filename] = {
                    'filename': filename,
                    'file_size': item['file_size'],
                    'created_at': item['created_at'],
                    'chunk_count': 0
                }
            doc_map[filename]['chunk_count'] += 1
        
        documents = list(doc_map.values())
        
        return response(200, {'documents': documents})
        
    except Exception as e:
        print(f"Error getting documents: {str(e)}")
        return response(500, {'error': 'Failed to get documents'})


def handle_delete_bot(bot_id: str, user_id: str):
    """Delete a bot and all associated data"""
    
    try:
        # Verify bot ownership
        bot_response = bots_table.get_item(Key={'bot_id': bot_id})
        
        if 'Item' not in bot_response:
            return response(404, {'error': 'Bot not found'})
        
        bot = bot_response['Item']
        
        if bot.get('user_id') != user_id:
            return response(403, {'error': 'Access denied'})
        
        # Delete vectors from DynamoDB
        delete_bot_vectors(bot_id)
        
        # Delete documents from S3
        delete_bot_documents_from_s3(user_id, bot_id)
        
        # Delete bot record
        bots_table.delete_item(Key={'bot_id': bot_id})
        
        return response(200, {'message': 'Bot deleted successfully'})
        
    except Exception as e:
        print(f"Error deleting bot: {str(e)}")
        return response(500, {'error': 'Failed to delete bot'})


def delete_bot_vectors(bot_id: str):
    """Delete all vectors for a bot"""
    
    try:
        # Query all vectors for this bot
        query_response = vectors_table.query(
            KeyConditionExpression=Key('bot_id').eq(bot_id),
            ProjectionExpression='bot_id, chunk_id'
        )
        
        items = query_response['Items']
        
        # Handle pagination
        while 'LastEvaluatedKey' in query_response:
            query_response = vectors_table.query(
                KeyConditionExpression=Key('bot_id').eq(bot_id),
                ProjectionExpression='bot_id, chunk_id',
                ExclusiveStartKey=query_response['LastEvaluatedKey']
            )
            items.extend(query_response['Items'])
        
        # Batch delete (max 25 items per batch)
        with vectors_table.batch_writer() as batch:
            for item in items:
                batch.delete_item(Key={
                    'bot_id': item['bot_id'],
                    'chunk_id': item['chunk_id']
                })
        
        print(f"Deleted {len(items)} vectors for bot {bot_id}")
        
    except Exception as e:
        print(f"Error deleting vectors: {str(e)}")
        raise


def delete_bot_documents_from_s3(user_id: str, bot_id: str):
    """Delete all documents for a bot from S3"""
    
    try:
        # List all objects with prefix
        prefix = f"documents/{user_id}/{bot_id}/"
        
        paginator = s3_client.get_paginator('list_objects_v2')
        pages = paginator.paginate(Bucket=S3_BUCKET, Prefix=prefix)
        
        objects_to_delete = []
        for page in pages:
            if 'Contents' in page:
                for obj in page['Contents']:
                    objects_to_delete.append({'Key': obj['Key']})
        
        # Delete objects (max 1000 per request)
        if objects_to_delete:
            for i in range(0, len(objects_to_delete), 1000):
                batch = objects_to_delete[i:i+1000]
                s3_client.delete_objects(
                    Bucket=S3_BUCKET,
                    Delete={'Objects': batch}
                )
        
        print(f"Deleted {len(objects_to_delete)} documents from S3 for bot {bot_id}")
        
    except Exception as e:
        print(f"Error deleting S3 documents: {str(e)}")
        # Don't raise - S3 deletion is not critical


def handle_get_stats(user_id: str):
    """Get aggregated statistics for user's bots"""
    
    try:
        # Get all user bots
        query_response = bots_table.scan(
            FilterExpression=Attr('user_id').eq(user_id)
        )
        
        bots = query_response['Items']
        
        # Calculate stats
        total_bots = len(bots)
        total_documents = sum(bot.get('total_documents', 0) for bot in bots)
        total_chunks = sum(bot.get('total_chunks', 0) for bot in bots)
        
        # Mock stats (in production, track these in a separate table)
        stats = {
            'totalBots': total_bots,
            'totalDocuments': total_documents,
            'totalChunks': total_chunks,
            'totalMessages': 0,  # Would track in messages table
            'responseRate': 100,
            'avgResponseTime': 0.5,
            'errorRate': 0
        }
        
        return response(200, stats)
        
    except Exception as e:
        print(f"Error getting stats: {str(e)}")
        return response(500, {'error': 'Failed to get stats'})


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
