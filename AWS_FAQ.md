# AWS Migration - Frequently Asked Questions (FAQ)

## 🤔 General Questions

### Q1: I've never used AWS before. Is this guide for me?

**A:** Yes! This guide is specifically written for complete beginners. It assumes zero AWS knowledge and explains everything step-by-step.

### Q2: How long will the migration take?

**A:** About 4 hours total:
- Account setup: 30 minutes
- Service configuration: 90 minutes
- Backend deployment: 60 minutes
- Data migration: 45 minutes
- Frontend deployment: 30 minutes
- Testing: 15 minutes

### Q3: Will my app be down during migration?

**A:** No! You can keep your current setup running while building on AWS. Only switch DNS/users when everything is tested and working.

### Q4: What if I make a mistake?

**A:** AWS is very forgiving:
- Most services can be deleted and recreated
- You can rollback to your old setup anytime
- Free tier means mistakes don't cost money
- This guide includes troubleshooting for common issues

### Q5: Do I need a credit card?

**A:** Yes, AWS requires a credit card for verification, but:
- They charge $1 to verify (refunded immediately)
- Free tier means $0 cost for 12 months
- You can set billing alerts to avoid surprises
- You won't be charged unless you exceed free tier limits

---

## 💰 Cost Questions

### Q6: Is AWS really free?

**A:** Yes, for the first 12 months with these limits:
- Lambda: 1 million requests/month
- DynamoDB: 25 GB storage
- S3: 5 GB storage
- RDS: 750 hours/month (db.t3.micro)
- Cognito: 50,000 users/month

For a small chatbot app, you'll stay well within these limits.

### Q7: What happens after 12 months?

**A:** You start paying for usage:
- Expected cost: $25-40/month for small app (100 users)
- Still cheaper than current setup ($52/month)
- You can optimize to reduce costs further

### Q8: How do I avoid unexpected charges?

**A:** Set up billing alerts:
1. Go to Billing Dashboard
2. Create budget alert for $10
3. You'll get email if costs exceed threshold
4. Review costs weekly in first month

### Q9: Can I stop services to save money?

**A:** Yes!
- Stop RDS when not in use (saves ~$15/month)
- Delete old S3 files
- Reduce Lambda memory if possible
- Use on-demand pricing for DynamoDB

### Q10: What's the most expensive service?

**A:** RDS (database) at $15-20/month after free tier. Consider:
- Stopping it when not needed
- Using smaller instance (db.t3.micro)
- Or switching to Aurora Serverless (pay per use)

---

## 🔧 Technical Questions

### Q11: Do I need to know programming?

**A:** Basic knowledge helps, but not required:
- Copy-paste the provided code
- Follow step-by-step instructions
- No need to write code from scratch
- Python and JavaScript knowledge is a plus

### Q12: What if I use Mac or Linux instead of Windows?

**A:** The guide works for all operating systems:
- AWS Console is web-based (works everywhere)
- AWS CLI works on Mac/Linux
- Commands are similar (bash instead of PowerShell)
- Python works the same way

### Q13: Can I use a different region than us-east-1?

**A:** Yes, but:
- Some services are cheaper in us-east-1
- Free tier is the same in all regions
- Change region in all configurations
- Keep everything in the same region

### Q14: What if I already have an AWS account?

**A:** Perfect! Skip account creation:
- Go directly to service setup
- Make sure you have free tier available
- Check your current usage first
- Follow the rest of the guide normally

### Q15: Do I need to use all these services?

**A:** For full functionality, yes:
- Cognito: User authentication (required)
- Lambda: Backend code (required)
- DynamoDB: Vector storage (required)
- RDS: User/bot data (required)
- S3: File storage (required)
- API Gateway: API endpoints (required)
- Amplify: Frontend hosting (optional, can use Vercel)

---

## 🚨 Troubleshooting Questions

### Q16: "Access Denied" error in Lambda

**Problem:** Lambda can't access DynamoDB or S3

**Solution:**
1. Go to IAM Console
2. Find `ChatbotLambdaExecutionRole`
3. Attach missing policy (DynamoDB or S3 Full Access)
4. Wait 1 minute for changes to propagate
5. Test again

### Q17: "CORS error" in browser

**Problem:** Browser blocks API requests

**Solution:**
1. Go to API Gateway
2. Select your API
3. For each resource: Actions → Enable CORS
4. Deploy API again
5. Clear browser cache

### Q18: Can't connect to RDS database

**Problem:** Connection timeout

**Solution:**
1. Check security group allows your IP
2. Verify endpoint is correct
3. Check username/password
4. Make sure database is "Available" status
5. Try from different network (VPN might block)

### Q19: Lambda function times out

**Problem:** Function doesn't complete in time

**Solution:**
1. Go to Lambda Console
2. Configuration → General configuration
3. Increase timeout (e.g., 30s → 60s)
4. Increase memory if needed (256MB → 512MB)
5. Check CloudWatch logs for actual error

### Q20: High AWS bill

**Problem:** Unexpected charges

**Solution:**
1. Check Billing Dashboard → Top Services
2. Common causes:
   - RDS running 24/7 (stop when not needed)
   - Large S3 storage (delete old files)
   - High Lambda invocations (check for loops)
3. Set up budget alerts
4. Review and optimize

---

## 📊 Migration Questions

### Q21: How do I export data from Supabase?

**A:** Two methods:
1. **Via Dashboard:**
   - Go to Table Editor
   - Select table
   - Click "..." → Export to CSV

2. **Via SQL:**
   ```sql
   COPY users TO '/tmp/users.csv' CSV HEADER;
   ```

### Q22: Will user passwords be migrated?

**A:** No, for security reasons:
- Passwords are hashed and can't be exported
- Users will need to reset passwords
- Migration script sends reset emails automatically
- Users create new passwords on first login

### Q23: How long does data migration take?

**A:** Depends on data size:
- 100 users: ~5 minutes
- 1000 vectors: ~10 minutes
- 10,000 vectors: ~30 minutes
- Total: Usually 30-45 minutes

### Q24: Can I test migration without affecting production?

**A:** Yes!
1. Create separate AWS account for testing
2. Migrate small subset of data
3. Test thoroughly
4. Then migrate production data
5. Keep old system running during transition

### Q25: What if migration fails halfway?

**A:** No problem:
- AWS services are independent
- Delete and start over
- No data loss (original data unchanged)
- Migration scripts can be run multiple times

---

## 🔒 Security Questions

### Q26: Is AWS secure?

**A:** Yes, very secure:
- Bank-level encryption
- Compliance certifications (SOC 2, ISO 27001)
- DDoS protection
- Regular security audits
- You control access with IAM

### Q27: Should I enable MFA?

**A:** Absolutely! Enable MFA on:
- Root account (required)
- IAM users (recommended)
- Cognito users (optional)

### Q28: How do I protect my API keys?

**A:** Best practices:
1. Never commit keys to Git
2. Use environment variables
3. Use AWS Secrets Manager for production
4. Rotate keys every 90 days
5. Use IAM roles instead of keys when possible

### Q29: Can users access my S3 files directly?

**A:** No, if configured correctly:
- S3 bucket is private by default
- Access only through Lambda functions
- Pre-signed URLs for temporary access
- CloudFront for public files (optional)

### Q30: What about GDPR compliance?

**A:** AWS is GDPR compliant:
- Data stored in your chosen region
- You control data retention
- Easy to delete user data
- Audit logs with CloudTrail
- Data encryption at rest and in transit

---

## 🎯 Performance Questions

### Q31: Will my app be faster on AWS?

**A:** Usually yes:
- Lambda: Sub-second response times
- DynamoDB: Single-digit millisecond latency
- S3: High throughput
- Global CDN with Amplify
- Auto-scaling handles traffic spikes

### Q32: How many users can AWS handle?

**A:** Millions! AWS scales automatically:
- Lambda: 1000 concurrent executions (default)
- DynamoDB: Unlimited throughput
- S3: Unlimited storage
- Cognito: 50,000+ users easily

### Q33: What about cold starts in Lambda?

**A:** Cold starts are usually < 1 second:
- First request: ~500ms-1s
- Subsequent requests: ~50-100ms
- Use provisioned concurrency for critical functions
- Optimize by reducing package size

### Q34: Can I use a CDN?

**A:** Yes! Two options:
1. **Amplify** (built-in CDN)
2. **CloudFront** (AWS CDN service)
   - Faster global delivery
   - Caching at edge locations
   - DDoS protection

### Q35: How do I optimize costs vs performance?

**A:** Balance these factors:
- Lambda memory: Higher = faster but more expensive
- DynamoDB: On-demand vs provisioned capacity
- RDS: Larger instance = faster but more expensive
- S3: Standard vs Infrequent Access storage
- Start small, scale based on metrics

---

## 🎓 Learning Questions

### Q36: What AWS certifications should I get?

**A:** Recommended path:
1. **Cloud Practitioner** (beginner, 3 months)
2. **Solutions Architect Associate** (intermediate, 6 months)
3. **Developer Associate** (advanced, 6 months)

### Q37: Where can I learn more about AWS?

**A:** Free resources:
- AWS Documentation: https://docs.aws.amazon.com/
- AWS Skill Builder: https://skillbuilder.aws/
- AWS YouTube channel
- freeCodeCamp AWS courses
- A Cloud Guru (paid but excellent)

### Q38: Should I learn other cloud platforms?

**A:** Eventually, yes:
- AWS: Market leader (32% market share)
- Azure: Good for Microsoft shops
- Google Cloud: Good for ML/AI
- Start with AWS, then expand

### Q39: What other AWS services should I learn?

**A:** After mastering these basics:
- CloudWatch (monitoring)
- CloudFormation (infrastructure as code)
- Step Functions (workflows)
- SQS (message queues)
- SNS (notifications)
- EventBridge (event-driven)

### Q40: How do I stay updated with AWS?

**A:** Follow these:
- AWS Blog: https://aws.amazon.com/blogs/
- AWS What's New: https://aws.amazon.com/new/
- AWS re:Invent (annual conference)
- AWS Podcast
- Twitter: @awscloud

---

## 🚀 Next Steps Questions

### Q41: What should I do after migration?

**A:** Follow this checklist:
1. Monitor for 1 week
2. Optimize based on metrics
3. Set up proper backups
4. Document your setup
5. Train team members
6. Decommission old infrastructure

### Q42: How do I add new features?

**A:** Process:
1. Create new Lambda function
2. Add API Gateway endpoint
3. Update frontend
4. Test thoroughly
5. Deploy

### Q43: Can I automate deployments?

**A:** Yes! Use:
- AWS CodePipeline (CI/CD)
- GitHub Actions
- AWS SAM (Serverless Application Model)
- Terraform (infrastructure as code)

### Q44: Should I use containers instead?

**A:** Depends on your needs:
- **Lambda** (current): Simpler, cheaper for small apps
- **ECS/Fargate**: Better for complex apps
- **EKS**: Kubernetes for large-scale apps
- Start with Lambda, migrate later if needed

### Q45: How do I scale to 10,000+ users?

**A:** Upgrade strategy:
1. Enable RDS Multi-AZ
2. Use Aurora Serverless
3. Add ElastiCache (Redis)
4. Use CloudFront CDN
5. Implement API rate limiting
6. Consider microservices architecture

---

## 📞 Support Questions

### Q46: Where do I get help if stuck?

**A:** Multiple options:
1. **This guide**: Check troubleshooting section
2. **AWS Documentation**: Comprehensive guides
3. **AWS Support**: Free basic support
4. **Stack Overflow**: Tag `amazon-web-services`
5. **AWS Forums**: Community help
6. **Reddit**: r/aws

### Q47: Is AWS support free?

**A:** Basic support is free:
- Documentation
- Forums
- Trusted Advisor (basic checks)
- Personal Health Dashboard

Paid support starts at $29/month (Developer plan).

### Q48: How do I report AWS issues?

**A:** Through AWS Support:
1. Go to Support Center
2. Create case
3. Choose severity
4. Describe issue
5. AWS responds within SLA

### Q49: Can I hire someone to help?

**A:** Yes, options:
- AWS Professional Services
- AWS Partner Network (consultants)
- Freelancers (Upwork, Fiverr)
- This guide should be enough for most cases!

### Q50: What if I want to go back to old setup?

**A:** Easy rollback:
1. Keep old infrastructure running during migration
2. Switch DNS back to old setup
3. Delete AWS resources
4. No data loss (you have backups)
5. Learn from experience

---

## 🎉 Success Stories

### Q51: Who else uses AWS?

**A:** Major companies:
- Netflix (streaming)
- Airbnb (marketplace)
- Slack (messaging)
- Spotify (music)
- NASA (space data)
- And millions more!

### Q52: Is AWS overkill for my small app?

**A:** No! AWS is perfect for small apps:
- Free tier for 12 months
- Pay only for what you use
- Scales automatically
- No server management
- Industry-standard platform

---

**Still have questions?** 

- Check [AWS_BEGINNER_GUIDE.md](AWS_BEGINNER_GUIDE.md) for detailed instructions
- Review [AWS_VISUAL_GUIDE.md](AWS_VISUAL_GUIDE.md) for diagrams
- Search AWS documentation
- Ask on Stack Overflow with tag `amazon-web-services`

**Ready to start?** Go to [AWS_BEGINNER_GUIDE.md](AWS_BEGINNER_GUIDE.md) and begin your migration! 🚀

