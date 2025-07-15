#!/bin/bash
set -e

echo "=== FRESH NETLIFY BUILD - $(date) ==="
echo "Building from scratch for Netlify deployment"

# Clean everything
rm -rf dist/
rm -rf node_modules/.vite
rm -rf .vite

# Install dependencies
echo "Installing dependencies..."
npm ci

# Build the React frontend
echo "Building React frontend..."
npm run build

# Verify the build worked
echo "Verifying build..."
if [ ! -f "dist/public/index.html" ]; then
    echo "ERROR: Frontend build failed"
    exit 1
fi

# List generated assets
echo "Generated assets:"
ls -la dist/public/assets/

# Build Netlify functions
echo "Building Netlify functions..."
mkdir -p dist/functions

# Create CommonJS package.json for functions
cat > dist/functions/package.json << 'EOF'
{
  "type": "commonjs"
}
EOF

# Build each function individually
for func in src/functions/*.ts; do
    if [ -f "$func" ]; then
        funcname=$(basename "$func" .ts)
        echo "Building function: $funcname"
        npx esbuild "$func" \
            --platform=node \
            --bundle \
            --format=cjs \
            --outfile="dist/functions/${funcname}.js" \
            --external:@neondatabase/serverless \
            --external:ws \
            --external:openai \
            --external:drizzle-orm \
            --external:drizzle-zod \
            --external:zod
    fi
done

# Verify functions built
echo "Built functions:"
ls -la dist/functions/

echo "=== BUILD COMPLETE ==="
echo "Frontend: dist/public/"
echo "Functions: dist/functions/"
echo "Ready for Netlify deployment"