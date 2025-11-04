"""
AWS Lambda Handler for Authentication - Adapted from your backend
Replaces Supabase Auth with Amazon Cognito
"""

import json
import boto3
import os
from botocore.exceptions import ClientError
from datetime import datetime

# Initialize Cognito client
cognito_client = boto3.client('cognito-idp', region_name=os.environ['AWS_REGION'])
dynamodb = boto3.resource('dynamodb', region_name=os.environ['AWS_REGION'])

USER_POOL_ID = os.environ['COGNITO_USER_POOL_ID']
CLIENT_ID = os.environ['COGNITO_APP_CLIENT_ID']
BOTS_TABLE = os.environ['DYNAMODB_BOTS_TABLE']

bots_table = dynamodb.Table(BOTS_TABLE)


def lambda_handler(event, context):
    """Main Lambda handler"""
    
    # Parse request
    http_method = event.get('httpMethod')
    path = event.get('path', '')
    body = json.loads(event.get('body', '{}'))
    
    # Route to appropriate handler
    if path.endswith('/register'):
        return handle_register(body)
    elif path.endswith('/login'):
        return handle_login(body)
    elif path.endswith('/logout'):
        return handle_logout(event)
    elif path.endswith('/verify'):
        return handle_verify(event)
    else:
        return response(404, {'error': 'Not found'})


def handle_register(body):
    """Register a new user - matches your sign_up logic"""
    try:
        email = body.get('email')
        password = body.get('password')
        
        if not email or not password:
            return response(400, {'error': 'Email and password required'})
        
        # Create user in Cognito
        user_attributes = [
            {'Name': 'email', 'Value': email}
        ]
        
        cognito_response = cognito_client.sign_up(
            ClientId=CLIENT_ID,
            Username=email,
            Password=password,
            UserAttributes=user_attributes
        )
        
        # Get user details
        user_sub = cognito_response['UserSub']
        
        return response(200, {
            'message': 'Registration successful',
            'user': {
                'id': user_sub,
                'email': email,
                'created_at': datetime.utcnow().isoformat()
            }
        })
        
    except ClientError as e:
        error_code = e.response['Error']['Code']
        error_message = e.response['Error']['Message']
        
        if error_code == 'UsernameExistsException':
            return response(400, {'error': 'User already exists'})
        elif error_code == 'InvalidPasswordException':
            return response(400, {'error': 'Password does not meet requirements'})
        else:
            return response(400, {'error': error_message})
    except Exception as e:
        return response(500, {'error': str(e)})


def handle_login(body):
    """Login user - matches your sign_in logic"""
    try:
        email = body.get('email')
        password = body.get('password')
        
        if not email or not password:
            return response(400, {'error': 'Email and password required'})
        
        # Authenticate user
        auth_response = cognito_client.initiate_auth(
            ClientId=CLIENT_ID,
            AuthFlow='USER_PASSWORD_AUTH',
            AuthParameters={
                'USERNAME': email,
                'PASSWORD': password
            }
        )
        
        # Get user details
        access_token = auth_response['AuthenticationResult']['AccessToken']
        user_info = cognito_client.get_user(AccessToken=access_token)
        
        # Extract user attributes
        user_attributes = {attr['Name']: attr['Value'] 
                          for attr in user_info['UserAttributes']}
        
        user_id = user_attributes.get('sub')
        
        # Get user's bots (matches your get_user_bots logic)
        bots = get_user_bots(user_id)
        
        return response(200, {
            'message': 'Login successful',
            'access_token': access_token,
            'refresh_token': auth_response['AuthenticationResult']['RefreshToken'],
            'token_type': 'bearer',
            'user': {
                'id': user_id,
                'email': user_attributes.get('email'),
                'name': user_attributes.get('name', ''),
                'email_verified': user_attributes.get('email_verified') == 'true'
            },
            'bots': bots
        })
        
    except ClientError as e:
        error_code = e.response['Error']['Code']
        
        if error_code == 'NotAuthorizedException':
            return response(401, {'error': 'Invalid credentials'})
        elif error_code == 'UserNotConfirmedException':
            return response(400, {'error': 'User not confirmed. Please verify your email.'})
        else:
            return response(401, {'error': 'Authentication failed'})
    except Exception as e:
        return response(500, {'error': str(e)})


def handle_logout(event):
    """Logout user"""
    try:
        # Extract token from Authorization header
        auth_header = event.get('headers', {}).get('Authorization', '')
        if auth_header.startswith('Bearer '):
            access_token = auth_header.split(' ')[1]
            
            # Sign out user (invalidate token)
            try:
                cognito_client.global_sign_out(AccessToken=access_token)
            except:
                pass  # Token might already be invalid
        
        return response(200, {'message': 'Logout successful'})
        
    except Exception as e:
        return response(200, {'message': 'Logout successful'})  # Always return success


def handle_verify(event):
    """Verify access token - matches your verify_token logic"""
    try:
        # Extract token from Authorization header
        auth_header = event.get('headers', {}).get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return response(401, {'error': 'No authorization token provided'})
        
        access_token = auth_header.split(' ')[1]
        
        # Verify token and get user info
        user_info = cognito_client.get_user(AccessToken=access_token)
        
        user_attributes = {attr['Name']: attr['Value'] 
                          for attr in user_info['UserAttributes']}
        
        return response(200, {
            'user': {
                'id': user_attributes.get('sub'),
                'email': user_attributes.get('email'),
                'name': user_attributes.get('name', ''),
                'email_verified': user_attributes.get('email_verified') == 'true'
            }
        })
        
    except ClientError as e:
        error_code = e.response['Error']['Code']
        if error_code == 'NotAuthorizedException':
            return response(401, {'error': 'Invalid or expired token'})
        else:
            return response(401, {'error': 'Token verification failed'})
    except Exception as e:
        return response(401, {'error': str(e)})


def get_user_bots(user_id: str):
    """Get all bots for a user - matches your get_user_bots logic"""
    try:
        # Query bots by user_id using GSI
        query_response = bots_table.query(
            IndexName='user-index',
            KeyConditionExpression='user_id = :user_id',
            ExpressionAttributeValues={':user_id': user_id}
        )
        
        bots = []
        for item in query_response['Items']:
            bots.append({
                'id': item.get('bot_id'),
                'bot_id': item.get('bot_id'),
                'name': item.get('name', 'Unnamed Bot'),
                'company_name': item.get('name', 'Unnamed Bot'),
                'created_at': item.get('created_at', datetime.utcnow().isoformat()),
                'status': 'ready',
                'user_id': user_id
            })
        
        return bots
        
    except Exception as e:
        print(f"Error getting user bots: {str(e)}")
        return []


def response(status_code, body):
    """Format API Gateway response"""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        'body': json.dumps(body)
    }
