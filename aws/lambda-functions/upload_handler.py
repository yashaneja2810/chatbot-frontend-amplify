"""
AWS Lambda Handler for Document Upload
Handles file upload to S3 and vector processing
"""

import json
import boto3
import os
import uuid
import base64
from datetime import datetime
from typing import List, Dict

# Initialize AWS clients
s3_client = boto3.client('s3', region_name=os.environ['AWS_REGION'])
dynamodb = boto3.resource('dynamodb', region_name=os.environ['AWS_REGION'])
rds_client = boto3.client('rds-data', region_name=os.environ['AWS_REGION'])

# Environment variables
S3_BUCKET = os.environ['S3_BUCKET_NAME']
VECTORS_TABLE = os.environ['DYNAMODB_VECTORS_TABLE']
BOTS_TABLE = os.environ['DYNAMODB_BOTS_TABLE']
RDS_ARN = os.environ.get('RDS_CLUSTER_ARN')
RDS_SECRET_ARN = os.environ.get('RDS_SECRET_ARN')
RDS_DATABASE = os.environ.get('RDS_DATABASE_NAME', 'chatbot_db')

# DynamoDB tables
vectors_table = dynamodb.Table(VECTORS_TABLE)
bots_table = dynamodb.Table(BOTS_TABLE)


def lambda_handler(event, context):
    """Main Lambda handler for document upload"""
    
    try:
        # Parse request
        body = json.loads(event.get('body', '{}'))
        
        # Get user from Cognito authorizer
        user_id = event['requestContext']['authorizer']['claims']['sub']
        user_email = event['requestContext']['authorizer']['claims']['email']
        
        # Extract form data
        company_name = body.get('company_name')
        files = body.get('files', [])  # List of {filename, content_base64, content_type}
        
        if not company_name:
            return response(400, {'error': 'Company name is required'})
        
        if not files:
            return response(400, {'error': 'At least one file is required'})
        
        # Create bot
        bot_id = str(uuid.uuid4())
        
        # Process each file
        all_chunks = []
        document_metadata = []
        
        for file_data in files:
            filename = file_data.get('filename')
            content_base64 = file_data.get('content')
            content_type = file_data.get('content_type', 'application/octet-stream')
            
            # Validate file type
            if not is_valid_file_type(filename):
                return response(400, {
                    'error': f'Unsupported file type: {filename}. Only PDF, DOCX, and TXT are supported.'
                })
            
            # Decode file content
            file_content = base64.b64decode(content_base64)
            file_size = len(file_content)
            
            # Upload to S3
            s3_key = f"documents/{user_id}/{bot_id}/{filename}"
            s3_client.put_object(
                Bucket=S3_BUCKET,
                Key=s3_key,
                Body=file_content,
                ContentType=content_type,
                Metadata={
                    'user_id': user_id,
                    'bot_id': bot_id,
                    'original_filename': filename
                }
            )
            
            # Process document and extract chunks
            chunks = process_document(file_content, filename, content_type)
            
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
        
        # Create bot record in RDS (for relational queries)
        create_bot_in_rds(bot_id, user_id, company_name)
        
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


def is_valid_file_type(filename: str) -> bool:
    """Check if file type is supported"""
    valid_extensions = ['.pdf', '.docx', '.txt']
    return any(filename.lower().endswith(ext) for ext in valid_extensions)


def process_document(content: bytes, filename: str, content_type: str) -> List[Dict]:
    """
    Process document and extract text chunks
    Note: This is a simplified version. In production, you'd use:
    - PyPDF2 for PDFs
    - python-docx for DOCX
    - Direct reading for TXT
    
    For Lambda, these libraries should be in a Lambda Layer
    """
    
    # For this example, we'll assume text content
    # In production, implement proper document parsing
    
    try:
        if filename.endswith('.txt'):
            text = content.decode('utf-8')
        else:
            # For PDF/DOCX, you'd use appropriate libraries
            # This is placeholder logic
            text = f"Content from {filename}"
        
        # Split into chunks (simple implementation)
        chunks = chunk_text(text, chunk_size=500, overlap=50)
        
        return [{'text': chunk} for chunk in chunks]
        
    except Exception as e:
        print(f"Error processing document {filename}: {str(e)}")
        return [{'text': f"Error processing {filename}"}]


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
    Note: In production, this should use SageMaker or a Lambda Layer with sentence-transformers
    For now, returns dummy embeddings
    """
    # Placeholder: In production, use sentence-transformers
    # This would be in a Lambda Layer
    import random
    return [[random.random() for _ in range(384)] for _ in texts]


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


def create_bot_in_rds(bot_id: str, user_id: str, name: str):
    """Create bot record in RDS PostgreSQL"""
    
    if not RDS_ARN or not RDS_SECRET_ARN:
        print("RDS not configured, skipping RDS insert")
        return
    
    try:
        sql = """
        INSERT INTO bots (bot_id, user_id, name, created_at, updated_at)
        VALUES (:bot_id, :user_id, :name, NOW(), NOW())
        """
        
        rds_client.execute_statement(
            resourceArn=RDS_ARN,
            secretArn=RDS_SECRET_ARN,
            database=RDS_DATABASE,
            sql=sql,
            parameters=[
                {'name': 'bot_id', 'value': {'stringValue': bot_id}},
                {'name': 'user_id', 'value': {'stringValue': user_id}},
                {'name': 'name', 'value': {'stringValue': name}}
            ]
        )
    except Exception as e:
        print(f"Error creating bot in RDS: {str(e)}")


def generate_widget_code(bot_id: str, company_name: str) -> str:
    """Generate embeddable widget code"""
    
    api_url = os.environ.get('API_GATEWAY_URL', 'https://api.example.com')
    
    widget_code = f"""
<!-- {company_name} Chatbot Widget -->
<div id="chatbot-widget-{bot_id}"></div>
<script>
  (function() {{
    const botId = '{bot_id}';
    const apiUrl = '{api_url}';
    
    // Widget initialization code
    const widget = document.createElement('div');
    widget.innerHTML = `
      <div style="position: fixed; bottom: 20px; right: 20px; z-index: 9999;">
        <button id="chat-toggle" style="background: #4F46E5; color: white; border: none; 
                border-radius: 50%; width: 60px; height: 60px; cursor: pointer; 
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          💬
        </button>
        <div id="chat-window" style="display: none; position: absolute; bottom: 70px; 
             right: 0; width: 350px; height: 500px; background: white; 
             border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);">
          <div style="padding: 20px; border-bottom: 1px solid #e5e7eb;">
            <h3 style="margin: 0; color: #1f2937;">{company_name} Assistant</h3>
          </div>
          <div id="chat-messages" style="height: 380px; overflow-y: auto; padding: 20px;"></div>
          <div style="padding: 10px; border-top: 1px solid #e5e7eb;">
            <input id="chat-input" type="text" placeholder="Ask a question..." 
                   style="width: 100%; padding: 10px; border: 1px solid #d1d5db; 
                   border-radius: 5px; outline: none;">
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(widget);
    
    // Toggle chat window
    document.getElementById('chat-toggle').addEventListener('click', function() {{
      const chatWindow = document.getElementById('chat-window');
      chatWindow.style.display = chatWindow.style.display === 'none' ? 'block' : 'none';
    }});
    
    // Handle chat input
    document.getElementById('chat-input').addEventListener('keypress', async function(e) {{
      if (e.key === 'Enter' && this.value.trim()) {{
        const query = this.value.trim();
        this.value = '';
        
        // Add user message
        addMessage(query, 'user');
        
        // Send to API
        try {{
          const response = await fetch(`${{apiUrl}}/api/chat`, {{
            method: 'POST',
            headers: {{ 'Content-Type': 'application/json' }},
            body: JSON.stringify({{ bot_id: botId, query: query }})
          }});
          
          const data = await response.json();
          addMessage(data.response, 'bot');
        }} catch (error) {{
          addMessage('Sorry, I encountered an error. Please try again.', 'bot');
        }}
      }}
    }});
    
    function addMessage(text, sender) {{
      const messagesDiv = document.getElementById('chat-messages');
      const messageDiv = document.createElement('div');
      messageDiv.style.marginBottom = '10px';
      messageDiv.style.textAlign = sender === 'user' ? 'right' : 'left';
      messageDiv.innerHTML = `
        <div style="display: inline-block; padding: 10px; border-radius: 10px; 
             max-width: 80%; background: ${{sender === 'user' ? '#4F46E5' : '#f3f4f6'}}; 
             color: ${{sender === 'user' ? 'white' : '#1f2937'}};">
          ${{text}}
        </div>
      `;
      messagesDiv.appendChild(messageDiv);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }}
  }})();
</script>
"""
    
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
