#!/usr/bin/env bash
# start.sh — run both backend and frontend together
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

# ── Backend ───────────────────────────────────────────────────────────────────
if [ ! -d "$ROOT/backend/.venv" ]; then
  echo "Setting up Python virtual environment…"
  python3 -m venv "$ROOT/backend/.venv"
  "$ROOT/backend/.venv/bin/pip" install -q -r "$ROOT/backend/requirements.txt"
fi

if [ ! -f "$ROOT/backend/.env" ]; then
  echo "⚠  No .env found — copying from .env.example. Please fill in your credentials."
  cp "$ROOT/backend/.env.example" "$ROOT/backend/.env"
fi

echo "Starting backend on :8000…"
cd "$ROOT/backend"
.venv/bin/uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!

# ── Frontend ──────────────────────────────────────────────────────────────────
echo "Starting frontend on :5173…"
cd "$ROOT/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Health Dashboard running!"
echo "   Frontend → http://localhost:5173"
echo "   API docs  → http://localhost:8000/docs"
echo ""
echo "Press Ctrl-C to stop."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM
wait
