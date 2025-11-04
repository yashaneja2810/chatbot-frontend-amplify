# AWS Migration - Quick Reference Card

## 🚀 One-Command Deployment

```powershell
# Windows PowerShell
cd aws
.\deploy.ps1 -GoogleApiKey "YOUR_KEY"
```

## 📋 Service URLs

After deployment, save these URLs:

```
Cognito User Pool: https://console.aws.amazon.com/cognito/
API Gateway: https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod
Amplify App: https://YOUR_APP_ID.amplifyapp.com
S3 Bucket: s3://chatbot-builder-documents-ACCOUNT_ID
DynamoDB: https://console.aws.amazon.com/dynamodb/
RDS: chatbot-db.XXXXX.us-east-1.rds.amazonaws.com
```

## 🔑 Environment Variables

### Backend (Lambda)
```env
AWS_REGION=us-east-1
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
COGNITO_APP_CLIENT_ID=XXXXXXXXXXXXXXXXXX
DYNAMODB_VECTORS_TABLE=chatbot-builder-vectors
DYNAMODB_BOTS_TABLE=chatbot-builder-bots
S3_BUCKET_NAME=chatbot-builder-documents-XXXX
GOOGLE_API_KEY=your_google_api_key
```

### Frontend (Amplify)
```env
VITE_AWS_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
VITE_COGNITO_APP_CLIENT_ID=XXXXXXXXXXXXXXXXXX
VITE_API_URL=https://xxx.execute-api.us-east-1.amazonaws.com/prod
```

## 📊 AWS Console Quick Links

| Service | Console URL |
|---------|-------------|
| CloudFormation | https://console.aws.amazon.com/cloudformation/ |
| Lambda | https://console.aws.amazon.com/lambda/ |
| API Gateway | https://console.aws.amazon.com/apigateway/ |
| Cognito | https://console.aws.amazon.com/cognito/ |
| DynamoDB | https://console.aws.amazon.com/dynamodb/ |
| RDS | https://console.aws.amazon.com/rds/ |
| S3 | https://console.aws.amazon.com/s3/ |
| Amplify | https://console.aws.amazon.com/amplify/ |
| CloudWatch | https://console.aws.amazon.com/cloudwatch/ |

## 🛠️ Common Commands

### Deploy Stack
```bash
aws cloudformation create-stack \
  --stack-name chatbot-builder-stack \
  --template-body file://aws/cloudformation/complete-stack.yaml \
  --parameters ParameterKey=GoogleApiKey,ParameterValue=YOUR_KEY \
  --capabilities CAPABILITY_NAMED_IAM
```

### Update Lambda Function
```bash
aws lambda update-function-code \
  --function-name chatbot-builder-chat \
  --zip-file fileb://function.zip
```

### View Logs
```bash
aws logs tail /aws/lambda/chatbot-builder-chat --follow
```

### Get Stack Outputs
```bash
aws cloudformation describe-stacks \
  --stack-name chatbot-builder-stack \
  --query 'Stacks[0].Outputs'
```

### Test API
```bash
curl -X POST https://YOUR_API/api/chat \
  -H "Content-Type: application/json" \
  -d '{"bot_id":"BOT_ID","query":"Hello"}'
```

## 🔍 Troubleshooting

### Lambda Errors
```bash
# View recent errors
aws logs filter-log-events \
  --log-group-name /aws/lambda/chatbot-builder-chat \
  --filter-pattern "ERROR"
```

### DynamoDB Issues
```bash
# Check table status
aws dynamodb describe-table --table-name chatbot-builder-vectors
```

### RDS Connection
```bash
# Test connection
psql -h chatbot-db.xxx.rds.amazonaws.com -U postgres -d chatbot_db
```

### API Gateway
```bash
# Get API details
aws apigateway get-rest-apis
```

## 💰 Cost Monitoring

```bash
# Current month costs
aws ce get-cost-and-usage \
  --time-period Start=2025-11-01,End=2025-11-30 \
  --granularity MONTHLY \
  --metrics BlendedCost
```

## 🔒 Security Checklist

- [ ] Enable MFA on root account
- [ ] Use IAM roles (not root credentials)
- [ ] Enable CloudTrail
- [ ] Encrypt data at rest
- [ ] Use HTTPS only
- [ ] Rotate credentials
- [ ] Set up billing alerts
- [ ] Review security groups
- [ ] Enable GuardDuty
- [ ] Use Secrets Manager

## 📈 Monitoring Metrics

### Lambda
- Invocations
- Errors
- Duration
- Throttles

### API Gateway
- Count (requests)
- 4XXError
- 5XXError
- Latency

### DynamoDB
- ConsumedReadCapacityUnits
- ConsumedWriteCapacityUnits
- UserErrors
- SystemErrors

### RDS
- CPUUtilization
- DatabaseConnections
- FreeStorageSpace
- ReadLatency

## 🎯 Migration Checklist

### Pre-Migration
- [ ] AWS account created
- [ ] AWS CLI configured
- [ ] Billing alerts set
- [ ] Data exported from Supabase/Qdrant

### Deployment
- [ ] CloudFormation stack deployed
- [ ] Lambda functions uploaded
- [ ] API Gateway configured
- [ ] Frontend deployed to Amplify

### Data Migration
- [ ] Users migrated to Cognito
- [ ] Database migrated to RDS
- [ ] Vectors migrated to DynamoDB
- [ ] Documents uploaded to S3

### Testing
- [ ] Authentication works
- [ ] Document upload works
- [ ] Chat responses accurate
- [ ] All bots accessible
- [ ] Performance acceptable

### Post-Migration
- [ ] Monitoring configured
- [ ] Alarms set up
- [ ] Backups enabled
- [ ] Security audit complete
- [ ] Old infrastructure decommissioned

## 📞 Support Resources

- **AWS Documentation**: https://docs.aws.amazon.com/
- **AWS Support**: https://console.aws.amazon.com/support/
- **AWS Forums**: https://forums.aws.amazon.com/
- **Stack Overflow**: Tag `amazon-web-services`

## 📚 Documentation Files

| File | Description |
|------|-------------|
| AWS_MIGRATION_GUIDE.md | Complete migration overview |
| aws/DEPLOYMENT_GUIDE.md | Step-by-step deployment |
| aws/cognito-setup.md | Cognito configuration |
| aws/dynamodb-schema.md | DynamoDB design |
| aws/rds-setup.md | RDS PostgreSQL setup |
| aws/README.md | AWS package overview |

## 🎉 Success Criteria

Your migration is complete when:
- ✅ Users can sign up/login via Cognito
- ✅ Documents upload to S3
- ✅ Chat works with vector search
- ✅ All bots are accessible
- ✅ Frontend loads from Amplify
- ✅ API response time < 2s
- ✅ No errors in logs
- ✅ Costs within budget

## 🚨 Emergency Rollback

```bash
# Delete stack (if needed)
aws cloudformation delete-stack --stack-name chatbot-builder-stack

# Revert DNS to old infrastructure
# Keep Supabase/Qdrant running during migration period
```

---

**Need help?** See detailed guides in the `aws/` directory or create a GitHub issue.
