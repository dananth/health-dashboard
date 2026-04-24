from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db, UserProfile
from routers.metrics import calculate_metrics
from services.ai_service import generate_workout_plan
from services.garmin_service import get_sleep_data, get_user_stats
from models.schemas import UserProfileIn

router = APIRouter(prefix="/exercise", tags=["exercise"])


@router.get("/suggestions")
def exercise_suggestions(db: Session = Depends(get_db)):
    profile = db.query(UserProfile).first()
    if not profile:
        return {"error": "Please set up your profile first via /metrics/calculate"}

    profile_in = UserProfileIn(
        weight_kg=profile.weight_kg,
        height_cm=profile.height_cm,
        age=profile.age,
        gender=profile.gender,
        activity_level=profile.activity_level,
        goal=profile.goal,
    )
    metrics = calculate_metrics(profile_in)

    sleep_data = get_sleep_data(days=1)
    last_sleep = sleep_data[0] if sleep_data else {}
    sleep_info = {
        "total_hours": round(last_sleep.get("total_seconds", 0) / 3600, 1),
        "score": last_sleep.get("score"),
    }

    garmin_stats = get_user_stats()

    plan = generate_workout_plan(metrics, sleep_info, garmin_stats)
    return plan
