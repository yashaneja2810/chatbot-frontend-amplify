import uuid
import time
from typing import List, Dict, Optional
from threading import Lock
import logging
from datetime import datetime

import numpy as np
from qdrant_client import QdrantClient
from qdrant_client.http import models
from qdrant_client.http.models import Distance, VectorParams, PointStruct
from sentence_transformers import SentenceTransformer

from ..core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

class VectorStoreService:
    _instance = None
    _lock = Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super(VectorStoreService, cls).__new__(cls)
                    cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        # Singleton pattern - only initialize once
        if self._initialized:
            return
            
        # Try loading the model with retries
        max_retries = 3
        retry_delay = 5  # seconds
        model_name = 'all-MiniLM-L6-v2'
        
        for attempt in range(max_retries):
            try:
                self.model = SentenceTransformer(model_name)
                logger.info(f"Successfully loaded SentenceTransformer model: {model_name}")
                break
            except Exception as e:
                if attempt == max_retries - 1:
                    raise Exception(f"Failed to load model after {max_retries} attempts: {str(e)}")
                logger.warning(f"Attempt {attempt + 1} failed, retrying in {retry_delay} seconds...")
                time.sleep(retry_delay)
        
        # Initialize Qdrant client
        self._init_qdrant_client()
        self._initialized = True
        
    def _init_qdrant_client(self):
        """Initialize Qdrant client with configuration"""
        try:
            if settings.QDRANT_URL:
                # Use cloud/remote Qdrant instance
                self.client = QdrantClient(
                    url=settings.QDRANT_URL,
                    api_key=settings.QDRANT_API_KEY,
                )
                logger.info(f"Connected to Qdrant cloud instance: {settings.QDRANT_URL}")
            else:
                # Use local Qdrant instance
                self.client = QdrantClient(
                    host=settings.QDRANT_HOST,
                    port=settings.QDRANT_PORT,
                    api_key=settings.QDRANT_API_KEY,
                )
                logger.info(f"Connected to local Qdrant instance: {settings.QDRANT_HOST}:{settings.QDRANT_PORT}")
                
            # Test connection
            collections = self.client.get_collections()
            logger.info(f"Qdrant connection successful. Found {len(collections.collections)} collections.")
            
        except Exception as e:
            logger.error(f"Failed to connect to Qdrant: {str(e)}")
            raise Exception(f"Failed to initialize Qdrant client: {str(e)}")
        
    def create_collection(self, collection_name: str):
        """Create a new Qdrant collection"""
        try:
            # Check if collection already exists
            try:
                collection_info = self.client.get_collection(collection_name)
                logger.info(f"Collection {collection_name} already exists")
                return
            except Exception:
                # Collection doesn't exist, create it
                pass
                
            # Create collection with vector configuration
            self.client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(
                    size=384,  # all-MiniLM-L6-v2 embedding dimension
                    distance=Distance.COSINE,  # Use cosine similarity
                ),
            )
            logger.info(f"Successfully created Qdrant collection: {collection_name}")
            
        except Exception as e:
            # Handle the case where collection already exists (race condition)
            if "already exists" in str(e).lower():
                logger.info(f"Collection {collection_name} already exists (race condition)")
                return
            logger.error(f"Failed to create collection {collection_name}: {str(e)}")
            raise Exception(f"Failed to create collection {collection_name}: {str(e)}")
    
    def add_texts(self, collection_name: str, texts: List[str], metadata: List[Dict] = None):
        """Add text chunks to the collection"""
        if not texts:
            logger.warning("No texts provided to add_texts")
            return

        try:
            # Ensure collection exists
            self.create_collection(collection_name)
            
            # Generate embeddings for the texts
            logger.info(f"Generating embeddings for {len(texts)} texts")
            embeddings = self.model.encode(texts)
            
            # Prepare points for insertion
            points = []
            for i, (text, embedding) in enumerate(zip(texts, embeddings)):
                point_id = str(uuid.uuid4())
                
                # Prepare payload (metadata)
                payload = {
                    "text": text,
                    "created_at": datetime.utcnow().isoformat(),
                }
                
                # Add custom metadata if provided
                if metadata and i < len(metadata):
                    payload.update(metadata[i])
                
                points.append(
                    PointStruct(
                        id=point_id,
                        vector=embedding.tolist(),
                        payload=payload
                    )
                )
            
            # Insert points into Qdrant
            operation_info = self.client.upsert(
                collection_name=collection_name,
                points=points
            )
            
            logger.info(f"Successfully added {len(texts)} texts to collection {collection_name}")
            logger.debug(f"Operation info: {operation_info}")
            
        except Exception as e:
            logger.error(f"Failed to add texts to collection {collection_name}: {str(e)}")
            raise Exception(f"Failed to add texts to collection {collection_name}: {str(e)}")

    def delete_collection(self, collection_name: str):
        """Delete a Qdrant collection"""
        try:
            # Try to delete the collection directly
            result = self.client.delete_collection(collection_name)
            logger.info(f"Successfully deleted collection: {collection_name}")
            return result
            
        except Exception as e:
            error_msg = str(e).lower()
            # If collection doesn't exist, that's fine
            if "not found" in error_msg or "doesn't exist" in error_msg or "404" in error_msg:
                logger.info(f"Collection {collection_name} doesn't exist, nothing to delete")
                return
            # Otherwise, it's a real error
            logger.error(f"Failed to delete collection {collection_name}: {str(e)}")
            raise Exception(f"Failed to delete collection {collection_name}: {str(e)}")

    def search(self, collection_name: str, query: str, limit: int = 5) -> List[Dict]:
        """Search for similar text chunks using Qdrant"""
        try:
            # Generate query embedding
            query_vector = self.model.encode([query])[0]
            
            # Search in Qdrant
            search_result = self.client.search(
                collection_name=collection_name,
                query_vector=query_vector.tolist(),
                limit=limit,
                with_payload=True,
                with_vectors=False,  # We don't need vectors in response
            )
            
            # Format results
            results = []
            for scored_point in search_result:
                # Qdrant returns cosine similarity scores (higher is better)
                score = float(scored_point.score)
                payload = scored_point.payload
                
                results.append({
                    "text": payload.get("text", ""),
                    "metadata": {k: v for k, v in payload.items() if k != "text"},
                    "score": score
                })
            
            logger.info(f"Found {len(results)} results for query '{query}' in collection {collection_name}")
            for r in results:
                logger.debug(f"Score: {r['score']:.3f} | Text: {r['text'][:100]}...")
            
            return results
            
        except Exception as e:
            logger.error(f"Error searching collection {collection_name}: {str(e)}")
            return []

    def get_collection_info(self, collection_name: str) -> Optional[Dict]:
        """Get information about a collection"""
        try:
            collection_info = self.client.get_collection(collection_name)
            return {
                "name": collection_name,
                "vectors_count": getattr(collection_info, 'vectors_count', 0),
                "points_count": getattr(collection_info, 'points_count', 0),
                "status": str(getattr(collection_info, 'status', 'unknown')),
            }
        except Exception as e:
            logger.error(f"Error getting collection info for {collection_name}: {str(e)}")
            return {
                "name": collection_name,
                "vectors_count": 0,
                "points_count": 0,
                "status": "error"
            }

    def list_collections(self) -> List[str]:
        """List all collections"""
        try:
            collections = self.client.get_collections()
            return [collection.name for collection in collections.collections]
        except Exception as e:
            logger.error(f"Error listing collections: {str(e)}")
            return []

    def get_collection_stats(self, collection_name: str) -> Dict:
        """Get statistics for a collection"""
        try:
            collection_info = self.client.get_collection(collection_name)
            return {
                "total_points": collection_info.points_count,
                "vectors_count": collection_info.vectors_count,
                "indexed_vectors_count": collection_info.indexed_vectors_count,
                "status": collection_info.status.value if collection_info.status else "unknown"
            }
        except Exception as e:
            logger.error(f"Error getting stats for collection {collection_name}: {str(e)}")
            return {
                "total_points": 0,
                "vectors_count": 0,
                "indexed_vectors_count": 0,
                "status": "error"
            }

    def scroll_collection(self, collection_name: str, limit: int = 100, offset: Optional[str] = None) -> Dict:
        """Scroll through all points in a collection"""
        try:
            result = self.client.scroll(
                collection_name=collection_name,
                limit=limit,
                offset=offset,
                with_payload=True,
                with_vectors=False
            )
            
            return {
                "points": [
                    {
                        "id": point.id,
                        "payload": point.payload
                    }
                    for point in result[0]
                ],
                "next_page_offset": result[1]
            }
        except Exception as e:
            logger.error(f"Error scrolling collection {collection_name}: {str(e)}")
            return {"points": [], "next_page_offset": None}

    def delete_points(self, collection_name: str, point_ids: List[str]) -> bool:
        """Delete specific points from a collection"""
        try:
            operation_info = self.client.delete(
                collection_name=collection_name,
                points_selector=models.PointIdsList(
                    points=point_ids
                )
            )
            logger.info(f"Deleted {len(point_ids)} points from collection {collection_name}")
            return True
        except Exception as e:
            logger.error(f"Error deleting points from collection {collection_name}: {str(e)}")
            return False

    def update_payload(self, collection_name: str, point_id: str, payload: Dict) -> bool:
        """Update payload for a specific point"""
        try:
            operation_info = self.client.set_payload(
                collection_name=collection_name,
                payload=payload,
                points=[point_id]
            )
            logger.info(f"Updated payload for point {point_id} in collection {collection_name}")
            return True
        except Exception as e:
            logger.error(f"Error updating payload for point {point_id}: {str(e)}")
            return False

    def health_check(self) -> Dict:
        """Check Qdrant health and return status"""
        try:
            # Try to get collections as a health check
            collections = self.client.get_collections()
            return {
                "status": "healthy",
                "collections_count": len(collections.collections),
                "message": "Qdrant is running and accessible"
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "collections_count": 0,
                "message": f"Qdrant connection failed: {str(e)}"
            }
