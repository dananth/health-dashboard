from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from session_store import set_credentials, clear_session, is_logged_in, get_garmin_client

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/login")
def login(req: LoginRequest):
    if not req.email or not req.password:
        raise HTTPException(status_code=400, detail="Email and password are required.")
    try:
        set_credentials(req.email, req.password)
        get_garmin_client()  # validate credentials immediately
    except Exception as e:
        clear_session()
        raise HTTPException(status_code=401, detail=f"Garmin login failed: {str(e)}")
    return {"ok": True, "email": req.email}


@router.post("/logout")
def logout():
    clear_session()
    return {"ok": True}


@router.get("/status")
def status():
    return {"logged_in": is_logged_in()}
