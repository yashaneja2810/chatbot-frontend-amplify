# Deployment Guide

This guide will help you deploy the BotForge application with the backend on Render and frontend on Vercel.

## Prerequisites

- GitHub account
- Render account (https://render.com)
- Vercel account (https://vercel.com)
- Supabase project
- Qdrant Cloud account
- Google AI API key

## Part 1: Backend Deployment (Render)

### Step 1: Prepare Your Repository

1. Push your code to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### Step 2: Deploy on Render

1. Go to https://render.com and sign in
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `botforge-backend`
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Step 3: Set Environment Variables

In Render dashboard, go to "Environment" and add these variables:

```
GOOGLE_API_KEY=your_google_api_key
JWT_SECRET=your_random_secret_key_here
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
QDRANT_URL=https://your-qdrant-instance.cloud.qdrant.io:6333
QDRANT_API_KEY=your_qdrant_api_key
FRONTEND_URL=https://your-app.vercel.app
PYTHON_VERSION=3.11.0
```

### Step 4: Deploy

1. Click "Create Web Service"
2. Wait for deployment to complete (5-10 minutes)
3. Note your backend URL: `https://botforge-backend.onrender.com`

## Part 2: Frontend Deployment (Vercel)

### Step 1: Deploy on Vercel

1. Go to https://vercel.com and sign in
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Step 2: Set Environment Variables

In Vercel dashboard, go to "Settings" → "Environment Variables" and add:

```
VITE_API_URL=https://botforge-backend.onrender.com
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Step 3: Deploy

1. Click "Deploy"
2. Wait for deployment to complete (2-3 minutes)
3. Note your frontend URL: `https://your-app.vercel.app`

### Step 4: Update Backend CORS

Go back to Render and update the `FRONTEND_URL` environment variable with your actual Vercel URL.

## Part 3: Post-Deployment Configuration

### Update Supabase Settings

1. Go to your Supabase project dashboard
2. Navigate to "Authentication" → "URL Configuration"
3. Add your Vercel URL to "Site URL"
4. Add your Vercel URL to "Redirect URLs"

### Test Your Deployment

1. Visit your Vercel URL
2. Try to sign up/login
3. Create a test bot
4. Upload a document
5. Test the chat functionality

## Troubleshooting

### Backend Issues

**Problem**: Build fails on Render
- Check Python version in `runtime.txt`
- Verify all dependencies in `requirements.txt`
- Check Render logs for specific errors

**Problem**: App crashes on startup
- Verify all environment variables are set
- Check that Qdrant and Supabase credentials are correct
- Review Render logs

### Frontend Issues

**Problem**: API calls fail
- Verify `VITE_API_URL` is set correctly
- Check browser console for CORS errors
- Ensure backend is running

**Problem**: Build fails on Vercel
- Check Node.js version compatibility
- Verify all dependencies in `package.json`
- Review Vercel build logs

### Common Issues

**Problem**: Authentication not working
- Verify Supabase URL and keys match in both frontend and backend
- Check Supabase dashboard for authentication logs
- Ensure JWT_SECRET is set in backend

**Problem**: Bot creation fails
- Verify Qdrant credentials
- Check Qdrant dashboard for connection issues
- Review backend logs for errors

**Problem**: Document upload fails
- Check file size limits (Render free tier has limits)
- Verify Google AI API key is valid
- Check backend logs for processing errors

## Monitoring

### Render
- View logs: Dashboard → Your Service → Logs
- Monitor metrics: Dashboard → Your Service → Metrics

### Vercel
- View logs: Dashboard → Your Project → Deployments → View Function Logs
- Monitor analytics: Dashboard → Your Project → Analytics

## Updating Your Deployment

### Backend Updates
```bash
git add .
git commit -m "Update backend"
git push origin main
```
Render will automatically redeploy.

### Frontend Updates
```bash
git add .
git commit -m "Update frontend"
git push origin main
```
Vercel will automatically redeploy.

## Cost Considerations

### Free Tier Limits

**Render Free Tier:**
- 750 hours/month
- Spins down after 15 minutes of inactivity
- 512 MB RAM
- Shared CPU

**Vercel Free Tier:**
- 100 GB bandwidth/month
- Unlimited deployments
- Automatic HTTPS

**Recommendations:**
- Use Render's paid plan ($7/month) for production to avoid spin-down
- Monitor Vercel bandwidth usage
- Consider upgrading Qdrant if you have many bots

## Security Best Practices

1. **Never commit `.env` files** - Use environment variables
2. **Rotate secrets regularly** - Update JWT_SECRET, API keys
3. **Use HTTPS only** - Both Render and Vercel provide this
4. **Monitor logs** - Check for suspicious activity
5. **Keep dependencies updated** - Run `npm audit` and `pip check`

## Support

If you encounter issues:
1. Check the logs first
2. Review this guide
3. Check Render/Vercel documentation
4. Verify all environment variables are set correctly

## Next Steps

After successful deployment:
1. Set up custom domain (optional)
2. Configure monitoring and alerts
3. Set up backup strategy for Supabase
4. Implement rate limiting (if needed)
5. Add analytics tracking

---

**Congratulations!** Your BotForge application is now deployed and accessible worldwide! 🎉
