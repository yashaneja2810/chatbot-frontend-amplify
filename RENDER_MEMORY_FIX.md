# Render Memory Fix - Out of Memory Error

## Problem
```
==> Out of memory (used over 512Mi)
```

The sentence-transformers model (`all-MiniLM-L6-v2`) is ~90MB and uses too much memory during loading on Render's free tier (512MB RAM limit).

## Solutions

### Option 1: Upgrade to Paid Plan (RECOMMENDED)
**Cost**: $7/month
**Benefits**: 
- 512MB → 2GB RAM
- No spin-down after inactivity
- Better performance

**Steps**:
1. Go to Render Dashboard
2. Your service → Settings
3. Upgrade to "Starter" plan ($7/month)
4. Redeploy

This is the best solution for production.

### Option 2: Optimize Memory Usage (FREE)

Modify the backend to lazy-load the model only when needed.

#### Update `backend/app/services/vector_store.py`:

Find the `__init__` method and change it to lazy loading:

```python
def __init__(self):
    # Singleton pattern - only initialize once
    if self._initialized:
        return
    
    # Don't load model immediately - load on first use
    self.model = None
    self._model_name = 'all-MiniLM-L6-v2'
    
    # Initialize Qdrant client
    if settings.QDRANT_URL:
        self.client = QdrantClient(
            url=settings.QDRANT_URL,
            api_key=settings.QDRANT_API_KEY,
            timeout=30
        )
        logger.info(f"Connected to Qdrant cloud instance: {settings.QDRANT_URL}")
    else:
        self.client = QdrantClient(
            host=settings.QDRANT_HOST,
            port=settings.QDRANT_PORT,
            timeout=30
        )
        logger.info(f"Connected to Qdrant at {settings.QDRANT_HOST}:{settings.QDRANT_PORT}")
    
    self._initialized = True

def _ensure_model_loaded(self):
    """Lazy load the model only when needed"""
    if self.model is None:
        logger.info(f"Loading SentenceTransformer model: {self._model_name}")
        self.model = SentenceTransformer(self._model_name)
        logger.info(f"Successfully loaded model")
```

Then update methods that use `self.model` to call `self._ensure_model_loaded()` first.

### Option 3: Use Smaller Model (FREE)

Use a smaller embedding model that uses less memory.

Change in `backend/app/services/vector_store.py`:

```python
# Instead of 'all-MiniLM-L6-v2' (90MB)
model_name = 'paraphrase-MiniLM-L3-v2'  # Only 60MB
```

### Option 4: Disable Model Pre-loading (FREE)

Comment out the model loading in `__init__` and only load when actually needed for document processing.

## Quick Fix for Now

**Upgrade to Starter Plan** - This is the simplest and most reliable solution.

1. Render Dashboard → Your Service
2. Settings → Instance Type
3. Select "Starter" ($7/month)
4. Save
5. Redeploy

## Why This Happens

Render's free tier has:
- 512MB RAM
- Shared CPU
- Limited resources

The sentence-transformers model + FastAPI + dependencies exceed this limit.

## Verification

After applying fix:
- Check Render logs
- Should see "Application startup complete"
- No "Out of memory" errors
- Backend responds to requests

## Alternative: Use Different Hosting

If you want to stay free:
- **Railway**: 512MB RAM but better memory management
- **Fly.io**: 256MB RAM but more efficient
- **PythonAnywhere**: Free tier with 512MB

But Render Starter ($7/month) is the best value for production.

## Recommended Action

**Upgrade to Render Starter Plan** - It's only $7/month and gives you:
- 2GB RAM (plenty for your app)
- No spin-down
- Better performance
- SSL included
- Worth it for a production app

Your frontend is already live on Vercel (free), so you only need to pay for backend hosting.

## Total Cost

- Frontend (Vercel): **$0/month** ✅
- Backend (Render Starter): **$7/month**
- **Total: $7/month** for a production-ready AI chatbot platform!

That's very reasonable for what you're getting.
