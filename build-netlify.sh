#!/bin/bash
set -e

echo "=== NETLIFY BUILD FOR TSIE MASILO BOT ==="
echo "$(date): Starting build with proper dependencies"

# Install all dependencies including dev dependencies
echo "Installing all dependencies..."
npm install --include=dev

# Build the React frontend
echo "Building React frontend..."
npx vite build

# Build Netlify functions with proper CommonJS format
echo "Building Netlify functions..."
mkdir -p dist/functions

# Create CommonJS package.json for functions
cat > dist/functions/package.json << 'EOF'
{
  "type": "commonjs"
}
EOF

# Build services first
if [ -d "src/functions/services" ]; then
    echo "Building services..."
    mkdir -p dist/functions/services
    npx esbuild src/functions/services/openai.ts --platform=node --bundle --format=cjs --outfile=dist/functions/services/openai.js --external:@neondatabase/serverless --external:ws --external:openai --external:@anthropic-ai/sdk
fi

# Compile each function individually with CommonJS format
for func in src/functions/*.ts; do
    if [ -f "$func" ]; then
        funcname=$(basename "$func" .ts)
        echo "Building function: $funcname"
        npx esbuild "$func" --platform=node --bundle --format=cjs --outfile="dist/functions/$funcname.js" --external:@neondatabase/serverless --external:ws --external:openai --external:@anthropic-ai/sdk --external:drizzle-orm --external:drizzle-zod
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