# 🚀 Deploy Now - Quick Commands

## Step 1: Clean and Commit (2 min)

```bash
# Clean frontend dependencies
cd frontend
rm -rf node_modules package-lock.json
npm install
cd ..

# Test build locally (optional but recommended)
cd frontend
npm run build
cd ..

# Commit all changes
git add .
git commit -m "Ready for deployment - Fixed dependencies"
git push origin main
```

## Step 2: Deploy Backend on Render (5 min)

1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repo
4. **Settings:**
   - Name: `botforge-backend`
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

5. **Environment Variables:**
```
GOOGLE_API_KEY=your_google_api_key
JWT_SECRET=your_random_secret_here
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
QDRANT_URL=https://your-qdrant.cloud.qdrant.io:6333
QDRANT_API_KEY=your_qdrant_api_key
FRONTEND_URL=https://your-app.vercel.app
PYTHON_VERSION=3.11.0
```

6. Click "Create Web Service"
7. **Copy your backend URL**: `https://botforge-backend.onrender.com`

## Step 3: Deploy Frontend on Vercel (3 min)

1. Go to https://vercel.com
2. Click "Add New" → "Project"
3. Import your GitHub repo
4. **Settings:**
   - Root Directory: `frontend`
   - Framework: Vite (auto-detected)

5. **Environment Variables:**
```
VITE_API_URL=https://your-backend.onrender.com
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

6. Click "Deploy"
7. **Copy your frontend URL**: `https://your-app.vercel.app`

## Step 4: Update Backend (2 min)

1. Go back to Render
2. Your service → Environment
3. Update `FRONTEND_URL` with your Vercel URL
4. Save (auto-redeploys)

## Step 5: Configure Supabase (2 min)

1. Supabase Dashboard → Authentication → URL Configuration
2. Add your Vercel URL to:
   - Site URL
   - Redirect URLs

## Step 6: Test! ✅

Visit your Vercel URL and test:
- Login/Signup
- Create bot
- Upload document
- Chat with bot

## 🎉 Done!

Your app is live!

## 📝 Save These URLs

- **Frontend**: `_______________________`
- **Backend**: `_______________________`

## ⚠️ Troubleshooting

**Vercel build still failing?**
```bash
# Try this locally first
cd frontend
npm install --legacy-peer-deps
npm run build
```

**Backend not responding?**
- Wait 2-3 minutes for first deployment
- Check Render logs
- Verify all environment variables

**Can't login?**
- Check Supabase redirect URLs
- Verify VITE_SUPABASE_URL matches
- Check browser console

## 🔄 Update Your App

```bash
git add .
git commit -m "Update"
git push
```

Both platforms auto-deploy!

## 💡 Pro Tips

1. **Render Free Tier** spins down after 15 min inactivity
   - First request after spin-down takes ~30 seconds
   - Upgrade to $7/month to avoid this

2. **Vercel** deploys are instant
   - Every push triggers a new deployment
   - Preview deployments for branches

3. **Environment Variables**
   - Changes require redeployment
   - Render: Auto-redeploys on env change
   - Vercel: Need to redeploy manually

## 📚 Need Help?

- Detailed guide: `DEPLOYMENT.md`
- Checklist: `DEPLOYMENT_CHECKLIST.md`
- Vercel fix: `VERCEL_FIX.md`

Good luck! 🚀
