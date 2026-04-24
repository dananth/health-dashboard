import os
from datetime import date, timedelta
from typing import Optional
from garminconnect import Garmin
from dotenv import load_dotenv

load_dotenv()

_client: Optional[Garmin] = None


def _get_client() -> Garmin:
    global _client
    if _client is None:
        email = os.getenv("GARMIN_EMAIL")
        password = os.getenv("GARMIN_PASSWORD")
        if not email or not password:
            raise RuntimeError("GARMIN_EMAIL and GARMIN_PASSWORD must be set in .env")
        _client = Garmin(email, password)
        _client.login()
    return _client


def get_heart_rate_data(days: int = 7) -> list[dict]:
    client = _get_client()
    result = []
    for i in range(days - 1, -1, -1):
        day = (date.today() - timedelta(days=i)).isoformat()
        try:
            data = client.get_heart_rates(day)
            for point in (data.get("heartRateValues") or []):
                if point and point[1] is not None:
                    result.append({"timestamp": str(point[0]), "value": int(point[1])})
        except Exception:
            pass
    return result


def get_steps_data(days: int = 7) -> list[dict]:
    client = _get_client()
    result = []
    for i in range(days - 1, -1, -1):
        day = (date.today() - timedelta(days=i)).isoformat()
        try:
            data = client.get_steps_data(day)
            total = sum(s.get("steps", 0) for s in (data or []))
            result.append({"date": day, "steps": total, "goal": 10000})
        except Exception:
            result.append({"date": day, "steps": 0, "goal": 10000})
    return result


def get_sleep_data(days: int = 7) -> list[dict]:
    client = _get_client()
    result = []
    for i in range(days - 1, -1, -1):
        day = (date.today() - timedelta(days=i)).isoformat()
        try:
            data = client.get_sleep_data(day)
            daily = data.get("dailySleepDTO", {})
            result.append({
                "date": day,
                "total_seconds": daily.get("sleepTimeSeconds", 0),
                "deep_seconds": daily.get("deepSleepSeconds", 0),
                "light_seconds": daily.get("lightSleepSeconds", 0),
                "rem_seconds": daily.get("remSleepSeconds", 0),
                "awake_seconds": daily.get("awakeSleepSeconds", 0),
                "score": daily.get("sleepScores", {}).get("overall", {}).get("value"),
            })
        except Exception:
            result.append({
                "date": day, "total_seconds": 0, "deep_seconds": 0,
                "light_seconds": 0, "rem_seconds": 0, "awake_seconds": 0, "score": None,
            })
    return result


def get_user_stats() -> dict:
    client = _get_client()
    try:
        today = date.today().isoformat()
        stats = client.get_stats(today)
        return {
            "resting_hr": stats.get("restingHeartRate"),
            "vo2max": stats.get("maxVO2") or stats.get("vo2MaxPreciseValue"),
            "stress_level": stats.get("averageStressLevel"),
            "calories_active": stats.get("activeKilocalories"),
        }
    except Exception:
        return {"resting_hr": None, "vo2max": None, "stress_level": None, "calories_active": None}
