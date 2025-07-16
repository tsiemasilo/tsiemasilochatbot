# Secure API Key Vault Setup

## Overview
This guide shows you how to securely store and manage API keys for your chat application without exposing them in code repositories.

## Current API Keys Required

### For Local Development (Replit)
- `OPENAI_API_KEY` - For AI chat responses and voice transcription
- `DATABASE_URL` - For PostgreSQL database connection

### For Production (Netlify)
- `OPENAI_API_KEY` - Same as above
- `DATABASE_URL` - Same database connection
- `NODE_ENV` - Set to "production"

## Secure Storage Methods

### Method 1: Replit Secrets (Recommended for Replit)
1. Go to your Replit project
2. Click on "Secrets" tab in the left sidebar
3. Add each secret:
   - Key: `OPENAI_API_KEY`
   - Value: [Your OpenAI API key]
   - Key: `DATABASE_URL`
   - Value: [Your database connection string]

### Method 2: Netlify Environment Variables (For Netlify)
1. Go to Netlify dashboard
2. Select your site
3. Go to Site Settings → Environment Variables
4. Add variables one by one (without exposing values in documentation)

### Method 3: Local Environment File (Development)
Create a `.env` file in your project root:
```
OPENAI_API_KEY=your_openai_key_here
DATABASE_URL=your_database_url_here
NODE_ENV=development
```

## Security Best Practices

### Never Store Keys In:
- Code files
- Documentation files
- Git repositories
- Public channels or messages

### Always Store Keys In:
- Environment variables
- Secure secret management systems
- Encrypted configuration files
- Platform-specific secret stores

## Implementation Status

### Current Security Level: ✅ SECURE
- API keys stored in Replit Secrets
- Database credentials in environment variables
- No sensitive data in code repository
- GitHub security scanning active (blocked docs with keys)

### Application Components Using Keys:
- `server/db.ts` - Uses DATABASE_URL from environment
- `server/services/openai.ts` - Uses OPENAI_API_KEY from environment
- `src/functions/chat.ts` - Uses both keys for Netlify functions
- All other functions - Use environment variables securely

## Vault Access Instructions

### For You (Project Owner):
1. Access Replit Secrets tab to view/edit keys
2. Use Netlify dashboard for production environment variables
3. Never share keys in plain text
4. Rotate keys periodically for security

### For Deployment:
1. Keys are automatically loaded from environment
2. No manual intervention needed in code
3. Functions automatically detect and use secure keys
4. All database connections use environment variables

## Testing Secure Setup

### Verify Keys Are Working:
1. Check if chat responses work (OpenAI key active)
2. Test voice message transcription (OpenAI key active)
3. Verify database connectivity (DATABASE_URL active)
4. Confirm admin dashboard loads data (Both keys active)

### If Keys Don't Work:
1. Check Replit Secrets tab
2. Verify environment variable names match exactly
3. Restart application after adding new secrets
4. Check console for authentication errors

Your API keys are now securely stored and your web app will work without exposing sensitive information!