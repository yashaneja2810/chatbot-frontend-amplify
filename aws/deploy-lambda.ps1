# AWS Lambda Deployment Script
# Deploys all Lambda functions with proper configuration

param(
    [string]$GoogleApiKey = $env:GOOGLE_API_KEY
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AWS Lambda Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Read credentials
$credentials = Get-Content "aws-credentials.txt" | ConvertFrom-StringData

$COGNITO_USER_POOL_ID = $credentials.COGNITO_USER_POOL_ID
$COGNITO_APP_CLIENT_ID = $credentials.COGNITO_APP_CLIENT_ID
$DYNAMODB_VECTORS_TABLE = $credentials.DYNAMODB_VECTORS_TABLE
$DYNAMODB_BOTS_TABLE = $credentials.DYNAMODB_BOTS_TABLE
$S3_BUCKET_NAME = $credentials.S3_BUCKET_NAME
$LAMBDA_ROLE_ARN = $credentials.LAMBDA_EXECUTION_ROLE_ARN

Write-Host "Using configuration:" -ForegroundColor Yellow
Write-Host "  Cognito Pool: $COGNITO_USER_POOL_ID"
Write-Host "  DynamoDB Vectors: $DYNAMODB_VECTORS_TABLE"
Write-Host "  DynamoDB Bots: $DYNAMODB_BOTS_TABLE"
Write-Host "  S3 Bucket: $S3_BUCKET_NAME"
Write-Host ""

# Function 1: Auth Lambda
Write-Host "Deploying Auth Lambda..." -ForegroundColor Yellow

# Create deployment package
$tempDir = "temp_lambda_auth"
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
Copy-Item "aws/lambda-functions/lambda_auth.py" -Destination "$tempDir/lambda_function.py"

# Zip the package
Compress-Archive -Path "$tempDir/*" -DestinationPath "lambda_auth.zip" -Force
Remove-Item -Recurse -Force $tempDir

# Create or update Lambda function
try {
    aws lambda get-function --function-name chatbot-builder-auth 2>$null
    # Function exists, update it
    aws lambda update-function-code `
        --function-name chatbot-builder-auth `
        --zip-file fileb://lambda_auth.zip | Out-Null
    
    Write-Host "  ✓ Updated existing function" -ForegroundColor Green
} catch {
    # Function doesn't exist, create it
    aws lambda create-function `
        --function-name chatbot-builder-auth `
        --runtime python3.11 `
        --role $LAMBDA_ROLE_ARN `
        --handler lambda_function.lambda_handler `
        --zip-file fileb://lambda_auth.zip `
        --timeout 30 `
        --memory-size 256 `
        --environment "Variables={AWS_REGION=us-east-1,COGNITO_USER_POOL_ID=$COGNITO_USER_POOL_ID,COGNITO_APP_CLIENT_ID=$COGNITO_APP_CLIENT_ID,DYNAMODB_BOTS_TABLE=$DYNAMODB_BOTS_TABLE}" | Out-Null
    
    Write-Host "  ✓ Created new function" -ForegroundColor Green
}

# Update environment variables
aws lambda update-function-configuration `
    --function-name chatbot-builder-auth `
    --environment "Variables={AWS_REGION=us-east-1,COGNITO_USER_POOL_ID=$COGNITO_USER_POOL_ID,COGNITO_APP_CLIENT_ID=$COGNITO_APP_CLIENT_ID,DYNAMODB_BOTS_TABLE=$DYNAMODB_BOTS_TABLE}" | Out-Null

Remove-Item "lambda_auth.zip"

# Function 2: Upload Lambda
Write-Host "Deploying Upload Lambda..." -ForegroundColor Yellow

$tempDir = "temp_lambda_upload"
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
Copy-Item "aws/lambda-functions/lambda_upload.py" -Destination "$tempDir/lambda_function.py"

Compress-Archive -Path "$tempDir/*" -DestinationPath "lambda_upload.zip" -Force
Remove-Item -Recurse -Force $tempDir

try {
    aws lambda get-function --function-name chatbot-builder-upload 2>$null
    aws lambda update-function-code `
        --function-name chatbot-builder-upload `
        --zip-file fileb://lambda_upload.zip | Out-Null
    Write-Host "  ✓ Updated existing function" -ForegroundColor Green
} catch {
    aws lambda create-function `
        --function-name chatbot-builder-upload `
        --runtime python3.11 `
        --role $LAMBDA_ROLE_ARN `
        --handler lambda_function.lambda_handler `
        --zip-file fileb://lambda_upload.zip `
        --timeout 300 `
        --memory-size 1024 `
        --environment "Variables={AWS_REGION=us-east-1,S3_BUCKET_NAME=$S3_BUCKET_NAME,DYNAMODB_VECTORS_TABLE=$DYNAMODB_VECTORS_TABLE,DYNAMODB_BOTS_TABLE=$DYNAMODB_BOTS_TABLE,COGNITO_USER_POOL_ID=$COGNITO_USER_POOL_ID,GOOGLE_API_KEY=$GoogleApiKey}" | Out-Null
    Write-Host "  ✓ Created new function" -ForegroundColor Green
}

aws lambda update-function-configuration `
    --function-name chatbot-builder-upload `
    --environment "Variables={AWS_REGION=us-east-1,S3_BUCKET_NAME=$S3_BUCKET_NAME,DYNAMODB_VECTORS_TABLE=$DYNAMODB_VECTORS_TABLE,DYNAMODB_BOTS_TABLE=$DYNAMODB_BOTS_TABLE,COGNITO_USER_POOL_ID=$COGNITO_USER_POOL_ID,GOOGLE_API_KEY=$GoogleApiKey}" | Out-Null

Remove-Item "lambda_upload.zip"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Lambda Functions Deployed:" -ForegroundColor Yellow
Write-Host "  ✓ chatbot-builder-auth" -ForegroundColor Green
Write-Host "  ✓ chatbot-builder-upload" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Create API Gateway endpoints"
Write-Host "2. Test Lambda functions"
Write-Host "3. Deploy remaining functions (chat, bots)"
Write-Host ""
