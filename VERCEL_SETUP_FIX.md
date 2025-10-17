# Vercel Setup Fix - Important!

## Problem
Vercel is trying to build the backend (Python) instead of just the frontend (React).

## Solution
Configure Vercel to ONLY build the frontend directory.

## Steps to Fix

### Option 1: Configure in Vercel Dashboard (RECOMMENDED)

1. Go to your Vercel project dashboard
2. Click **Settings** → **General**
3. Scroll to **Root Directory**
4. Set it to: `frontend`
5. Click **Save**
6. Go to **Deployments** → Click **Redeploy**

This is the BEST solution - it tells Vercel to only look at the frontend folder.

### Option 2: Use .vercelignore (Already Done)

I've created `.vercelignore` to tell Vercel to ignore backend files.

### Option 3: Delete and Recreate Project

If the above doesn't work:

1. **Delete the Vercel project**
2. **Create new project**
3. **IMPORTANT**: When importing, set:
   - Root Directory: `frontend`
   - Framework: Vite (auto-detected)
   - Build Command: `npm run build`
   - Output Directory: `dist`

## Environment Variables (Don't Forget!)

After fixing the root directory, add these in Vercel:

```
VITE_API_URL=https://your-backend.onrender.com
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Verification

After redeployment:
- ✅ Build should complete in ~2 minutes
- ✅ No Python errors
- ✅ Only npm/vite logs
- ✅ Site loads correctly

## Why This Happened

Your repo has both `frontend/` and `backend/` folders. Vercel detected Python files and tried to build them. By setting the root directory to `frontend`, Vercel only sees the React app.

## Quick Fix Commands

```bash
# Commit the .vercelignore file
git add .vercelignore frontend/vercel.json
git commit -m "Fix: Configure Vercel to only build frontend"
git push
```

Then go to Vercel dashboard and set Root Directory to `frontend`.

## Alternative: Separate Repos (Future)

For cleaner deployment, consider:
- Repo 1: `botforge-frontend` (deploy to Vercel)
- Repo 2: `botforge-backend` (deploy to Render)

But for now, just set the Root Directory in Vercel settings!

## Need Help?

If still having issues:
1. Check Vercel build logs
2. Verify Root Directory is set to `frontend`
3. Ensure environment variables are set
4. Try redeploying

The key is: **Root Directory = `frontend`** in Vercel settings!
