#!/bin/bash
set -e

echo "=== FORCE REBUILD - $(date) ==="
echo "Clearing any cached builds..."

# Clean build directory
rm -rf dist/
mkdir -p dist/public dist/functions

echo "Building React frontend with fresh cache..."
npx vite build --force

echo "Building Netlify functions..."
mkdir -p dist/functions
cat > dist/functions/package.json << 'FUNC_EOF'
{
  "type": "commonjs"
}
FUNC_EOF

# Build functions
for func in src/functions/*.ts; do
    if [ -f "$func" ]; then
        funcname=$(basename "$func" .ts)
        echo "Building function: $funcname"
        npx esbuild "$func" --platform=node --bundle --format=cjs --outfile="dist/functions/${funcname}.js" --external:@neondatabase/serverless --external:ws --external:openai --external:@anthropic-ai/sdk --external:drizzle-orm --external:drizzle-zod --external:zod
    fi
done

echo "Build complete with timestamp: $(date)"
ls -la dist/public/assets/
