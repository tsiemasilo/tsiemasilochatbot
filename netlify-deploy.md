# Netlify Deployment Guide for Tsie Masilo Bot

## Prerequisites
- GitHub repository with your code
- Netlify account
- Environment variables ready

## Environment Variables Required
Set these in your Netlify dashboard:
- `DATABASE_URL` - Your Neon PostgreSQL connection string
- `OPENAI_API_KEY` - Your OpenAI API key
- `NODE_ENV` - Set to "production"

## Deployment Steps

### 1. Connect to Netlify
1. Go to https://app.netlify.com/
2. Click "New site from Git"
3. Choose GitHub and select your repository: `tsiemasilo/tsiemasilochatbot`

### 2. Build Settings
- **Build command**: `npm run build`
- **Publish directory**: `dist/public`
- **Functions directory**: `dist/functions`

### 3. Environment Variables
In your Netlify dashboard, go to:
Site Settings → Environment variables → Add variable

Add these variables:
```
DATABASE_URL=your_neon_postgresql_connection_string
OPENAI_API_KEY=your_openai_api_key
NODE_ENV=production
```

### 4. Deploy
Click "Deploy site" and wait for the build to complete.

## Important Notes

### WebSocket Limitations
- Netlify Functions don't support WebSocket connections
- Real-time chat features will be limited to HTTP polling
- Consider using Netlify's real-time features or deploying to a platform that supports WebSockets

### Database
- Make sure your Neon database is accessible from external connections
- Update your database connection settings if needed

### OpenAI API
- Ensure your OpenAI API key has sufficient credits
- Voice transcription requires Whisper API access

## Alternative Deployment Options

If you need full WebSocket support, consider:
1. **Vercel** - Better support for server-side functions
2. **Railway** - Full server deployment
3. **Heroku** - Traditional server hosting
4. **DigitalOcean App Platform** - Container-based deployment

## Troubleshooting

### Build Errors
- Check that all dependencies are installed
- Verify environment variables are set correctly
- Check build logs for specific error messages

### Runtime Errors
- Monitor function logs in Netlify dashboard
- Check database connectivity
- Verify API key validity

### Performance Issues
- Netlify Functions have cold start delays
- Consider using Netlify's Edge Functions for better performance
- Monitor function execution times

## Post-Deployment
- Test all features including voice messages
- Monitor error rates and performance
- Set up monitoring and alerts
- Consider implementing fallbacks for real-time features