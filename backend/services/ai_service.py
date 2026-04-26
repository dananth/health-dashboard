import os
import sys
import ssl
import httpx
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

# On macOS with corporate SSL inspection (e.g. Cisco Secure Access) the system
# keychain must be used via truststore. On Linux (Railway) default SSL works fine.
if sys.platform == "darwin":
    try:
        import truststore
        truststore.inject_into_ssl()
        _ssl_context = truststore.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
        _http_client = httpx.Client(verify=_ssl_context)
    except ImportError:
        _http_client = httpx.Client()
else:
    _http_client = httpx.Client()

# Lazy singleton — not created at import time so a missing API key doesn't
# crash the server on startup; it raises a proper 500 only when AI is called.
_openai_client: OpenAI | None = None


def _get_client() -> OpenAI:
    global _openai_client
    if _openai_client is None:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise RuntimeError("OPENAI_API_KEY environment variable is not set.")
        _openai_client = OpenAI(api_key=api_key, http_client=_http_client)
    return _openai_client


SYSTEM_PROMPT = """You are a certified personal trainer and registered dietitian.
You provide evidence-based, safe fitness and nutrition advice.
The user follows a vegetarian diet. Always prioritise safety — if a user reports pain or injury, advise rest and professional consultation.
Be concise, practical, and encouraging."""


def generate_workout_plan(metrics: dict, sleep: dict, garmin_stats: dict) -> dict:
    user_context = f"""
User metrics:
- BMI: {metrics.get('bmi')} ({metrics.get('bmi_category')})
- BMR: {metrics.get('bmr')} kcal/day
- TDEE: {metrics.get('tdee')} kcal/day
- Activity level: {metrics.get('activity_level', 'moderate')}
- Sleep last night: {sleep.get('total_hours', 'unknown')} hrs, score: {sleep.get('score', 'unknown')}
- Resting HR: {garmin_stats.get('resting_hr', 'unknown')} bpm
- VO2 Max: {garmin_stats.get('vo2max', 'unknown')}
- Goal: {metrics.get('goal', 'weight_loss')}
"""
    response = _get_client().chat.completions.create(
        model="gpt-4o-mini",
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT + "\nRespond ONLY with valid JSON matching this schema: {rationale: string, exercises: [{name, category, sets, reps, duration_minutes, rest_seconds, description, intensity}], total_duration_minutes: number, calories_estimate: number}"},
            {"role": "user", "content": f"Create a workout plan for today based on these metrics:\n{user_context}"}
        ]
    )
    import json
    return json.loads(response.choices[0].message.content)


def generate_diet_plan(metrics: dict) -> dict:
    user_context = f"""
User metrics:
- Target calories: {metrics.get('target_calories')} kcal/day
- BMI: {metrics.get('bmi')} ({metrics.get('bmi_category')})
- Goal: {metrics.get('goal', 'weight_loss')}
- Diet: Vegetarian (no meat, no fish; eggs and dairy allowed)
"""
    response = _get_client().chat.completions.create(
        model="gpt-4o-mini",
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT + "\nRespond ONLY with valid JSON matching this schema: {daily_calorie_target: number, protein_target_g: number, carbs_target_g: number, fat_target_g: number, meals: [{type, items: [{name, portion, calories, protein_g, carbs_g, fat_g}], total_calories}], tips: [string]}"},
            {"role": "user", "content": f"Create a full-day vegetarian meal plan for calorie deficit:\n{user_context}"}
        ]
    )
    import json
    return json.loads(response.choices[0].message.content)


def stream_chat(messages: list[dict], context: str | None = None):
    system = SYSTEM_PROMPT
    if context:
        system += f"\n\nContext: {context}"
    all_messages = [{"role": "system", "content": system}] + messages
    stream = _get_client().chat.completions.create(
        model="gpt-4o-mini",
        messages=all_messages,
        stream=True,
    )
    for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta
