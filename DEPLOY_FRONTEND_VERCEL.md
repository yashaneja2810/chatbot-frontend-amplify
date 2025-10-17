# Deploy Frontend to Vercel - Step by Step

## ⚠️ CRITICAL: Set Root Directory First!

Your repo has both frontend and backend. Vercel needs to know to ONLY build the frontend.

## Step-by-Step Instructions

### 1. Go to Vercel (2 min)

1. Visit https://vercel.com
2. Sign in with GitHub
3. Click **"Add New"** → **"Project"**
4. Find and select your repository

### 2. Configure Project Settings (CRITICAL!)

**BEFORE clicking Deploy, configure these:**

#### Root Directory
- Click **"Edit"** next to Root Directory
- Enter: `frontend`
- This tells Vercel to only look at the frontend folder

#### Framework Preset
- Should auto-detect as **Vite**
- If not, select **Vite** from dropdown

#### Build Settings (should auto-fill)
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

### 3. Add Environment Variables

Click **"Environment Variables"** and add:

```
Name: VITE_API_URL
Value: https://your-backend.onrender.com

Name: VITE_SUPABASE_URL
Value: https://your-project.supabase.co

Name: VITE_SUPABASE_ANON_KEY
Value: your_supabase_anon_key
```

**Important**: Replace the values with your actual URLs and keys!

### 4. Deploy!

1. Click **"Deploy"**
2. Wait 2-3 minutes
3. You'll see:
   - ✅ Installing dependencies
   - ✅ Building application
   - ✅ Deployment ready

### 5. Get Your URL

After deployment:
- Copy your Vercel URL (e.g., `https://botforge.vercel.app`)
- Save it - you'll need it for backend configuration

### 6. Update Backend

Go to Render and update the `FRONTEND_URL` environment variable with your Vercel URL.

## Troubleshooting

### "ModuleNotFoundError: No module named 'distutils'"

**Problem**: Vercel is trying to build Python backend

**Solution**: 
1. Go to Project Settings → General
2. Set Root Directory to `frontend`
3. Save and redeploy

### "Build failed" or "Command not found"

**Problem**: Wrong build settings

**Solution**:
1. Settings → General → Build & Development Settings
2. Framework: Vite
3. Build Command: `npm run build`
4. Output Directory: `dist`

### "Environment variable not defined"

**Problem**: Missing environment variables

**Solution**:
1. Settings → Environment Variables
2. Add all three VITE_* variables
3. Redeploy

### Site loads but API calls fail

**Problem**: Wrong API URL

**Solution**:
1. Check `VITE_API_URL` matches your Render backend URL
2. Ensure backend is running
3. Check browser console for errors

## Verification Checklist

After deployment, verify:
- [ ] Site loads at your Vercel URL
- [ ] No console errors (F12 → Console)
- [ ] Can navigate to login page
- [ ] Login form appears
- [ ] No "API connection" errors

## Next Steps

After successful deployment:
1. Test login/signup
2. Create a test bot
3. Upload a document
4. Test chat functionality

## Pro Tips

### Custom Domain (Optional)
1. Settings → Domains
2. Add your domain
3. Follow DNS instructions

### Automatic Deployments
- Every push to `main` branch auto-deploys
- Preview deployments for other branches
- Rollback anytime from Deployments tab

### Performance
- Vercel automatically optimizes your build
- Global CDN for fast loading
- Automatic HTTPS

## Summary

**Key Setting**: Root Directory = `frontend`

This is the most important configuration. Without it, Vercel will try to build the Python backend and fail.

## Need Help?

- Detailed troubleshooting: `VERCEL_SETUP_FIX.md`
- Full deployment guide: `DEPLOYMENT.md`
- Quick commands: `DEPLOY_NOW.md`

---

**Remember**: Set Root Directory to `frontend` BEFORE deploying!
