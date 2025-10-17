# Qdrant Migration Guide

This guide will help you migrate from FAISS to Qdrant for vector storage in your chatbot application.

## What Changed

- **Vector Database**: Migrated from FAISS (file-based) to Qdrant (server-based)
- **Benefits**: 
  - Better scalability and performance
  - Built-in metadata support
  - RESTful API
  - Better concurrent access handling
  - Cloud deployment options

## Setup Instructions

### Option 1: Local Qdrant with Docker (Recommended)

1. **Start Qdrant using Docker Compose:**
   ```bash
   docker-compose up -d qdrant
   ```

2. **Verify Qdrant is running:**
   ```bash
   curl http://localhost:6333/health
   ```
   You should see: `{"title":"qdrant - vector search engine","version":"1.x.x"}`

### Option 2: Local Qdrant Binary

1. **Download and install Qdrant:**
   ```bash
   # On macOS with Homebrew
   brew install qdrant
   
   # Or download from GitHub releases
   # https://github.com/qdrant/qdrant/releases
   ```

2. **Start Qdrant:**
   ```bash
   qdrant
   ```

### Option 3: Qdrant Cloud

1. **Sign up for Qdrant Cloud:** https://cloud.qdrant.io/
2. **Create a cluster and get your credentials**
3. **Update your .env file with cloud credentials:**
   ```env
   QDRANT_URL=https://your-cluster-url.qdrant.io
   QDRANT_API_KEY=your-api-key
   ```

## Environment Configuration

Update your `.env` file with Qdrant settings:

```env
# For local Qdrant (default)
QDRANT_HOST=localhost
QDRANT_PORT=6333
QDRANT_API_KEY=

# For Qdrant Cloud (alternative)
QDRANT_URL=https://your-cluster-url.qdrant.io
QDRANT_API_KEY=your-api-key
```

## Migration from FAISS

If you have existing FAISS data, run the migration script:

```bash
cd backend
python migrate_to_qdrant.py
```

This will:
1. Read your existing FAISS indices and metadata
2. Create corresponding collections in Qdrant
3. Migrate all vectors and metadata
4. Backup your old FAISS files

To verify the migration:
```bash
python migrate_to_qdrant.py verify
```

## Install Dependencies

Update your Python dependencies:

```bash
cd backend
pip install -r requirements.txt
```

## Start the Application

1. **Make sure Qdrant is running** (see setup options above)

2. **Start the backend:**
   ```bash
   cd backend
   uvicorn main:app --reload --port 8000
   ```

3. **Start the frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

## Verification

1. **Check Qdrant dashboard:** http://localhost:6333/dashboard
2. **Test document upload** in your application
3. **Test chat functionality** to ensure vector search works

## Troubleshooting

### Connection Issues

If you get connection errors:

1. **Check if Qdrant is running:**
   ```bash
   curl http://localhost:6333/health
   ```

2. **Check Docker logs:**
   ```bash
   docker-compose logs qdrant
   ```

3. **Verify environment variables** in your `.env` file

### Performance Issues

- **Local setup**: Qdrant should be faster than FAISS for most operations
- **Memory usage**: Qdrant uses memory more efficiently
- **Concurrent access**: Much better than FAISS file locking

### Migration Issues

If migration fails:
1. Check the logs for specific error messages
2. Ensure Qdrant is running and accessible
3. Verify your old FAISS files are not corrupted
4. Try migrating collections one by one

## Monitoring

You can monitor your Qdrant instance:

1. **Web UI**: http://localhost:6333/dashboard
2. **Metrics**: http://localhost:6333/metrics
3. **Collections API**: http://localhost:6333/collections

## Backup and Recovery

### Backup
```bash
# Create a snapshot
curl -X POST http://localhost:6333/snapshots

# Download the snapshot
curl http://localhost:6333/snapshots/snapshot-name.snapshot -o backup.snapshot
```

### Recovery
```bash
# Upload and restore snapshot
curl -X PUT http://localhost:6333/snapshots/upload \
  -H "Content-Type: application/octet-stream" \
  --data-binary @backup.snapshot
```

## Production Considerations

1. **Use Qdrant Cloud** for production deployments
2. **Set up proper authentication** with API keys
3. **Configure resource limits** based on your data size
4. **Set up monitoring and alerting**
5. **Regular backups** of your collections

## Support

- **Qdrant Documentation**: https://qdrant.tech/documentation/
- **Qdrant Discord**: https://discord.gg/qdrant
- **GitHub Issues**: https://github.com/qdrant/qdrant/issues