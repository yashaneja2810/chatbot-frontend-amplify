# Amplify GitHub Connection Setup

## Current Issue
Manual Amplify deployments aren't working properly. The proper way to use Amplify is to connect it to your GitHub repository.

## Your GitHub Repository
- **URL**: https://github.com/yashaneja2810/GenAI-Services-Deployment-.git
- **Branch**: main

## Option 1: Connect via AWS Console (RECOMMENDED)

1. Go to AWS Amplify Console: https://console.aws.amazon.com/amplify/home?region=us-east-1
2. Click "New app" → "Host web app"
3. Select "GitHub" as the source
4. Authorize AWS Amplify to access your GitHub account
5. Select repository: `yashaneja2810/GenAI-Services-Deployment-`
6. Select branch: `main`
7. Build settings will auto-detect from `amplify.yml`
8. Add environment variables:
   ```
   VITE_API_URL=https://g31hjitjqk.execute-api.us-east-1.amazonaws.com/prod
   VITE_AWS_REGION=us-east-1
   VITE_COGNITO_USER_POOL_ID=us-east-1_iq8va28cy
   VITE_COGNITO_APP_CLIENT_ID=6e7kcma9ucdc83tefa0eg4ot5b
   ```
9. Click "Save and deploy"

## Option 2: Connect via CLI (Requires GitHub Token)

If you want to use CLI, you need to:
1. Create a GitHub Personal Access Token:
   - Go to: https://github.com/settings/tokens
   - Generate new token (classic)
   - Select scopes: `repo` (full control)
   - Copy the token

2. Then run:
```bash
aws amplify create-app --name chatbot-builder \
  --repository https://github.com/yashaneja2810/GenAI-Services-Deployment-.git \
  --access-token YOUR_GITHUB_TOKEN \
  --environment-variables VITE_API_URL=https://g31hjitjqk.execute-api.us-east-1.amazonaws.com/prod,VITE_AWS_REGION=us-east-1,VITE_COGNITO_USER_POOL_ID=us-east-1_iq8va28cy,VITE_COGNITO_APP_CLIENT_ID=6e7kcma9ucdc83tefa0eg4ot5b
```

## Why GitHub Connection is Better
- ✅ Automatic deployments on git push
- ✅ Proper build process with all assets
- ✅ Preview deployments for pull requests
- ✅ Rollback capability
- ✅ Build logs and debugging

## Next Steps
Please choose one of the options above to connect Amplify to your GitHub repository.
