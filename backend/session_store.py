"""
Session store for Garmin credentials and the cached Garmin client.

Token persistence strategy:
- After first successful login, OAuth tokens are saved to TOKEN_DIR on disk.
- On subsequent logins (or server restarts), saved tokens are loaded first.
- This avoids re-authenticating with Garmin SSO on every restart, preventing
  429 Too Many Requests errors from Garmin's rate limiter.
- TOKEN_DIR defaults to /data/garmin_tokens (Railway volume) or .garmin_tokens locally.
"""
import os
from pathlib import Path
from typing import Optional
from garminconnect import Garmin

# Store tokens in Railway's persistent volume if available, else local dir
TOKEN_DIR = Path(os.getenv("GARMIN_TOKEN_DIR", "/data/garmin_tokens" if Path("/data").exists() else ".garmin_tokens"))

_session: dict = {
    "email": None,
    "password": None,
    "client": None,
    "logged_in": False,
}


def _token_path(email: str) -> Path:
    """Return per-user token directory."""
    safe = email.replace("@", "_at_").replace(".", "_")
    return TOKEN_DIR / safe


def set_credentials(email: str, password: str) -> None:
    _session["email"] = email
    _session["password"] = password
    _session["client"] = None
    _session["logged_in"] = False


def get_garmin_client() -> Garmin:
    if _session["logged_in"] and _session["client"] is not None:
        return _session["client"]

    email = _session["email"]
    password = _session["password"]
    if not email or not password:
        raise RuntimeError("Not authenticated. Please log in via /auth/login.")

    token_path = _token_path(email)

    # Try loading saved tokens first — avoids hitting Garmin SSO
    if token_path.exists():
        try:
            client = Garmin()
            client.login(tokenstore=str(token_path))
            _session["client"] = client
            _session["logged_in"] = True
            return client
        except Exception:
            # Tokens expired or invalid — fall through to full login
            pass

    # Full OAuth login with credentials
    client = Garmin(email, password)
    client.login()

    # Persist tokens for future restarts
    try:
        token_path.mkdir(parents=True, exist_ok=True)
        client.garth.dump(str(token_path))
    except Exception:
        pass  # token save failure is non-fatal

    _session["client"] = client
    _session["logged_in"] = True
    return client


def clear_session() -> None:
    _session["email"] = None
    _session["password"] = None
    _session["client"] = None
    _session["logged_in"] = False


def is_logged_in() -> bool:
    return bool(_session["logged_in"] and _session["email"])


def is_logged_in() -> bool:
    return bool(_session["logged_in"] and _session["email"])
