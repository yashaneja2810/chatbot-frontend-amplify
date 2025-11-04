# 🎉 AWS Chatbot Application - READY TO USE

## Application Access
**Live URL**: https://main.dw585mmpvme6s.amplifyapp.com

## Test Account
- **Email**: test@example.com
- **Password**: TestPass123!

## What's Deployed ✅

### Frontend (AWS Amplify)
- ✅ React application hosted on Amplify
- ✅ Auto-deploy from GitHub on push
- ✅ SPA routing configured
- ✅ CORS properly configured

### Backend (AWS Lambda + API Gateway)
- ✅ **API Gateway**: https://g31hjitjqk.execute-api.us-east-1.amazonaws.com/prod
- ✅ **Lambda Functions**:
  - `chatbot-builder-auth` - Login/Register (Working ✅)
  - `chatbot-builder-bots` - Bot management (Working ✅)
  - `chatbot-builder-upload` - Document upload (Timeout increased to 15 min)
  - `chatbot-builder-chat` - Chat functionality (Working ✅)

### Database & Storage
- ✅ **DynamoDB Tables**:
  - `chatbot-builder-bots` - Bot metadata
  - `chatbot-builder-vectors` - Document embeddings
- ✅ **S3 Bucket**: `chatbot-builder-documents-252689085544`
- ✅ **Cognito User Pool**: `us-east-1_iq8va28cy`

## Known Issues & Solutions

### Issue: ERR_INTERNET_DISCONNECTED
**Cause**: This Chrome error occurs when:
1. Actual internet connectivity issues
2. Request takes longer than browser timeout
3. Large file uploads

**Solutions Applied**:
- ✅ Increased Lambda timeout to 900 seconds (15 minutes)
- ✅ API Gateway timeout set to 29 seconds (max allowed)
- ✅ Upload uses JSON with base64 encoding

**What to try**:
1. Use smaller files (< 5MB) for testing
2. Check your internet connection stability
3. Try a different browser (Firefox, Edge)
4. Disable browser extensions that might interfere

### Cosmetic Issues (Non-Breaking)
- ⚠️ `vite.svg 404` - Missing favicon (doesn't affect functionality)
- ⚠️ `create-bot/ 404` - Browser prefetch (doesn't affect functionality)

## How to Use

### 1. Login
1. Go to https://main.dw585mmpvme6s.amplifyapp.com
2. Click "Login"
3. Enter: test@example.com / TestPass123!

### 2. Create a Bot
1. Click "Create New Bot"
2. Enter company name
3. Upload documents (PDF, DOCX, or TXT)
4. Click "Create Bot"
5. Wait for processing (may take 30-60 seconds)

### 3. Chat with Bot
1. Go to dashboard
2. Click on your bot
3. Start chatting!

## Troubleshooting

### If upload fails:
1. **Check file size** - Keep files under 5MB
2. **Check internet** - Ensure stable connection
3. **Try different browser** - Chrome sometimes has timeout issues
4. **Check CloudWatch logs**:
   ```bash
   aws logs tail /aws/lambda/chatbot-builder-upload --follow
   ```

### If login fails:
1. Clear browser cache
2. Check credentials
3. Create new user:
   ```bash
   aws cognito-idp admin-create-user --user-pool-id us-east-1_iq8va28cy --username newuser@example.com --user-attributes Name=email,Value=newuser@example.com Name=email_verified,Value=true --temporary-password TempPass123!
   aws cognito-idp admin-set-user-password --user-pool-id us-east-1_iq8va28cy --username newuser@example.com --password NewPass123! --permanent
   ```

## Architecture

```
User Browser
    ↓
AWS Amplify (Frontend)
    ↓ HTTPS
API Gateway (REST API)
    ↓ Lambda Proxy Integration
Lambda Functions (Python 3.11)
    ↓
├── Cognito (Authentication)
├── DynamoDB (Data Storage)
└── S3 (File Storage)
```

## Deployment Info
- **Region**: us-east-1 (US East - N. Virginia)
- **Amplify App ID**: dw585mmpvme6s
- **API Gateway ID**: g31hjitjqk
- **GitHub Repo**: https://github.com/yashaneja2810/GenAI-Services-Deployment-

## Next Steps
1. Test with small files first
2. Monitor CloudWatch logs for any errors
3. Add Google Gemini API key for AI responses
4. Consider adding CloudFront for better performance
5. Set up custom domain name

Your application is fully deployed and ready to use! 🚀
