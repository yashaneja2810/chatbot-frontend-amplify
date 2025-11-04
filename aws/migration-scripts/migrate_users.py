"""
Migrate users from Supabase to AWS Cognito
"""

import boto3
import os
from supabase import create_client
from dotenv import load_dotenv
import time

load_dotenv()

# Supabase client
supabase_url = os.getenv('VITE_SUPABASE_URL')
supabase_key = os.getenv('VITE_SUPABASE_ANON_KEY')
supabase = create_client(supabase_url, supabase_key)

# AWS Cognito client
cognito_client = boto3.client('cognito-idp', region_name=os.getenv('AWS_REGION', 'us-east-1'))
USER_POOL_ID = os.getenv('COGNITO_USER_POOL_ID')


def get_supabase_users():
    """Fetch all users from Supabase"""
    try:
        # Note: This requires admin access to Supabase
        # You may need to use Supabase Management API or export users manually
        response = supabase.auth.admin.list_users()
        return response
    except Exception as e:
        print(f"Error fetching Supabase users: {str(e)}")
        print("Note: You may need to export users manually from Supabase dashboard")
        return []


def create_cognito_user(email, name='', email_verified=True):
    """Create user in Cognito"""
    try:
        user_attributes = [
            {'Name': 'email', 'Value': email},
            {'Name': 'email_verified', 'Value': 'true' if email_verified else 'false'}
        ]
        
        if name:
            user_attributes.append({'Name': 'name', 'Value': name})
        
        response = cognito_client.admin_create_user(
            UserPoolId=USER_POOL_ID,
            Username=email,
            UserAttributes=user_attributes,
            MessageAction='SUPPRESS',  # Don't send welcome email
            DesiredDeliveryMediums=['EMAIL']
        )
        
        # Set permanent password (users will need to reset)
        # Or you can send password reset email
        
        print(f"✓ Created user: {email}")
        return response
        
    except cognito_client.exceptions.UsernameExistsException:
        print(f"⚠ User already exists: {email}")
        return None
    except Exception as e:
        print(f"✗ Error creating user {email}: {str(e)}")
        return None


def migrate_users_from_csv(csv_file):
    """
    Migrate users from CSV export
    CSV format: email,name,email_verified
    """
    import csv
    
    migrated = 0
    failed = 0
    
    with open(csv_file, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            email = row.get('email')
            name = row.get('name', '')
            email_verified = row.get('email_verified', 'true').lower() == 'true'
            
            if email:
                result = create_cognito_user(email, name, email_verified)
                if result:
                    migrated += 1
                else:
                    failed += 1
                
                # Rate limiting
                time.sleep(0.1)
    
    print(f"\nMigration complete:")
    print(f"  Migrated: {migrated}")
    print(f"  Failed: {failed}")


def migrate_users_from_json(json_file):
    """
    Migrate users from JSON export
    JSON format: [{"email": "...", "name": "...", "email_verified": true}, ...]
    """
    import json
    
    with open(json_file, 'r') as f:
        users = json.load(f)
    
    migrated = 0
    failed = 0
    
    for user in users:
        email = user.get('email')
        name = user.get('name', '')
        email_verified = user.get('email_verified', True)
        
        if email:
            result = create_cognito_user(email, name, email_verified)
            if result:
                migrated += 1
            else:
                failed += 1
            
            # Rate limiting
            time.sleep(0.1)
    
    print(f"\nMigration complete:")
    print(f"  Migrated: {migrated}")
    print(f"  Failed: {failed}")


def send_password_reset_emails():
    """Send password reset emails to all users"""
    try:
        # List all users
        response = cognito_client.list_users(
            UserPoolId=USER_POOL_ID,
            Limit=60
        )
        
        users = response['Users']
        
        for user in users:
            username = user['Username']
            try:
                cognito_client.admin_reset_user_password(
                    UserPoolId=USER_POOL_ID,
                    Username=username
                )
                print(f"✓ Sent password reset to: {username}")
                time.sleep(0.1)  # Rate limiting
            except Exception as e:
                print(f"✗ Error sending reset to {username}: {str(e)}")
        
        # Handle pagination
        while 'PaginationToken' in response:
            response = cognito_client.list_users(
                UserPoolId=USER_POOL_ID,
                Limit=60,
                PaginationToken=response['PaginationToken']
            )
            
            users = response['Users']
            for user in users:
                username = user['Username']
                try:
                    cognito_client.admin_reset_user_password(
                        UserPoolId=USER_POOL_ID,
                        Username=username
                    )
                    print(f"✓ Sent password reset to: {username}")
                    time.sleep(0.1)
                except Exception as e:
                    print(f"✗ Error sending reset to {username}: {str(e)}")
        
    except Exception as e:
        print(f"Error sending password resets: {str(e)}")


if __name__ == '__main__':
    import sys
    
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python migrate_users.py <csv_file>")
        print("  python migrate_users.py <json_file>")
        print("  python migrate_users.py --send-resets")
        sys.exit(1)
    
    arg = sys.argv[1]
    
    if arg == '--send-resets':
        print("Sending password reset emails...")
        send_password_reset_emails()
    elif arg.endswith('.csv'):
        print(f"Migrating users from CSV: {arg}")
        migrate_users_from_csv(arg)
    elif arg.endswith('.json'):
        print(f"Migrating users from JSON: {arg}")
        migrate_users_from_json(arg)
    else:
        print("Error: File must be .csv or .json")
        sys.exit(1)
