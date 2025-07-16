#!/bin/bash
set -e

echo "=== SIMPLE WORKING BUILD ==="
echo "Building exactly as Replit works"

# Clean
rm -rf dist/ node_modules/.vite .vite

# Install with dev deps
NODE_ENV=development npm install --prefer-offline

# Build frontend
echo "Building frontend..."
npx vite build --outDir=dist/public

# Build server
echo "Building server..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

# Build functions
echo "Building functions..."
mkdir -p dist/functions
echo '{"type": "commonjs"}' > dist/functions/package.json

# Build each function
npx esbuild src/functions/chat.ts --platform=node --bundle --format=cjs --outfile=dist/functions/chat.js --external:@neondatabase/serverless --external:ws --external:openai --external:drizzle-orm --external:drizzle-zod --external:zod
npx esbuild src/functions/messages.ts --platform=node --bundle --format=cjs --outfile=dist/functions/messages.js --external:@neondatabase/serverless --external:ws --external:openai --external:drizzle-orm --external:drizzle-zod --external:zod
npx esbuild src/functions/admin.ts --platform=node --bundle --format=cjs --outfile=dist/functions/admin.js --external:@neondatabase/serverless --external:ws --external:openai --external:drizzle-orm --external:drizzle-zod --external:zod
npx esbuild src/functions/admin-messages.ts --platform=node --bundle --format=cjs --outfile=dist/functions/admin-messages.js --external:@neondatabase/serverless --external:ws --external:openai --external:drizzle-orm --external:drizzle-zod --external:zod

# Copy redirects
[ -f "_redirects" ] && cp _redirects dist/public/

echo "✅ Build complete!"
ls -la dist/public/ | head -5
ls -la dist/functions/