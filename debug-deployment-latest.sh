#!/bin/bash
set -e

echo "=== DEPLOYMENT DEBUG SCRIPT ==="
echo "Timestamp: $(date)"
echo "Environment: $NODE_ENV"
echo "Build Command: $BUILD_COMMAND"
echo "Publish Directory: $PUBLISH_DIR"
echo

# Check Netlify environment
echo "=== NETLIFY ENVIRONMENT CHECK ==="
echo "NETLIFY: $NETLIFY"
echo "NETLIFY_BUILD_BASE: $NETLIFY_BUILD_BASE"
echo "NETLIFY_BUILD_OUTPUT: $NETLIFY_BUILD_OUTPUT"
echo "DEPLOY_PRIME_URL: $DEPLOY_PRIME_URL"
echo "DEPLOY_URL: $DEPLOY_URL"
echo "URL: $URL"
echo

# Check database URLs
echo "=== DATABASE CONFIGURATION ==="
echo "DATABASE_URL exists: ${DATABASE_URL:+YES}"
echo "DATABASE_URL preview: ${DATABASE_URL:0:50}..."
echo "NETLIFY_DATABASE_URL exists: ${NETLIFY_DATABASE_URL:+YES}"
echo "NETLIFY_DATABASE_URL preview: ${NETLIFY_DATABASE_URL:0:50}..."
echo

# Check file system before build
echo "=== PRE-BUILD FILE SYSTEM ==="
echo "Current directory: $(pwd)"
echo "Directory contents:"
ls -la
echo
echo "Package.json exists: $(test -f package.json && echo YES || echo NO)"
echo "Vite config exists: $(test -f vite.config.ts && echo YES || echo NO)"
echo "Build script exists: $(test -f build-simple.sh && echo YES || echo NO)"
echo

# Run the actual build with detailed logging
echo "=== RUNNING BUILD PROCESS ==="
bash -x ./build-simple.sh 2>&1 | tee build-output.log
echo

# Check post-build file system
echo "=== POST-BUILD FILE SYSTEM ==="
echo "dist directory exists: $(test -d dist && echo YES || echo NO)"
echo "dist/public exists: $(test -d dist/public && echo YES || echo NO)"
echo "dist/functions exists: $(test -d dist/functions && echo YES || echo NO)"
echo

if [ -d dist ]; then
    echo "Contents of dist/:"
    ls -la dist/
    echo
fi

if [ -d dist/public ]; then
    echo "Contents of dist/public/:"
    ls -la dist/public/
    echo
    echo "index.html exists: $(test -f dist/public/index.html && echo YES || echo NO)"
    if [ -f dist/public/index.html ]; then
        echo "index.html size: $(stat -c%s dist/public/index.html) bytes"
        echo "index.html first 200 chars:"
        head -c 200 dist/public/index.html
        echo
    fi
fi

if [ -d dist/functions ]; then
    echo "Contents of dist/functions/:"
    ls -la dist/functions/
    echo
    echo "server.js exists: $(test -f dist/functions/server.js && echo YES || echo NO)"
    if [ -f dist/functions/server.js ]; then
        echo "server.js size: $(stat -c%s dist/functions/server.js) bytes"
    fi
fi

# Check for any build errors
echo "=== BUILD LOG ANALYSIS ==="
if [ -f build-output.log ]; then
    echo "Build log size: $(stat -c%s build-output.log) bytes"
    echo "Last 50 lines of build log:"
    tail -n 50 build-output.log
    echo
    echo "Searching for errors in build log:"
    grep -i "error\|failed\|timeout\|cannot\|not found" build-output.log || echo "No obvious errors found"
fi

echo "=== DEBUG COMPLETE ==="
echo "Copy this entire output to identify the deployment issue"