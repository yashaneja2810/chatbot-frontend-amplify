#!/usr/bin/env python3
"""
Test script to verify Qdrant integration works correctly.
Run this after setting up Qdrant to ensure everything is working.
"""

import asyncio
import logging
from app.services.vector_store import VectorStoreService

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_qdrant_integration():
    """Test basic Qdrant operations"""
    
    print("🚀 Testing Qdrant Integration...")
    
    try:
        # Initialize vector store
        print("1. Initializing VectorStoreService...")
        vector_store = VectorStoreService()
        print("✅ VectorStoreService initialized successfully")
        
        # Test health check
        print("\n2. Testing health check...")
        health = vector_store.health_check()
        print(f"Health status: {health}")
        
        if health["status"] != "healthy":
            print("❌ Qdrant is not healthy. Please check your setup.")
            return False
        
        print("✅ Qdrant health check passed")
        
        # Test collection creation
        import time
        test_collection = f"test_collection_{int(time.time())}"
        print(f"\n3. Creating test collection: {test_collection}")
        vector_store.create_collection(test_collection)
        print("✅ Collection created successfully")
        
        # Test adding texts
        print("\n4. Adding test texts...")
        test_texts = [
            "This is a test document about artificial intelligence.",
            "Machine learning is a subset of AI that focuses on algorithms.",
            "Natural language processing helps computers understand human language.",
            "Vector databases are great for similarity search."
        ]
        
        test_metadata = [
            {"source": "test_doc_1", "topic": "AI"},
            {"source": "test_doc_2", "topic": "ML"},
            {"source": "test_doc_3", "topic": "NLP"},
            {"source": "test_doc_4", "topic": "Vector DB"}
        ]
        
        vector_store.add_texts(test_collection, test_texts, test_metadata)
        print(f"✅ Added {len(test_texts)} texts successfully")
        
        # Test collection info
        print("\n5. Getting collection info...")
        info = vector_store.get_collection_info(test_collection)
        print(f"Collection info: {info}")
        print("✅ Collection info retrieved successfully")
        
        # Test search
        print("\n6. Testing search functionality...")
        query = "What is artificial intelligence?"
        results = vector_store.search(test_collection, query, limit=2)
        
        print(f"Search results for '{query}':")
        for i, result in enumerate(results, 1):
            print(f"  {i}. Score: {result['score']:.3f}")
            print(f"     Text: {result['text'][:50]}...")
            print(f"     Metadata: {result['metadata']}")
        
        if not results:
            print("❌ No search results returned")
            return False
        
        print("✅ Search functionality working correctly")
        
        # Test collection stats
        print("\n7. Getting collection statistics...")
        stats = vector_store.get_collection_stats(test_collection)
        print(f"Collection stats: {stats}")
        print("✅ Collection statistics retrieved successfully")
        
        # Test listing collections
        print("\n8. Listing all collections...")
        collections = vector_store.list_collections()
        print(f"Found collections: {collections}")
        
        if test_collection not in collections:
            print("❌ Test collection not found in collections list")
            return False
        
        print("✅ Collections listed successfully")
        
        # Clean up - delete test collection
        print(f"\n9. Cleaning up test collection: {test_collection}")
        vector_store.delete_collection(test_collection)
        print("✅ Test collection deleted successfully")
        
        # Verify deletion
        collections_after = vector_store.list_collections()
        if test_collection in collections_after:
            print("❌ Test collection still exists after deletion")
            return False
        
        print("✅ Collection deletion verified")
        
        print("\n🎉 All tests passed! Qdrant integration is working correctly.")
        return True
        
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")
        logger.exception("Test failed")
        return False

def test_connection_only():
    """Quick connection test"""
    try:
        print("🔍 Testing Qdrant connection...")
        vector_store = VectorStoreService()
        health = vector_store.health_check()
        
        if health["status"] == "healthy":
            print("✅ Qdrant connection successful!")
            print(f"   Collections: {health['collections_count']}")
        else:
            print("❌ Qdrant connection failed!")
            print(f"   Error: {health['message']}")
            
        return health["status"] == "healthy"
        
    except Exception as e:
        print(f"❌ Connection test failed: {str(e)}")
        return False

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "connection":
        # Quick connection test
        success = test_connection_only()
    else:
        # Full integration test
        success = asyncio.run(test_qdrant_integration())
    
    if success:
        print("\n✨ Ready to use Qdrant with your chatbot application!")
        sys.exit(0)
    else:
        print("\n💥 Please fix the issues above before proceeding.")
        print("\nTroubleshooting tips:")
        print("1. Make sure Qdrant is running: docker-compose up -d qdrant")
        print("2. Check your .env file has correct Qdrant settings")
        print("3. Verify Qdrant is accessible: curl http://localhost:6333/health")
        sys.exit(1)