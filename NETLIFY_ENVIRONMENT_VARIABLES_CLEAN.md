# Netlify Environment Variables Setup

## Required Environment Variables

### 1. OpenAI API Key
- **Variable**: `OPENAI_API_KEY`
- **Value**: `your_openai_api_key_here`
- **Purpose**: Powers AI chat responses, mood analysis, and speech-to-text transcription

### 2. Database Connection
- **Variable**: `DATABASE_URL`
- **Value**: `postgresql://neondb_owner:npg_I9syPbvXdK8W@ep-restless-recipe-aeshfl0e-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require`
- **Purpose**: Main database connection for storing chat messages and user data (uses pooled connection for optimal performance)

### 3. Node.js Version
- **Variable**: `NODE_VERSION`
- **Value**: `18`
- **Purpose**: Ensures consistent Node.js version for builds

## How to Set Environment Variables in Netlify

### Option 1: Via Netlify Dashboard (Recommended)
1. Go to your Netlify dashboard
2. Navigate to your "tsiemasilochatbot" site
3. Go to **Site settings** → **Environment variables**
4. Click **"Add a variable"** for each one:
   - Key: `OPENAI_API_KEY`
   - Value: `your_actual_openai_api_key`
   - Key: `DATABASE_URL`
   - Value: `postgresql://neondb_owner:npg_I9syPbvXdK8W@ep-restless-recipe-aeshfl0e-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require`
   - Key: `NODE_VERSION`
   - Value: `18`

### Option 2: Already Set in netlify.toml
These variables are also configured in the `netlify.toml` file, but setting them in the dashboard provides better security and reliability.

## Verification Steps

After setting environment variables:
1. **Trigger a new deploy**: Go to Deploys → Trigger deploy → Deploy site
2. **Check build logs**: Look for successful environment variable loading
3. **Test functions**: Use the debugging scripts to verify function deployment
4. **Test chat functionality**: Verify AI responses and database connections work

## Important Notes

- **Security**: Environment variables in Netlify dashboard are encrypted and more secure than netlify.toml
- **Priority**: Dashboard variables override netlify.toml variables
- **Deployment**: New deploys are required after changing environment variables
- **Testing**: Use the debugging scripts to verify all variables are loaded correctly

## Expected Result

Once all environment variables are set:
- AI chat responses will work
- Database connections will be established
- Voice transcription will function
- Admin dashboard will be accessible
- Full chatbot functionality identical to Replit version