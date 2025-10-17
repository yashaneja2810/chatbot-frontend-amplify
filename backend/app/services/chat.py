from typing import List, Optional
import pickle
import asyncio
from datetime import datetime
from fastapi import HTTPException, status
from ..log_config import logger
from ..core.config import get_settings
from .vector_store import VectorStoreService
from .auth import AuthService
from .ai_service import AIService

settings = get_settings()

from threading import Lock

class ChatService:
    _instance = None
    _lock = Lock()
    _initialized = False

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super(ChatService, cls).__new__(cls)
                    cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        with self._lock:
            if not self._initialized:
                self.vector_store = VectorStoreService()
                self.auth_service = AuthService()
                self.ai_service = AIService()
                self._initialized = True
    
    def _get_collection_name(self, bot_id: str) -> str:
        """Generate collection name for a bot"""
        return f"bot_{bot_id}"
    
    async def verify_bot_access(self, bot_id: str, user_id: Optional[str], token: str = None) -> dict:
        """Verify user has access to the bot"""
        from ..log_config import logger
        try:
            logger.info(f"Verifying access for bot {bot_id} and user {user_id}")
            
            # Skip ownership check for anonymous users (public widget access)
            if user_id is None:
                logger.info(f"Anonymous access - skipping ownership check for bot {bot_id}")
                return {"bot_id": bot_id}  # Return minimal bot info
            
            # Get all user's bots first
            bots = await self.auth_service.get_user_bots(user_id, token)
            logger.info(f"Found {len(bots)} bots for user. Bot IDs: {[b.get('id', 'N/A') for b in bots]}")
            
            # We need to look for bot_id in the 'bot_id' field and handle potential UUID formatting
            # Try both bot_id and id fields for matching, and normalize UUIDs
            matching_bot = next(
                (bot for bot in bots if 
                 str(bot.get('bot_id', '')).replace('-', '').lower() == str(bot_id).replace('-', '').lower() or
                 str(bot.get('id', '')).replace('-', '').lower() == str(bot_id).replace('-', '').lower()
                ), None)
            
            if not matching_bot:
                logger.error(f"Bot {bot_id} not found in user's bots. Available bots: {[b.get('bot_id', 'N/A') for b in bots]}")
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied for this bot"
                )
                
            logger.info(f"Access verified for bot {bot_id}. Bot details: {matching_bot}")
            return matching_bot
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error during bot access verification: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error verifying bot access: {str(e)}"
            )

    async def get_bot_documents(self, bot_id: str, user_id: str, token: str = None) -> dict:
        """Get all documents associated with a bot from the vector store"""
        from ..log_config import logger
        try:
            # Verify bot access
            await self.verify_bot_access(bot_id, user_id, token)
            
            # Get the collection name for this bot
            collection_name = self._get_collection_name(bot_id)
            logger.info(f"Looking for documents in collection: {collection_name}")
            
            # Get collection info from Qdrant
            collection_info = self.vector_store.get_collection_info(collection_name)
            
            if not collection_info:
                logger.info(f"No collection found for bot {bot_id}")
                return {"documents": []}
            
            try:
                # Use Qdrant's scroll API to get document metadata
                scroll_result = self.vector_store.scroll_collection(collection_name, limit=100)
                points = scroll_result.get("points", [])
                
                if not points:
                    logger.info(f"No documents found in collection {collection_name}")
                    return {"documents": []}
                
                # Group points by filename to create document summaries
                file_groups = {}
                for point in points:
                    payload = point.get("payload", {})
                    filename = payload.get("filename", "unknown_document.txt")
                    
                    if filename not in file_groups:
                        file_groups[filename] = {
                            "chunks": [],
                            "total_length": 0,
                            "original_file_size": payload.get("original_file_size", 0),
                            "created_at": payload.get("created_at", datetime.now().isoformat())
                        }
                    
                    file_groups[filename]["chunks"].append(payload.get("text", ""))
                    file_groups[filename]["total_length"] += payload.get("chunk_length", 0)
                
                # Create document entries
                documents = []
                for i, (filename, data) in enumerate(file_groups.items()):
                    # Use original file size if available, otherwise use sum of chunk lengths
                    file_size = data["original_file_size"] if data["original_file_size"] > 0 else data["total_length"]
                    
                    # Create preview text from first chunk
                    preview_text = ""
                    if data["chunks"]:
                        preview_text = data["chunks"][0][:100] + "..." if len(data["chunks"][0]) > 100 else data["chunks"][0]
                    
                    documents.append({
                        "id": str(i),
                        "bot_id": bot_id,
                        "filename": filename,
                        "file_size": file_size,
                        "created_at": data["created_at"],
                        "text": preview_text,
                        "chunk_count": len(data["chunks"])
                    })
                
                logger.info(f"Successfully retrieved {len(documents)} documents for bot {bot_id}")
                return {"documents": documents}
                
            except Exception as e:
                logger.error(f"Error getting documents from Qdrant for bot {bot_id}: {str(e)}")
                # Fallback: return basic collection info
                stats = self.vector_store.get_collection_stats(collection_name)
                documents = [{
                    "id": "collection_info",
                    "bot_id": bot_id,
                    "filename": f"Documents ({stats.get('total_points', 0)} chunks)",
                    "file_size": stats.get("total_points", 0) * 500,  # Estimate
                    "created_at": datetime.now().isoformat(),
                    "text": f"This bot contains {stats.get('total_points', 0)} text chunks from uploaded documents.",
                    "chunk_count": stats.get("total_points", 0)
                }]
                return {"documents": documents}
                
        except Exception as e:
            logger.error(f"Error in get_bot_documents: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error retrieving documents: {str(e)}"
            )
    
    async def get_response(self, bot_id: str, user_id: Optional[str], query: str, token: str = None) -> str:
        """Get response from Gemini based on context from vector store"""
        try:
            # Verify bot access
            bot = await self.verify_bot_access(bot_id, user_id, token)
            collection_name = self._get_collection_name(bot_id)
            
            # Get relevant context from vector store
            results = self.vector_store.search(collection_name, query, limit=3)
            
            if not results:
                return "I don't have any relevant information to answer your question."
            
            # Extract and format context chunks with relevance scores
            context_chunks = []
            for result in results:
                if result["score"] > 0.3:  # Relevance threshold
                    context_chunks.append(result["text"])
            
            if not context_chunks:
                return "I found some related information, but it wasn't relevant enough to provide a good answer."
            
            # Format context and create prompt
            context = "\n\n".join(f"- {chunk}" for chunk in context_chunks)
            bot_name = bot.get('name', 'an AI assistant')  # Default name if not provided
            prompt = f"""Based on the following excerpts from a document, please answer the user's question.
            You are {bot_name}, a helpful AI assistant.
            Only use information from the provided context.
            If the context doesn't contain relevant information, say so.
            Keep your response concise and focused on the question.
            
            Context:
            {context}
            
            User Question: {query}"""
            
            try:
                # Get response from AI service
                response_text = await self.ai_service.generate_response(prompt)
                if not response_text:
                    return "I apologize, but I'm having trouble generating a response right now. Please try again."
                return response_text
            except Exception as e:
                return "I apologize, but I'm having trouble generating a response at the moment. Please try again later."
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error generating response: {str(e)}"
            )
    
    async def process_documents(self, bot_id: str, user_id: str, texts: List[str], filenames: List[str] = None, file_sizes: List[int] = None):
        """Process and store document chunks in vector store"""
        try:
            # Skip access verification during initial document upload
            # The bot was just created in the upload endpoint
            collection_name = self._get_collection_name(bot_id)
            
            # Create collection if it doesn't exist
            try:
                self.vector_store.create_collection(collection_name)
                logger.info(f"Created new collection {collection_name}")
            except Exception as e:
                if "already exists" not in str(e).lower():
                    logger.error(f"Error creating collection {collection_name}: {str(e)}")
                    raise
                logger.info(f"Collection {collection_name} already exists")
            
            # Prepare metadata for each text chunk
            metadata = []
            for i, text in enumerate(texts):
                chunk_metadata = {
                    "bot_id": bot_id,
                    "user_id": user_id,
                    "chunk_index": i,
                    "chunk_length": len(text),
                }
                
                # Add filename if provided
                if filenames and i < len(filenames):
                    chunk_metadata["filename"] = filenames[i]
                elif filenames and len(filenames) == 1:
                    # Single file, all chunks belong to it
                    chunk_metadata["filename"] = filenames[0]
                else:
                    chunk_metadata["filename"] = f"document_chunk_{i}"
                
                # Add original file size if provided
                if file_sizes and i < len(file_sizes):
                    chunk_metadata["original_file_size"] = file_sizes[i]
                
                metadata.append(chunk_metadata)
                
            # Store chunks in vector store with retry
            max_retries = 3
            retry_delay = 1  # seconds
            last_error = None
            
            for attempt in range(max_retries):
                try:
                    self.vector_store.add_texts(collection_name, texts, metadata)
                    logger.info(f"Successfully added {len(texts)} texts to collection {collection_name}")
                    return
                except Exception as e:
                    last_error = e
                    if attempt < max_retries - 1:
                        logger.warning(f"Attempt {attempt + 1} failed, retrying in {retry_delay} seconds: {str(e)}")
                        await asyncio.sleep(retry_delay)
                        retry_delay *= 2
                    
            raise last_error
            
        except Exception as e:
            logger.error(f"Error processing documents: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error processing documents: {str(e)}"
            )
