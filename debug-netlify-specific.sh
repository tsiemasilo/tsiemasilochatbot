#!/bin/bash

# Netlify-Specific Debugging Script
# Focus on Netlify deployment issues only

echo "🔍 NETLIFY-SPECIFIC DEBUGGING"
echo "============================="
echo "Time: $(date)"
echo ""

# Test 1: Check if Netlify functions are properly deployed
echo "📦 TEST 1: Netlify Functions Deployment Check"
echo "--------------------------------------------"

# Check function endpoints directly
functions=("chat" "messages" "admin" "admin-messages")

for func in "${functions[@]}"; do
    echo "Testing /.netlify/functions/$func..."
    
    # HEAD request to check if endpoint exists
    status=$(curl -s -o /dev/null -w "%{http_code}" -X HEAD "https://tsiemasilochatbot.netlify.app/.netlify/functions/$func" --connect-timeout 10 --max-time 15)
    
    if [ "$status" = "404" ]; then
        echo "  ❌ $func: NOT DEPLOYED (404)"
    elif [ "$status" = "200" ] || [ "$status" = "405" ]; then
        echo "  ✅ $func: DEPLOYED (Status: $status)"
    else
        echo "  ⚠️ $func: UNKNOWN STATUS ($status)"
    fi
done
echo ""

# Test 2: Check Netlify build logs simulation
echo "🔨 TEST 2: Build Process Analysis"
echo "--------------------------------"

# Check if functions are built locally
if [ -d "dist/functions" ]; then
    echo "✅ Functions directory exists"
    echo "Functions built:"
    ls -la dist/functions/ | grep -E '\.(js|mjs)$' || echo "  No JS files found"
else
    echo "❌ Functions directory missing - running build..."
    chmod +x build-netlify.sh
    ./build-netlify.sh
fi
echo ""

# Test 3: Environment Variables for Netlify
echo "🔐 TEST 3: Environment Variables (Netlify Context)"
echo "------------------------------------------------"

# Check if netlify.toml has environment variables
if [ -f "netlify.toml" ]; then
    echo "Checking netlify.toml for environment variables..."
    if grep -q "OPENAI_API_KEY" netlify.toml; then
        echo "  ✅ OPENAI_API_KEY found in netlify.toml"
    else
        echo "  ❌ OPENAI_API_KEY missing from netlify.toml"
    fi
    
    if grep -q "NETLIFY_DATABASE_URL" netlify.toml; then
        echo "  ✅ NETLIFY_DATABASE_URL found in netlify.toml"
    else
        echo "  ❌ NETLIFY_DATABASE_URL missing from netlify.toml"
    fi
else
    echo "❌ netlify.toml missing"
fi
echo ""

# Test 4: Function Content Analysis
echo "📝 TEST 4: Function Content Analysis"
echo "-----------------------------------"

for func in chat.js messages.js admin.js admin-messages.js; do
    if [ -f "dist/functions/$func" ]; then
        echo "Analyzing $func..."
        
        # Check file size
        size=$(stat -c%s "dist/functions/$func")
        echo "  Size: $size bytes"
        
        # Check for key imports
        if grep -q "handler.*export" "dist/functions/$func"; then
            echo "  ✅ Handler export found"
        else
            echo "  ❌ Handler export missing"
        fi
        
        # Check for database connection
        if grep -q "NETLIFY_DATABASE_URL\|DATABASE_URL" "dist/functions/$func"; then
            echo "  ✅ Database connection found"
        else
            echo "  ❌ Database connection missing"
        fi
        
        # Check for OpenAI
        if grep -q "OPENAI_API_KEY\|openai" "dist/functions/$func"; then
            echo "  ✅ OpenAI integration found"
        else
            echo "  ❌ OpenAI integration missing"
        fi
        
        # Check for CORS headers
        if grep -q "Access-Control-Allow-Origin" "dist/functions/$func"; then
            echo "  ✅ CORS headers found"
        else
            echo "  ❌ CORS headers missing"
        fi
        
    else
        echo "❌ $func not found in dist/functions/"
    fi
    echo ""
done

# Test 5: Netlify Deployment Status
echo "🚀 TEST 5: Netlify Deployment Status"
echo "------------------------------------"

echo "Main site status:"
main_status=$(curl -s -o /dev/null -w "%{http_code}" "https://tsiemasilochatbot.netlify.app" --connect-timeout 10 --max-time 15)
if [ "$main_status" = "200" ]; then
    echo "  ✅ Main site: Online ($main_status)"
else
    echo "  ❌ Main site: Issue ($main_status)"
fi

echo ""
echo "Functions status summary:"
working_functions=0
total_functions=4

for func in "${functions[@]}"; do
    status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "https://tsiemasilochatbot.netlify.app/.netlify/functions/$func" -H "Content-Type: application/json" -d '{}' --connect-timeout 10 --max-time 15)
    
    if [ "$status" != "404" ]; then
        working_functions=$((working_functions + 1))
        echo "  ✅ $func: Working"
    else
        echo "  ❌ $func: Not deployed"
    fi
done

echo ""
echo "Functions deployment: $working_functions/$total_functions working"

# Test 6: GitHub Integration Check
echo "🔗 TEST 6: GitHub Integration Status"
echo "-----------------------------------"

# Check if GitHub push was successful
if [ -f "netlify-trigger.md" ]; then
    echo "✅ GitHub trigger file exists"
    echo "  Content: $(cat netlify-trigger.md)"
else
    echo "❌ GitHub trigger file missing"
fi
echo ""

# Test 7: Quick Fix Suggestions
echo "💡 TEST 7: Quick Fix Suggestions"
echo "--------------------------------"

if [ "$working_functions" -eq 0 ]; then
    echo "🔧 ISSUE: No functions are working"
    echo "Possible fixes:"
    echo "1. Manual Netlify deploy trigger needed"
    echo "2. Build process failing on Netlify"
    echo "3. Environment variables not set in Netlify dashboard"
    echo "4. Functions not properly compiled"
    echo ""
    
    # Test build process
    echo "Testing build process..."
    if [ -f "build-netlify.sh" ]; then
        echo "Build script exists, testing..."
        timeout 30 ./build-netlify.sh > /tmp/build_test.log 2>&1
        if [ $? -eq 0 ]; then
            echo "✅ Build script works locally"
        else
            echo "❌ Build script failed locally"
            echo "Build errors:"
            tail -5 /tmp/build_test.log
        fi
    fi
    
elif [ "$working_functions" -lt "$total_functions" ]; then
    echo "🔧 ISSUE: Some functions not working"
    echo "Partial deployment detected"
    echo "Check Netlify build logs for specific function errors"
    
else
    echo "✅ All functions working!"
    echo "Netlify deployment successful"
fi

echo ""
echo "🏁 NETLIFY DEBUGGING COMPLETE"
echo "=============================="
echo "Next steps based on results above"