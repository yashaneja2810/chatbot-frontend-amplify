# API Gateway Deployment Script
# Connects Lambda functions to HTTP endpoints

$API_ID = "g31hjitjqk"
$REGION = "us-east-1"
$ACCOUNT_ID = "252689085544"

# Resource IDs
$ROOT_ID = "ejoyrycf61"
$AUTH_ID = "fnksjh"
$API_ID_RESOURCE = "wi74io"

# Lambda ARNs
$AUTH_LAMBDA = "arn:aws:lambda:us-east-1:252689085544:function:chatbot-builder-auth"
$UPLOAD_LAMBDA = "arn:aws:lambda:us-east-1:252689085544:function:chatbot-builder-upload"
$CHAT_LAMBDA = "arn:aws:lambda:us-east-1:252689085544:function:chatbot-builder-chat"
$BOTS_LAMBDA = "arn:aws:lambda:us-east-1:252689085544:function:chatbot-builder-bots"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "API Gateway Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Create Cognito Authorizer
Write-Host "Creating Cognito Authorizer..." -ForegroundColor Yellow
try {
    $authorizer = aws apigateway create-authorizer `
        --rest-api-id $API_ID `
        --name "CognitoAuthorizer" `
        --type COGNITO_USER_POOLS `
        --provider-arns "arn:aws:cognito-idp:us-east-1:252689085544:userpool/us-east-1_iq8va28cy" `
        --identity-source "method.request.header.Authorization" `
        --region $REGION `
        --output json | ConvertFrom-Json
    
    $AUTHORIZER_ID = $authorizer.id
    Write-Host "  ✓ Authorizer created: $AUTHORIZER_ID" -ForegroundColor Green
} catch {
    Write-Host "  ⚠ Authorizer might already exist" -ForegroundColor Yellow
}

# Create /auth/login endpoint
Write-Host "`nCreating /auth/login endpoint..." -ForegroundColor Yellow

# Create login resource
try {
    $loginResource = aws apigateway create-resource `
        --rest-api-id $API_ID `
        --parent-id $AUTH_ID `
        --path-part login `
        --region $REGION `
        --output json | ConvertFrom-Json
    $LOGIN_ID = $loginResource.id
} catch {
    # Get existing
    $resources = aws apigateway get-resources --rest-api-id $API_ID --region $REGION --output json | ConvertFrom-Json
    $LOGIN_ID = ($resources.items | Where-Object { $_.path -eq "/auth/login" }).id
}

# Add POST method
aws apigateway put-method `
    --rest-api-id $API_ID `
    --resource-id $LOGIN_ID `
    --http-method POST `
    --authorization-type NONE `
    --region $REGION | Out-Null

# Add integration
aws apigateway put-integration `
    --rest-api-id $API_ID `
    --resource-id $LOGIN_ID `
    --http-method POST `
    --type AWS_PROXY `
    --integration-http-method POST `
    --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$AUTH_LAMBDA/invocations" `
    --region $REGION | Out-Null

# Add Lambda permission
aws lambda add-permission `
    --function-name chatbot-builder-auth `
    --statement-id apigateway-login `
    --action lambda:InvokeFunction `
    --principal apigateway.amazonaws.com `
    --source-arn "arn:aws:execute-api:$REGION:$ACCOUNT_ID:$API_ID/*/*" `
    --region $REGION 2>$null | Out-Null

Write-Host "  ✓ /auth/login created" -ForegroundColor Green

# Create /auth/register endpoint
Write-Host "Creating /auth/register endpoint..." -ForegroundColor Yellow

try {
    $registerResource = aws apigateway create-resource `
        --rest-api-id $API_ID `
        --parent-id $AUTH_ID `
        --path-part register `
        --region $REGION `
        --output json | ConvertFrom-Json
    $REGISTER_ID = $registerResource.id
} catch {
    $resources = aws apigateway get-resources --rest-api-id $API_ID --region $REGION --output json | ConvertFrom-Json
    $REGISTER_ID = ($resources.items | Where-Object { $_.path -eq "/auth/register" }).id
}

aws apigateway put-method `
    --rest-api-id $API_ID `
    --resource-id $REGISTER_ID `
    --http-method POST `
    --authorization-type NONE `
    --region $REGION | Out-Null

aws apigateway put-integration `
    --rest-api-id $API_ID `
    --resource-id $REGISTER_ID `
    --http-method POST `
    --type AWS_PROXY `
    --integration-http-method POST `
    --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$AUTH_LAMBDA/invocations" `
    --region $REGION | Out-Null

Write-Host "  ✓ /auth/register created" -ForegroundColor Green

# Create /api/chat endpoint
Write-Host "Creating /api/chat endpoint..." -ForegroundColor Yellow

try {
    $chatResource = aws apigateway create-resource `
        --rest-api-id $API_ID `
        --parent-id $API_ID_RESOURCE `
        --path-part chat `
        --region $REGION `
        --output json | ConvertFrom-Json
    $CHAT_ID = $chatResource.id
} catch {
    $resources = aws apigateway get-resources --rest-api-id $API_ID --region $REGION --output json | ConvertFrom-Json
    $CHAT_ID = ($resources.items | Where-Object { $_.path -eq "/api/chat" }).id
}

aws apigateway put-method `
    --rest-api-id $API_ID `
    --resource-id $CHAT_ID `
    --http-method POST `
    --authorization-type NONE `
    --region $REGION | Out-Null

aws apigateway put-integration `
    --rest-api-id $API_ID `
    --resource-id $CHAT_ID `
    --http-method POST `
    --type AWS_PROXY `
    --integration-http-method POST `
    --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$CHAT_LAMBDA/invocations" `
    --region $REGION | Out-Null

aws lambda add-permission `
    --function-name chatbot-builder-chat `
    --statement-id apigateway-chat `
    --action lambda:InvokeFunction `
    --principal apigateway.amazonaws.com `
    --source-arn "arn:aws:execute-api:$REGION:$ACCOUNT_ID:$API_ID/*/*" `
    --region $REGION 2>$null | Out-Null

Write-Host "  ✓ /api/chat created" -ForegroundColor Green

# Create /api/bots endpoint
Write-Host "Creating /api/bots endpoint..." -ForegroundColor Yellow

try {
    $botsResource = aws apigateway create-resource `
        --rest-api-id $API_ID `
        --parent-id $API_ID_RESOURCE `
        --path-part bots `
        --region $REGION `
        --output json | ConvertFrom-Json
    $BOTS_ID = $botsResource.id
} catch {
    $resources = aws apigateway get-resources --rest-api-id $API_ID --region $REGION --output json | ConvertFrom-Json
    $BOTS_ID = ($resources.items | Where-Object { $_.path -eq "/api/bots" }).id
}

aws apigateway put-method `
    --rest-api-id $API_ID `
    --resource-id $BOTS_ID `
    --http-method GET `
    --authorization-type NONE `
    --region $REGION | Out-Null

aws apigateway put-integration `
    --rest-api-id $API_ID `
    --resource-id $BOTS_ID `
    --http-method GET `
    --type AWS_PROXY `
    --integration-http-method POST `
    --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$BOTS_LAMBDA/invocations" `
    --region $REGION | Out-Null

aws lambda add-permission `
    --function-name chatbot-builder-bots `
    --statement-id apigateway-bots `
    --action lambda:InvokeFunction `
    --principal apigateway.amazonaws.com `
    --source-arn "arn:aws:execute-api:$REGION:$ACCOUNT_ID:$API_ID/*/*" `
    --region $REGION 2>$null | Out-Null

Write-Host "  ✓ /api/bots created" -ForegroundColor Green

# Deploy API
Write-Host "`nDeploying API to prod stage..." -ForegroundColor Yellow
aws apigateway create-deployment `
    --rest-api-id $API_ID `
    --stage-name prod `
    --region $REGION | Out-Null

Write-Host "  ✓ API deployed!" -ForegroundColor Green

# Get API URL
$API_URL = "https://$API_ID.execute-api.$REGION.amazonaws.com/prod"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "API Gateway Deployed Successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "API URL: $API_URL" -ForegroundColor Yellow
Write-Host ""
Write-Host "Available Endpoints:" -ForegroundColor Yellow
Write-Host "  POST $API_URL/auth/register" -ForegroundColor White
Write-Host "  POST $API_URL/auth/login" -ForegroundColor White
Write-Host "  POST $API_URL/api/chat" -ForegroundColor White
Write-Host "  GET  $API_URL/api/bots" -ForegroundColor White
Write-Host ""

# Save to file
$API_URL | Out-File -FilePath "api-url.txt"
Write-Host "✓ API URL saved to api-url.txt" -ForegroundColor Green
