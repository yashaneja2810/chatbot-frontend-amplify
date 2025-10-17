# Deployment Checklist

Use this checklist to ensure smooth deployment.

## Pre-Deployment

### Backend Preparation
- [ ] All code committed to GitHub
- [ ] `requirements.txt` is up to date
- [ ] `.env.example` has all required variables
- [ ] `render.yaml` is configured
- [ ] `Procfile` exists
- [ ] `runtime.txt` specifies Python 3.11.0

### Frontend Preparation
- [ ] All code committed to GitHub
- [ ] `package.json` has correct build scripts
- [ ] `.env.example` has all required variables
- [ ] `vercel.json` is configured
- [ ] API URL uses environment variable

### External Services
- [ ] Supabase project created
- [ ] Supabase database tables created
- [ ] Supabase RLS policies configured
- [ ] Qdrant Cloud instance created
- [ ] Google AI API key obtained
- [ ] JWT secret generated

## Backend Deployment (Render)

- [ ] Render account created
- [ ] New Web Service created
- [ ] GitHub repository connected
- [ ] Root directory set to `backend`
- [ ] Build command: `pip install -r requirements.txt`
- [ ] Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- [ ] Environment variables added:
  - [ ] GOOGLE_API_KEY
  - [ ] JWT_SECRET
  - [ ] VITE_SUPABASE_URL
  - [ ] VITE_SUPABASE_ANON_KEY
  - [ ] QDRANT_URL
  - [ ] QDRANT_API_KEY
  - [ ] FRONTEND_URL
  - [ ] PYTHON_VERSION
- [ ] Deployment successful
- [ ] Backend URL noted: `___________________________`
- [ ] Health check endpoint works: `/api/health`

## Frontend Deployment (Vercel)

- [ ] Vercel account created
- [ ] New Project created
- [ ] GitHub repository connected
- [ ] Root directory set to `frontend`
- [ ] Framework preset: Vite
- [ ] Build command: `npm run build`
- [ ] Output directory: `dist`
- [ ] Environment variables added:
  - [ ] VITE_API_URL (your Render backend URL)
  - [ ] VITE_SUPABASE_URL
  - [ ] VITE_SUPABASE_ANON_KEY
- [ ] Deployment successful
- [ ] Frontend URL noted: `___________________________`
- [ ] Site loads correctly

## Post-Deployment Configuration

### Update Backend
- [ ] Update `FRONTEND_URL` in Render with actual Vercel URL
- [ ] Redeploy backend

### Update Supabase
- [ ] Add Vercel URL to Site URL
- [ ] Add Vercel URL to Redirect URLs
- [ ] Test authentication

### Testing
- [ ] Can access frontend
- [ ] Can login/signup
- [ ] Can create a bot
- [ ] Can upload documents
- [ ] Can test bot chat
- [ ] Can delete bot
- [ ] All API calls work
- [ ] No CORS errors in console

## Optional Enhancements

- [ ] Custom domain configured
- [ ] SSL certificate verified
- [ ] Monitoring set up
- [ ] Error tracking configured
- [ ] Analytics added
- [ ] Backup strategy implemented

## Troubleshooting Completed

- [ ] Checked Render logs
- [ ] Checked Vercel logs
- [ ] Checked browser console
- [ ] Verified all environment variables
- [ ] Tested all major features

## Documentation

- [ ] README updated with deployment URLs
- [ ] Team notified of deployment
- [ ] Credentials securely stored
- [ ] Deployment guide reviewed

---

**Deployment Date**: _______________
**Backend URL**: _______________
**Frontend URL**: _______________
**Deployed By**: _______________

## Notes

Add any deployment notes or issues encountered:

```
[Your notes here]
```
