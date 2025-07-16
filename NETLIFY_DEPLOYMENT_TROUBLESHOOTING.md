# Netlify Deployment Troubleshooting

## Issue: Vite Not Found During Build

### Problem:
Netlify build failing with "vite: not found" error because NODE_ENV=production prevents devDependencies installation.

### Solution Applied:
1. **Updated build-netlify-fresh.sh**:
   - Changed `npm install` to `NODE_ENV=development npm install` 
   - This ensures devDependencies (including vite) are installed
   - Used `npx vite build` to guarantee vite availability

2. **Build Process Fixed**:
   - Frontend: `npx vite build` (ensures vite is available)
   - Server: `npx esbuild server/index.ts` (bundles server code)
   - Functions: Individual esbuild compilation for each function

### Environment Variables Required:
```
DATABASE_URL=postgresql://neondb_owner:npg_E3Jn8cxsglWG@ep-round-brook-a5e3k093.us-east-2.aws.neon.tech/neondb?sslmode=require
OPENAI_API_KEY=[Your OpenAI API Key]
NODE_ENV=production
```

### Current Build Configuration:
- **Build Command**: `bash build-netlify-fresh.sh`
- **Publish Directory**: `dist/public`
- **Functions Directory**: `dist/functions`

### Expected Build Flow:
1. Install all dependencies (including devDependencies)
2. Build React frontend with Vite
3. Bundle server code with esbuild
4. Compile Netlify functions individually
5. Deploy to Netlify

### Next Steps:
1. Repository updated with fixed build script
2. Trigger new Netlify deployment
3. Build should complete successfully
4. Test chat functionality and admin dashboard

The build script now handles the production environment correctly while ensuring all build tools are available.