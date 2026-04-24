from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from routers import garmin, metrics, exercise, diet, logs, chat

app = FastAPI(title="Health Dashboard API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:4173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(garmin.router)
app.include_router(metrics.router)
app.include_router(exercise.router)
app.include_router(diet.router)
app.include_router(logs.router)
app.include_router(chat.router)


@app.on_event("startup")
def startup():
    init_db()


@app.get("/health")
def health_check():
    return {"status": "ok"}
