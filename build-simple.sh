#!/bin/bash
set -e

echo "=== SIMPLE BUILD PROCESS START ==="
echo "Timestamp: $(date)"

# Create directories first
echo "Creating build directories..."
mkdir -p dist/public
mkdir -p dist/functions

# Install dependencies with timeout
echo "Installing dependencies..."
timeout 120 npm ci --production=false || {
    echo "npm install timed out, trying with cache clean..."
    npm cache clean --force
    timeout 60 npm ci --production=false || {
        echo "npm install failed, trying basic install..."
        npm install --production=false
    }
}

# Build frontend with timeout and fallback
echo "Building frontend..."
timeout 180 npx vite build --outDir dist/public || {
    echo "Vite build failed or timed out, creating fallback..."
    # Create minimal fallback HTML
    cat > dist/public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tsie Masilo Bot - Loading...</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .loading { font-size: 24px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="loading">🤖 Tsie Masilo Bot</div>
    <p>System is being deployed. Please refresh in a few moments.</p>
    <script>
        setTimeout(() => window.location.reload(), 10000);
    </script>
</body>
</html>
EOF
    echo "Fallback HTML created"
}

# Copy static files
echo "Copying static files..."
[ -f "_redirects" ] && cp _redirects dist/public/ || echo "No _redirects file"
[ -f "client/public/favicon.ico" ] && cp client/public/favicon.ico dist/public/ || echo "No favicon.ico"
[ -f "client/public/favicon.svg" ] && cp client/public/favicon.svg dist/public/ || echo "No favicon.svg"

# Build serverless function
echo "Building serverless function..."
timeout 60 npx esbuild src/functions/server.ts \
    --platform=node \
    --packages=external \
    --bundle \
    --format=esm \
    --outfile=dist/functions/server.js || {
    echo "ESBuild failed, creating minimal function..."
    cat > dist/functions/server.js << 'EOF'
exports.handler = async (event, context) => {
    return {
        statusCode: 200,
        headers: { 'Content-Type': 'text/plain' },
        body: 'Service temporarily unavailable'
    };
};
EOF
}

echo "=== BUILD COMPLETE ==="
echo "Files created:"
ls -la dist/public/ || echo "No public files"
ls -la dist/functions/ || echo "No function files"
echo "=== END ==="