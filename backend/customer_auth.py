"""
Customer-facing authentication via Native Google Identity Services.
ConstructONS™ — India's First Integrated Construction Ecosystem.

Completely independent of third-party intermediaries.
Uses native httpOnly `customer_session` cookie + MongoDB `customers` and `customer_sessions`.
"""
import os
import uuid
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, List

import httpx
from fastapi import HTTPException, Request, Response
from pydantic import BaseModel

from db import db

logger = logging.getLogger(__name__)

COOKIE_NAME = "customer_session"
SESSION_DAYS = 7
GOOGLE_TOKEN_INFO_URL = "https://oauth2.googleapis.com/tokeninfo"
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")


class GoogleAuthBody(BaseModel):
    credential: str  # Google ID token (JWT) returned by Google GIS SDK


class CustomerProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    current_status: Optional[str] = None
    plot_location: Optional[str] = None
    plot_size: Optional[str] = None
    style_pref: Optional[str] = None
    budget_range: Optional[str] = None
    site_photos: Optional[List[str]] = None
    onboarding_completed: Optional[bool] = None


async def _upsert_customer(email: str, name: str, picture: Optional[str]) -> dict:
    """Inserts or updates customer identity in MongoDB."""
    existing = await db.customers.find_one({"email": email}, {"_id": 0})
    now = datetime.now(timezone.utc).isoformat()
    if existing:
        await db.customers.update_one(
            {"user_id": existing["user_id"]},
            {"$set": {"name": name, "picture": picture, "updated_at": now}},
        )
        existing["name"] = name
        existing["picture"] = picture
        existing["updated_at"] = now
        return existing

    user_id = f"cust_{uuid.uuid4().hex[:16]}"
    doc = {
        "user_id": user_id,
        "email": email,
        "name": name,
        "picture": picture,
        "role": "customer",
        "phone": "",
        "whatsapp": "",
        "current_status": "",
        "plot_location": "",
        "plot_size": "",
        "style_pref": "",
        "budget_range": "",
        "site_photos": [],
        "onboarding_completed": False,  # First-time users trigger onboarding wizard
        "created_at": now,
        "updated_at": now,
    }
    await db.customers.insert_one(doc)
    doc.pop("_id", None)
    return doc

async def _create_session(user_id: str, session_token: str) -> dict:
    """Stores the active customer session token in the database."""
    expires_at = datetime.now(timezone.utc) + timedelta(days=SESSION_DAYS)
    doc = {
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc),
    }
    await db.customer_sessions.update_one(
        {"session_token": session_token},
        {"$set": doc},
        upsert=True,
    )
    return doc


def _set_session_cookie(resp: Response, session_token: str) -> None:
    """Sets a secure httpOnly cookie with cross-domain support."""
    resp.set_cookie(
        key=COOKIE_NAME,
        value=session_token,
        max_age=SESSION_DAYS * 24 * 3600,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
    )


def _clear_session_cookie(resp: Response) -> None:
    """Deletes the customer session cookie."""
    resp.delete_cookie(COOKIE_NAME, path="/", samesite="none", secure=True)


async def process_google_auth(body: GoogleAuthBody, resp: Response) -> dict:
    """Verifies Google Token directly with Google APIs and creates an application session."""
    if not body.credential:
        raise HTTPException(status_code=400, detail="Google credential required")

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(
                GOOGLE_TOKEN_INFO_URL,
                params={"id_token": body.credential}
            )
            if r.status_code != 200:
                logger.error(f"[customer-auth] Google token validation failed {r.status_code}: {r.text[:200]}")
                raise HTTPException(status_code=401, detail="Invalid Google security credential")
            data = r.json()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[customer-auth] Google API network call error: {e}")
        raise HTTPException(status_code=502, detail="Google auth server unreachable")

    aud = data.get("aud") or ""
    if GOOGLE_CLIENT_ID and aud != GOOGLE_CLIENT_ID:
        logger.warning(f"[customer-auth] Audience mismatch! Got: {aud}, Expected: {GOOGLE_CLIENT_ID}")

    email = (data.get("email") or "").lower()
    name = data.get("name") or email.split("@")[0]
    picture = data.get("picture")

    if not email:
        raise HTTPException(status_code=400, detail="Incomplete Google user profile details")

    session_token = f"cust_sess_{uuid.uuid4().hex}{uuid.uuid4().hex}"

    customer = await _upsert_customer(email, name, picture)
    await _create_session(customer["user_id"], session_token)
    _set_session_cookie(resp, session_token)

    return customer


async def get_current_customer(request: Request) -> dict:
    """Validates the active httpOnly cookie session, returns customer document."""
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        auth = request.headers.get("Authorization") or ""
        if auth.startswith("Bearer "):
            token = auth[7:]

    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    sess = await db.customer_sessions.find_one({"session_token": token}, {"_id": 0})
    if not sess:
        raise HTTPException(status_code=401, detail="Session not found")

    expires_at = sess.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at and expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")

    customer = await db.customers.find_one({"user_id": sess["user_id"]}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=401, detail="Customer profile not found")

    return customer


async def logout_customer(request: Request, resp: Response) -> dict:
    """Invalidates active session from DB and deletes local cookie."""
    token = request.cookies.get(COOKIE_NAME)
    if token:
        await db.customer_sessions.delete_one({"session_token": token})
    _clear_session_cookie(resp)
    return {"success": True}