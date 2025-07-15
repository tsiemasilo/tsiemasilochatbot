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

# Build the serverless function
echo "Building serverless function..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

# Copy redirects
echo "Copying redirects..."
cp _redirects dist/public/

echo "✅ Build completed successfully!"
echo "Files created:"
ls -la dist/public/
ls -la dist/