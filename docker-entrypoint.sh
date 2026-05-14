#!/bin/sh
set -eu

mkdir -p /app/data/eval

if [ ! -f /app/data/eval/best-config.json ] && [ -f /app/default-data/eval/best-config.json ]; then
  cp /app/default-data/eval/best-config.json /app/data/eval/best-config.json
fi

if [ ! -f /app/data/eval/baseline-report.json ] && [ -f /app/default-data/eval/baseline-report.json ]; then
  cp /app/default-data/eval/baseline-report.json /app/data/eval/baseline-report.json
fi

if [ ! -f /app/data/eval/benchmark-cases.json ] && [ -f /app/default-data/eval/benchmark-cases.json ]; then
  cp /app/default-data/eval/benchmark-cases.json /app/data/eval/benchmark-cases.json
fi

if [ ! -f /app/data/eval/benchmark-report.json ] && [ -f /app/default-data/eval/benchmark-report.json ]; then
  cp /app/default-data/eval/benchmark-report.json /app/data/eval/benchmark-report.json
fi

# Keep database schema in sync on startup when enabled.
# Disable by setting PRISMA_DB_PUSH_ON_START=false.
if [ "${PRISMA_DB_PUSH_ON_START:-true}" = "true" ]; then
  echo "[entrypoint] Running prisma db push..."
  npx prisma db push
fi

exec "$@"
