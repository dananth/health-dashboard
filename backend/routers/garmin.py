from fastapi import APIRouter
from services.garmin_service import get_heart_rate_data, get_steps_data, get_sleep_data, get_user_stats

router = APIRouter(prefix="/garmin", tags=["garmin"])


@router.get("/summary")
def garmin_summary(days: int = 7):
    stats = get_user_stats()
    return {
        "heart_rate": get_heart_rate_data(days),
        "steps": get_steps_data(days),
        "sleep": get_sleep_data(days),
        **stats,
    }


@router.get("/heart-rate")
def heart_rate(days: int = 7):
    return get_heart_rate_data(days)


@router.get("/steps")
def steps(days: int = 7):
    return get_steps_data(days)


@router.get("/sleep")
def sleep(days: int = 7):
    return get_sleep_data(days)


@router.get("/stats")
def stats():
    return get_user_stats()
