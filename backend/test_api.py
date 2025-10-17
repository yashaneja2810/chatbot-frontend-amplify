#!/usr/bin/env python3
"""
Test script to verify the API endpoints work correctly after Qdrant migration
"""

import requests
import json
import os
from pathlib import Path

API_BASE = "http://localhost:8000"

def test_health():
    """Test health endpoint"""
    print("🔍 Testing health endpoint...")
    try:
        response = requests.get(f"{API_BASE}/api/health")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check passed: {data['status']}")
            print(f"   Services: {data['services']}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

def test_upload_document():
    """Test document upload endpoint"""
    print("\n📄 Testing document upload...")
    
    # Create a test document
    test_doc_path = Path("test_doc.txt")
    if not test_doc_path.exists():
        print("❌ Test document not found")
        return None
    
    try:
        # Prepare the upload
        files = {
            'files': ('test_doc.txt', open(test_doc_path, 'rb'), 'text/plain')
        }
        data = {
            'company_name': 'Test Company API'
        }
        
        # Note: This would normally require authentication
        # For now, just test if the endpoint is accessible
        response = requests.post(f"{API_BASE}/api/upload", files=files, data=data)
        
        if response.status_code == 401:
            print("✅ Upload endpoint accessible (requires auth as expected)")
            return None
        elif response.status_code == 200:
            result = response.json()
            print(f"✅ Document uploaded successfully!")
            print(f"   Bot ID: {result.get('bot_id')}")
            return result.get('bot_id')
        else:
            print(f"❌ Upload failed: {response.status_code} - {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Upload error: {e}")
        return None
    finally:
        if 'files' in locals():
            files['files'][1].close()

def test_chat_endpoint():
    """Test public chat endpoint"""
    print("\n💬 Testing chat endpoint...")
    
    try:
        # Test with a dummy bot ID
        chat_data = {
            "bot_id": "test-bot-123",
            "query": "Hello, how are you?"
        }
        
        response = requests.post(f"{API_BASE}/api/chat", json=chat_data)
        
        if response.status_code == 403:
            print("✅ Chat endpoint accessible (bot access denied as expected)")
        elif response.status_code == 200:
            result = response.json()
            print(f"✅ Chat response: {result.get('response', 'No response')}")
        else:
            print(f"⚠️  Chat endpoint response: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Chat error: {e}")

def main():
    print("🚀 Testing API endpoints after Qdrant migration...\n")
    
    # Test health
    if not test_health():
        print("💥 Health check failed. Please ensure the backend is running.")
        return
    
    # Test upload (will require auth)
    bot_id = test_upload_document()
    
    # Test chat
    test_chat_endpoint()
    
    print("\n✨ API testing completed!")
    print("\nNext steps:")
    print("1. Open http://localhost:5173 in your browser")
    print("2. Login/register a user")
    print("3. Upload a document to create a bot")
    print("4. Test the chat functionality")
    print("5. Check the 'My Bots' page to see your created bots")

if __name__ == "__main__":
    main()