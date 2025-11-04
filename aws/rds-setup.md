# Amazon RDS PostgreSQL Setup

## Overview

Amazon RDS will replace Supabase PostgreSQL for relational data storage (users, bots, documents metadata).

## Why RDS?

- **Free Tier**: 750 hours/month of db.t3.micro (12 months)
- **Managed Service**: Automated backups, patching, monitoring
- **High Availability**: Multi-AZ deployment option
- **Scalability**: Easy to scale up as needed

## Step 1: Create RDS Instance

### Via AWS Console

1. Go to RDS Console
2. Click "Create database"
3. Choose database creation method: **Standard create**
4. Engine options:
   - Engine type: **PostgreSQL**
   - Version: **PostgreSQL 15.x** (latest)
5. Templates: **Free tier**
6. Settings:
   - DB instance identifier: `chatbot-db`
   - Master username: `postgres`
   - Master password: (create strong password)
7. Instance configuration:
   - DB instance class: **db.t3.micro** (Free tier eligible)
8. Storage:
   - Storage type: **General Purpose SSD (gp2)**
   - Allocated storage: **20 GB** (Free tier limit)
   - Enable storage autoscaling: **No** (to stay in free tier)
9. Connectivity:
   - VPC: Default VPC
   - Public access: **Yes** (for initial setup, restrict later)
   - VPC security group: Create new
   - Security group name: `chatbot-db-sg`
10. Database authentication: **Password authentication**
11. Additional configuration:
    - Initial database name: `chatbot_db`
    - Backup retention: **7 days** (Free tier)
    - Enable encryption: **Yes**
12. Click "Create database"

### Via AWS CLI

```bash
aws rds create-db-instance \
  --db-instance-identifier chatbot-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.4 \
  --master-username postgres \
  --master-user-password YOUR_STRONG_PASSWORD \
  --allocated-storage 20 \
  --storage-type gp2 \
  --vpc-security-group-ids sg-XXXXXXXX \
  --backup-retention-period 7 \
  --publicly-accessible \
  --db-name chatbot_db \
  --region us-east-1
```

## Step 2: Configure Security Group

```bash
# Get security group ID
SG_ID=$(aws rds describe-db-instances \
  --db-instance-identifier chatbot-db \
  --query 'DBInstances[0].VpcSecurityGroups[0].VpcSecurityGroupId' \
  --output text)

# Allow PostgreSQL access from your IP
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 5432 \
  --cidr YOUR_IP_ADDRESS/32

# Allow access from Lambda (VPC CIDR)
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 5432 \
  --cidr 10.0.0.0/16
```

## Step 3: Get Connection Details

```bash
# Get endpoint
aws rds describe-db-instances \
  --db-instance-identifier chatbot-db \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text

# Example output: chatbot-db.xxxxxxxxxx.us-east-1.rds.amazonaws.com
```

## Step 4: Create Database Schema

### Connect to Database

```bash
# Install PostgreSQL client
# Windows: Download from https://www.postgresql.org/download/windows/
# Or use psql from WSL

# Connect
psql -h chatbot-db.xxxxxxxxxx.us-east-1.rds.amazonaws.com \
     -U postgres \
     -d chatbot_db
```

### Create Tables

```sql
-- Users table (synced with Cognito)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cognito_sub VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Bots table
CREATE TABLE bots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_id VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active',
    total_documents INTEGER DEFAULT 0,
    total_chunks INTEGER DEFAULT 0
);

-- Documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_id VARCHAR(255) REFERENCES bots(bot_id) ON DELETE CASCADE,
    filename VARCHAR(500) NOT NULL,
    file_size BIGINT,
    s3_key VARCHAR(1000),
    content_type VARCHAR(100),
    chunk_count INTEGER DEFAULT 0,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'processing'
);

-- Chat messages table (for analytics)
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_id VARCHAR(255) REFERENCES bots(bot_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    query TEXT NOT NULL,
    response TEXT,
    response_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source_documents JSONB
);

-- Bot analytics table
CREATE TABLE bot_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_id VARCHAR(255) REFERENCES bots(bot_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_queries INTEGER DEFAULT 0,
    avg_response_time_ms INTEGER,
    error_count INTEGER DEFAULT 0,
    unique_users INTEGER DEFAULT 0,
    UNIQUE(bot_id, date)
);

-- Create indexes
CREATE INDEX idx_bots_user_id ON bots(user_id);
CREATE INDEX idx_bots_bot_id ON bots(bot_id);
CREATE INDEX idx_documents_bot_id ON documents(bot_id);
CREATE INDEX idx_chat_messages_bot_id ON chat_messages(bot_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX idx_bot_analytics_bot_id_date ON bot_analytics(bot_id, date);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bots_updated_at BEFORE UPDATE ON bots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Step 5: Environment Variables

Add to your `.env` files:

```env
# RDS Configuration
RDS_HOST=chatbot-db.xxxxxxxxxx.us-east-1.rds.amazonaws.com
RDS_PORT=5432
RDS_DATABASE=chatbot_db
RDS_USER=postgres
RDS_PASSWORD=your_password

# Or use connection string
DATABASE_URL=postgresql://postgres:password@chatbot-db.xxx.rds.amazonaws.com:5432/chatbot_db
```

## Step 6: Lambda Integration

### Option 1: Direct Connection (Simple)

```python
import psycopg2
import os

def get_db_connection():
    return psycopg2.connect(
        host=os.environ['RDS_HOST'],
        port=os.environ['RDS_PORT'],
        database=os.environ['RDS_DATABASE'],
        user=os.environ['RDS_USER'],
        password=os.environ['RDS_PASSWORD']
    )

def lambda_handler(event, context):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM bots WHERE user_id = %s", (user_id,))
    bots = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    return bots
```

### Option 2: RDS Data API (Recommended for Lambda)

```python
import boto3
import json

rds_client = boto3.client('rds-data')

def execute_sql(sql, parameters=None):
    response = rds_client.execute_statement(
        resourceArn=os.environ['RDS_CLUSTER_ARN'],
        secretArn=os.environ['RDS_SECRET_ARN'],
        database=os.environ['RDS_DATABASE'],
        sql=sql,
        parameters=parameters or []
    )
    return response

def lambda_handler(event, context):
    sql = "SELECT * FROM bots WHERE user_id = :user_id"
    params = [{'name': 'user_id', 'value': {'stringValue': user_id}}]
    
    result = execute_sql(sql, params)
    return result['records']
```

## Step 7: Migration from Supabase

### Export Data from Supabase

```bash
# Using Supabase CLI
supabase db dump --db-url "postgresql://..." > supabase_dump.sql

# Or use pg_dump
pg_dump -h db.xxx.supabase.co -U postgres -d postgres > supabase_dump.sql
```

### Import to RDS

```bash
# Import dump
psql -h chatbot-db.xxx.rds.amazonaws.com \
     -U postgres \
     -d chatbot_db \
     -f supabase_dump.sql

# Or use migration script
python aws/migration-scripts/migrate_database.py
```

## Step 8: Connection Pooling (Production)

For production, use connection pooling:

```python
from psycopg2 import pool

# Create connection pool
connection_pool = pool.SimpleConnectionPool(
    1,  # minconn
    10,  # maxconn
    host=os.environ['RDS_HOST'],
    port=os.environ['RDS_PORT'],
    database=os.environ['RDS_DATABASE'],
    user=os.environ['RDS_USER'],
    password=os.environ['RDS_PASSWORD']
)

def get_connection():
    return connection_pool.getconn()

def release_connection(conn):
    connection_pool.putconn(conn)
```

## Step 9: Monitoring

### Enable Enhanced Monitoring

```bash
aws rds modify-db-instance \
  --db-instance-identifier chatbot-db \
  --monitoring-interval 60 \
  --monitoring-role-arn arn:aws:iam::ACCOUNT_ID:role/rds-monitoring-role
```

### CloudWatch Metrics

Monitor these metrics:
- CPUUtilization
- DatabaseConnections
- FreeStorageSpace
- ReadLatency
- WriteLatency

### Set Up Alarms

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name rds-high-cpu \
  --alarm-description "Alert when CPU > 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --dimensions Name=DBInstanceIdentifier,Value=chatbot-db
```

## Step 10: Backup and Recovery

### Automated Backups

Backups are automatic with 7-day retention (free tier).

### Manual Snapshot

```bash
aws rds create-db-snapshot \
  --db-instance-identifier chatbot-db \
  --db-snapshot-identifier chatbot-db-snapshot-$(date +%Y%m%d)
```

### Restore from Snapshot

```bash
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier chatbot-db-restored \
  --db-snapshot-identifier chatbot-db-snapshot-20251103
```

## Cost Optimization

### Free Tier Limits
- 750 hours/month of db.t3.micro (12 months)
- 20 GB storage
- 20 GB backup storage

### Beyond Free Tier
- db.t3.micro: ~$15/month
- Storage: $0.115/GB-month
- Backup storage: $0.095/GB-month

### Tips
1. Stop instance when not in use (saves compute costs)
2. Use reserved instances for production (up to 60% savings)
3. Monitor storage usage
4. Delete old snapshots

## Security Best Practices

1. **Use Secrets Manager** for credentials
2. **Enable encryption** at rest and in transit
3. **Restrict security group** to Lambda VPC only
4. **Use IAM authentication** instead of passwords
5. **Enable audit logging**
6. **Regular security patches** (automatic)
7. **Use SSL/TLS** for connections

## Troubleshooting

### Connection Issues

```bash
# Test connection
psql -h chatbot-db.xxx.rds.amazonaws.com -U postgres -d chatbot_db

# Check security group
aws ec2 describe-security-groups --group-ids sg-XXXXXXXX

# Check RDS status
aws rds describe-db-instances --db-instance-identifier chatbot-db
```

### Performance Issues

```sql
-- Check slow queries
SELECT * FROM pg_stat_statements 
ORDER BY total_time DESC 
LIMIT 10;

-- Check connections
SELECT * FROM pg_stat_activity;

-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Next Steps

1. ✅ Create RDS instance
2. ✅ Configure security group
3. ✅ Create database schema
4. ✅ Test connection
5. ✅ Migrate data from Supabase
6. ✅ Update Lambda functions
7. ✅ Set up monitoring
8. ✅ Configure backups
