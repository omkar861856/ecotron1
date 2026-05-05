#!/bin/bash

# Ecotron API Test Suite
# Run this on your server to verify all endpoints are working.

BASE_URL="http://localhost:3001"
echo "--- Starting Ecotron API Tests ---"

# 1. Health Check
echo -n "Test 1: Health Check... "
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health")
if [ "$HEALTH" == "200" ]; then echo "✅ PASS"; else echo "❌ FAIL ($HEALTH)"; fi

# 2. Resume
echo -n "Test 2: Resume Endpoint... "
RESUME=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/resume" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Test resume data"}')
if [ "$RESUME" == "200" ]; then echo "✅ PASS"; else echo "❌ FAIL ($RESUME)"; fi

# 3. Rewrite
echo -n "Test 3: Rewrite Endpoint... "
REWRITE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/rewrite" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Test rewrite data"}')
if [ "$REWRITE" == "200" ]; then echo "✅ PASS"; else echo "❌ FAIL ($REWRITE)"; fi

# 4. Summarize
echo -n "Test 4: Summarize Endpoint... "
SUMMARIZE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/summarize" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Test summarize data"}')
if [ "$SUMMARIZE" == "200" ]; then echo "✅ PASS"; else echo "❌ FAIL ($SUMMARIZE)"; fi

echo "--- Tests Complete ---"
