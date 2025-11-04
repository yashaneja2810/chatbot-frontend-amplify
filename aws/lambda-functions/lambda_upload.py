"""
AWS Lambda Handler for Document Upload - Adapted from your backend
Handles file upload to S3 and vector processing with DynamoDB
"""

import json
import boto3
import os
import uuid
import base64
from datetime import datetime
from typing import List, Dict
import io

# Initialize AWS clients
s3_client = boto3.client('s3', region_name=os.environ['AWS_REGION'])
dynamodb = boto3.resource('dynamodb', region_name=os.environ['AWS_REGION'])
cognito_client = boto3.client('cognito-idp', region_name=os.environ['AWS_REGION'])

# Environment variables
S3_BUCKET = os.environ['S3_BUCKET_NAME']
VECTORS_TABLE = os.environ['DYNAMODB_VECTORS_TABLE']
BOTS_TABLE = os.environ['DYNAMODB_BOTS_TABLE']
USER_POOL_ID = os.environ['COGNITO_USER_POOL_ID']

# DynamoDB tables
vectors_table = dynamodb.Table(VECTORS_TABLE)
bots_table = dynamodb.Table(BOTS_TABLE)


def lambda_handler(event, context):
    """Main Lambda handler for document upload"""
    
    try:
        # Get user from Authorization header
        auth_header = event.get('headers', {}).get('Authorization', '') or event.get('headers', {}).get('authorization', '')
        if not auth_header or not auth_header.startswith('Bearer '):
            return response(401, {'error': 'No authorization token provided'})
        
        access_token = auth_header.split(' ')[1]
        
        # Verify token and get user info
        try:
            user_info = cognito_client.get_user(AccessToken=access_token)
            user_attributes = {attr['Name']: attr['Value'] for attr in user_info['UserAttributes']}
            user_id = user_attributes.get('sub')
        except Exception as e:
            return response(401, {'error': 'Invalid or expired token'})
        
        # Parse request body
        body = event.get('body', '')
        
        # Try to parse as JSON first
        try:
            if isinstance(body, str):
                form_data = json.loads(body)
            else:
                form_data = body
        except:
            # If not JSON, try multipart (simplified)
            is_base64 = event.get('isBase64Encoded', False)
            if is_base64:
                body = base64.b64decode(body).decode('utf-8')
            form_data = parse_form_data(body, event.get('headers', {}))
        
        company_name = form_data.get('company_name') or form_data.get('name')
        files = form_data.get('files', [])
        
        if not company_name:
            return response(422, {'error': 'Company name is required'})
        
        if not files:
            return response(422, {'error': 'At least one file is required'})
        
        # Create bot
        bot_id = str(uuid.uuid4())
        
        # Process each file
        all_chunks = []
        document_metadata = []
        
        for file_data in files:
            filename = file_data.get('filename')
            content_base64 = file_data.get('content')
            content_type = file_data.get('content_type', 'application/octet-stream')
            
            # Decode base64 content
            if isinstance(content_base64, str):
                content = base64.b64decode(content_base64)
            else:
                content = content_base64
            
            # Validate file type
            if not is_valid_file_type(filename):
                return response(422, {
                    'error': f'Unsupported file type: {filename}. Only PDF, DOCX, and TXT are supported.'
                })
            
            file_size = len(content)
            
            # Upload to S3
            s3_key = f"documents/{user_id}/{bot_id}/{filename}"
            s3_client.put_object(
                Bucket=S3_BUCKET,
                Key=s3_key,
                Body=content,
                ContentType=content_type,
                Metadata={
                    'user_id': user_id,
                    'bot_id': bot_id,
                    'original_filename': filename
                }
            )
            
            # Process document and extract chunks
            chunks = process_document(content, filename, content_type)
            
            # Add metadata to chunks
            for i, chunk in enumerate(chunks):
                chunk['filename'] = filename
                chunk['file_size'] = file_size
                chunk['chunk_index'] = i
                chunk['s3_key'] = s3_key
            
            all_chunks.extend(chunks)
            
            document_metadata.append({
                'filename': filename,
                'file_size': file_size,
                's3_key': s3_key,
                'chunk_count': len(chunks)
            })
        
        # Generate embeddings and store in DynamoDB
        store_vectors(bot_id, user_id, all_chunks)
        
        # Create bot record in DynamoDB
        create_bot_record(bot_id, user_id, company_name, document_metadata)
        
        # Generate widget code
        widget_code = generate_widget_code(bot_id, company_name)
        
        return response(200, {
            'bot_id': bot_id,
            'message': 'Documents processed successfully',
            'widget_code': widget_code,
            'documents_processed': len(files),
            'total_chunks': len(all_chunks)
        })
        
    except Exception as e:
        print(f"Error in upload handler: {str(e)}")
        return response(500, {'error': f'Upload failed: {str(e)}'})


def parse_form_data(body: str, headers: dict) -> dict:
    """Parse multipart form data (simplified)"""
    # This is a simplified parser - in production use proper multipart parser
    # For now, assume JSON format for testing
    try:
        return json.loads(body)
    except:
        return {}


def is_valid_file_type(filename: str) -> bool:
    """Check if file type is supported"""
    valid_extensions = ['.pdf', '.docx', '.txt']
    return any(filename.lower().endswith(ext) for ext in valid_extensions)


def process_document(content: bytes, filename: str, content_type: str) -> List[Dict]:
    """Process document and extract text chunks"""
    
    try:
        if filename.endswith('.txt'):
            text = content.decode('utf-8')
        else:
            # For PDF/DOCX, use basic text extraction
            # In production, add proper PDF/DOCX parsing
            text = content.decode('utf-8', errors='ignore')
        
        # Split into chunks (matches your DocumentProcessor logic)
        chunks = chunk_text(text, chunk_size=500, overlap=50)
        
        return [{'text': chunk} for chunk in chunks]
        
    except Exception as e:
        print(f"Error processing document {filename}: {str(e)}")
        return [{'text': f"Content from {filename}"}]


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
    """Split text into overlapping chunks"""
    chunks = []
    start = 0
    text_length = len(text)
    
    while start < text_length:
        end = start + chunk_size
        chunk = text[start:end]
        
        if chunk.strip():
            chunks.append(chunk.strip())
        
        start = end - overlap
    
    return chunks


def generate_embeddings(texts: List[str]) -> List[List[float]]:
    """
    Generate embeddings for text chunks
    Note: In production, use SageMaker endpoint or Lambda Layer with sentence-transformers
    For now, returns dummy embeddings for testing
    """
    import random
    embeddings = []
    for text in texts:
        random.seed(hash(text) % (2**32))
        embedding = [random.random() for _ in range(384)]
        embeddings.append(embedding)
    return embeddings


def store_vectors(bot_id: str, user_id: str, chunks: List[Dict]):
    """Store vectors in DynamoDB"""
    
    # Generate embeddings
    texts = [chunk['text'] for chunk in chunks]
    embeddings = generate_embeddings(texts)
    
    # Batch write to DynamoDB
    with vectors_table.batch_writer() as batch:
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            chunk_id = str(uuid.uuid4())
            
            item = {
                'bot_id': bot_id,
                'chunk_id': chunk_id,
                'embedding': embedding,
                'text': chunk['text'],
                'filename': chunk.get('filename', ''),
                'file_size': chunk.get('file_size', 0),
                'chunk_index': chunk.get('chunk_index', i),
                'created_at': datetime.utcnow().isoformat(),
                'metadata': {
                    's3_key': chunk.get('s3_key', ''),
                    'user_id': user_id
                }
            }
            
            batch.put_item(Item=item)


def create_bot_record(bot_id: str, user_id: str, name: str, documents: List[Dict]):
    """Create bot record in DynamoDB"""
    
    total_chunks = sum(doc['chunk_count'] for doc in documents)
    
    bots_table.put_item(Item={
        'bot_id': bot_id,
        'user_id': user_id,
        'name': name,
        'total_chunks': total_chunks,
        'total_documents': len(documents),
        'embedding_dimension': 384,
        'created_at': datetime.utcnow().isoformat(),
        'updated_at': datetime.utcnow().isoformat(),
        'status': 'active',
        'documents': documents
    })


def generate_widget_code(bot_id: str, company_name: str) -> str:
    """Generate embeddable widget code"""
    
    api_url = os.environ.get('API_GATEWAY_URL', 'https://api.example.com')
    
    widget_code = f"""<!-- {company_name} Chatbot Widget -->
<div id="chatbot-widget-{bot_id}"></div>
<script src="{api_url}/widget.js" data-bot-id="{bot_id}"></script>"""
    
    return widget_code.strip()


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
