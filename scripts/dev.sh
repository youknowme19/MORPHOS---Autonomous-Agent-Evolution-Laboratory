#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -d .venv ]]; then
  /opt/homebrew/bin/python3.11 -m venv .venv
  .venv/bin/pip install -e ".[dev]"
fi

.venv/bin/uvicorn main:app --reload --app-dir apps/api --host 127.0.0.1 --port 8000 &
API_PID=$!
trap 'kill $API_PID' EXIT

cd "$ROOT/apps/web"
if [[ ! -d node_modules ]]; then
  npm install
fi
npm run dev
