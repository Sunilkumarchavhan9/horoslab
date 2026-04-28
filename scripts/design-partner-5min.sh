#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${MEMORYOS_BASE_URL:-http://localhost:3001}"
TOKEN="${1:-${MEMORYOS_API_TOKEN:-}}"
THREAD_ID="${2:-week2-design-partner-$(date +%s)}"
PROJECT="${3:-MemoryOS}"

if [[ -z "$TOKEN" ]]; then
  echo "Usage: MEMORYOS_API_TOKEN=<token> $0"
  echo "   or: $0 <token> [thread_id] [project]"
  exit 1
fi

auth_header=( -H "Authorization: Bearer ${TOKEN}" -H "Content-Type: application/json" )

echo "== 1) Health check =="
curl -sS "${BASE_URL}/api/health"
echo

echo "== 2) Ingest one real work update =="
curl -sS -X POST "${BASE_URL}/api/memory/process" \
  "${auth_header[@]}" \
  -d "{
    \"threadId\": \"${THREAD_ID}\",
    \"message\": \"I am building ${PROJECT}. Next I need to ship one production milestone and close open loops.\"
  }"
echo

echo "== 3) Retrieve continuity =="
curl -sS -X POST "${BASE_URL}/api/memory/retrieve" \
  "${auth_header[@]}" \
  -d "{
    \"question\": \"What should I build next for ${PROJECT}?\",
    \"project\": \"${PROJECT}\",
    \"threadId\": \"${THREAD_ID}\",
    \"topK\": 5
  }"
echo

echo "== 4) Resume planning =="
curl -sS -X POST "${BASE_URL}/api/memory/resume" \
  "${auth_header[@]}" \
  -d "{
    \"question\": \"Where did I leave off on ${PROJECT}?\",
    \"project\": \"${PROJECT}\",
    \"threadId\": \"${THREAD_ID}\",
    \"topK\": 5
  }"
echo

echo "== 5) Generate handoff =="
curl -sS -X POST "${BASE_URL}/api/memory/handoff" \
  "${auth_header[@]}" \
  -d "{
    \"question\": \"Create handoff for next developer\",
    \"project\": \"${PROJECT}\",
    \"threadId\": \"${THREAD_ID}\",
    \"topK\": 5
  }"
echo

echo "== Done =="
echo "Thread: ${THREAD_ID}"
echo "Project: ${PROJECT}"
