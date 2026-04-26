"""
In-memory session store for Garmin credentials and the cached Garmin client.
Credentials are never written to disk — cleared on server restart.
"""
from typing import Optional
from garminconnect import Garmin

# Single-user session (extend to dict keyed by session token for multi-user)
_session: dict = {
    "email": None,
    "password": None,
    "client": None,
    "logged_in": False,
}


def set_credentials(email: str, password: str) -> None:
    _session["email"] = email
    _session["password"] = password
    _session["client"] = None  # force re-login
    _session["logged_in"] = False


def get_garmin_client() -> Garmin:
    if _session["logged_in"] and _session["client"] is not None:
        return _session["client"]

    email = _session["email"]
    password = _session["password"]
    if not email or not password:
        raise RuntimeError("Not authenticated. Please log in via /auth/login.")

    client = Garmin(email, password)
    client.login()
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
