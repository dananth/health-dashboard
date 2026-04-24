from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db, UserProfile
from models.schemas import UserProfileIn, MetricsOut
from datetime import datetime

router = APIRouter(prefix="/metrics", tags=["metrics"])

ACTIVITY_MULTIPLIERS = {
    "sedentary": 1.2,
    "light": 1.375,
    "moderate": 1.55,
    "active": 1.725,
    "very_active": 1.9,
}


def calculate_metrics(profile: UserProfileIn) -> dict:
    w = profile.weight_kg
    h = profile.height_cm
    age = profile.age

    bmi = round(w / ((h / 100) ** 2), 1)

    if bmi < 18.5:
        bmi_category = "Underweight"
    elif bmi < 25:
        bmi_category = "Normal"
    elif bmi < 30:
        bmi_category = "Overweight"
    else:
        bmi_category = "Obese"

    # Mifflin-St Jeor BMR
    if profile.gender.lower() == "male":
        bmr = 10 * w + 6.25 * h - 5 * age + 5
    else:
        bmr = 10 * w + 6.25 * h - 5 * age - 161

    multiplier = ACTIVITY_MULTIPLIERS.get(profile.activity_level, 1.55)
    tdee = round(bmr * multiplier, 0)

    # Target calories: 500 kcal deficit for weight loss, +300 for muscle gain
    if profile.goal == "weight_loss":
        target = tdee - 500
    elif profile.goal == "muscle_gain":
        target = tdee + 300
    else:
        target = tdee

    # Devine formula ideal weight
    if profile.gender.lower() == "male":
        ideal = 50 + 2.3 * ((h / 2.54) - 60)
    else:
        ideal = 45.5 + 2.3 * ((h / 2.54) - 60)

    # US Navy body fat estimate (simplified, needs neck/waist measurements — approximation)
    body_fat = None

    return {
        "bmi": bmi,
        "bmi_category": bmi_category,
        "bmr": round(bmr, 0),
        "tdee": tdee,
        "target_calories": round(target, 0),
        "ideal_weight_kg": round(ideal, 1),
        "body_fat_estimate": body_fat,
        "activity_level": profile.activity_level,
        "goal": profile.goal,
    }


@router.post("/calculate", response_model=MetricsOut)
def compute_metrics(profile: UserProfileIn, db: Session = Depends(get_db)):
    # Upsert user profile
    existing = db.query(UserProfile).first()
    if existing:
        for k, v in profile.model_dump().items():
            setattr(existing, k, v)
        existing.updated_at = datetime.utcnow()
    else:
        db.add(UserProfile(**profile.model_dump()))
    db.commit()
    return calculate_metrics(profile)


@router.get("/profile")
def get_profile(db: Session = Depends(get_db)):
    profile = db.query(UserProfile).first()
    if not profile:
        return None
    return {
        "weight_kg": profile.weight_kg,
        "height_cm": profile.height_cm,
        "age": profile.age,
        "gender": profile.gender,
        "activity_level": profile.activity_level,
        "goal": profile.goal,
    }
