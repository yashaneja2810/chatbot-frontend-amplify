# AWS Migration - Live Execution Guide

## Step 1: Configure AWS CLI

You need to configure AWS CLI with your credentials first.

### Get AWS Credentials

1. Go to AWS Console: https://console.aws.amazon.com/
2. Sign in (or create account if you don't have one)
3. Go to IAM → Users → Your User → Security Credentials
4. Create Access Key → CLI
5. Save the Access Key ID and Secret Access Key

### Configure AWS CLI

```powershell
# Run this command and enter your credentials
aws configure

# You'll be prompted for:
# AWS Access Key ID: [paste your access key]
# AWS Secret Access Key: [paste your secret key]
# Default region name: us-east-1
# Default output format: json
```

### Verify Configuration

```powershell
# This should show your account details
aws sts get-caller-identity
```

## Step 2: Set Environment Variables

Create a file `aws/.env.migration` with your values:

```env
# Google API Key (required)
GOOGLE_API_KEY=your_google_api_key_here

# Supabase (for migration)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key

# Qdrant (for migration)
QDRANT_URL=your_qdrant_url
QDRANT_API_KEY=your_qdrant_key

# AWS Settings
AWS_REGION=us-east-1
PROJECT_NAME=chatbot-builder
```

## Step 3: Deploy Infrastructure

```powershell
# Navigate to aws directory
cd aws

# Load environment variables
Get-Content .env.migration | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        [Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process')
    }
}

# Deploy CloudFormation stack
aws cloudformation create-stack `
  --stack-name chatbot-builder-stack `
  --template-body file://cloudformation/complete-stack.yaml `
  --parameters `
    ParameterKey=ProjectName,ParameterValue=chatbot-builder `
    ParameterKey=GoogleApiKey,ParameterValue=$env:GOOGLE_API_KEY `
  --capabilities CAPABILITY_NAMED_IAM `
  --region us-east-1

# Wait for stack creation (takes 5-10 minutes)
Write-Host "Waiting for stack creation..." -ForegroundColor Yellow
aws cloudformation wait stack-create-complete `
  --stack-name chatbot-builder-stack `
  --region us-east-1

Write-Host "Stack created successfully!" -ForegroundColor Green
```

## Step 4: Get Stack Outputs

```powershell
# Get all outputs
aws cloudformation describe-stacks `
  --stack-name chatbot-builder-stack `
  --query 'Stacks[0].Outputs' `
  --output table

# Save outputs to JSON
aws cloudformation describe-stacks `
  --stack-name chatbot-builder-stack `
  --query 'Stacks[0].Outputs' `
  --output json | Out-File -FilePath stack-outputs.json

# Extract specific values
$outputs = aws cloudformation describe-stacks `
  --stack-name chatbot-builder-stack `
  --query 'Stacks[0].Outputs' `
  --output json | ConvertFrom-Json

$userPoolId = ($outputs | Where-Object {$_.OutputKey -eq 'UserPoolId'}).OutputValue
$clientId = ($outputs | Where-Object {$_.OutputKey -eq 'UserPoolClientId'}).OutputValue
$apiUrl = ($outputs | Where-Object {$_.OutputKey -eq 'ApiGatewayUrl'}).OutputValue
$bucketName = ($outputs | Where-Object {$_.OutputKey -eq 'DocumentsBucketName'}).OutputValue

Write-Host "User Pool ID: $userPoolId" -ForegroundColor Cyan
Write-Host "Client ID: $clientId" -ForegroundColor Cyan
Write-Host "API URL: $apiUrl" -ForegroundColor Cyan
Write-Host "S3 Bucket: $bucketName" -ForegroundColor Cyan
```

## Step 5: Create RDS Instance

```powershell
# Create RDS PostgreSQL instance
$dbPassword = Read-Host "Enter a strong password for RDS" -AsSecureString
$dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword)
)

aws rds create-db-instance `
  --db-instance-identifier chatbot-db `
  --db-instance-class db.t3.micro `
  --engine postgres `
  --engine-version 15.4 `
  --master-username postgres `
  --master-user-password $dbPasswordPlain `
  --allocated-storage 20 `
  --storage-type gp2 `
  --backup-retention-period 7 `
  --publicly-accessible `
  --db-name chatbot_db `
  --region us-east-1

Write-Host "RDS instance creation initiated..." -ForegroundColor Yellow
Write-Host "This will take 5-10 minutes..." -ForegroundColor Yellow

# Wait for RDS to be available
aws rds wait db-instance-available `
  --db-instance-identifier chatbot-db `
  --region us-east-1

Write-Host "RDS instance is ready!" -ForegroundColor Green

# Get RDS endpoint
$rdsEndpoint = aws rds describe-db-instances `
  --db-instance-identifier chatbot-db `
  --query 'DBInstances[0].Endpoint.Address' `
  --output text

Write-Host "RDS Endpoint: $rdsEndpoint" -ForegroundColor Cyan
```

## Step 6: Configure RDS Security Group

```powershell
# Get RDS security group
$sgId = aws rds describe-db-instances `
  --db-instance-identifier chatbot-db `
  --query 'DBInstances[0].VpcSecurityGroups[0].VpcSecurityGroupId' `
  --output text

# Get your public IP
$myIp = (Invoke-WebRequest -Uri "https://api.ipify.org").Content

# Allow access from your IP
aws ec2 authorize-security-group-ingress `
  --group-id $sgId `
  --protocol tcp `
  --port 5432 `
  --cidr "$myIp/32"

Write-Host "Security group configured for your IP: $myIp" -ForegroundColor Green
```

## Step 7: Create Database Schema

```powershell
# Install PostgreSQL client if not installed
# Download from: https://www.postgresql.org/download/windows/

# Connect and create schema
$createSchemaSQL = @"
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cognito_sub VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bots table
CREATE TABLE bots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_id VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_documents INTEGER DEFAULT 0,
    total_chunks INTEGER DEFAULT 0
);

-- Documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_id VARCHAR(255) REFERENCES bots(bot_id) ON DELETE CASCADE,
    filename VARCHAR(500) NOT NULL,
    file_size BIGINT,
    s3_key VARCHAR(1000),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_bots_user_id ON bots(user_id);
CREATE INDEX idx_bots_bot_id ON bots(bot_id);
CREATE INDEX idx_documents_bot_id ON documents(bot_id);
"@

# Save SQL to file
$createSchemaSQL | Out-File -FilePath "create_schema.sql" -Encoding UTF8

Write-Host "Schema SQL saved to create_schema.sql" -ForegroundColor Green
Write-Host "Run this command to create schema:" -ForegroundColor Yellow
Write-Host "psql -h $rdsEndpoint -U postgres -d chatbot_db -f create_schema.sql" -ForegroundColor Cyan
```

## Step 8: Package and Deploy Lambda Functions

```powershell
cd lambda-functions

# Create packages directory
New-Item -ItemType Directory -Path "packages" -Force | Out-Null

# Function to package Lambda
function Package-Lambda {
    param($FunctionName, $Handler)
    
    Write-Host "Packaging $FunctionName..." -ForegroundColor Yellow
    
    $funcDir = "packages\$FunctionName"
    if (Test-Path $funcDir) {
        Remove-Item -Recurse -Force $funcDir
    }
    New-Item -ItemType Directory -Path $funcDir -Force | Out-Null
    
    # Copy handler
    Copy-Item $Handler -Destination $funcDir
    
    # Install dependencies
    pip install -r requirements.txt -t $funcDir --quiet --no-warn-script-location
    
    # Create zip
    $zipFile = "packages\$FunctionName-function.zip"
    if (Test-Path $zipFile) {
        Remove-Item $zipFile
    }
    
    Push-Location $funcDir
    Compress-Archive -Path * -DestinationPath "..\$FunctionName-function.zip" -Force
    Pop-Location
    
    Write-Host "✓ $FunctionName packaged" -ForegroundColor Green
    return $zipFile
}

# Package all functions
$functions = @(
    @{Name="auth"; Handler="auth_handler.py"},
    @{Name="upload"; Handler="upload_handler.py"},
    @{Name="chat"; Handler="chat_handler.py"},
    @{Name="bots"; Handler="bots_handler.py"}
)

foreach ($func in $functions) {
    $zipFile = Package-Lambda -FunctionName $func.Name -Handler $func.Handler
    
    # Update Lambda function
    Write-Host "Deploying $($func.Name) to Lambda..." -ForegroundColor Yellow
    aws lambda update-function-code `
        --function-name "chatbot-builder-$($func.Name)" `
        --zip-file "fileb://$zipFile" `
        --region us-east-1
    
    Write-Host "✓ $($func.Name) deployed" -ForegroundColor Green
}

cd ..
```

## Step 9: Migrate Users from Supabase to Cognito

```powershell
cd migration-scripts

# First, export users from Supabase
Write-Host "Export users from Supabase dashboard to users.csv" -ForegroundColor Yellow
Write-Host "Format: email,name,email_verified" -ForegroundColor Gray
Write-Host "Press Enter when ready..." -ForegroundColor Yellow
Read-Host

# Install Python dependencies
pip install boto3 supabase python-dotenv

# Set environment variables
$env:AWS_REGION = "us-east-1"
$env:COGNITO_USER_POOL_ID = $userPoolId

# Run migration
python migrate_users.py users.csv

Write-Host "User migration complete!" -ForegroundColor Green
```

## Step 10: Migrate Vectors from Qdrant to DynamoDB

```powershell
# Install dependencies
pip install qdrant-client

# Set environment variables
$env:QDRANT_URL = $env:QDRANT_URL
$env:QDRANT_API_KEY = $env:QDRANT_API_KEY
$env:DYNAMODB_VECTORS_TABLE = "chatbot-builder-vectors"
$env:DYNAMODB_BOTS_TABLE = "chatbot-builder-bots"

# List Qdrant collections
Write-Host "Listing Qdrant collections..." -ForegroundColor Yellow
python migrate_vectors.py list

# Export collection mapping
python migrate_vectors.py export-mapping

Write-Host "Edit collection_mapping.json to add user IDs" -ForegroundColor Yellow
Write-Host "Press Enter when ready..." -ForegroundColor Yellow
Read-Host

# Migrate all collections
python migrate_vectors.py migrate-all collection_mapping.json

Write-Host "Vector migration complete!" -ForegroundColor Green

cd ..
```

## Step 11: Update Frontend Environment Variables

```powershell
cd ../frontend

# Create production environment file
$envContent = @"
VITE_AWS_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=$userPoolId
VITE_COGNITO_APP_CLIENT_ID=$clientId
VITE_API_URL=$apiUrl
"@

$envContent | Out-File -FilePath ".env.production" -Encoding UTF8

Write-Host "Frontend environment variables updated" -ForegroundColor Green
Write-Host "File: frontend/.env.production" -ForegroundColor Cyan
```

## Step 12: Deploy Frontend to Amplify

```powershell
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Initialize Amplify
amplify init

# Follow prompts:
# - Project name: chatbot-builder
# - Environment: prod
# - Editor: Visual Studio Code
# - App type: javascript
# - Framework: react
# - Source directory: src
# - Distribution directory: dist
# - Build command: npm run build
# - Start command: npm run dev

# Publish to Amplify
amplify publish

Write-Host "Frontend deployed to Amplify!" -ForegroundColor Green
```

## Step 13: Verify Deployment

```powershell
# Test authentication
Write-Host "Testing authentication..." -ForegroundColor Yellow

$signupBody = @{
    email = "test@example.com"
    password = "Test123!"
    name = "Test User"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "$apiUrl/auth/signup" `
    -Method POST `
    -ContentType "application/json" `
    -Body $signupBody

Write-Host "✓ Signup test passed" -ForegroundColor Green

# Test signin
$signinBody = @{
    email = "test@example.com"
    password = "Test123!"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "$apiUrl/auth/signin" `
    -Method POST `
    -ContentType "application/json" `
    -Body $signinBody

Write-Host "✓ Signin test passed" -ForegroundColor Green
Write-Host "Access Token: $($response.access_token.Substring(0,20))..." -ForegroundColor Gray
```

## Step 14: Set Up Monitoring

```powershell
# Create CloudWatch alarm for Lambda errors
aws cloudwatch put-metric-alarm `
  --alarm-name chatbot-lambda-errors `
  --alarm-description "Alert on Lambda errors" `
  --metric-name Errors `
  --namespace AWS/Lambda `
  --statistic Sum `
  --period 300 `
  --threshold 5 `
  --comparison-operator GreaterThanThreshold `
  --evaluation-periods 1 `
  --region us-east-1

Write-Host "✓ CloudWatch alarms configured" -ForegroundColor Green
```

## Step 15: Final Verification

```powershell
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Migration Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Resources Created:" -ForegroundColor Yellow
Write-Host "  Cognito User Pool: $userPoolId" -ForegroundColor Gray
Write-Host "  API Gateway: $apiUrl" -ForegroundColor Gray
Write-Host "  S3 Bucket: $bucketName" -ForegroundColor Gray
Write-Host "  RDS Endpoint: $rdsEndpoint" -ForegroundColor Gray
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Test all functionality" -ForegroundColor White
Write-Host "2. Monitor CloudWatch logs" -ForegroundColor White
Write-Host "3. Update DNS if using custom domain" -ForegroundColor White
Write-Host "4. Decommission old infrastructure after 1 week" -ForegroundColor White
Write-Host ""
```

## Troubleshooting

### If stack creation fails:
```powershell
# Check stack events
aws cloudformation describe-stack-events `
  --stack-name chatbot-builder-stack `
  --query 'StackEvents[?ResourceStatus==`CREATE_FAILED`]'

# Delete and retry
aws cloudformation delete-stack --stack-name chatbot-builder-stack
```

### If Lambda deployment fails:
```powershell
# Check function logs
aws logs tail /aws/lambda/chatbot-builder-chat --follow
```

### If RDS connection fails:
```powershell
# Check security group
aws ec2 describe-security-groups --group-ids $sgId

# Test connection
Test-NetConnection -ComputerName $rdsEndpoint -Port 5432
```

## Rollback

If you need to rollback:

```powershell
# Delete CloudFormation stack
aws cloudformation delete-stack --stack-name chatbot-builder-stack

# Delete RDS instance
aws rds delete-db-instance `
  --db-instance-identifier chatbot-db `
  --skip-final-snapshot

# Revert to old infrastructure
```
