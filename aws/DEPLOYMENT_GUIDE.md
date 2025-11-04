# AWS Deployment Guide - Step by Step

## Prerequisites

- AWS Account (Free Tier eligible)
- AWS CLI installed and configured
- Python 3.11+
- Node.js 16+
- Git

## Phase 1: AWS Infrastructure Setup

### Step 1: Install AWS CLI

```bash
# Windows (PowerShell)
msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi

# Verify installation
aws --version
```

### Step 2: Configure AWS CLI

```bash
aws configure

# Enter:
# AWS Access Key ID: [Your Access Key]
# AWS Secret Access Key: [Your Secret Key]
# Default region name: us-east-1
# Default output format: json
```

### Step 3: Deploy CloudFormation Stack

```bash
# Navigate to aws directory
cd aws/cloudformation

# Deploy the stack
aws cloudformation create-stack \
  --stack-name chatbot-builder-stack \
  --template-body file://complete-stack.yaml \
  --parameters \
    ParameterKey=ProjectName,ParameterValue=chatbot-builder \
    ParameterKey=GoogleApiKey,ParameterValue=YOUR_GOOGLE_API_KEY \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1

# Monitor stack creation
aws cloudformation describe-stacks \
  --stack-name chatbot-builder-stack \
  --query 'Stacks[0].StackStatus'

# Wait for CREATE_COMPLETE status (takes 5-10 minutes)
aws cloudformation wait stack-create-complete \
  --stack-name chatbot-builder-stack
```

### Step 4: Get Stack Outputs

```bash
# Get all outputs
aws cloudformation describe-stacks \
  --stack-name chatbot-builder-stack \
  --query 'Stacks[0].Outputs' \
  --output table

# Save outputs to file
aws cloudformation describe-stacks \
  --stack-name chatbot-builder-stack \
  --query 'Stacks[0].Outputs' > stack-outputs.json
```

## Phase 2: Lambda Function Deployment

### Step 1: Package Lambda Functions

```bash
cd aws/lambda-functions

# Create deployment packages
mkdir -p packages

# Package auth function
cd packages
mkdir auth && cd auth
cp ../../auth_handler.py .
pip install -r ../../requirements.txt -t .
zip -r ../auth-function.zip .
cd ..

# Package upload function
mkdir upload && cd upload
cp ../../upload_handler.py .
pip install -r ../../requirements.txt -t .
zip -r ../upload-function.zip .
cd ..

# Package chat function
mkdir chat && cd chat
cp ../../chat_handler.py .
pip install -r ../../requirements.txt -t .
zip -r ../chat-function.zip .
cd ..

# Package bots function
mkdir bots && cd bots
cp ../../bots_handler.py .
pip install -r ../../requirements.txt -t .
zip -r ../bots-function.zip .
cd ..
```

### Step 2: Upload Lambda Functions

```bash
# Update auth function
aws lambda update-function-code \
  --function-name chatbot-builder-auth \
  --zip-file fileb://packages/auth-function.zip

# Update upload function
aws lambda update-function-code \
  --function-name chatbot-builder-upload \
  --zip-file fileb://packages/upload-function.zip

# Update chat function
aws lambda update-function-code \
  --function-name chatbot-builder-chat \
  --zip-file fileb://packages/chat-function.zip

# Update bots function
aws lambda update-function-code \
  --function-name chatbot-builder-bots \
  --zip-file fileb://packages/bots-function.zip
```

### Step 3: Create Lambda Layers (Optional but Recommended)

```bash
# Create layer for common dependencies
mkdir -p lambda-layers/python
pip install numpy boto3 -t lambda-layers/python
cd lambda-layers
zip -r dependencies-layer.zip python
cd ..

# Create layer
aws lambda publish-layer-version \
  --layer-name chatbot-dependencies \
  --zip-file fileb://lambda-layers/dependencies-layer.zip \
  --compatible-runtimes python3.11

# Attach layer to functions
LAYER_ARN=$(aws lambda list-layer-versions \
  --layer-name chatbot-dependencies \
  --query 'LayerVersions[0].LayerVersionArn' \
  --output text)

aws lambda update-function-configuration \
  --function-name chatbot-builder-chat \
  --layers $LAYER_ARN
```

## Phase 3: API Gateway Configuration

### Step 1: Create API Resources

```bash
# Get API ID
API_ID=$(aws cloudformation describe-stacks \
  --stack-name chatbot-builder-stack \
  --query 'Stacks[0].Outputs[?OutputKey==`RestApiId`].OutputValue' \
  --output text)

# Get root resource ID
ROOT_ID=$(aws apigateway get-resources \
  --rest-api-id $API_ID \
  --query 'items[?path==`/`].id' \
  --output text)

# Create /auth resource
AUTH_RESOURCE=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $ROOT_ID \
  --path-part auth \
  --query 'id' \
  --output text)

# Create /api resource
API_RESOURCE=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $ROOT_ID \
  --path-part api \
  --query 'id' \
  --output text)
```

### Step 2: Configure CORS

```bash
# Enable CORS for all resources
aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $API_RESOURCE \
  --http-method OPTIONS \
  --authorization-type NONE

aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $API_RESOURCE \
  --http-method OPTIONS \
  --type MOCK \
  --request-templates '{"application/json": "{\"statusCode\": 200}"}'

aws apigateway put-method-response \
  --rest-api-id $API_ID \
  --resource-id $API_RESOURCE \
  --http-method OPTIONS \
  --status-code 200 \
  --response-parameters \
    'method.response.header.Access-Control-Allow-Headers=true' \
    'method.response.header.Access-Control-Allow-Methods=true' \
    'method.response.header.Access-Control-Allow-Origin=true'
```

### Step 3: Deploy API

```bash
aws apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name prod
```

## Phase 4: Frontend Deployment (AWS Amplify)

### Step 1: Connect GitHub Repository

```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Initialize Amplify
cd frontend
amplify init

# Follow prompts:
# - Enter a name for the project: chatbot-builder
# - Enter a name for the environment: prod
# - Choose your default editor: Visual Studio Code
# - Choose the type of app: javascript
# - What javascript framework: react
# - Source Directory Path: src
# - Distribution Directory Path: dist
# - Build Command: npm run build
# - Start Command: npm run dev
```

### Step 2: Configure Environment Variables

Create `frontend/.env.production`:

```env
VITE_AWS_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=<from stack outputs>
VITE_COGNITO_APP_CLIENT_ID=<from stack outputs>
VITE_API_URL=<from stack outputs>
```

### Step 3: Deploy Frontend

```bash
# Build frontend
npm run build

# Deploy to Amplify
amplify publish

# Or use Amplify Console for CI/CD
# 1. Go to AWS Amplify Console
# 2. Click "New app" > "Host web app"
# 3. Connect your GitHub repository
# 4. Configure build settings
# 5. Add environment variables
# 6. Deploy
```

## Phase 5: Data Migration

### Step 1: Migrate Users

```bash
cd aws/migration-scripts

# Export users from Supabase to CSV
# (Do this manually from Supabase dashboard)

# Migrate users to Cognito
python migrate_users.py users_export.csv

# Send password reset emails
python migrate_users.py --send-resets
```

### Step 2: Migrate Vectors

```bash
# List Qdrant collections
python migrate_vectors.py list

# Export collection mapping
python migrate_vectors.py export-mapping

# Edit collection_mapping.json to add user IDs

# Migrate all collections
python migrate_vectors.py migrate-all collection_mapping.json

# Verify migration
python migrate_vectors.py verify <bot_id>
```

## Phase 6: Testing

### Step 1: Test Authentication

```bash
# Test signup
curl -X POST https://YOUR_API_URL/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","name":"Test User"}'

# Test signin
curl -X POST https://YOUR_API_URL/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

### Step 2: Test Upload

```bash
# Get access token from signin response
ACCESS_TOKEN="<your_access_token>"

# Test upload (simplified)
curl -X POST https://YOUR_API_URL/api/upload \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"company_name":"Test Company","files":[...]}'
```

### Step 3: Test Chat

```bash
# Test public chat endpoint
curl -X POST https://YOUR_API_URL/api/chat \
  -H "Content-Type: application/json" \
  -d '{"bot_id":"<bot_id>","query":"What is your company about?"}'
```

## Phase 7: Monitoring and Optimization

### Step 1: Set Up CloudWatch Alarms

```bash
# Create alarm for Lambda errors
aws cloudwatch put-metric-alarm \
  --alarm-name chatbot-lambda-errors \
  --alarm-description "Alert on Lambda errors" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1

# Create alarm for API Gateway 5xx errors
aws cloudwatch put-metric-alarm \
  --alarm-name chatbot-api-errors \
  --alarm-description "Alert on API errors" \
  --metric-name 5XXError \
  --namespace AWS/ApiGateway \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1
```

### Step 2: Enable X-Ray Tracing

```bash
# Enable X-Ray for Lambda functions
aws lambda update-function-configuration \
  --function-name chatbot-builder-chat \
  --tracing-config Mode=Active

# Enable X-Ray for API Gateway
aws apigateway update-stage \
  --rest-api-id $API_ID \
  --stage-name prod \
  --patch-operations op=replace,path=/tracingEnabled,value=true
```

## Phase 8: DNS and Custom Domain (Optional)

### Step 1: Request SSL Certificate

```bash
# Request certificate in ACM
aws acm request-certificate \
  --domain-name chatbot.yourdomain.com \
  --validation-method DNS \
  --region us-east-1
```

### Step 2: Configure Custom Domain

```bash
# Create custom domain for API Gateway
aws apigateway create-domain-name \
  --domain-name api.chatbot.yourdomain.com \
  --certificate-arn <certificate_arn>

# Create base path mapping
aws apigateway create-base-path-mapping \
  --domain-name api.chatbot.yourdomain.com \
  --rest-api-id $API_ID \
  --stage prod
```

## Troubleshooting

### Lambda Function Errors

```bash
# View Lambda logs
aws logs tail /aws/lambda/chatbot-builder-chat --follow

# Get recent errors
aws logs filter-log-events \
  --log-group-name /aws/lambda/chatbot-builder-chat \
  --filter-pattern "ERROR"
```

### API Gateway Issues

```bash
# Test API Gateway endpoint
aws apigateway test-invoke-method \
  --rest-api-id $API_ID \
  --resource-id $API_RESOURCE \
  --http-method POST \
  --path-with-query-string "/api/chat"
```

### DynamoDB Issues

```bash
# Check table status
aws dynamodb describe-table \
  --table-name chatbot-builder-vectors

# Scan table (for debugging)
aws dynamodb scan \
  --table-name chatbot-builder-bots \
  --limit 10
```

## Cost Monitoring

```bash
# Get current month costs
aws ce get-cost-and-usage \
  --time-period Start=2025-11-01,End=2025-11-30 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=SERVICE

# Set up budget alert
aws budgets create-budget \
  --account-id <your_account_id> \
  --budget file://budget.json
```

## Rollback Procedure

If you need to rollback:

```bash
# Delete CloudFormation stack
aws cloudformation delete-stack \
  --stack-name chatbot-builder-stack

# Wait for deletion
aws cloudformation wait stack-delete-complete \
  --stack-name chatbot-builder-stack

# Restore old infrastructure
# (Keep Supabase/Qdrant running during migration)
```

## Next Steps

1. ✅ Infrastructure deployed
2. ✅ Lambda functions updated
3. ✅ API Gateway configured
4. ✅ Frontend deployed
5. ✅ Data migrated
6. ✅ Testing complete
7. 🔄 Monitor for 1 week
8. 🔄 Optimize based on usage
9. 🔄 Decommission old infrastructure

## Support

- AWS Documentation: https://docs.aws.amazon.com/
- AWS Support: https://console.aws.amazon.com/support/
- Community: AWS Forums, Stack Overflow

---

**Congratulations!** Your chatbot builder is now running on AWS! 🎉
