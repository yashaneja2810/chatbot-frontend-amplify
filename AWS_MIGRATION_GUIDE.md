# AWS Migration Guide - No-Code AI Chatbot Builder

## Overview
This guide provides a complete migration path from your current architecture (Supabase + Qdrant + Render/Vercel) to AWS using only free tier eligible services.

## Current Architecture
- **Frontend**: React + TypeScript (Vite) → Deployed on Vercel
- **Backend**: FastAPI + Python → Deployed on Render
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **Vector Store**: Qdrant Cloud
- **AI**: Google Gemini API
- **File Storage**: Local/Temporary

## Target AWS Architecture

### Service Mapping

| Current Service | AWS Service | Purpose |
|----------------|-------------|---------|
| Vercel (Frontend) | **AWS Amplify** | Host React frontend with CI/CD |
| Render (Backend) | **AWS Lambda + API Gateway** | Serverless API endpoints |
| Supabase Auth | **Amazon Cognito** | User authentication & authorization |
| Supabase PostgreSQL | **Amazon RDS (PostgreSQL)** | Relational database for user/bot data |
| Qdrant Vector DB | **Amazon DynamoDB** | Store vector embeddings & metadata |
| File Storage | **Amazon S3** | Document storage |
| Analytics (Future) | **Amazon QuickSight** | Bot analytics & dashboards |

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         AWS Cloud                                │
│                                                                   │
│  ┌──────────────┐         ┌─────────────────────────────────┐  │
│  │              │         │      Amazon Cognito              │  │
│  │ AWS Amplify  │────────▶│  - User Pool                     │  │
│  │ (Frontend)   │         │  - JWT Tokens                    │  │
│  │              │         │  - OAuth 2.0                     │  │
│  └──────┬───────┘         └─────────────────────────────────┘  │
│         │                                                        │
│         │ HTTPS                                                  │
│         ▼                                                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           Amazon API Gateway (REST API)                   │  │
│  │  - /auth/*     - /api/upload    - /api/chat              │  │
│  │  - /api/bots/* - /api/health                             │  │
│  └──────┬───────────────────────────────────────────────────┘  │
│         │                                                        │
│         │ Invokes                                                │
│         ▼                                                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              AWS Lambda Functions                         │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │  │
│  │  │   Auth     │  │  Upload    │  │    Chat    │         │  │
│  │  │  Handler   │  │  Handler   │  │  Handler   │         │  │
│  │  └────────────┘  └────────────┘  └────────────┘         │  │
│  └──────┬───────────────┬───────────────┬──────────────────┘  │
│         │               │               │                       │
│         ▼               ▼               ▼                       │
│  ┌──────────────┐ ┌──────────┐  ┌──────────────────────────┐  │
│  │  Amazon RDS  │ │ Amazon S3│  │    Amazon DynamoDB       │  │
│  │ (PostgreSQL) │ │          │  │  - Vectors Table         │  │
│  │  - users     │ │ - PDFs   │  │  - Embeddings (384-dim)  │  │
│  │  - bots      │ │ - DOCX   │  │  - Metadata              │  │
│  │  - documents │ │ - TXT    │  │  - Bot Collections       │  │
│  └──────────────┘ └──────────┘  └──────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           Amazon QuickSight (Optional)                    │  │
│  │  - Bot Analytics Dashboard                                │  │
│  │  - Usage Metrics                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Google Gemini   │
                    │   API (External) │
                    └──────────────────┘
```

## Migration Steps

### Phase 1: Setup AWS Infrastructure (Week 1)

#### 1.1 Amazon Cognito Setup
- Create User Pool for authentication
- Configure JWT tokens
- Set up user attributes (email, name)
- Create App Client for frontend

#### 1.2 Amazon RDS Setup
- Launch PostgreSQL instance (db.t3.micro - Free Tier)
- Configure security groups
- Create database schema
- Migrate user/bot data from Supabase

#### 1.3 Amazon DynamoDB Setup
- Create tables for vector storage
- Design partition/sort keys for efficient queries
- Set up GSI for bot_id lookups
- Configure auto-scaling (within free tier)

#### 1.4 Amazon S3 Setup
- Create bucket for document storage
- Configure CORS for frontend access
- Set up lifecycle policies
- Enable versioning

### Phase 2: Backend Migration (Week 2)

#### 2.1 Lambda Function Development
- Convert FastAPI endpoints to Lambda handlers
- Implement API Gateway integration
- Add Cognito authorizer
- Update database connections

#### 2.2 Vector Store Migration
- Implement DynamoDB vector operations
- Create similarity search logic
- Migrate existing vectors from Qdrant
- Test search performance

#### 2.3 Document Processing
- Update upload flow to use S3
- Implement Lambda layers for dependencies
- Handle large file uploads (S3 presigned URLs)

### Phase 3: Frontend Migration (Week 3)

#### 3.1 AWS Amplify Setup
- Connect GitHub repository
- Configure build settings
- Set environment variables
- Deploy frontend

#### 3.2 Authentication Update
- Replace Supabase client with AWS Amplify Auth
- Update login/signup flows
- Implement JWT token handling
- Test authentication flow

#### 3.3 API Integration
- Update API endpoints to API Gateway URLs
- Handle CORS configuration
- Test all API calls

### Phase 4: Testing & Optimization (Week 4)

#### 4.1 Integration Testing
- Test complete user flows
- Verify vector search accuracy
- Load testing
- Security audit

#### 4.2 Monitoring Setup
- CloudWatch logs
- Lambda metrics
- API Gateway monitoring
- Set up alarms

#### 4.3 Cost Optimization
- Review free tier usage
- Optimize Lambda memory/timeout
- DynamoDB capacity planning
- S3 storage optimization

## Detailed Implementation

See the following files for detailed implementation:
- `aws/cognito-setup.md` - Cognito configuration
- `aws/rds-setup.md` - RDS database setup
- `aws/dynamodb-schema.md` - DynamoDB table design
- `aws/lambda-functions/` - Lambda function code
- `aws/amplify-config.md` - Amplify deployment
- `aws/migration-scripts/` - Data migration scripts

## Cost Estimation (Free Tier)

### Monthly Free Tier Limits
- **AWS Amplify**: 1000 build minutes, 15 GB served/month
- **Lambda**: 1M requests, 400,000 GB-seconds compute
- **API Gateway**: 1M API calls/month (12 months)
- **RDS**: 750 hours db.t3.micro, 20 GB storage
- **DynamoDB**: 25 GB storage, 25 WCU, 25 RCU
- **S3**: 5 GB storage, 20,000 GET, 2,000 PUT requests
- **Cognito**: 50,000 MAUs (Monthly Active Users)

### Expected Usage (Small Scale)
- **Users**: < 100 active users/month
- **API Calls**: < 50,000/month
- **Storage**: < 5 GB documents
- **Database**: < 20 GB data
- **Compute**: < 100,000 Lambda invocations

**Estimated Cost**: $0-5/month (mostly within free tier)

## Migration Checklist

- [ ] Create AWS account
- [ ] Set up IAM users and roles
- [ ] Configure Cognito User Pool
- [ ] Launch RDS PostgreSQL instance
- [ ] Create DynamoDB tables
- [ ] Create S3 bucket
- [ ] Develop Lambda functions
- [ ] Set up API Gateway
- [ ] Deploy to Amplify
- [ ] Migrate user data
- [ ] Migrate vector data
- [ ] Update DNS records
- [ ] Test all functionality
- [ ] Monitor for 1 week
- [ ] Decommission old infrastructure

## Rollback Plan

If issues arise during migration:
1. Keep old infrastructure running in parallel
2. Use feature flags to switch between old/new
3. Maintain data sync during transition period
4. Have backup of all data before migration
5. Document rollback procedures

## Support & Resources

- AWS Free Tier: https://aws.amazon.com/free/
- AWS Documentation: https://docs.aws.amazon.com/
- Migration Support: AWS Support (Basic - Free)

## Next Steps

1. Review this guide with your team
2. Create AWS account if not exists
3. Start with Phase 1: Infrastructure Setup
4. Follow the detailed implementation guides
5. Test thoroughly before going live

---

**Note**: This migration maintains all current functionality while leveraging AWS's free tier services. The architecture is designed to scale as your user base grows.
