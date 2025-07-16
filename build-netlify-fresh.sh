#!/bin/bash

echo "=== NETLIFY BUILD SCRIPT ==="
echo "Building chat application for deployment..."

# Install dependencies with development tools
echo "Installing dependencies..."
NODE_ENV=development npm install

# Build React frontend using the vite config
echo "Building React frontend..."
npx vite build --config vite.config.ts

# Create functions directory
mkdir -p dist/functions

# Build serverless functions
echo "Building serverless functions..."
if [ -f "src/functions/chat.ts" ]; then
  npx esbuild src/functions/chat.ts --platform=node --packages=external --bundle --format=cjs --outfile=dist/functions/chat.js
fi

if [ -f "src/functions/messages.ts" ]; then
  npx esbuild src/functions/messages.ts --platform=node --packages=external --bundle --format=cjs --outfile=dist/functions/messages.js
fi

if [ -f "src/functions/admin.ts" ]; then
  npx esbuild src/functions/admin.ts --platform=node --packages=external --bundle --format=cjs --outfile=dist/functions/admin.js
fi

if [ -f "src/functions/admin-messages.ts" ]; then
  npx esbuild src/functions/admin-messages.ts --platform=node --packages=external --bundle --format=cjs --outfile=dist/functions/admin-messages.js
fi

# Verify build
echo "Verifying build..."
if [ -d "dist/public" ] && [ -f "dist/public/index.html" ]; then
  echo "✓ Frontend build successful"
else
  echo "✗ Frontend build failed"
  exit 1
fi

if [ -d "dist/functions" ]; then
  echo "✓ Functions build successful"
else
  echo "✗ Functions build failed"
  exit 1
fi

echo "✅ Build completed successfully!"