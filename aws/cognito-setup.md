# Amazon Cognito Setup Guide

## Overview
Amazon Cognito will replace Supabase Auth for user authentication and authorization.

## Step 1: Create User Pool

### Via AWS Console

1. Navigate to Amazon Cognito in AWS Console
2. Click "Create user pool"
3. Configure sign-in options:
   - **Sign-in options**: Email
   - **User name requirements**: Allow email addresses
   
4. Configure security requirements:
   - **Password policy**: Cognito defaults (8 chars, uppercase, lowercase, numbers, special chars)
   - **Multi-factor authentication**: Optional (OFF for free tier)
   - **User account recovery**: Email only

5. Configure sign-up experience:
   - **Self-registration**: Enabled
   - **Attribute verification**: Email
   - **Required attributes**: 
     - email (required)
     - name (optional)
   - **Custom attributes**: None needed

6. Configure message delivery:
   - **Email provider**: Send email with Cognito (Free tier: 50 emails/day)
   - **FROM email address**: no-reply@verificationemail.com
   - **Reply-to email address**: Your support email

7. Integrate your app:
   - **User pool name**: `chatbot-builder-users`
   - **App client name**: `chatbot-web-client`
   - **App client type**: Public client
   - **Authentication flows**: 
     - ALLOW_USER_PASSWORD_AUTH
     - ALLOW_REFRESH_TOKEN_AUTH
   - **Token expiration**:
     - Access token: 1 hour
     - ID token: 1 hour
     - Refresh token: 30 days

8. Review and create

### Via AWS CLI

```bash
# Create User Pool
aws cognito-idp create-user-pool \
  --pool-name chatbot-builder-users \
  --policies "PasswordPolicy={MinimumLength=8,RequireUppercase=true,RequireLowercase=true,RequireNumbers=true,RequireSymbols=true}" \
  --auto-verified-attributes email \
  --username-attributes email \
  --schema Name=email,Required=true,Mutable=false \
  --region us-east-1

# Note the UserPoolId from output

# Create App Client
aws cognito-idp create-user-pool-client \
  --user-pool-id <YOUR_USER_POOL_ID> \
  --client-name chatbot-web-client \
  --no-generate-secret \
  --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH \
  --region us-east-1

# Note the ClientId from output
```

## Step 2: Configure User Pool Domain

```bash
# Create custom domain prefix
aws cognito-idp create-user-pool-domain \
  --domain chatbot-builder-<your-unique-id> \
  --user-pool-id <YOUR_USER_POOL_ID> \
  --region us-east-1
```

## Step 3: Environment Variables

Add these to your `.env` files:

### Backend (.env)
```env
AWS_REGION=us-east-1
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
COGNITO_APP_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
COGNITO_DOMAIN=chatbot-builder-<your-unique-id>
```

### Frontend (.env)
```env
VITE_AWS_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
VITE_COGNITO_APP_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
```

## Step 4: IAM Roles for Lambda

Create an IAM role for Lambda functions to access Cognito:

```bash
# Create trust policy
cat > lambda-trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create role
aws iam create-role \
  --role-name ChatbotLambdaExecutionRole \
  --assume-role-policy-document file://lambda-trust-policy.json

# Attach policies
aws iam attach-role-policy \
  --role-name ChatbotLambdaExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

aws iam attach-role-policy \
  --role-name ChatbotLambdaExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonCognitoPowerUser
```

## Step 5: Test Cognito Setup

```python
# test_cognito.py
import boto3
import os
from dotenv import load_dotenv

load_dotenv()

client = boto3.client('cognito-idp', region_name=os.getenv('AWS_REGION'))

# Test: Create a test user
response = client.admin_create_user(
    UserPoolId=os.getenv('COGNITO_USER_POOL_ID'),
    Username='test@example.com',
    UserAttributes=[
        {'Name': 'email', 'Value': 'test@example.com'},
        {'Name': 'email_verified', 'Value': 'true'}
    ],
    TemporaryPassword='TempPass123!',
    MessageAction='SUPPRESS'
)

print("User created successfully:", response['User']['Username'])

# Test: List users
response = client.list_users(
    UserPoolId=os.getenv('COGNITO_USER_POOL_ID'),
    Limit=10
)

print(f"Total users: {len(response['Users'])}")
```

## Step 6: Frontend Integration

Install AWS Amplify:

```bash
cd frontend
npm install aws-amplify @aws-amplify/ui-react
```

Configure Amplify in your React app:

```typescript
// src/lib/amplify-config.ts
import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_COGNITO_APP_CLIENT_ID,
      region: import.meta.env.VITE_AWS_REGION,
      signUpVerificationMethod: 'code',
      loginWith: {
        email: true,
      },
    }
  }
});
```

## Step 7: Backend Integration

Install boto3:

```bash
cd backend
pip install boto3
```

Create Cognito service:

```python
# backend/app/services/cognito_service.py
import boto3
from botocore.exceptions import ClientError
from ..core.config import get_settings

settings = get_settings()

class CognitoService:
    def __init__(self):
        self.client = boto3.client('cognito-idp', region_name=settings.AWS_REGION)
        self.user_pool_id = settings.COGNITO_USER_POOL_ID
        self.client_id = settings.COGNITO_APP_CLIENT_ID
    
    def sign_up(self, email: str, password: str, name: str):
        """Register a new user"""
        try:
            response = self.client.sign_up(
                ClientId=self.client_id,
                Username=email,
                Password=password,
                UserAttributes=[
                    {'Name': 'email', 'Value': email},
                    {'Name': 'name', 'Value': name}
                ]
            )
            return {
                'user_sub': response['UserSub'],
                'user_confirmed': response['UserConfirmed']
            }
        except ClientError as e:
            raise Exception(f"Sign up failed: {e.response['Error']['Message']}")
    
    def confirm_sign_up(self, email: str, code: str):
        """Confirm user registration with verification code"""
        try:
            self.client.confirm_sign_up(
                ClientId=self.client_id,
                Username=email,
                ConfirmationCode=code
            )
            return True
        except ClientError as e:
            raise Exception(f"Confirmation failed: {e.response['Error']['Message']}")
    
    def sign_in(self, email: str, password: str):
        """Sign in user and get tokens"""
        try:
            response = self.client.initiate_auth(
                ClientId=self.client_id,
                AuthFlow='USER_PASSWORD_AUTH',
                AuthParameters={
                    'USERNAME': email,
                    'PASSWORD': password
                }
            )
            return {
                'access_token': response['AuthenticationResult']['AccessToken'],
                'id_token': response['AuthenticationResult']['IdToken'],
                'refresh_token': response['AuthenticationResult']['RefreshToken'],
                'expires_in': response['AuthenticationResult']['ExpiresIn']
            }
        except ClientError as e:
            raise Exception(f"Sign in failed: {e.response['Error']['Message']}")
    
    def verify_token(self, access_token: str):
        """Verify JWT token and get user info"""
        try:
            response = self.client.get_user(AccessToken=access_token)
            user_attributes = {attr['Name']: attr['Value'] for attr in response['UserAttributes']}
            return {
                'username': response['Username'],
                'email': user_attributes.get('email'),
                'name': user_attributes.get('name'),
                'sub': user_attributes.get('sub')
            }
        except ClientError as e:
            raise Exception(f"Token verification failed: {e.response['Error']['Message']}")
    
    def refresh_token(self, refresh_token: str):
        """Refresh access token"""
        try:
            response = self.client.initiate_auth(
                ClientId=self.client_id,
                AuthFlow='REFRESH_TOKEN_AUTH',
                AuthParameters={
                    'REFRESH_TOKEN': refresh_token
                }
            )
            return {
                'access_token': response['AuthenticationResult']['AccessToken'],
                'id_token': response['AuthenticationResult']['IdToken'],
                'expires_in': response['AuthenticationResult']['ExpiresIn']
            }
        except ClientError as e:
            raise Exception(f"Token refresh failed: {e.response['Error']['Message']}")
```

## Migration from Supabase Auth

See `aws/migration-scripts/migrate_users.py` for user migration script.

## Security Best Practices

1. **Enable MFA** for admin users
2. **Use HTTPS only** for all API calls
3. **Rotate secrets** regularly
4. **Monitor failed login attempts** via CloudWatch
5. **Set up account recovery** via email
6. **Use least privilege** IAM policies
7. **Enable CloudTrail** for audit logs

## Cost Considerations

- **Free Tier**: 50,000 Monthly Active Users (MAUs)
- **Email sending**: 50 emails/day (use SES for more)
- **Beyond free tier**: $0.0055 per MAU

## Troubleshooting

### Common Issues

1. **"User pool does not exist"**
   - Verify USER_POOL_ID is correct
   - Check AWS region matches

2. **"Invalid password"**
   - Check password policy requirements
   - Minimum 8 characters with complexity

3. **"Email not verified"**
   - Use admin_confirm_sign_up for testing
   - Check email delivery settings

4. **"Token expired"**
   - Implement token refresh logic
   - Check token expiration settings

## Next Steps

1. Complete Cognito setup
2. Test authentication flow
3. Migrate existing users from Supabase
4. Update frontend to use Cognito
5. Update backend API authentication
6. Test end-to-end authentication
