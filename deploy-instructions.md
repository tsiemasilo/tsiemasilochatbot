# Netlify Deployment Instructions

## Important Note About WebSockets
Netlify Functions don't support WebSocket connections. For the best experience with real-time features, consider these alternatives:

### Recommended Deployment Options:
1. **Vercel** - Better serverless function support
2. **Railway** - Full server deployment with WebSocket support
3. **Render** - Easy deployment with database support
4. **Heroku** - Traditional hosting

## For Netlify Deployment (Limited Features):

### 1. Push Updated Files to GitHub
```bash
git add netlify.toml _redirects src/functions/
git commit -m "Add Netlify deployment configuration"
git push origin main
```

### 2. Connect to Netlify
1. Go to https://app.netlify.com/
2. Click "New site from Git"
3. Connect your GitHub account
4. Select repository: `tsiemasilo/tsiemasilochatbot`

### 3. Build Settings
- **Build command**: `npm run build`
- **Publish directory**: `dist/public`  
- **Functions directory**: `dist/functions`

### 4. Environment Variables
In Netlify dashboard → Site Settings → Environment variables:
```
DATABASE_URL=your_neon_postgresql_connection_string
OPENAI_API_KEY=your_openai_api_key
NODE_ENV=production
```

### 5. Deploy
Click "Deploy site"

## Limitations on Netlify:
- No real-time WebSocket communication
- Voice messages may have longer processing times
- Admin dashboard will work but without real-time updates

## For Full Features (Recommended):
Deploy to **Railway** or **Render** for complete WebSocket support and better performance.

### Railway Deployment:
1. Go to https://railway.app/
2. Connect GitHub repository
3. Set environment variables
4. Deploy with automatic HTTPS and domain

### Render Deployment:
1. Go to https://render.com/
2. Connect GitHub repository  
3. Choose "Web Service"
4. Set environment variables
5. Deploy with automatic HTTPS

Would you like me to help you deploy to Railway or Render instead for better performance?