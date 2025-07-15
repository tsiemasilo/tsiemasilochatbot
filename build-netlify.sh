#!/bin/bash
set -e

echo "=== FINAL BUILD SCRIPT ==="
echo "Building frontend and functions for deployment"

# Clean build directory
rm -rf dist/
mkdir -p dist/public/assets dist/functions

# Install dependencies if needed
echo "Installing dependencies..."
npm ci

# Build frontend using the working approach
echo "Building frontend..."
npx vite build

# Build functions
echo "Building functions..."
cat > dist/functions/package.json << 'FUNC_EOF'
{
  "type": "commonjs"
}
FUNC_EOF

# Build all functions
npx esbuild src/functions/chat.ts --platform=node --bundle --format=cjs --outfile="dist/functions/chat.js" --external:@neondatabase/serverless --external:ws --external:openai --external:drizzle-orm --external:drizzle-zod --external:zod
npx esbuild src/functions/messages.ts --platform=node --bundle --format=cjs --outfile="dist/functions/messages.js" --external:@neondatabase/serverless --external:ws --external:openai --external:drizzle-orm --external:drizzle-zod --external:zod
npx esbuild src/functions/admin.ts --platform=node --bundle --format=cjs --outfile="dist/functions/admin.js" --external:@neondatabase/serverless --external:ws --external:openai --external:drizzle-orm --external:drizzle-zod --external:zod
npx esbuild src/functions/admin-messages.ts --platform=node --bundle --format=cjs --outfile="dist/functions/admin-messages.js" --external:@neondatabase/serverless --external:ws --external:openai --external:drizzle-orm --external:drizzle-zod --external:zod

echo "Build complete!"
echo "Frontend: $(ls -la dist/public/assets/ | wc -l) assets"
echo "Functions: $(ls dist/functions/*.js | wc -l) functions"