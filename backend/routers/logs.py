from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db, WorkoutLog, MealLog
from models.schemas import WorkoutLogIn, WorkoutLogOut, MealLogIn, MealLogOut
from datetime import date
from typing import List

router = APIRouter(prefix="/logs", tags=["logs"])


# ── Workout Logs ──────────────────────────────────────────────────────────────

@router.post("/workout", response_model=WorkoutLogOut)
def add_workout_log(entry: WorkoutLogIn, db: Session = Depends(get_db)):
    log = WorkoutLog(**entry.model_dump())
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@router.get("/workout", response_model=List[WorkoutLogOut])
def get_workout_logs(log_date: date | None = None, db: Session = Depends(get_db)):
    query = db.query(WorkoutLog)
    if log_date:
        query = query.filter(WorkoutLog.date == log_date)
    return query.order_by(WorkoutLog.date.desc(), WorkoutLog.created_at.desc()).all()


@router.delete("/workout/{log_id}")
def delete_workout_log(log_id: int, db: Session = Depends(get_db)):
    log = db.query(WorkoutLog).filter(WorkoutLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    db.delete(log)
    db.commit()
    return {"ok": True}


# ── Meal Logs ─────────────────────────────────────────────────────────────────

@router.post("/meal", response_model=MealLogOut)
def add_meal_log(entry: MealLogIn, db: Session = Depends(get_db)):
    log = MealLog(**entry.model_dump())
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@router.get("/meal", response_model=List[MealLogOut])
def get_meal_logs(log_date: date | None = None, db: Session = Depends(get_db)):
    query = db.query(MealLog)
    if log_date:
        query = query.filter(MealLog.date == log_date)
    return query.order_by(MealLog.date.desc(), MealLog.created_at.desc()).all()


@router.delete("/meal/{log_id}")
def delete_meal_log(log_id: int, db: Session = Depends(get_db)):
    log = db.query(MealLog).filter(MealLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    db.delete(log)
    db.commit()
    return {"ok": True}


# ── Summary ───────────────────────────────────────────────────────────────────

@router.get("/summary")
def daily_summary(log_date: date = date.today(), db: Session = Depends(get_db)):
    workouts = db.query(WorkoutLog).filter(WorkoutLog.date == log_date).all()
    meals = db.query(MealLog).filter(MealLog.date == log_date).all()

    total_calories = sum(m.calories or 0 for m in meals)
    total_protein = sum(m.protein_g or 0 for m in meals)
    total_carbs = sum(m.carbs_g or 0 for m in meals)
    total_fat = sum(m.fat_g or 0 for m in meals)

    return {
        "date": log_date.isoformat(),
        "workouts_completed": len([w for w in workouts if w.completed]),
        "total_workouts": len(workouts),
        "nutrition": {
            "calories": round(total_calories, 1),
            "protein_g": round(total_protein, 1),
            "carbs_g": round(total_carbs, 1),
            "fat_g": round(total_fat, 1),
        },
    }
