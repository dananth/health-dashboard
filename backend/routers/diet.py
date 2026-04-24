from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db, UserProfile
from routers.metrics import calculate_metrics
from services.ai_service import generate_diet_plan
from models.schemas import UserProfileIn

router = APIRouter(prefix="/diet", tags=["diet"])


@router.get("/recommendations")
def diet_recommendations(db: Session = Depends(get_db)):
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
    plan = generate_diet_plan(metrics)
    return plan
