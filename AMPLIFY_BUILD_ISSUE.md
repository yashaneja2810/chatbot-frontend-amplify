# Amplify Build Issue - Action Required

## Current Status
Your Amplify app is connected to GitHub but builds are failing.

## App Details
- **App ID**: dw585mmpvme6s
- **URL**: https://main.dw585mmpvme6s.amplifyapp.com
- **Repository**: https://github.com/yashaneja2810/GenAI-Services-Deployment-
- **Branch**: main

## Check Build Logs
To see why the build is failing, go to:
https://console.aws.amazon.com/amplify/home?region=us-east-1#/dw585mmpvme6s

Click on the "main" branch, then click on the latest build to see detailed logs.

## Likely Issues
1. **Build spec not being read**: The amplify.yml might not be in the right location
2. **Node version**: Might need to specify Node version
3. **Build commands**: The `cd frontend` command might be causing issues

## Quick Fix - Update amplify.yml

Try updating the amplify.yml with Node version specified:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd frontend
        - npm install
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: frontend/dist
    files:
      - '**/*'
  cache:
    paths:
      - frontend/node_modules/**/*
```

## Alternative: Manual Build Settings in Console

Go to the Amplify Console and set build settings manually:
1. Go to App settings → Build settings
2. Edit build spec
3. Paste the amplify.yml content
4. Save and redeploy

## Environment Variables (Already Set)
✅ VITE_API_URL
✅ VITE_AWS_REGION  
✅ VITE_COGNITO_USER_POOL_ID
✅ VITE_COGNITO_APP_CLIENT_ID

Please check the console logs to see the exact error.
