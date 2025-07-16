#!/bin/bash
set -e

echo "=== NETLIFY BUILD FOR TSIE MASILO BOT ==="
echo "$(date): Starting build with proper dependencies"

# Clean everything first
rm -rf dist/
rm -rf node_modules/.vite
rm -rf .vite

# Install all dependencies including dev dependencies
echo "Installing all dependencies..."
NODE_ENV=development npm install

# Build the React frontend
echo "Building React frontend..."
npx vite build && npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

# Build Netlify functions with proper CommonJS format
echo "Building Netlify functions..."
mkdir -p dist/functions

# Create CommonJS package.json for functions
cat > dist/functions/package.json << 'EOF'
{
  "type": "commonjs"
}
EOF

# Build services first - these are included in the function bundles
if [ -d "src/functions/services" ]; then
    echo "Services will be bundled with functions..."
fi

# Compile each function individually with CommonJS format
for func in src/functions/*.ts; do
    if [ -f "$func" ]; then
        funcname=$(basename "$func" .ts)
        echo "Building function: $funcname"
        npx esbuild "$func" --platform=node --bundle --format=cjs --outfile="dist/functions/$funcname.js" --external:@neondatabase/serverless --external:ws --external:openai --external:@anthropic-ai/sdk --external:drizzle-orm --external:drizzle-zod --external:zod
    fi
done

# Create a simple test function to verify deployment
echo "Creating test function..."
cat > dist/functions/test.js << 'EOF'
exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      message: 'Netlify functions are working!',
      timestamp: new Date().toISOString(),
      method: event.httpMethod,
      path: event.path
    })
  };
};
EOF

# Copy shared schema for functions
if [ -d "shared" ]; then
    echo "Copying shared schema..."
    cp -r shared dist/
fi

# Copy redirects
echo "Copying redirects..."
cp _redirects dist/public/

echo "✅ Build completed successfully!"
echo "Files created:"
ls -la dist/public/
ls -la dist/functions/
echo "Test function created for verification"