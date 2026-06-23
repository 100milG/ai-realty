# AI Realty Platform - Complete Hosting Guide

This guide will walk you through deploying your AI Realty Platform from your local machine to a production environment. We'll cover database hosting, backend server deployment, frontend application hosting, and integration testing.

---

## 1. Pre-Deployment Preparation

### 1.1 Finalize Your Codebase
- Ensure all changes are committed to your version control system
- Test your application locally one more time
- Double-check that all dependencies are listed in both `package.json` files

### 1.2 Prepare Environment Variables
For security, **never commit `.env` files to Git**. Instead, use `.env.example` files as templates and store sensitive keys in your hosting provider's environment configuration.

### 1.3 Select Your Hosting Stack
For this guide, we'll use **free/affordable, beginner-friendly** services:
- **Database**: Supabase (PostgreSQL) or Neon
- **Backend**: Render or Railway
- **Frontend**: Vercel or Netlify

---

## 2. Database Hosting Implementation

We'll use **Supabase** (free tier available) to host our PostgreSQL database.

### 2.1 Sign Up for Supabase
1. Go to [supabase.com](https://supabase.com) and sign up for a free account
2. Click "New Project"
3. Fill in project details:
   - **Name**: AI Realty Platform
   - **Database Password**: Create a strong, secure password and **save it!**
   - **Region**: Choose the one closest to your users
4. Click "Create New Project" (this may take 2-3 minutes)

### 2.2 Get Your Database Connection String
1. Once the project is ready, go to **Settings > Database**
2. Find the **Connection String > URI** section
3. Copy this string. It will look like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxx.supabase.co:5432/postgres
   ```

### 2.3 Configure Prisma to Use the Remote Database
1. Open `server/.env`
2. Replace the local `DATABASE_URL` with your Supabase connection string
3. Run the migration to set up the production database:
   ```bash
   cd server
   npx prisma migrate deploy
   ```
4. (Optional) Run the seed script if you want sample data in production:
   ```bash
   npm run seed
   ```

---

## 3. Backend Server Hosting Setup

We'll use **Render** to host the Express backend server.

### 3.1 Sign Up for Render
1. Go to [render.com](https://render.com) and sign up (free tier available)
2. Connect your GitHub, GitLab, or Bitbucket account
3. Click **"New +" > Web Service**
4. Select your AI Realty repo

### 3.2 Configure the Web Service
Fill out the configuration:
- **Name**: `ai-realty-backend`
- **Region**: Choose a region close to your database
- **Branch**: `main` (or your production branch)
- **Root Directory**: `server`
- **Runtime**: Node
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

### 3.3 Add Environment Variables
In the **Environment** section, click "Add Environment Variable" and add:
```
DATABASE_URL=postgresql://... (your Supabase URL)
JWT_SECRET=your_secure_jwt_secret_key_here (generate a strong secret)
PORT=10000 (Render requires this specific port)
```

### 3.4 Deploy the Backend
1. Click "Create Web Service"
2. Wait for the deployment to complete (first deployment takes ~5 minutes)
3. Once deployed, copy your **Backend URL** (it will look like `https://ai-realty-backend.onrender.com`)

---

## 4. Frontend Application Deployment

We'll use **Vercel** (free for personal use) to host the React/Vite frontend.

### 4.1 Update Frontend API Configuration
1. Open `vite.config.ts` and review the proxy settings
2. Update your frontend API calls to use the production backend URL
3. For Vite, create a production-specific env file at the root `.env.production`:
   ```env
   VITE_GEOAPIFY_API_KEY=your_geoapify_key
   VITE_API_URL=https://ai-realty-backend.onrender.com/api
   ```

### 4.2 Sign Up for Vercel
1. Go to [vercel.com](https://vercel.com) and sign up using your GitHub account
2. Click "Add New > Project"
3. Import your AI Realty repo

### 4.3 Configure the Vercel Project
- **Root Directory**: Leave as default (root of repo)
- **Framework Preset**: Vite will auto-detect "Vite"
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### 4.4 Add Environment Variables in Vercel
In the **Environment Variables** section:
1. Add `VITE_GEOAPIFY_API_KEY` with your production key
2. Add `VITE_API_URL` with your Render backend URL (from section 3.4)

### 4.5 Deploy the Frontend
1. Click "Deploy"
2. Wait for the build to finish (~2-3 minutes)
3. Copy your **Frontend URL** (e.g., `https://ai-realty.vercel.app`)

### 4.6 Update CORS Settings in the Backend
1. Go to `server/src/index.ts`
2. Update the CORS configuration to allow your Vercel frontend:
   ```typescript
   app.use(cors({
     origin: ['https://ai-realty.vercel.app', 'http://localhost:5173'], // Add your frontend URL
     credentials: true
   }));
   ```
3. Commit and push this change to redeploy the backend

---

## 5. Integration & End-to-End Testing

### 5.1 Sanity Check: Visit Both Services
- Open your Vercel frontend URL in a browser
- Verify the page loads without errors
- Test the API health check by visiting `https://your-backend.onrender.com/api/health`

### 5.2 Test User Authentication
1. Create a new customer account
2. Log in and out
3. Try creating a subagent account (or use the admin seed credentials)

### 5.3 Test Property Features
1. As a subagent, add a new property
2. As a customer, browse properties
3. Save a property and test location search (Geoapify should work)

### 5.4 Test Real-Time Features (if available)
- Test chat functionality
- Test notifications
- Test visit scheduling

### 5.5 Monitor Logs for Errors
- **Supabase**: Check database logs under Reports
- **Render**: Check backend logs on your service's "Logs" tab
- **Vercel**: Check frontend logs on your project's "Functions" tab

---

## Bonus: Monitoring & Scaling (Production Readiness)

### 6.1 Set Up Custom Domains
- **Frontend**: Add a custom domain in Vercel > Settings > Domains
- **Backend**: Add a custom domain in Render > Settings > Custom Domains

### 6.2 Enable Backups
- **Supabase**: Database backups are automatic in the free tier
- Download regular SQL dumps locally as an extra layer of security

### 6.3 Security Hardening
- **Backend**: Ensure all your JWT secrets are long and complex
- **API Keys**: Rotate API keys regularly
- **CORS**: Restrict CORS to only your frontend domain

### 6.4 Performance Monitoring
- **Frontend**: Use Vercel Analytics
- **Backend**: Add logging service like Sentry or Datadog

---

## Troubleshooting Common Issues

### Issue 1: Backend times out on Render
- **Fix**: Render free tier sleeps after 15 minutes of inactivity. Add a health check ping service like [UptimeRobot](https://uptimerobot.com) to keep it awake.

### Issue 2: CORS errors
- **Fix**: Double-check your CORS origin configuration includes your full frontend URL (including `https://`)

### Issue 3: Database connection fails
- **Fix**: Verify your `DATABASE_URL` is correct, and your Supabase project hasn't been paused

---

## Alternative Hosting Options

If the above providers don't suit you, consider these alternatives:
- **Database**: AWS RDS, Railway, PlanetScale, Neon
- **Backend**: Railway, Heroku, AWS EC2, DigitalOcean App Platform
- **Frontend**: Netlify, Cloudflare Pages, AWS S3 + CloudFront

Congratulations! Your AI Realty Platform is now live and accessible to users worldwide. 🎉
