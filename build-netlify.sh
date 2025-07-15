#!/bin/bash
set -e

echo "Starting Netlify build process..."

# Install dependencies
echo "Installing dependencies..."
npm install --production=false

# Create directories
echo "Creating build directories..."
mkdir -p dist/public
mkdir -p dist/functions

# Build frontend
echo "Building frontend with Vite..."
npx vite build --outDir dist/public

# Copy static files
echo "Copying static files..."
if [ -f "_redirects" ]; then
    cp _redirects dist/public/
    echo "_redirects file copied"
else
    echo "Warning: _redirects file not found"
fi

if [ -f "client/public/favicon.ico" ]; then
    cp client/public/favicon.ico dist/public/
    echo "favicon.ico copied"
fi

if [ -f "client/public/favicon.svg" ]; then
    cp client/public/favicon.svg dist/public/
    echo "favicon.svg copied"
fi

# Build serverless function
echo "Building serverless function..."
npx esbuild src/functions/server.ts \
    --platform=node \
    --packages=external \
    --bundle \
    --format=esm \
    --outfile=dist/functions/server.js

echo "Build completed successfully!"
echo "Contents of dist/public:"
ls -la dist/public/
echo "Contents of dist/functions:"
ls -la dist/functions/

# Run database migrations to ensure schema is up to date
echo "Running database migrations..."
if [ -n "$DATABASE_URL" ]; then
    npx drizzle-kit push || echo "Database migration failed - continuing anyway"
else
    echo "DATABASE_URL not set - skipping migrations"
fi