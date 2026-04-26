# Health Dashboard

A personal health tracking web app powered by Garmin Connect data and OpenAI.

## Stack
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + TanStack Query + Recharts
- **Backend**: Python 3.13 + FastAPI + SQLAlchemy (SQLite) + garminconnect + OpenAI
- **Auth**: Session-based Garmin login (credentials stored server-side in memory, never persisted)

## Project Structure
```
health-dashboard/
├── start.sh                    # Starts both backend and frontend
├── backend/
│   ├── main.py                 # FastAPI app, CORS, router registration
│   ├── database.py             # SQLAlchemy models: WorkoutLog, MealLog, UserProfile
│   ├── requirements.txt
│   ├── .env                    # OPENAI_API_KEY only (Garmin creds entered via UI)
│   ├── .env.example
│   ├── routers/
│   │   ├── auth.py             # POST /auth/login, POST /auth/logout, GET /auth/status
│   │   ├── garmin.py           # GET /garmin/summary|heart-rate|steps|sleep|stats
│   │   ├── metrics.py          # POST /metrics/calculate, GET /metrics/profile
│   │   ├── exercise.py         # GET /exercise/suggestions  (calls OpenAI)
│   │   ├── diet.py             # GET /diet/recommendations  (calls OpenAI)
│   │   ├── logs.py             # CRUD /logs/workout|meal, GET /logs/summary
│   │   └── chat.py             # POST /chat/ (streaming SSE)
│   └── services/
│       ├── garmin_service.py   # garminconnect wrapper; credentials from session store
│       └── ai_service.py       # OpenAI client with truststore for Cisco SSL proxy
└── frontend/
    └── src/
        ├── App.tsx             # QueryClientProvider + BrowserRouter + auth guard
        ├── api.ts              # axios instance + all API functions + streamChat
        ├── hooks.ts            # TanStack Query hooks for all endpoints
        └── pages/
            ├── Login.tsx       # Garmin login form
            ├── Home.tsx        # Charts (HR, steps, sleep) + computed metrics + profile setup
            ├── Exercise.tsx    # AI workout plan + per-exercise AI substitute chat panel
            ├── Diet.tsx        # Vegetarian calorie-deficit meal plan + macro pie chart
            └── Logger.tsx      # Daily workout + meal logging with running totals
```

## Running Locally

### First time setup
```bash
# Backend
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env — only OPENAI_API_KEY is needed; Garmin creds are entered via the UI

# Frontend
cd ../frontend
npm install
```

### Start (both services)
```bash
./start.sh
# or separately:
# Terminal 1: cd backend && source .venv/bin/activate && uvicorn main:app --reload --port 8000
# Terminal 2: cd frontend && npm run dev
```

- Frontend: http://localhost:5173
- API docs:  http://localhost:8000/docs

## Key Notes

### SSL / Corporate Proxy
The backend uses `truststore` to pull SSL certificates from the macOS system keychain.
This is required because Cisco Secure Access (corporate VPN) performs SSL inspection,
replacing server certs with its own — which certifi does not trust but the OS keychain does.

### Garmin Authentication
Credentials are entered via the Login page and held in a server-side in-memory session dict.
They are **never written to disk**. On server restart the session is cleared and user must log in again.
The garminconnect client is cached per-session for performance.

### OpenAI Usage
- Model: `gpt-4o-mini` (cost-efficient)
- Exercise and Diet endpoints use `response_format: json_object` for structured output
- Chat endpoint uses streaming (`text/plain` SSE) for real-time responses
- System prompt enforces vegetarian diet and safety-first advice

### Database
SQLite file at `backend/health.db` (git-ignored). Tables:
- `user_profile` — weight, height, age, gender, activity level, goal
- `workout_logs` — date, exercise name, sets/reps/duration, notes
- `meal_logs` — date, meal type, food name, macros, notes

## Common Commands
```bash
# Restart backend after code changes
pkill -f uvicorn && cd backend && source .venv/bin/activate && uvicorn main:app --reload --port 8000

# Check API health
curl http://localhost:8000/health

# View all logs
curl http://localhost:8000/logs/summary

# Push changes
git add -A && git commit -m "..." && git push
```

## Environment Variables
| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | Yes | OpenAI API key (sk-...) |
| `DATABASE_URL` | No | Defaults to `sqlite:///./health.db` |
