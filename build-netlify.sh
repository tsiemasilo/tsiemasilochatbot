#!/bin/bash

# Build script for Netlify deployment

echo "Building client..."
npm run build:client

echo "Building functions..."
mkdir -p dist/functions
esbuild src/functions/server.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/functions/server.js

echo "Build complete!"
echo "Client built to: dist/public"
echo "Functions built to: dist/functions"