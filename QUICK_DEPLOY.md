# Quick Deployment Guide

## 🚀 Deploy in 15 Minutes

### Step 1: Push to GitHub (2 min)
```bash
git init
git add .
git commit -m "Ready for deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/botforge.git
git push -u origin main
```

### Step 2: Deploy Backend on Render (5 min)

1. Go to https://render.com → Sign in
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repo
4. Settings:
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add Environment Variables (click "Advanced"):
   ```
   GOOGLE_API_KEY=your_key
   JWT_SECRET=any_random_string_here
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_key
   QDRANT_URL=your_qdrant_url
   QDRANT_API_KEY=your_qdrant_key
   FRONTEND_URL=https://your-app.vercel.app
   ```
6. Click **"Create Web Service"**
7. **Copy your backend URL** (e.g., `https://botforge-backend.onrender.com`)

### Step 3: Deploy Frontend on Vercel (3 min)

1. Go to https://vercel.com → Sign in
2. Click **"Add New"** → **"Project"**
3. Import your GitHub repo
4. Settings:
   - Root Directory: `frontend`
   - Framework: Vite (auto-detected)
5. Add Environment Variables:
   ```
   VITE_API_URL=https://your-backend-url.onrender.com
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_key
   ```
6. Click **"Deploy"**
7. **Copy your frontend URL** (e.g., `https://botforge.vercel.app`)

### Step 4: Update Backend (2 min)

1. Go back to Render dashboard
2. Go to your service → **Environment**
3. Update `FRONTEND_URL` with your actual Vercel URL
4. Click **"Save Changes"** (will auto-redeploy)

### Step 5: Configure Supabase (2 min)

1. Go to your Supabase project
2. **Authentication** → **URL Configuration**
3. Add your Vercel URL to:
   - Site URL
   - Redirect URLs

### Step 6: Test! (1 min)

Visit your Vercel URL and test:
- ✅ Login
- ✅ Create bot
- ✅ Upload document
- ✅ Chat with bot

## 🎉 Done!

Your app is now live at: `https://your-app.vercel.app`

## 📝 Important URLs

Save these for reference:
- **Frontend**: `_______________________`
- **Backend**: `_______________________`
- **Supabase**: `_______________________`
- **Qdrant**: `_______________________`

## ⚠️ Common Issues

**Backend not responding?**
- Check Render logs
- Verify all environment variables are set
- Wait 2-3 minutes for first deployment

**Frontend can't connect to backend?**
- Verify `VITE_API_URL` is correct
- Check browser console for errors
- Ensure backend is running

**Authentication not working?**
- Verify Supabase URLs match
- Check Supabase dashboard for auth logs
- Ensure redirect URLs are configured

## 🔄 Updating Your App

Just push to GitHub:
```bash
git add .
git commit -m "Update"
git push
```

Both Render and Vercel will auto-deploy!

## 💰 Cost

- **Render Free**: 750 hours/month (enough for testing)
- **Vercel Free**: 100GB bandwidth/month
- **Total**: $0/month for testing

For production, upgrade Render to $7/month to avoid spin-down.

## 📚 Need More Help?

See `DEPLOYMENT.md` for detailed guide.
