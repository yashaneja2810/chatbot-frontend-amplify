# How to Revert to Larger Model

## What Was Changed

**File**: `backend/app/services/vector_store.py`
**Line**: ~42

### Current (Smaller Model for Testing)
```python
model_name = 'paraphrase-MiniLM-L3-v2'  # 61MB
```

### Original (Better Quality)
```python
model_name = 'all-MiniLM-L6-v2'  # 90MB
```

## When to Revert

Revert to the larger model when you:
1. Upgrade to Render Starter plan ($7/month with 2GB RAM)
2. Move to a different hosting with more memory
3. Want better embedding quality

## How to Revert

### Option 1: Manual Edit
1. Open `backend/app/services/vector_store.py`
2. Find line ~42 (search for `model_name =`)
3. Change:
   ```python
   model_name = 'paraphrase-MiniLM-L3-v2'
   ```
   To:
   ```python
   model_name = 'all-MiniLM-L6-v2'
   ```
4. Save, commit, and push

### Option 2: Using Git
```bash
# Find the exact line
git diff HEAD~1 backend/app/services/vector_store.py

# Or revert just this change
# (after you've upgraded Render)
```

## Model Comparison

| Model | Size | Quality | RAM Usage |
|-------|------|---------|-----------|
| paraphrase-MiniLM-L3-v2 | 61MB | Good | ~300MB |
| all-MiniLM-L6-v2 | 90MB | Better | ~450MB |

## Impact

**Smaller Model (Current)**:
- ✅ Fits in Render free tier
- ✅ Faster loading
- ⚠️ Slightly less accurate embeddings

**Larger Model (Original)**:
- ✅ Better quality embeddings
- ✅ More accurate search results
- ❌ Requires more RAM

For testing, the smaller model works fine!

## After Upgrading Render

1. Upgrade to Starter plan
2. Revert the model change
3. Redeploy
4. Enjoy better quality! 🎉
