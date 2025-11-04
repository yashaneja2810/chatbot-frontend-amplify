# AWS Migration for Complete Beginners - Step by Step

## 🎯 What You'll Learn

By the end of this guide, you'll understand:
- What AWS is and why we're using it
- How to create an AWS account
- How to set up each service step-by-step
- How to migrate your chatbot to AWS
- How to manage and monitor your application

**Time Required**: 3-4 hours (including account setup)
**Cost**: $0 for first 12 months (Free Tier)
**Difficulty**: Beginner-friendly

---

## Part 1: Understanding AWS (10 minutes)

### What is AWS?

**AWS (Amazon Web Services)** is like renting a computer, database, and storage space from Amazon instead of buying your own servers.

Think of it like this:
- **Your current setup**: You're renting an apartment (Supabase, Qdrant, Render)
- **AWS setup**: You're renting individual rooms in a huge building (AWS services)

### Why Migrate to AWS?

1. **Cost**: Free for 12 months, then cheaper than current setup
2. **Scalability**: Automatically handles more users
3. **Reliability**: 99.99% uptime guarantee
4. **Learning**: Industry-standard platform

### AWS Services We'll Use

| Service | What It Does | Real-World Analogy |
|---------|--------------|-------------------|
| **Cognito** | User login/signup | Security guard at building entrance |
| **Lambda** | Runs your code | Worker who does tasks when needed |
| **DynamoDB** | Stores vector data | Filing cabinet for documents |
| **RDS** | Database | Organized spreadsheet |
| **S3** | File storage | Cloud storage like Dropbox |
| **API Gateway** | Handles requests | Receptionist routing calls |
| **Amplify** | Hosts website | Web hosting like Vercel |

---


## Part 2: Creating Your AWS Account (20 minutes)

### Step 1: Sign Up for AWS

1. **Go to AWS website**
   - Open browser and visit: https://aws.amazon.com
   - Click the orange "Create an AWS Account" button (top right)

2. **Enter your email and account name**
   - Email: Your email address
   - AWS account name: Choose something like "my-chatbot-project"
   - Click "Verify email address"

3. **Check your email**
   - AWS will send a verification code
   - Enter the code on the AWS page
   - Click "Verify"

4. **Create password**
   - Choose a strong password (at least 8 characters)
   - Confirm password
   - Click "Continue"

5. **Enter contact information**
   - Select "Personal" account type
   - Full name: Your name
   - Phone number: Your phone
   - Country: Your country
   - Address: Your address
   - Agree to terms
   - Click "Continue"

6. **Add payment information**
   - **Don't worry!** AWS won't charge you if you stay in free tier
   - Enter credit/debit card details
   - AWS will charge $1 to verify (refunded immediately)
   - Click "Verify and Continue"

7. **Confirm your identity**
   - Choose "Text message (SMS)" or "Voice call"
   - Enter phone number
   - Enter the code you receive
   - Click "Continue"

8. **Select support plan**
   - Choose "Basic support - Free"
   - Click "Complete sign up"

9. **Wait for account activation**
   - Takes 5-10 minutes
   - You'll receive email when ready
   - Click "Go to AWS Management Console"

### Step 2: Secure Your Account

**IMPORTANT**: Do this immediately after account creation!

1. **Enable MFA (Multi-Factor Authentication)**
   - In AWS Console, click your name (top right)
   - Click "Security credentials"
   - Scroll to "Multi-factor authentication (MFA)"
   - Click "Assign MFA device"
   - Choose "Authenticator app"
   - Use Google Authenticator or Microsoft Authenticator app
   - Scan QR code with your phone
   - Enter two consecutive codes
   - Click "Assign MFA"

2. **Set up billing alerts**
   - Search for "Billing" in top search bar
   - Click "Billing Dashboard"
   - Click "Billing preferences" (left menu)
   - Check "Receive Free Tier Usage Alerts"
   - Enter your email
   - Check "Receive Billing Alerts"
   - Click "Save preferences"

---


## Part 3: Installing Required Tools (15 minutes)

### Step 1: Install AWS CLI (Command Line Interface)

**What is AWS CLI?** It's a tool that lets you control AWS from your computer's command line.

#### For Windows:

1. **Download AWS CLI**
   - Visit: https://awscli.amazonaws.com/AWSCLIV2.msi
   - File will download automatically

2. **Install AWS CLI**
   - Double-click the downloaded file
   - Click "Next" through the installer
   - Accept defaults
   - Click "Install"
   - Click "Finish"

3. **Verify installation**
   - Press `Windows + R`
   - Type `cmd` and press Enter
   - Type: `aws --version`
   - You should see: `aws-cli/2.x.x Python/3.x.x Windows/...`

### Step 2: Configure AWS CLI

1. **Get your AWS credentials**
   - Go to AWS Console: https://console.aws.amazon.com
   - Click your name (top right) → "Security credentials"
   - Scroll to "Access keys"
   - Click "Create access key"
   - Choose "Command Line Interface (CLI)"
   - Check "I understand..." box
   - Click "Next"
   - Add description: "My laptop CLI access"
   - Click "Create access key"
   - **IMPORTANT**: Copy both:
     - Access key ID (looks like: AKIAIOSFODNN7EXAMPLE)
     - Secret access key (looks like: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY)
   - Click "Download .csv file" (backup)
   - Click "Done"

2. **Configure AWS CLI**
   - Open Command Prompt (Windows + R, type `cmd`)
   - Type: `aws configure`
   - Enter when prompted:
     ```
     AWS Access Key ID: [paste your access key]
     AWS Secret Access Key: [paste your secret key]
     Default region name: us-east-1
     Default output format: json
     ```

3. **Test configuration**
   - Type: `aws sts get-caller-identity`
   - You should see your account info in JSON format
   - If you see an error, double-check your keys

### Step 3: Install Python (if not installed)

1. **Check if Python is installed**
   - Open Command Prompt
   - Type: `python --version`
   - If you see "Python 3.x.x", skip to Step 4
   - If error, continue below

2. **Download Python**
   - Visit: https://www.python.org/downloads/
   - Click "Download Python 3.11.x"

3. **Install Python**
   - Run the downloaded file
   - **IMPORTANT**: Check "Add Python to PATH"
   - Click "Install Now"
   - Wait for installation
   - Click "Close"

4. **Verify Python**
   - Open NEW Command Prompt
   - Type: `python --version`
   - Should show: `Python 3.11.x`

### Step 4: Install Required Python Packages

```bash
pip install boto3 psycopg2-binary qdrant-client python-dotenv
```

This installs:
- `boto3`: AWS SDK for Python
- `psycopg2-binary`: PostgreSQL database connector
- `qdrant-client`: To migrate from Qdrant
- `python-dotenv`: To read environment variables

---


## Part 4: Setting Up AWS Services (60 minutes)

### Service 1: Amazon Cognito (User Authentication) - 15 minutes

**What it does**: Handles user signup, login, and authentication (replaces Supabase Auth)

#### Step-by-Step Setup:

1. **Open Cognito Console**
   - Go to AWS Console: https://console.aws.amazon.com
   - In search bar (top), type "Cognito"
   - Click "Amazon Cognito"

2. **Create User Pool**
   - Click "Create user pool" (orange button)

3. **Configure sign-in experience**
   - Authentication providers: Check "Email"
   - Cognito user pool sign-in options: Check "Email"
   - Click "Next"

4. **Configure security requirements**
   - Password policy: Keep "Cognito defaults"
   - Multi-factor authentication: Select "No MFA" (for now)
   - User account recovery: Check "Email only"
   - Click "Next"

5. **Configure sign-up experience**
   - Self-service sign-up: Check "Enable self-registration"
   - Attribute verification: Check "Send email message, verify email address"
   - Required attributes: Check "name" and "email"
   - Click "Next"

6. **Configure message delivery**
   - Email provider: Select "Send email with Cognito"
   - FROM email address: Keep default (no-reply@verificationemail.com)
   - Click "Next"

7. **Integrate your app**
   - User pool name: `chatbot-builder-users`
   - Hosted authentication pages: Uncheck (we'll use custom)
   - Domain: Leave blank for now
   - Initial app client:
     - App client name: `chatbot-web-client`
     - Client secret: Select "Don't generate a client secret"
   - Click "Next"

8. **Review and create**
   - Review all settings
   - Click "Create user pool"
   - Wait 30 seconds for creation

9. **Save important information**
   - You'll see "User pool created successfully"
   - **Copy and save these** (you'll need them later):
     - User pool ID (looks like: `us-east-1_XXXXXXXXX`)
     - App client ID (looks like: `1234567890abcdefghijklmnop`)
   
   Create a text file called `aws-credentials.txt` and save:
   ```
   COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
   COGNITO_APP_CLIENT_ID=1234567890abcdefghijklmnop
   ```

**✅ Cognito Setup Complete!** Users can now sign up and log in.

---


### Service 2: Amazon DynamoDB (Vector Storage) - 15 minutes

**What it does**: Stores your document embeddings/vectors (replaces Qdrant)

#### Step-by-Step Setup:

1. **Open DynamoDB Console**
   - In AWS Console search bar, type "DynamoDB"
   - Click "DynamoDB"

2. **Create First Table (VectorEmbeddings)**
   - Click "Create table" (orange button)
   - Table name: `chatbot-builder-vectors`
   - Partition key: `bot_id` (String)
   - Sort key: `chunk_id` (String)
   - Table settings: Keep "Default settings"
   - Click "Create table"
   - Wait 30 seconds for "Active" status

3. **Add Global Secondary Index**
   - Click on your table name `chatbot-builder-vectors`
   - Click "Indexes" tab
   - Click "Create index"
   - Partition key: `bot_id` (String)
   - Sort key: `filename` (String)
   - Index name: `filename-index`
   - Click "Create index"
   - Wait for "Active" status

4. **Create Second Table (BotCollections)**
   - Click "Tables" in left menu
   - Click "Create table"
   - Table name: `chatbot-builder-bots`
   - Partition key: `bot_id` (String)
   - No sort key needed
   - Table settings: Keep "Default settings"
   - Click "Create table"
   - Wait for "Active" status

5. **Add Global Secondary Index to BotCollections**
   - Click on `chatbot-builder-bots` table
   - Click "Indexes" tab
   - Click "Create index"
   - Partition key: `user_id` (String)
   - Index name: `user-index`
   - Click "Create index"
   - Wait for "Active" status

6. **Save table names**
   - Add to your `aws-credentials.txt`:
   ```
   DYNAMODB_VECTORS_TABLE=chatbot-builder-vectors
   DYNAMODB_BOTS_TABLE=chatbot-builder-bots
   ```

**✅ DynamoDB Setup Complete!** You can now store vectors and bot data.

---


### Service 3: Amazon S3 (File Storage) - 10 minutes

**What it does**: Stores uploaded documents (PDFs, DOCX, TXT files)

#### Step-by-Step Setup:

1. **Open S3 Console**
   - In AWS Console search bar, type "S3"
   - Click "S3"

2. **Create Bucket**
   - Click "Create bucket" (orange button)
   - Bucket name: `chatbot-builder-documents-YOUR_ACCOUNT_ID`
     - Replace YOUR_ACCOUNT_ID with your AWS account number
     - To find it: Click your name (top right) → Account ID is shown
     - Example: `chatbot-builder-documents-123456789012`
   - AWS Region: `US East (N. Virginia) us-east-1`
   - Object Ownership: Keep "ACLs disabled"
   - Block Public Access: Keep all boxes CHECKED (for security)
   - Bucket Versioning: Disable
   - Tags: Skip
   - Default encryption: Keep "Server-side encryption with Amazon S3 managed keys (SSE-S3)"
   - Click "Create bucket"

3. **Configure CORS (Cross-Origin Resource Sharing)**
   - Click on your bucket name
   - Click "Permissions" tab
   - Scroll to "Cross-origin resource sharing (CORS)"
   - Click "Edit"
   - Paste this configuration:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": ["*"],
       "ExposeHeaders": []
     }
   ]
   ```
   - Click "Save changes"

4. **Save bucket name**
   - Add to your `aws-credentials.txt`:
   ```
   S3_BUCKET_NAME=chatbot-builder-documents-123456789012
   ```

**✅ S3 Setup Complete!** You can now store documents.

---


### Service 4: Amazon RDS (Database) - 20 minutes

**What it does**: PostgreSQL database for user and bot information (replaces Supabase DB)

#### Step-by-Step Setup:

1. **Open RDS Console**
   - In AWS Console search bar, type "RDS"
   - Click "RDS"

2. **Create Database**
   - Click "Create database" (orange button)

3. **Choose database creation method**
   - Select "Standard create"

4. **Engine options**
   - Engine type: Select "PostgreSQL"
   - Version: Keep latest (PostgreSQL 15.x)

5. **Templates**
   - Select "Free tier" (IMPORTANT!)

6. **Settings**
   - DB instance identifier: `chatbot-db`
   - Master username: `postgres`
   - Master password: Create a strong password (save it!)
   - Confirm password: Re-enter password
   - **Write down your password in aws-credentials.txt**

7. **Instance configuration**
   - DB instance class: Should show "db.t3.micro" (Free tier eligible)

8. **Storage**
   - Storage type: General Purpose SSD (gp2)
   - Allocated storage: 20 GB (Free tier limit)
   - Uncheck "Enable storage autoscaling" (to stay in free tier)

9. **Connectivity**
   - Compute resource: Don't connect to an EC2 compute resource
   - VPC: Default VPC
   - Public access: Select "Yes" (for initial setup)
   - VPC security group: Create new
   - New VPC security group name: `chatbot-db-sg`

10. **Database authentication**
    - Select "Password authentication"

11. **Additional configuration** (click to expand)
    - Initial database name: `chatbot_db`
    - Backup retention period: 7 days
    - Uncheck "Enable encryption" (to stay in free tier)

12. **Create database**
    - Click "Create database"
    - Wait 5-10 minutes for "Available" status
    - You'll see "Creating database..." message

13. **Get database endpoint**
    - Once status is "Available", click on database name `chatbot-db`
    - Under "Connectivity & security" tab
    - Copy "Endpoint" (looks like: `chatbot-db.xxxxxxxxxx.us-east-1.rds.amazonaws.com`)
    - Add to `aws-credentials.txt`:
    ```
    RDS_HOST=chatbot-db.xxxxxxxxxx.us-east-1.rds.amazonaws.com
    RDS_PORT=5432
    RDS_DATABASE=chatbot_db
    RDS_USER=postgres
    RDS_PASSWORD=your_password_here
    ```

14. **Configure Security Group** (Allow connections)
    - Click "VPC security groups" link (under Connectivity)
    - Click on the security group ID
    - Click "Inbound rules" tab
    - Click "Edit inbound rules"
    - Click "Add rule"
    - Type: PostgreSQL
    - Source: My IP (this adds your current IP)
    - Click "Save rules"

**✅ RDS Setup Complete!** You now have a PostgreSQL database.

---


## Part 5: Creating Database Schema (15 minutes)

Now we need to create tables in your PostgreSQL database.

### Step 1: Install PostgreSQL Client

#### For Windows:

1. **Download pgAdmin**
   - Visit: https://www.pgadmin.org/download/pgadmin-4-windows/
   - Click latest version
   - Download and install

2. **Or use Command Line (simpler)**
   - Download: https://www.postgresql.org/download/windows/
   - Install PostgreSQL (just the client tools)

### Step 2: Connect to Database

#### Using Command Line:

1. **Open Command Prompt**
   - Press Windows + R
   - Type `cmd` and press Enter

2. **Connect to RDS**
   ```bash
   psql -h chatbot-db.xxxxxxxxxx.us-east-1.rds.amazonaws.com -U postgres -d chatbot_db
   ```
   - Replace with your actual RDS endpoint
   - Enter password when prompted
   - You should see: `chatbot_db=>`

### Step 3: Create Tables

Copy and paste this SQL (one section at a time):

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cognito_sub VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'processed'
);

-- Create indexes for faster queries
CREATE INDEX idx_bots_user_id ON bots(user_id);
CREATE INDEX idx_documents_bot_id ON documents(bot_id);
```

After each section, you should see: `CREATE TABLE` or `CREATE INDEX`

### Step 4: Verify Tables

```sql
-- List all tables
\dt

-- You should see:
-- users
-- bots
-- documents
```

Type `\q` to exit psql.

**✅ Database Schema Created!** Your database is ready to store data.

---


## Part 6: Deploying Lambda Functions (30 minutes)

**What are Lambda Functions?** They're like mini-programs that run your backend code without needing a server.

### Step 1: Create IAM Role for Lambda

**What is IAM?** Identity and Access Management - it controls what AWS services can access.

1. **Open IAM Console**
   - Search "IAM" in AWS Console
   - Click "IAM"

2. **Create Role**
   - Click "Roles" in left menu
   - Click "Create role"
   - Trusted entity type: "AWS service"
   - Use case: Select "Lambda"
   - Click "Next"

3. **Add Permissions**
   - Search and check these policies:
     - `AWSLambdaBasicExecutionRole`
     - `AmazonDynamoDBFullAccess`
     - `AmazonS3FullAccess`
     - `AmazonCognitoPowerUser`
   - Click "Next"

4. **Name Role**
   - Role name: `ChatbotLambdaExecutionRole`
   - Description: "Role for chatbot Lambda functions"
   - Click "Create role"

### Step 2: Create Lambda Functions

We'll create 4 Lambda functions. I'll show you the first one in detail, then you'll repeat for others.

#### Function 1: Auth Handler

1. **Open Lambda Console**
   - Search "Lambda" in AWS Console
   - Click "Lambda"

2. **Create Function**
   - Click "Create function"
   - Select "Author from scratch"
   - Function name: `chatbot-builder-auth`
   - Runtime: Python 3.11
   - Architecture: x86_64
   - Permissions: "Use an existing role"
   - Existing role: Select `ChatbotLambdaExecutionRole`
   - Click "Create function"

3. **Add Environment Variables**
   - Scroll down to "Configuration" tab
   - Click "Environment variables" in left menu
   - Click "Edit"
   - Click "Add environment variable" for each:
     - Key: `AWS_REGION`, Value: `us-east-1`
     - Key: `COGNITO_USER_POOL_ID`, Value: (from your aws-credentials.txt)
     - Key: `COGNITO_APP_CLIENT_ID`, Value: (from your aws-credentials.txt)
   - Click "Save"

4. **Upload Code**
   - Go back to "Code" tab
   - Delete the default code
   - Copy code from `aws/lambda-functions/auth_handler.py`
   - Paste into the editor
   - Click "Deploy"

5. **Configure Timeout**
   - Click "Configuration" tab
   - Click "General configuration"
   - Click "Edit"
   - Timeout: 30 seconds
   - Memory: 256 MB
   - Click "Save"

#### Repeat for Other Functions:

**Function 2: Upload Handler**
- Name: `chatbot-builder-upload`
- Environment variables:
  - AWS_REGION
  - S3_BUCKET_NAME
  - DYNAMODB_VECTORS_TABLE
  - DYNAMODB_BOTS_TABLE
  - GOOGLE_API_KEY (your Google Gemini key)
- Code: `aws/lambda-functions/upload_handler.py`
- Timeout: 300 seconds (5 minutes)
- Memory: 1024 MB

**Function 3: Chat Handler**
- Name: `chatbot-builder-chat`
- Environment variables:
  - AWS_REGION
  - DYNAMODB_VECTORS_TABLE
  - GOOGLE_API_KEY
- Code: `aws/lambda-functions/chat_handler.py`
- Timeout: 60 seconds
- Memory: 512 MB

**Function 4: Bots Handler**
- Name: `chatbot-builder-bots`
- Environment variables:
  - AWS_REGION
  - S3_BUCKET_NAME
  - DYNAMODB_VECTORS_TABLE
  - DYNAMODB_BOTS_TABLE
- Code: `aws/lambda-functions/bots_handler.py`
- Timeout: 60 seconds
- Memory: 512 MB

**✅ Lambda Functions Created!** Your backend code is deployed.

---


## Part 7: Setting Up API Gateway (30 minutes)

**What is API Gateway?** It's like a front door that routes requests to your Lambda functions.

### Step 1: Create REST API

1. **Open API Gateway Console**
   - Search "API Gateway" in AWS Console
   - Click "API Gateway"

2. **Create API**
   - Click "Create API"
   - Find "REST API" (not Private)
   - Click "Build"
   - Choose protocol: REST
   - Create new API: "New API"
   - API name: `chatbot-builder-api`
   - Description: "API for chatbot builder"
   - Endpoint Type: Regional
   - Click "Create API"

### Step 2: Create Cognito Authorizer

1. **Create Authorizer**
   - Click "Authorizers" in left menu
   - Click "Create New Authorizer"
   - Name: `CognitoAuthorizer`
   - Type: Cognito
   - Cognito User Pool: Select your user pool
   - Token Source: `Authorization`
   - Click "Create"

### Step 3: Create Resources and Methods

We'll create endpoints for your API. This is repetitive but important.

#### Create /auth endpoint:

1. **Create Resource**
   - Click "Resources" in left menu
   - Click "Actions" → "Create Resource"
   - Resource Name: `auth`
   - Resource Path: `auth`
   - Enable CORS: Check
   - Click "Create Resource"

2. **Create POST Method**
   - Select `/auth` resource
   - Click "Actions" → "Create Method"
   - Select "POST" from dropdown
   - Click checkmark
   - Integration type: Lambda Function
   - Use Lambda Proxy integration: Check
   - Lambda Region: us-east-1
   - Lambda Function: `chatbot-builder-auth`
   - Click "Save"
   - Click "OK" on permission popup

#### Create /api endpoint:

1. **Create Resource**
   - Select root `/`
   - Click "Actions" → "Create Resource"
   - Resource Name: `api`
   - Resource Path: `api`
   - Enable CORS: Check
   - Click "Create Resource"

#### Create /api/upload endpoint:

1. **Create Resource**
   - Select `/api`
   - Click "Actions" → "Create Resource"
   - Resource Name: `upload`
   - Resource Path: `upload`
   - Enable CORS: Check
   - Click "Create Resource"

2. **Create POST Method**
   - Select `/api/upload`
   - Click "Actions" → "Create Method"
   - Select "POST"
   - Integration type: Lambda Function
   - Use Lambda Proxy integration: Check
   - Lambda Function: `chatbot-builder-upload`
   - Click "Save"

3. **Add Authorization**
   - Click on "POST" method
   - Click "Method Request"
   - Authorization: Select `CognitoAuthorizer`
   - Click checkmark
   - Click "Actions" → "Deploy API"

#### Create /api/chat endpoint:

1. **Create Resource**
   - Select `/api`
   - Click "Actions" → "Create Resource"
   - Resource Name: `chat`
   - Enable CORS: Check
   - Click "Create Resource"

2. **Create POST Method**
   - Select `/api/chat`
   - Create POST method
   - Lambda Function: `chatbot-builder-chat`
   - No authorization needed (public endpoint)

#### Create /api/bots endpoint:

1. **Create Resource**
   - Select `/api`
   - Click "Actions" → "Create Resource"
   - Resource Name: `bots`
   - Enable CORS: Check
   - Click "Create Resource"

2. **Create GET Method**
   - Select `/api/bots`
   - Create GET method
   - Lambda Function: `chatbot-builder-bots`
   - Authorization: `CognitoAuthorizer`

3. **Create DELETE Method**
   - Select `/api/bots`
   - Create resource: `{bot_id}`
   - Create DELETE method
   - Lambda Function: `chatbot-builder-bots`
   - Authorization: `CognitoAuthorizer`

### Step 4: Deploy API

1. **Deploy**
   - Click "Actions" → "Deploy API"
   - Deployment stage: [New Stage]
   - Stage name: `prod`
   - Click "Deploy"

2. **Get API URL**
   - You'll see "Invoke URL" at top
   - Copy it (looks like: `https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod`)
   - Add to `aws-credentials.txt`:
   ```
   API_GATEWAY_URL=https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod
   ```

**✅ API Gateway Setup Complete!** Your API is live.

---


## Part 8: Migrating Your Data (45 minutes)

Now we'll move your existing data from Supabase and Qdrant to AWS.

### Step 1: Export Data from Supabase

1. **Export Users**
   - Go to Supabase Dashboard: https://app.supabase.com
   - Select your project
   - Click "Table Editor" (left menu)
   - Click on "users" table
   - Click "..." (three dots) → "Export to CSV"
   - Save as `users_export.csv`

2. **Export Bots**
   - Click on "bots" table
   - Export to CSV
   - Save as `bots_export.csv`

### Step 2: Migrate Users to Cognito

1. **Prepare Migration Script**
   - Open Command Prompt
   - Navigate to your project:
   ```bash
   cd path\to\your\project
   cd aws\migration-scripts
   ```

2. **Edit users CSV** (if needed)
   - Open `users_export.csv` in Excel or Notepad
   - Make sure it has columns: email, name
   - Save

3. **Run Migration**
   ```bash
   python migrate_users.py users_export.csv
   ```
   - You'll see progress for each user
   - ✓ means success
   - ✗ means error (usually duplicate)

4. **Send Password Reset Emails**
   ```bash
   python migrate_users.py --send-resets
   ```
   - This sends password reset emails to all users
   - Users will create new passwords

### Step 3: Migrate Vectors from Qdrant

1. **List Qdrant Collections**
   ```bash
   python migrate_vectors.py list
   ```
   - This shows all your bot collections

2. **Create Mapping File**
   ```bash
   python migrate_vectors.py export-mapping
   ```
   - Creates `collection_mapping.json`

3. **Edit Mapping File**
   - Open `collection_mapping.json` in Notepad
   - Replace "USER_ID_HERE" with actual user IDs
   - Example:
   ```json
   {
     "bot_abc123": "user-uuid-from-cognito",
     "bot_xyz789": "user-uuid-from-cognito"
   }
   ```
   - Save file

4. **Run Migration**
   ```bash
   python migrate_vectors.py migrate-all collection_mapping.json
   ```
   - This takes 5-30 minutes depending on data size
   - You'll see progress for each collection
   - Don't close the window!

5. **Verify Migration**
   ```bash
   python migrate_vectors.py verify bot_abc123
   ```
   - Replace `bot_abc123` with your actual bot ID
   - Should show number of vectors migrated

### Step 4: Verify in AWS Console

1. **Check DynamoDB**
   - Go to DynamoDB Console
   - Click on `chatbot-builder-vectors` table
   - Click "Explore table items"
   - You should see your data

2. **Check Cognito**
   - Go to Cognito Console
   - Click on your user pool
   - Click "Users" tab
   - You should see all migrated users

**✅ Data Migration Complete!** Your data is now in AWS.

---


## Part 9: Deploying Frontend to AWS Amplify (30 minutes)

**What is Amplify?** It's like Vercel but from AWS - hosts your React frontend.

### Step 1: Install Amplify CLI

1. **Install Node.js** (if not installed)
   - Visit: https://nodejs.org/
   - Download LTS version
   - Install with defaults

2. **Install Amplify CLI**
   ```bash
   npm install -g @aws-amplify/cli
   ```

3. **Configure Amplify**
   ```bash
   amplify configure
   ```
   - Press Enter to open browser
   - Sign in to AWS Console
   - Press Enter in terminal
   - Region: us-east-1
   - User name: amplify-cli-user
   - Press Enter (opens browser to create IAM user)
   - Click "Next" → "Next" → "Create user"
   - Copy Access Key ID and Secret Access Key
   - Paste in terminal when prompted
   - Profile name: default

### Step 2: Update Frontend Environment Variables

1. **Navigate to Frontend**
   ```bash
   cd path\to\your\project\frontend
   ```

2. **Create Production Environment File**
   - Create file: `.env.production`
   - Add these variables (use values from `aws-credentials.txt`):
   ```env
   VITE_AWS_REGION=us-east-1
   VITE_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
   VITE_COGNITO_APP_CLIENT_ID=XXXXXXXXXXXXXXXXXX
   VITE_API_URL=https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod
   ```

### Step 3: Update Frontend Code for Cognito

1. **Install AWS Amplify Libraries**
   ```bash
   npm install aws-amplify @aws-amplify/ui-react
   ```

2. **Create Amplify Config File**
   - Create file: `src/lib/amplify-config.ts`
   - Add this code:
   ```typescript
   import { Amplify } from 'aws-amplify';

   Amplify.configure({
     Auth: {
       Cognito: {
         userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
         userPoolClientId: import.meta.env.VITE_COGNITO_APP_CLIENT_ID,
         region: import.meta.env.VITE_AWS_REGION,
       }
     }
   });
   ```

3. **Update Main.tsx**
   - Open `src/main.tsx`
   - Add at top:
   ```typescript
   import './lib/amplify-config';
   ```

### Step 4: Initialize Amplify in Project

1. **Initialize Amplify**
   ```bash
   amplify init
   ```
   - Enter a name: `chatbotbuilder`
   - Environment name: `prod`
   - Default editor: Visual Studio Code
   - App type: javascript
   - Framework: react
   - Source directory: `src`
   - Distribution directory: `dist`
   - Build command: `npm run build`
   - Start command: `npm run dev`
   - Use AWS profile: Yes
   - Profile: default

2. **Add Hosting**
   ```bash
   amplify add hosting
   ```
   - Select: "Hosting with Amplify Console"
   - Type: "Manual deployment"

### Step 5: Build and Deploy

1. **Build Frontend**
   ```bash
   npm run build
   ```
   - Wait for build to complete
   - Should see "dist" folder created

2. **Deploy to Amplify**
   ```bash
   amplify publish
   ```
   - Confirm: Yes
   - Wait 5-10 minutes for deployment
   - You'll get a URL like: `https://prod.xxxxxx.amplifyapp.com`

3. **Save URL**
   - Add to `aws-credentials.txt`:
   ```
   AMPLIFY_URL=https://prod.xxxxxx.amplifyapp.com
   ```

### Step 6: Test Your Application

1. **Open Your App**
   - Visit the Amplify URL in browser
   - You should see your chatbot builder

2. **Test Signup**
   - Click "Sign Up"
   - Enter email and password
   - Check email for verification code
   - Enter code to verify

3. **Test Login**
   - Login with your credentials
   - Should see dashboard

4. **Test Upload**
   - Try uploading a document
   - Create a bot

5. **Test Chat**
   - Try chatting with your bot
   - Should get AI responses

**✅ Frontend Deployed!** Your app is live on AWS.

---


## Part 10: Testing Everything (20 minutes)

Let's make sure everything works!

### Test 1: Authentication

1. **Test Signup**
   ```bash
   curl -X POST https://YOUR_API_URL/auth/signup \
     -H "Content-Type: application/json" \
     -d "{\"email\":\"test@example.com\",\"password\":\"Test123!\",\"name\":\"Test User\"}"
   ```
   - Replace YOUR_API_URL with your actual API Gateway URL
   - Should return: `{"message": "User registered successfully"}`

2. **Test Login**
   ```bash
   curl -X POST https://YOUR_API_URL/auth/signin \
     -H "Content-Type: application/json" \
     -d "{\"email\":\"test@example.com\",\"password\":\"Test123!\"}"
   ```
   - Should return access_token and user info
   - Copy the access_token

### Test 2: Upload Document

```bash
curl -X POST https://YOUR_API_URL/api/upload \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"company_name\":\"Test Company\",\"files\":[]}"
```
- Replace YOUR_ACCESS_TOKEN with token from login
- Should return bot_id

### Test 3: Chat

```bash
curl -X POST https://YOUR_API_URL/api/chat \
  -H "Content-Type: application/json" \
  -d "{\"bot_id\":\"YOUR_BOT_ID\",\"query\":\"Hello\"}"
```
- Replace YOUR_BOT_ID with bot ID from upload
- Should return AI response

### Test 4: List Bots

```bash
curl -X GET https://YOUR_API_URL/api/bots \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```
- Should return list of your bots

### Test 5: Frontend Tests

1. **Open your Amplify URL**
2. **Test each feature**:
   - ✅ Sign up new user
   - ✅ Login
   - ✅ Upload document
   - ✅ Chat with bot
   - ✅ View bots list
   - ✅ Delete bot

**✅ All Tests Passed!** Your migration is complete.

---


## Part 11: Monitoring and Maintenance (15 minutes)

### Setting Up CloudWatch Monitoring

**What is CloudWatch?** It's like a security camera system for your AWS services.

1. **Open CloudWatch Console**
   - Search "CloudWatch" in AWS Console
   - Click "CloudWatch"

2. **View Lambda Logs**
   - Click "Logs" → "Log groups"
   - You'll see logs for each Lambda function:
     - `/aws/lambda/chatbot-builder-auth`
     - `/aws/lambda/chatbot-builder-upload`
     - `/aws/lambda/chatbot-builder-chat`
     - `/aws/lambda/chatbot-builder-bots`
   - Click any log group to see logs
   - Click "Search log group" to find errors

3. **Create Dashboard**
   - Click "Dashboards" in left menu
   - Click "Create dashboard"
   - Dashboard name: `chatbot-monitoring`
   - Click "Create dashboard"
   - Add widgets:
     - Lambda invocations
     - Lambda errors
     - API Gateway requests
     - DynamoDB consumed capacity

4. **Set Up Alarms**
   - Click "Alarms" → "All alarms"
   - Click "Create alarm"
   - Select metric: Lambda → Errors
   - Conditions: Greater than 5
   - Actions: Send email notification
   - Enter your email
   - Click "Create alarm"

### Checking Costs

1. **View Current Costs**
   - Search "Billing" in AWS Console
   - Click "Billing Dashboard"
   - See "Month-to-Date Costs"

2. **Set Budget Alert**
   - Click "Budgets" in left menu
   - Click "Create budget"
   - Budget type: Cost budget
   - Budget name: `monthly-budget`
   - Amount: $10
   - Email: Your email
   - Click "Create budget"

### Regular Maintenance Tasks

**Daily**:
- Check CloudWatch for errors
- Monitor costs in Billing Dashboard

**Weekly**:
- Review Lambda function performance
- Check DynamoDB capacity usage
- Review S3 storage usage

**Monthly**:
- Review and optimize costs
- Update Lambda functions if needed
- Backup RDS database
- Review security settings

---


## Part 12: Troubleshooting Common Issues

### Issue 1: "Access Denied" Error

**Problem**: Lambda function can't access DynamoDB or S3

**Solution**:
1. Go to IAM Console
2. Click "Roles" → Find `ChatbotLambdaExecutionRole`
3. Click "Attach policies"
4. Add missing policy (DynamoDB or S3)
5. Click "Attach policy"

### Issue 2: Lambda Timeout

**Problem**: Function times out before completing

**Solution**:
1. Go to Lambda Console
2. Click on function
3. Configuration → General configuration → Edit
4. Increase timeout (e.g., from 30s to 60s)
5. Click "Save"

### Issue 3: CORS Error in Frontend

**Problem**: Browser blocks API requests

**Solution**:
1. Go to API Gateway Console
2. Select your API
3. Select resource (e.g., /api/chat)
4. Actions → Enable CORS
5. Click "Enable CORS and replace existing CORS headers"
6. Actions → Deploy API

### Issue 4: Can't Connect to RDS

**Problem**: Connection timeout to database

**Solution**:
1. Go to RDS Console
2. Click on database
3. Click on VPC security group
4. Edit inbound rules
5. Add your current IP address
6. Save rules

### Issue 5: Cognito User Not Confirmed

**Problem**: User can't login after signup

**Solution**:
1. Go to Cognito Console
2. Click on User Pool
3. Click "Users" tab
4. Find user
5. Click "Confirm account" (if needed)

### Issue 6: High Costs

**Problem**: AWS bill higher than expected

**Solution**:
1. Check Billing Dashboard
2. Look at "Top Services by Cost"
3. Common causes:
   - RDS running 24/7 (stop when not needed)
   - Large S3 storage (delete old files)
   - High Lambda invocations (optimize code)
4. Set up budget alerts

### Getting Help

**AWS Support**:
- Basic support is free
- Go to: https://console.aws.amazon.com/support/
- Create case for technical issues

**Documentation**:
- AWS Docs: https://docs.aws.amazon.com/
- Search for specific service

**Community**:
- AWS Forums: https://forums.aws.amazon.com/
- Stack Overflow: Tag with `amazon-web-services`

---


## Part 13: Cost Optimization Tips

### Staying in Free Tier

**Lambda**:
- ✅ Free: 1 million requests/month
- ✅ Free: 400,000 GB-seconds compute
- Tip: Optimize function memory and timeout

**DynamoDB**:
- ✅ Free: 25 GB storage
- ✅ Free: 25 WCU, 25 RCU
- Tip: Use on-demand pricing for unpredictable traffic

**S3**:
- ✅ Free: 5 GB storage
- ✅ Free: 20,000 GET requests
- ✅ Free: 2,000 PUT requests
- Tip: Delete old documents regularly

**RDS**:
- ✅ Free: 750 hours/month (db.t3.micro)
- ✅ Free: 20 GB storage
- Tip: Stop database when not in use

**API Gateway**:
- ✅ Free: 1 million calls/month (first 12 months)
- Tip: Cache responses to reduce calls

**Cognito**:
- ✅ Free: 50,000 monthly active users
- Tip: More than enough for most apps

### After Free Tier (Month 13+)

**Expected Costs** (for small app with 100 users):
- Lambda: $1-3/month
- DynamoDB: $2-5/month
- S3: $1-2/month
- RDS: $15-20/month (biggest cost)
- API Gateway: $3-5/month
- Cognito: $0-2/month
- **Total: ~$25-40/month**

### Ways to Reduce Costs

1. **Stop RDS when not needed**
   ```bash
   aws rds stop-db-instance --db-instance-identifier chatbot-db
   ```

2. **Use S3 Lifecycle Policies**
   - Auto-delete files older than 90 days
   - Move old files to cheaper storage

3. **Optimize Lambda**
   - Reduce memory if possible
   - Reduce timeout
   - Use Lambda layers for dependencies

4. **Use DynamoDB On-Demand**
   - Only pay for what you use
   - No minimum charges

5. **Enable CloudWatch Logs Retention**
   - Set logs to expire after 7 days
   - Reduces storage costs

---


## Part 14: Next Steps and Best Practices

### Security Best Practices

1. **Enable MFA on Root Account** ✅ (Already done)
2. **Use IAM Users** (Don't use root for daily tasks)
3. **Rotate Access Keys** (Every 90 days)
4. **Enable CloudTrail** (Audit logs)
5. **Use Secrets Manager** (For API keys)
6. **Regular Security Audits** (Monthly)

### Performance Optimization

1. **Enable API Gateway Caching**
   - Reduces Lambda invocations
   - Faster response times

2. **Use CloudFront CDN**
   - Faster frontend loading
   - Global distribution

3. **Optimize Lambda Cold Starts**
   - Keep functions warm
   - Use provisioned concurrency

4. **Database Indexing**
   - Add indexes for common queries
   - Improves query performance

### Scaling Your Application

**When you have 1,000+ users**:
1. Enable RDS Multi-AZ (high availability)
2. Use Lambda provisioned concurrency
3. Add CloudFront for frontend
4. Consider Aurora Serverless for database
5. Use ElastiCache for caching

**When you have 10,000+ users**:
1. Use AWS OpenSearch for vector search
2. Implement API rate limiting
3. Use SQS for async processing
4. Add load balancing
5. Consider microservices architecture

### Backup Strategy

**Daily Backups**:
- RDS: Automatic (7-day retention)
- DynamoDB: Enable point-in-time recovery
- S3: Enable versioning

**Manual Backups** (before major changes):
```bash
# Backup RDS
aws rds create-db-snapshot \
  --db-instance-identifier chatbot-db \
  --db-snapshot-identifier backup-$(date +%Y%m%d)

# Export DynamoDB
aws dynamodb create-backup \
  --table-name chatbot-builder-vectors \
  --backup-name vectors-backup-$(date +%Y%m%d)
```

### Monitoring Checklist

**Daily**:
- [ ] Check CloudWatch for errors
- [ ] Review Lambda invocations
- [ ] Check API Gateway 5xx errors

**Weekly**:
- [ ] Review costs in Billing Dashboard
- [ ] Check DynamoDB capacity
- [ ] Review S3 storage usage
- [ ] Check RDS performance metrics

**Monthly**:
- [ ] Security audit
- [ ] Cost optimization review
- [ ] Update Lambda functions
- [ ] Review and delete old logs
- [ ] Test disaster recovery

---


## Part 15: Complete Checklist

Print this and check off as you complete each step!

### Pre-Migration Checklist
- [ ] AWS account created
- [ ] MFA enabled on root account
- [ ] Billing alerts set up
- [ ] AWS CLI installed
- [ ] AWS CLI configured
- [ ] Python installed
- [ ] Required packages installed
- [ ] Data exported from Supabase
- [ ] Data exported from Qdrant

### AWS Services Setup
- [ ] Cognito User Pool created
- [ ] Cognito App Client created
- [ ] DynamoDB VectorEmbeddings table created
- [ ] DynamoDB BotCollections table created
- [ ] DynamoDB indexes created
- [ ] S3 bucket created
- [ ] S3 CORS configured
- [ ] RDS PostgreSQL instance created
- [ ] RDS security group configured
- [ ] RDS database schema created

### Lambda Functions
- [ ] IAM role created
- [ ] Auth Lambda function created
- [ ] Upload Lambda function created
- [ ] Chat Lambda function created
- [ ] Bots Lambda function created
- [ ] All environment variables set
- [ ] All functions tested

### API Gateway
- [ ] REST API created
- [ ] Cognito authorizer created
- [ ] /auth endpoint created
- [ ] /api/upload endpoint created
- [ ] /api/chat endpoint created
- [ ] /api/bots endpoint created
- [ ] CORS enabled on all endpoints
- [ ] API deployed to prod stage

### Data Migration
- [ ] Users migrated to Cognito
- [ ] Password reset emails sent
- [ ] Vectors migrated to DynamoDB
- [ ] Bots migrated to RDS
- [ ] Migration verified

### Frontend Deployment
- [ ] Amplify CLI installed
- [ ] Amplify configured
- [ ] Environment variables updated
- [ ] Amplify libraries installed
- [ ] Frontend code updated
- [ ] Frontend built successfully
- [ ] Frontend deployed to Amplify

### Testing
- [ ] Authentication tested
- [ ] Document upload tested
- [ ] Chat functionality tested
- [ ] Bot management tested
- [ ] Widget tested
- [ ] All API endpoints tested

### Monitoring & Maintenance
- [ ] CloudWatch dashboard created
- [ ] Alarms set up
- [ ] Budget alerts configured
- [ ] Backup strategy implemented
- [ ] Documentation updated

### Post-Migration
- [ ] Old infrastructure still running (backup)
- [ ] DNS updated (if applicable)
- [ ] Users notified of migration
- [ ] Monitoring for 1 week
- [ ] Performance acceptable
- [ ] Costs within budget
- [ ] Old infrastructure decommissioned

---

## 🎉 Congratulations!

You've successfully migrated your chatbot builder to AWS!

### What You've Accomplished

✅ Created AWS account and secured it
✅ Set up 7 AWS services from scratch
✅ Deployed serverless backend with Lambda
✅ Migrated all your data
✅ Deployed frontend to Amplify
✅ Set up monitoring and alerts
✅ Learned AWS fundamentals

### Your New Architecture

- **Frontend**: AWS Amplify (global CDN)
- **Authentication**: Amazon Cognito (50K free users)
- **API**: API Gateway + Lambda (serverless)
- **Database**: RDS PostgreSQL (managed)
- **Vector Storage**: DynamoDB (NoSQL)
- **File Storage**: S3 (unlimited)
- **Monitoring**: CloudWatch (real-time)

### Cost Summary

- **First 12 months**: $0-5/month (free tier)
- **After free tier**: $25-40/month
- **Savings vs current**: ~30-40%

### Support Resources

- **This guide**: For step-by-step instructions
- **AWS Documentation**: https://docs.aws.amazon.com/
- **AWS Support**: https://console.aws.amazon.com/support/
- **Community**: AWS Forums, Stack Overflow

### Keep Learning

- AWS Certified Cloud Practitioner (beginner cert)
- AWS Certified Solutions Architect (intermediate)
- AWS re:Invent videos (free on YouTube)
- AWS Skill Builder (free training)

---

## 📞 Need Help?

If you get stuck:

1. **Check troubleshooting section** (Part 12)
2. **Review CloudWatch logs** for errors
3. **Search AWS documentation** for specific errors
4. **Ask on Stack Overflow** with tag `amazon-web-services`
5. **Create AWS Support case** (free basic support)

---

## 🚀 You're Now an AWS Developer!

You've learned:
- Cloud computing fundamentals
- Serverless architecture
- AWS service integration
- Database management
- API development
- Frontend deployment
- Monitoring and optimization

**This is a valuable skill!** AWS powers millions of applications worldwide.

Keep building, keep learning, and enjoy your new AWS-powered chatbot builder! 🎊

---

**Last Updated**: November 2025
**Author**: AWS Migration Guide for Beginners
**Version**: 1.0

