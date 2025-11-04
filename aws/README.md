# AWS Migration - Complete Package

## 📁 Directory Structure

```
aws/
├── README.md                          # This file
├── cognito-setup.md                   # Amazon Cognito configuration
├── dynamodb-schema.md                 # DynamoDB table design
├── rds-setup.md                       # RDS PostgreSQL setup
├── DEPLOYMENT_GUIDE.md                # Step-by-step deployment
├── lambda-functions/                  # Lambda function code
│   ├── auth_handler.py               # Authentication endpoints
│   ├── upload_handler.py             # Document upload
│   ├── chat_handler.py               # Chat with AI
│   ├── bots_handler.py               # Bot management
│   └── requirements.txt              # Python dependencies
├── migration-scripts/                 # Data migration tools
│   ├── migrate_users.py              # Supabase → Cognito
│   └── migrate_vectors.py            # Qdrant → DynamoDB
├── cloudformation/                    # Infrastructure as Code
│   └── complete-stack.yaml           # Full AWS stack
└── terraform/                         # Alternative IaC (optional)
```

## 🚀 Quick Start

### 1. Prerequisites

```bash
# Install AWS CLI
# Windows: https://awscli.amazonaws.com/AWSCLIV2.msi

# Configure AWS
aws configure

# Install Python dependencies
pip install boto3 psycopg2-binary qdrant-client supabase
```

### 2. Deploy Infrastructure

```bash
# Deploy CloudFormation stack
cd aws/cloudformation
aws cloudformation create-stack \
  --stack-name chatbot-builder-stack \
  --template-body file://complete-stack.yaml \
  --parameters \
    ParameterKey=GoogleApiKey,ParameterValue=YOUR_KEY \
  --capabilities CAPABILITY_NAMED_IAM

# Wait for completion (5-10 minutes)
aws cloudformation wait stack-create-complete \
  --stack-name chatbot-builder-stack
```

### 3. Deploy Lambda Functions

```bash
cd aws/lambda-functions

# Package and deploy
./deploy-functions.sh  # See DEPLOYMENT_GUIDE.md for details
```

### 4. Migrate Data

```bash
cd aws/migration-scripts

# Migrate users
python migrate_users.py users_export.csv

# Migrate vectors
python migrate_vectors.py migrate-all collection_mapping.json
```

### 5. Deploy Frontend

```bash
cd frontend

# Update environment variables
cp .env.example .env.production
# Edit .env.production with AWS values

# Deploy to Amplify
amplify publish
```

## 📚 Documentation

### Core Setup Guides

1. **[AWS_MIGRATION_GUIDE.md](../AWS_MIGRATION_GUIDE.md)** - Overview and architecture
2. **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Step-by-step deployment
3. **[cognito-setup.md](cognito-setup.md)** - User authentication
4. **[dynamodb-schema.md](dynamodb-schema.md)** - Vector storage
5. **[rds-setup.md](rds-setup.md)** - Relational database

### Service Mapping

| Current | AWS Service | Guide |
|---------|-------------|-------|
| Supabase Auth | Amazon Cognito | [cognito-setup.md](cognito-setup.md) |
| Supabase DB | Amazon RDS | [rds-setup.md](rds-setup.md) |
| Qdrant | DynamoDB | [dynamodb-schema.md](dynamodb-schema.md) |
| Render | Lambda + API Gateway | [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) |
| Vercel | AWS Amplify | [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) |
| Local Files | Amazon S3 | [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) |

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                      AWS Cloud                           │
│                                                          │
│  ┌──────────────┐         ┌──────────────────────┐     │
│  │ AWS Amplify  │────────▶│  Amazon Cognito      │     │
│  │  (Frontend)  │         │  (Authentication)    │     │
│  └──────┬───────┘         └──────────────────────┘     │
│         │                                                │
│         ▼                                                │
│  ┌──────────────────────────────────────────────┐      │
│  │      Amazon API Gateway (REST API)           │      │
│  └──────┬───────────────────────────────────────┘      │
│         │                                                │
│         ▼                                                │
│  ┌──────────────────────────────────────────────┐      │
│  │         AWS Lambda Functions                  │      │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐│      │
│  │  │  Auth  │ │ Upload │ │  Chat  │ │  Bots  ││      │
│  │  └────────┘ └────────┘ └────────┘ └────────┘│      │
│  └──────┬────────────┬────────────┬─────────────┘      │
│         │            │            │                     │
│         ▼            ▼            ▼                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐       │
│  │   RDS    │ │    S3    │ │    DynamoDB      │       │
│  │(Postgres)│ │(Documents)│ │(Vector Storage)  │       │
│  └──────────┘ └──────────┘ └──────────────────┘       │
└─────────────────────────────────────────────────────────┘
```

## 💰 Cost Estimation

### Free Tier (First 12 Months)

| Service | Free Tier | Expected Usage | Cost |
|---------|-----------|----------------|------|
| Lambda | 1M requests/month | ~50K | $0 |
| API Gateway | 1M calls/month | ~50K | $0 |
| DynamoDB | 25 GB, 25 WCU/RCU | ~10 GB | $0 |
| S3 | 5 GB storage | ~2 GB | $0 |
| RDS | 750 hrs db.t3.micro | ~720 hrs | $0 |
| Cognito | 50K MAUs | ~100 users | $0 |
| Amplify | 1000 build mins | ~100 mins | $0 |
| **Total** | | | **$0-5/month** |

### After Free Tier

| Service | Monthly Cost (Small Scale) |
|---------|---------------------------|
| Lambda | $1-5 |
| API Gateway | $3-10 |
| DynamoDB | $5-15 |
| S3 | $1-3 |
| RDS | $15-20 |
| Cognito | $0-5 |
| Amplify | $0-5 |
| **Total** | **$25-63/month** |

## 🔧 Configuration

### Environment Variables

#### Backend (Lambda)

```env
AWS_REGION=us-east-1
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
COGNITO_APP_CLIENT_ID=XXXXXXXXXXXXXXXXXX
DYNAMODB_VECTORS_TABLE=chatbot-builder-vectors
DYNAMODB_BOTS_TABLE=chatbot-builder-bots
S3_BUCKET_NAME=chatbot-builder-documents-XXXX
RDS_HOST=chatbot-db.xxx.rds.amazonaws.com
RDS_DATABASE=chatbot_db
GOOGLE_API_KEY=your_google_api_key
```

#### Frontend (Amplify)

```env
VITE_AWS_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
VITE_COGNITO_APP_CLIENT_ID=XXXXXXXXXXXXXXXXXX
VITE_API_URL=https://xxx.execute-api.us-east-1.amazonaws.com/prod
```

## 🧪 Testing

### Test Authentication

```bash
# Signup
curl -X POST https://YOUR_API/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","name":"Test"}'

# Signin
curl -X POST https://YOUR_API/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

### Test Chat

```bash
curl -X POST https://YOUR_API/api/chat \
  -H "Content-Type: application/json" \
  -d '{"bot_id":"BOT_ID","query":"Hello"}'
```

## 📊 Monitoring

### CloudWatch Dashboards

```bash
# View Lambda logs
aws logs tail /aws/lambda/chatbot-builder-chat --follow

# View API Gateway logs
aws logs tail API-Gateway-Execution-Logs_XXXXX/prod --follow
```

### Key Metrics to Monitor

- Lambda invocations and errors
- API Gateway 4xx/5xx errors
- DynamoDB consumed capacity
- RDS CPU and connections
- S3 storage usage

## 🔒 Security Checklist

- [ ] Enable MFA for AWS root account
- [ ] Use IAM roles with least privilege
- [ ] Enable CloudTrail for audit logs
- [ ] Encrypt data at rest (RDS, S3, DynamoDB)
- [ ] Use HTTPS only (API Gateway, Amplify)
- [ ] Rotate credentials regularly
- [ ] Enable AWS WAF for API Gateway
- [ ] Set up VPC for Lambda functions
- [ ] Use Secrets Manager for sensitive data
- [ ] Enable GuardDuty for threat detection

## 🚨 Troubleshooting

### Common Issues

#### Lambda Timeout

```bash
# Increase timeout
aws lambda update-function-configuration \
  --function-name chatbot-builder-chat \
  --timeout 60
```

#### DynamoDB Throttling

```bash
# Check consumed capacity
aws dynamodb describe-table \
  --table-name chatbot-builder-vectors \
  --query 'Table.ProvisionedThroughput'
```

#### RDS Connection Issues

```bash
# Check security group
aws ec2 describe-security-groups \
  --group-ids sg-XXXXXXXX

# Test connection
psql -h chatbot-db.xxx.rds.amazonaws.com -U postgres -d chatbot_db
```

## 📞 Support

### AWS Resources

- **Documentation**: https://docs.aws.amazon.com/
- **Support Center**: https://console.aws.amazon.com/support/
- **Forums**: https://forums.aws.amazon.com/
- **Stack Overflow**: Tag with `amazon-web-services`

### Project Resources

- **GitHub Issues**: Create an issue for bugs
- **Documentation**: See individual guide files
- **Migration Scripts**: Check `migration-scripts/` directory

## 🎯 Next Steps

1. **Review** the [AWS_MIGRATION_GUIDE.md](../AWS_MIGRATION_GUIDE.md)
2. **Follow** the [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
3. **Configure** each service using individual guides
4. **Migrate** data using migration scripts
5. **Test** thoroughly before going live
6. **Monitor** for 1 week before decommissioning old infrastructure

## 📝 Migration Checklist

### Pre-Migration

- [ ] Review all documentation
- [ ] Create AWS account
- [ ] Set up billing alerts
- [ ] Configure AWS CLI
- [ ] Export data from Supabase/Qdrant

### Infrastructure

- [ ] Deploy CloudFormation stack
- [ ] Configure Cognito User Pool
- [ ] Create DynamoDB tables
- [ ] Set up RDS PostgreSQL
- [ ] Create S3 bucket
- [ ] Deploy Lambda functions
- [ ] Configure API Gateway

### Data Migration

- [ ] Migrate users to Cognito
- [ ] Migrate database to RDS
- [ ] Migrate vectors to DynamoDB
- [ ] Upload documents to S3
- [ ] Verify data integrity

### Frontend

- [ ] Update environment variables
- [ ] Deploy to Amplify
- [ ] Configure custom domain (optional)
- [ ] Test all functionality

### Post-Migration

- [ ] Set up monitoring
- [ ] Configure alarms
- [ ] Enable backups
- [ ] Security audit
- [ ] Performance testing
- [ ] User acceptance testing
- [ ] Decommission old infrastructure

## 🎉 Success Criteria

Your migration is successful when:

- ✅ All users can authenticate via Cognito
- ✅ Document upload works via S3
- ✅ Chat responses are accurate (vector search)
- ✅ All bots are accessible
- ✅ Frontend loads from Amplify
- ✅ API response times < 2 seconds
- ✅ No errors in CloudWatch logs
- ✅ Costs within expected range
- ✅ All tests passing

---

**Ready to migrate?** Start with the [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)!

For questions or issues, refer to individual service guides or create a GitHub issue.
