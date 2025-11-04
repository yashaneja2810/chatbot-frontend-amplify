"""
AWS Lambda Handler for Authentication
Handles user signup, signin, and token verification
"""

import json
import boto3
import os
from botocore.exceptions import ClientError

# Initialize Cognito client
cognito_client = boto3.client('cognito-idp', region_name=os.environ['AWS_REGION'])
USER_POOL_ID = os.environ['COGNITO_USER_POOL_ID']
CLIENT_ID = os.environ['COGNITO_APP_CLIENT_ID']

def lambda_handler(event, context):
    """Main Lambda handler"""
    
    # Parse request
    http_method = event.get('httpMethod')
    path = event.get('path', '')
    body = json.loads(event.get('body', '{}'))
    
    # Route to appropriate handler
    if path.endswith('/signup'):
        return handle_signup(body)
    elif path.endswith('/signin') or path.endswith('/login'):
        return handle_signin(body)
    elif path.endswith('/verify'):
        return handle_verify(body)
    elif path.endswith('/confirm'):
        return handle_confirm(body)
    elif path.endswith('/refresh'):
        return handle_refresh(body)
    else:
        return response(404, {'error': 'Not found'})


def handle_signup(body):
    """Handle user registration"""
    try:
        email = body.get('email')
        password = body.get('password')
        name = body.get('name', '')
        
        if not email or not password:
            return response(400, {'error': 'Email and password required'})
        
        # Create user in Cognito
        user_attributes = [
            {'Name': 'email', 'Value': email}
        ]
        
        if name:
            user_attributes.append({'Name': 'name', 'Value': name})
        
        cognito_response = cognito_client.sign_up(
            ClientId=CLIENT_ID,
            Username=email,
            Password=password,
            UserAttributes=user_attributes
        )
        
        return response(200, {
            'message': 'User registered successfully',
            'user_sub': cognito_response['UserSub'],
            'user_confirmed': cognito_response['UserConfirmed']
        })
        
    except ClientError as e:
        error_code = e.response['Error']['Code']
        error_message = e.response['Error']['Message']
        
        if error_code == 'UsernameExistsException':
            return response(400, {'error': 'User already exists'})
        elif error_code == 'InvalidPasswordException':
            return response(400, {'error': 'Password does not meet requirements'})
        else:
            return response(500, {'error': error_message})
    except Exception as e:
        return response(500, {'error': str(e)})


def handle_signin(body):
    """Handle user login"""
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
        
        return response(200, {
            'access_token': access_token,
            'id_token': auth_response['AuthenticationResult']['IdToken'],
            'refresh_token': auth_response['AuthenticationResult']['RefreshToken'],
            'expires_in': auth_response['AuthenticationResult']['ExpiresIn'],
            'user': {
                'id': user_attributes.get('sub'),
                'email': user_attributes.get('email'),
                'name': user_attributes.get('name', ''),
                'email_verified': user_attributes.get('email_verified') == 'true'
            }
        })
        
    except ClientError as e:
        error_code = e.response['Error']['Code']
        error_message = e.response['Error']['Message']
        
        if error_code == 'NotAuthorizedException':
            return response(401, {'error': 'Invalid credentials'})
        elif error_code == 'UserNotConfirmedException':
            return response(400, {'error': 'User not confirmed. Please verify your email.'})
        else:
            return response(500, {'error': error_message})
    except Exception as e:
        return response(500, {'error': str(e)})


def handle_confirm(body):
    """Handle email confirmation"""
    try:
        email = body.get('email')
        code = body.get('code')
        
        if not email or not code:
            return response(400, {'error': 'Email and confirmation code required'})
        
        cognito_client.confirm_sign_up(
            ClientId=CLIENT_ID,
            Username=email,
            ConfirmationCode=code
        )
        
        return response(200, {'message': 'Email confirmed successfully'})
        
    except ClientError as e:
        error_code = e.response['Error']['Code']
        error_message = e.response['Error']['Message']
        
        if error_code == 'CodeMismatchException':
            return response(400, {'error': 'Invalid confirmation code'})
        elif error_code == 'ExpiredCodeException':
            return response(400, {'error': 'Confirmation code expired'})
        else:
            return response(500, {'error': error_message})
    except Exception as e:
        return response(500, {'error': str(e)})


def handle_verify(body):
    """Verify access token and return user info"""
    try:
        access_token = body.get('access_token')
        
        if not access_token:
            # Try to get from Authorization header
            auth_header = body.get('headers', {}).get('Authorization', '')
            if auth_header.startswith('Bearer '):
                access_token = auth_header.split(' ')[1]
        
        if not access_token:
            return response(400, {'error': 'Access token required'})
        
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
            return response(500, {'error': e.response['Error']['Message']})
    except Exception as e:
        return response(500, {'error': str(e)})


def handle_refresh(body):
    """Refresh access token"""
    try:
        refresh_token = body.get('refresh_token')
        
        if not refresh_token:
            return response(400, {'error': 'Refresh token required'})
        
        auth_response = cognito_client.initiate_auth(
            ClientId=CLIENT_ID,
            AuthFlow='REFRESH_TOKEN_AUTH',
            AuthParameters={
                'REFRESH_TOKEN': refresh_token
            }
        )
        
        return response(200, {
            'access_token': auth_response['AuthenticationResult']['AccessToken'],
            'id_token': auth_response['AuthenticationResult']['IdToken'],
            'expires_in': auth_response['AuthenticationResult']['ExpiresIn']
        })
        
    except ClientError as e:
        return response(401, {'error': 'Invalid refresh token'})
    except Exception as e:
        return response(500, {'error': str(e)})


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
