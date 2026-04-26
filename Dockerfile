# ── Stage 1: Build the React frontend ────────────────────────────────────────
FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ── Stage 2: Python backend + bundled frontend ────────────────────────────────
# Use full image (not slim) to avoid missing system libs (needed by garminconnect/cloudscraper)
FROM python:3.13

WORKDIR /app

# Install Python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/ ./

# Smoke-test all imports so the build fails loudly if a dependency is missing
RUN python -c "import fastapi, uvicorn, sqlalchemy, garminconnect, openai, aiofiles; print('All imports OK')"

# Copy built frontend into backend's expected location
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Railway injects $PORT at runtime; default to 8000 for local docker runs
EXPOSE 8000

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --log-level info"]
