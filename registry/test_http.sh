#!/bin/bash
BASE_URL="${1:-http://localhost:3456}"
PASS=0
FAIL=0
TOTAL=0

check() {
  local name="$1"
  local status="$2"
  TOTAL=$((TOTAL + 1))
  if [ "$status" -ge 200 ] && [ "$status" -lt 300 ]; then
    PASS=$((PASS + 1))
    echo "PASS [$status] $name"
  else
    FAIL=$((FAIL + 1))
    echo "FAIL [$status] $name"
  fi
}

echo "ASM Registry HTTP API Test"
echo "Base URL: ${BASE_URL}"
echo ""

echo "-- 1. Health Check --"
RESP=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/health")
STATUS=$(echo "$RESP" | tail -1)
check "GET /api/health" "$STATUS"
echo ""

echo "-- 2. GET /api/services (asm_list) --"
LIST_RESP=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/services")
LIST_STATUS=$(echo "$LIST_RESP" | tail -1)
LIST_BODY=$(echo "$LIST_RESP" | sed '$d')
check "GET /api/services" "$LIST_STATUS"
echo ""

FIRST_ID=$(echo "$LIST_BODY" | python3 -c 'import sys,json; print(json.load(sys.stdin)["services"][0]["service_id"])' 2>/dev/null)

echo "-- 3. GET /api/services/:id (asm_get) --"
RESP=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/services/$FIRST_ID")
STATUS=$(echo "$RESP" | tail -1)
check "GET /api/services/$FIRST_ID" "$STATUS"
echo ""

RESP=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/services/nonexistent/service-id")
STATUS=$(echo "$RESP" | tail -1)
TOTAL=$((TOTAL + 1))
if [ "$STATUS" -eq 404 ]; then
  PASS=$((PASS + 1))
  echo "PASS [$STATUS] GET nonexistent service (correctly 404)"
else
  FAIL=$((FAIL + 1))
  echo "FAIL [$STATUS] expected 404"
fi
echo ""

echo "-- 4. POST /api/query (asm_query) --"
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/query" -H "Content-Type: application/json" -d '{"taxonomy": "ai.llm"}')
STATUS=$(echo "$RESP" | tail -1)
check "POST /api/query {taxonomy: ai.llm}" "$STATUS"
echo ""

RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/query" -H "Content-Type: application/json" -d '{"taxonomy": "ai.llm", "min_quality": 0.5, "sort_by": "quality", "limit": 3}')
STATUS=$(echo "$RESP" | tail -1)
check "POST /api/query {compound filter}" "$STATUS"
echo ""

echo "-- 5. POST /api/compare (asm_compare) --"
IDS=$(echo "$LIST_BODY" | python3 -c 'import sys,json; d=json.load(sys.stdin); print(json.dumps([s["service_id"] for s in d["services"][:2]]))' 2>/dev/null)
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/compare" -H "Content-Type: application/json" -d "{\"service_ids\": $IDS}")
STATUS=$(echo "$RESP" | tail -1)
check "POST /api/compare (2 services)" "$STATUS"
echo ""

RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/compare" -H "Content-Type: application/json" -d '{"service_ids": ["only-one"]}')
STATUS=$(echo "$RESP" | tail -1)
TOTAL=$((TOTAL + 1))
if [ "$STATUS" -eq 400 ]; then
  PASS=$((PASS + 1))
  echo "PASS [$STATUS] POST /api/compare rejects <2 services"
else
  FAIL=$((FAIL + 1))
  echo "FAIL [$STATUS] expected 400"
fi
echo ""

echo "-- 6. CORS Check --"
CORS_HEADER=$(curl -s -I -X OPTIONS "$BASE_URL/api/services" -H "Origin: http://example.com" -H "Access-Control-Request-Method: GET" 2>/dev/null | grep -i "access-control-allow-origin" | head -1)
TOTAL=$((TOTAL + 1))
if echo "$CORS_HEADER" | grep -qi "access-control"; then
  PASS=$((PASS + 1))
  echo "PASS CORS header present"
else
  FAIL=$((FAIL + 1))
  echo "FAIL CORS header not found"
fi
echo ""

echo "========================================"
echo "Result: $PASS passed / $FAIL failed / $TOTAL total"
echo "========================================"
[ "$FAIL" -gt 0 ] && exit 1 || exit 0
