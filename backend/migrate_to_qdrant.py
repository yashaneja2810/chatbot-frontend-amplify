#!/usr/bin/env python3
"""
Migration script to move data from FAISS to Qdrant.
This script will read existing FAISS indices and metadata files and migrate them to Qdrant.
"""

import os
import pickle
import logging
from pathlib import Path
from typing import List, Dict
import asyncio

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def migrate_faiss_to_qdrant():
    """Migrate existing FAISS data to Qdrant"""
    
    # Import here to avoid circular imports
    from app.services.vector_store import VectorStoreService
    
    # Initialize the new Qdrant vector store
    vector_store = VectorStoreService()
    
    # Path to old FAISS indices
    indices_dir = Path("indices")
    
    if not indices_dir.exists():
        logger.info("No indices directory found. Nothing to migrate.")
        return
    
    # Find all metadata files (they contain the text data)
    meta_files = list(indices_dir.glob("*.meta"))
    
    if not meta_files:
        logger.info("No metadata files found. Nothing to migrate.")
        return
    
    logger.info(f"Found {len(meta_files)} collections to migrate")
    
    migrated_count = 0
    failed_count = 0
    
    for meta_file in meta_files:
        collection_name = meta_file.stem  # Remove .meta extension
        logger.info(f"Migrating collection: {collection_name}")
        
        try:
            # Load metadata and texts from FAISS format
            with open(meta_file, 'rb') as f:
                stored_data = pickle.load(f)
            
            if not isinstance(stored_data, dict) or "texts" not in stored_data:
                logger.error(f"Invalid metadata format in {meta_file}")
                failed_count += 1
                continue
            
            texts = stored_data["texts"]
            metadata = stored_data.get("metadata", [])
            
            if not texts:
                logger.warning(f"No texts found in {collection_name}")
                continue
            
            # Ensure metadata list has same length as texts
            while len(metadata) < len(texts):
                metadata.append({})
            
            # Create collection in Qdrant
            vector_store.create_collection(collection_name)
            
            # Add texts to Qdrant with enhanced metadata
            enhanced_metadata = []
            for i, (text, meta) in enumerate(zip(texts, metadata)):
                enhanced_meta = {
                    "migrated_from_faiss": True,
                    "original_index": i,
                    **meta  # Include original metadata
                }
                enhanced_metadata.append(enhanced_meta)
            
            vector_store.add_texts(collection_name, texts, enhanced_metadata)
            
            logger.info(f"Successfully migrated {len(texts)} texts from {collection_name}")
            migrated_count += 1
            
            # Optionally backup the old files
            backup_dir = indices_dir / "faiss_backup"
            backup_dir.mkdir(exist_ok=True)
            
            # Move old files to backup
            meta_file.rename(backup_dir / meta_file.name)
            
            # Also move corresponding index file if it exists
            index_file = indices_dir / f"{collection_name}.index"
            if index_file.exists():
                index_file.rename(backup_dir / index_file.name)
            
            logger.info(f"Backed up old FAISS files for {collection_name}")
            
        except Exception as e:
            logger.error(f"Failed to migrate {collection_name}: {str(e)}")
            failed_count += 1
            continue
    
    logger.info(f"Migration completed. Migrated: {migrated_count}, Failed: {failed_count}")
    
    if migrated_count > 0:
        logger.info("Old FAISS files have been moved to indices/faiss_backup/")
        logger.info("You can delete the backup directory once you've verified the migration.")

def verify_migration():
    """Verify that the migration was successful"""
    from app.services.vector_store import VectorStoreService
    
    vector_store = VectorStoreService()
    collections = vector_store.list_collections()
    
    logger.info(f"Found {len(collections)} collections in Qdrant:")
    
    for collection_name in collections:
        info = vector_store.get_collection_info(collection_name)
        if info:
            logger.info(f"  - {collection_name}: {info['points_count']} points")
        else:
            logger.warning(f"  - {collection_name}: Could not get info")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "verify":
        verify_migration()
    else:
        print("Starting migration from FAISS to Qdrant...")
        print("Make sure Qdrant is running before proceeding.")
        print("Press Enter to continue or Ctrl+C to cancel...")
        
        try:
            input()
        except KeyboardInterrupt:
            print("\nMigration cancelled.")
            sys.exit(0)
        
        migrate_faiss_to_qdrant()
        
        print("\nRunning verification...")
        verify_migration()
        
        print("\nMigration completed!")
        print("To verify the migration worked correctly, run:")
        print("python migrate_to_qdrant.py verify")