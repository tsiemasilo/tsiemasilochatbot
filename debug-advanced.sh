#!/bin/bash

# Advanced Debugging Script for Netlify Deployment Issues
# Tests all endpoints, functions, and configurations

echo "🔍 ADVANCED DEBUGGING - NETLIFY DEPLOYMENT ANALYSIS"
echo "=================================================="
echo "Time: $(date)"
echo "Testing: https://tsiemasilochatbot.netlify.app"
echo ""

# Test 1: Main Website
echo "📱 TEST 1: Main Website Accessibility"
echo "------------------------------------"
curl -s -w "Status: %{http_code} | Time: %{time_total}s | Size: %{size_download} bytes\n" \
  "https://tsiemasilochatbot.netlify.app" \
  -o /tmp/main_page.html \
  --connect-timeout 10 --max-time 15
echo "Main page saved to: /tmp/main_page.html"
echo ""

# Test 2: Netlify Functions
echo "🔧 TEST 2: Netlify Functions Testing"
echo "-----------------------------------"

# Chat function
echo "Testing chat function..."
curl -s -w "Status: %{http_code} | Time: %{time_total}s\n" \
  -X POST "https://tsiemasilochatbot.netlify.app/.netlify/functions/chat" \
  -H "Content-Type: application/json" \
  -d '{"content": "Debug test message", "userName": "DebugUser"}' \
  --connect-timeout 15 --max-time 30 \
  -o /tmp/chat_response.json
echo "Chat response saved to: /tmp/chat_response.json"
echo ""

# Messages function
echo "Testing messages function..."
curl -s -w "Status: %{http_code} | Time: %{time_total}s\n" \
  -X POST "https://tsiemasilochatbot.netlify.app/.netlify/functions/messages" \
  -H "Content-Type: application/json" \
  -d '{"userName": "DebugUser"}' \
  --connect-timeout 15 --max-time 30 \
  -o /tmp/messages_response.json
echo "Messages response saved to: /tmp/messages_response.json"
echo ""

# Admin function
echo "Testing admin function..."
curl -s -w "Status: %{http_code} | Time: %{time_total}s\n" \
  -X GET "https://tsiemasilochatbot.netlify.app/.netlify/functions/admin" \
  --connect-timeout 15 --max-time 30 \
  -o /tmp/admin_response.json
echo "Admin response saved to: /tmp/admin_response.json"
echo ""

# Admin messages function
echo "Testing admin-messages function..."
curl -s -w "Status: %{http_code} | Time: %{time_total}s\n" \
  -X POST "https://tsiemasilochatbot.netlify.app/.netlify/functions/admin-messages" \
  -H "Content-Type: application/json" \
  -d '{"userName": "DebugUser"}' \
  --connect-timeout 15 --max-time 30 \
  -o /tmp/admin_messages_response.json
echo "Admin-messages response saved to: /tmp/admin_messages_response.json"
echo ""

# Test 3: DNS and Network Analysis
echo "🌐 TEST 3: DNS and Network Analysis"
echo "-----------------------------------"
echo "DNS Resolution:"
nslookup tsiemasilochatbot.netlify.app || echo "DNS lookup failed"
echo ""

echo "Network connectivity:"
ping -c 3 tsiemasilochatbot.netlify.app || echo "Ping failed"
echo ""

# Test 4: Function File Analysis
echo "📁 TEST 4: Local Function Files Analysis"
echo "----------------------------------------"
echo "Checking compiled function files..."
if [ -d "dist/functions" ]; then
  echo "Functions directory exists: ✓"
  ls -la dist/functions/
  echo ""
  
  for func in chat.js messages.js admin.js admin-messages.js; do
    if [ -f "dist/functions/$func" ]; then
      echo "✓ $func exists ($(stat -c%s dist/functions/$func) bytes)"
      echo "  First 100 chars: $(head -c 100 dist/functions/$func)"
    else
      echo "✗ $func missing"
    fi
  done
else
  echo "Functions directory missing: ✗"
fi
echo ""

# Test 5: Configuration Analysis
echo "⚙️ TEST 5: Configuration Files Analysis"
echo "---------------------------------------"
echo "Checking netlify.toml..."
if [ -f "netlify.toml" ]; then
  echo "netlify.toml exists: ✓"
  cat netlify.toml
else
  echo "netlify.toml missing: ✗"
fi
echo ""

echo "Checking build script..."
if [ -f "build-netlify.sh" ]; then
  echo "build-netlify.sh exists: ✓"
  echo "Build script permissions: $(stat -c%a build-netlify.sh)"
else
  echo "build-netlify.sh missing: ✗"
fi
echo ""

# Test 6: Response Content Analysis
echo "📄 TEST 6: Response Content Analysis"
echo "------------------------------------"
echo "Analyzing main page response..."
if [ -f "/tmp/main_page.html" ]; then
  echo "Main page size: $(stat -c%s /tmp/main_page.html) bytes"
  echo "Contains 'Tsie Masilo Bot': $(grep -c 'Tsie Masilo Bot' /tmp/main_page.html || echo 0)"
  echo "Contains error messages: $(grep -c 'Page not found\|Error' /tmp/main_page.html || echo 0)"
fi
echo ""

echo "Analyzing function responses..."
for file in /tmp/chat_response.json /tmp/messages_response.json /tmp/admin_response.json /tmp/admin_messages_response.json; do
  if [ -f "$file" ]; then
    echo "$(basename $file): $(stat -c%s $file) bytes"
    echo "  First 200 chars: $(head -c 200 $file)"
    echo "  Contains 404: $(grep -c '404\|Page not found' $file || echo 0)"
    echo "  Contains JSON: $(grep -c '{' $file || echo 0)"
  fi
done
echo ""

# Test 7: Build Process Test
echo "🔨 TEST 7: Build Process Test"
echo "-----------------------------"
echo "Testing build process locally..."
if [ -f "build-netlify.sh" ]; then
  echo "Running build script..."
  chmod +x build-netlify.sh
  timeout 60 ./build-netlify.sh > /tmp/build_output.log 2>&1
  echo "Build exit code: $?"
  echo "Build output (last 20 lines):"
  tail -20 /tmp/build_output.log
else
  echo "Build script not found"
fi
echo ""

# Test 8: Environment Variables Check
echo "🔐 TEST 8: Environment Variables Check"
echo "--------------------------------------"
echo "Checking required environment variables..."
echo "OPENAI_API_KEY: $(if [ -n "$OPENAI_API_KEY" ]; then echo "Set (${#OPENAI_API_KEY} chars)"; else echo "Not set"; fi)"
echo "NETLIFY_DATABASE_URL: $(if [ -n "$NETLIFY_DATABASE_URL" ]; then echo "Set (${#NETLIFY_DATABASE_URL} chars)"; else echo "Not set"; fi)"
echo "DATABASE_URL: $(if [ -n "$DATABASE_URL" ]; then echo "Set (${#DATABASE_URL} chars)"; else echo "Not set"; fi)"
echo ""

# Test 9: Function Syntax Check
echo "🔍 TEST 9: Function Syntax Check"
echo "--------------------------------"
if [ -d "dist/functions" ]; then
  for func in dist/functions/*.js; do
    if [ -f "$func" ]; then
      echo "Checking $(basename $func)..."
      node -c "$func" 2>&1 || echo "Syntax error in $func"
    fi
  done
else
  echo "No compiled functions to check"
fi
echo ""

# Test 10: Deployment Status Summary
echo "📊 TEST 10: Deployment Status Summary"
echo "------------------------------------"
echo "Website Status: $(if curl -s -f https://tsiemasilochatbot.netlify.app > /dev/null; then echo "✓ Online"; else echo "✗ Offline"; fi)"
echo "Functions Status: $(if curl -s -f https://tsiemasilochatbot.netlify.app/.netlify/functions/chat > /dev/null; then echo "✓ Working"; else echo "✗ Not working"; fi)"
echo "Build Files: $(if [ -d "dist/functions" ]; then echo "✓ Present"; else echo "✗ Missing"; fi)"
echo "Configuration: $(if [ -f "netlify.toml" ]; then echo "✓ Present"; else echo "✗ Missing"; fi)"
echo ""

echo "🏁 DEBUGGING COMPLETE"
echo "===================="
echo "Check /tmp/ directory for detailed response files"
echo "Run this script again to re-test after changes"