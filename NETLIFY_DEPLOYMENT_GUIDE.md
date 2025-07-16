# Netlify Deployment Guide

## Step 1: Connect GitHub Repository

1. **Go to Netlify**: Visit [https://app.netlify.com](https://app.netlify.com)
2. **Login**: Use your GitHub account
3. **New Site**: Click "New site from Git"
4. **Connect Repository**: 
   - Choose GitHub
   - Select repository: `tsiemasilo/tsiemasilochatbot`
   - Branch: `main`

## Step 2: Build Configuration

**Build Settings** (should auto-detect from netlify.toml):
- Build command: `bash build-simple-working.sh`
- Publish directory: `dist/public`
- Functions directory: `dist/functions`

## Step 3: Environment Variables

Add these environment variables in Netlify Dashboard:

### Required Variables:
```
DATABASE_URL=postgresql://neondb_owner:npg_E3Jn8cxsglWG@ep-round-brook-a5e3k093.us-east-2.aws.neon.tech/neondb?sslmode=require
OPENAI_API_KEY=[Your OpenAI API Key from Replit Secrets]
NODE_ENV=production
```

### How to Add:
1. Go to Site Settings → Environment variables
2. Click "Add variable"
3. Add each variable with its value
4. Save changes

## Step 4: Deploy

1. **Trigger Deploy**: Click "Deploy site"
2. **Monitor Build**: Watch the deploy log
3. **Expected Build Time**: 2-3 minutes
4. **Success**: Site will be live at `[random-name].netlify.app`

## Step 5: Test Functionality

After deployment, verify:
- ✅ Chat interface loads
- ✅ Real-time messaging works
- ✅ AI responses generate
- ✅ Admin dashboard accessible at `/admin`
- ✅ Database viewer at `/database`
- ✅ Voice message recording

## Troubleshooting

If build fails:
1. Check environment variables are set correctly
2. Verify DATABASE_URL connection
3. Ensure OPENAI_API_KEY is valid
4. Check deploy logs for specific errors

## Expected Result

Your site will work exactly like the Replit version with:
- Full chat functionality
- AI-powered responses
- Voice message support
- Admin dashboard
- Database analytics
- Professional UI/UX

The deployment is ready to go!