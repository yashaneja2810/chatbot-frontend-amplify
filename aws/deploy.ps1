# AWS Deployment Script for Windows PowerShell
# This script automates the deployment of the chatbot builder to AWS

param(
    [Parameter(Mandatory=$false)]
    [string]$GoogleApiKey,
    
    [Parameter(Mandatory=$false)]
    [string]$StackName = "chatbot-builder-stack",
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "us-east-1",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipInfrastructure,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipLambda,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipFrontend
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AWS Chatbot Builder Deployment Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if AWS CLI is installed
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
try {
    $awsVersion = aws --version
    Write-Host "✓ AWS CLI installed: $awsVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ AWS CLI not found. Please install it first." -ForegroundColor Red
    Write-Host "  Download from: https://awscli.amazonaws.com/AWSCLIV2.msi" -ForegroundColor Yellow
    exit 1
}

# Check AWS credentials
try {
    $identity = aws sts get-caller-identity --output json | ConvertFrom-Json
    Write-Host "✓ AWS credentials configured" -ForegroundColor Green
    Write-Host "  Account: $($identity.Account)" -ForegroundColor Gray
    Write-Host "  User: $($identity.Arn)" -ForegroundColor Gray
} catch {
    Write-Host "✗ AWS credentials not configured. Run 'aws configure' first." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Phase 1: Deploy Infrastructure
if (-not $SkipInfrastructure) {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Phase 1: Deploying Infrastructure" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    if (-not $GoogleApiKey) {
        $GoogleApiKey = Read-Host "Enter your Google API Key"
    }
    
    Write-Host "Deploying CloudFormation stack..." -ForegroundColor Yellow
    
    try {
        aws cloudformation create-stack `
            --stack-name $StackName `
            --template-body file://cloudformation/complete-stack.yaml `
            --parameters ParameterKey=GoogleApiKey,ParameterValue=$GoogleApiKey `
            --capabilities CAPABILITY_NAMED_IAM `
            --region $Region
        
        Write-Host "✓ Stack creation initiated" -ForegroundColor Green
        Write-Host "  Waiting for stack to complete (this may take 5-10 minutes)..." -ForegroundColor Yellow
        
        aws cloudformation wait stack-create-complete `
            --stack-name $StackName `
            --region $Region
        
        Write-Host "✓ Infrastructure deployed successfully!" -ForegroundColor Green
        
        # Get stack outputs
        Write-Host ""
        Write-Host "Stack Outputs:" -ForegroundColor Cyan
        $outputs = aws cloudformation describe-stacks `
            --stack-name $StackName `
            --region $Region `
            --query 'Stacks[0].Outputs' `
            --output json | ConvertFrom-Json
        
        foreach ($output in $outputs) {
            Write-Host "  $($output.OutputKey): $($output.OutputValue)" -ForegroundColor Gray
        }
        
        # Save outputs to file
        $outputs | ConvertTo-Json | Out-File -FilePath "stack-outputs.json"
        Write-Host ""
        Write-Host "✓ Outputs saved to stack-outputs.json" -ForegroundColor Green
        
    } catch {
        Write-Host "✗ Stack deployment failed: $_" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Skipping infrastructure deployment" -ForegroundColor Yellow
}

Write-Host ""

# Phase 2: Deploy Lambda Functions
if (-not $SkipLambda) {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Phase 2: Deploying Lambda Functions" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    # Create packages directory
    $packagesDir = "lambda-functions/packages"
    if (-not (Test-Path $packagesDir)) {
        New-Item -ItemType Directory -Path $packagesDir -Force | Out-Null
    }
    
    $functions = @(
        @{Name="auth"; Handler="auth_handler.py"},
        @{Name="upload"; Handler="upload_handler.py"},
        @{Name="chat"; Handler="chat_handler.py"},
        @{Name="bots"; Handler="bots_handler.py"}
    )
    
    foreach ($func in $functions) {
        Write-Host "Packaging $($func.Name) function..." -ForegroundColor Yellow
        
        $funcDir = Join-Path $packagesDir $func.Name
        if (Test-Path $funcDir) {
            Remove-Item -Recurse -Force $funcDir
        }
        New-Item -ItemType Directory -Path $funcDir -Force | Out-Null
        
        # Copy handler
        Copy-Item "lambda-functions/$($func.Handler)" -Destination $funcDir
        
        # Install dependencies
        Write-Host "  Installing dependencies..." -ForegroundColor Gray
        pip install -r lambda-functions/requirements.txt -t $funcDir --quiet
        
        # Create zip
        $zipFile = Join-Path $packagesDir "$($func.Name)-function.zip"
        if (Test-Path $zipFile) {
            Remove-Item $zipFile
        }
        
        Push-Location $funcDir
        Compress-Archive -Path * -DestinationPath $zipFile
        Pop-Location
        
        Write-Host "  ✓ Package created: $zipFile" -ForegroundColor Green
        
        # Upload to Lambda
        Write-Host "  Uploading to Lambda..." -ForegroundColor Gray
        try {
            aws lambda update-function-code `
                --function-name "$StackName-$($func.Name)" `
                --zip-file fileb://$zipFile `
                --region $Region | Out-Null
            
            Write-Host "  ✓ $($func.Name) function deployed" -ForegroundColor Green
        } catch {
            Write-Host "  ✗ Failed to deploy $($func.Name) function: $_" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Write-Host "✓ All Lambda functions deployed!" -ForegroundColor Green
} else {
    Write-Host "Skipping Lambda deployment" -ForegroundColor Yellow
}

Write-Host ""

# Phase 3: Deploy Frontend
if (-not $SkipFrontend) {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Phase 3: Frontend Deployment" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "Frontend deployment requires manual steps:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Update frontend/.env.production with AWS values:" -ForegroundColor White
    Write-Host "   - VITE_COGNITO_USER_POOL_ID" -ForegroundColor Gray
    Write-Host "   - VITE_COGNITO_APP_CLIENT_ID" -ForegroundColor Gray
    Write-Host "   - VITE_API_URL" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Deploy to AWS Amplify:" -ForegroundColor White
    Write-Host "   cd frontend" -ForegroundColor Gray
    Write-Host "   amplify init" -ForegroundColor Gray
    Write-Host "   amplify publish" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Or use AWS Amplify Console for CI/CD deployment" -ForegroundColor Yellow
} else {
    Write-Host "Skipping frontend deployment" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deployment Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if (-not $SkipInfrastructure) {
    Write-Host "✓ Infrastructure deployed" -ForegroundColor Green
}
if (-not $SkipLambda) {
    Write-Host "✓ Lambda functions deployed" -ForegroundColor Green
}
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Review stack-outputs.json for resource details" -ForegroundColor White
Write-Host "2. Run migration scripts to migrate data:" -ForegroundColor White
Write-Host "   cd migration-scripts" -ForegroundColor Gray
Write-Host "   python migrate_users.py users.csv" -ForegroundColor Gray
Write-Host "   python migrate_vectors.py migrate-all" -ForegroundColor Gray
Write-Host "3. Deploy frontend to AWS Amplify" -ForegroundColor White
Write-Host "4. Test the application" -ForegroundColor White
Write-Host ""
Write-Host "For detailed instructions, see DEPLOYMENT_GUIDE.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "Deployment script completed!" -ForegroundColor Green
