#!/bin/bash
# Build Verification Script
echo "Starting build verification..."
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"

# Check if critical files exist
echo "Checking critical files..."
ls -la src/functions/chat.ts
ls -la client/src/hooks/useWebSocket.ts
ls -la client/src/components/chat/ChatInterface.tsx
ls -la client/src/index.css

# Verify TypeScript compilation
echo "Verifying TypeScript compilation..."
npx tsc --noEmit --project .

# Build the project
echo "Building project..."
npm run build

echo "Build verification complete!"
