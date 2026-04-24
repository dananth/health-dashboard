from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime


# ── Garmin ────────────────────────────────────────────────────────────────────
class HeartRatePoint(BaseModel):
    timestamp: str
    value: int


class StepsDay(BaseModel):
    date: str
    steps: int
    goal: int


class SleepDay(BaseModel):
    date: str
    total_seconds: int
    deep_seconds: int
    light_seconds: int
    rem_seconds: int
    awake_seconds: int
    score: Optional[int] = None


class GarminSummary(BaseModel):
    heart_rate: List[HeartRatePoint]
    steps: List[StepsDay]
    sleep: List[SleepDay]
    resting_hr: Optional[int] = None
    vo2max: Optional[float] = None
    stress_level: Optional[int] = None
    calories_active: Optional[int] = None


# ── User Profile & Metrics ────────────────────────────────────────────────────
class UserProfileIn(BaseModel):
    weight_kg: float
    height_cm: float
    age: int
    gender: str  # male | female
    activity_level: str = "moderate"  # sedentary | light | moderate | active | very_active
    goal: str = "weight_loss"  # weight_loss | maintenance | muscle_gain


class MetricsOut(BaseModel):
    bmi: float
    bmi_category: str
    bmr: float
    tdee: float
    target_calories: float
    ideal_weight_kg: float
    body_fat_estimate: Optional[float] = None


# ── Exercise ──────────────────────────────────────────────────────────────────
class Exercise(BaseModel):
    name: str
    category: str
    sets: Optional[int] = None
    reps: Optional[str] = None
    duration_minutes: Optional[int] = None
    rest_seconds: Optional[int] = None
    description: str
    intensity: str  # low | moderate | high


class WorkoutPlan(BaseModel):
    rationale: str
    exercises: List[Exercise]
    total_duration_minutes: int
    calories_estimate: int


# ── Diet ──────────────────────────────────────────────────────────────────────
class MealItem(BaseModel):
    name: str
    portion: str
    calories: int
    protein_g: float
    carbs_g: float
    fat_g: float


class Meal(BaseModel):
    type: str  # Breakfast | Lunch | Dinner | Snack
    items: List[MealItem]
    total_calories: int


class DietPlan(BaseModel):
    daily_calorie_target: int
    protein_target_g: float
    carbs_target_g: float
    fat_target_g: float
    meals: List[Meal]
    tips: List[str]


# ── Logs ──────────────────────────────────────────────────────────────────────
class WorkoutLogIn(BaseModel):
    date: date
    exercise_name: str
    sets: Optional[int] = None
    reps: Optional[int] = None
    duration_minutes: Optional[int] = None
    notes: Optional[str] = None
    completed: int = 1


class WorkoutLogOut(WorkoutLogIn):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class MealLogIn(BaseModel):
    date: date
    meal_type: str
    food_name: str
    calories: Optional[float] = None
    protein_g: Optional[float] = None
    carbs_g: Optional[float] = None
    fat_g: Optional[float] = None
    notes: Optional[str] = None


class MealLogOut(MealLogIn):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ── AI Chat ───────────────────────────────────────────────────────────────────
class ChatMessage(BaseModel):
    role: str  # user | assistant
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    context: Optional[str] = None  # e.g. "substitute: push-ups"
