"""Admin auth — JWT stored in an httpOnly, Secure, SameSite=None cookie.

Credentials live in MongoDB (`admin_users` collection) with bcrypt-hashed
passwords, so they survive every future re-deploy without any .env edits.
On first startup the collection is seeded from the `ADMIN_EMAIL` /
`ADMIN_PASSWORD` env vars if it's empty (bootstrap only).
"""
import os
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
import jwt
from fastapi import Depends, HTTPException, Request, Response, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from db import db

JWT_SECRET = os.environ.get("JWT_SECRET", "changeme")
JWT_ALGO = "HS256"

# Cookie configuration
COOKIE_NAME = "cons_admin_token"
COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7  # 7 days
COOKIE_PATH = "/"

# Defaults set to 'true' and 'none' for Vercel -> Render cross-domain authentication
COOKIE_SECURE = os.environ.get("COOKIE_SECURE", "true").lower() != "false"
COOKIE_SAMESITE = os.environ.get("COOKIE_SAMESITE", "none").lower()

security = HTTPBearer(auto_error=False)


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _check_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_admin_token(email: str) -> str:
    payload = {
        "sub": email,
        "role": "admin",
        "exp": datetime.now(timezone.utc) + timedelta(seconds=COOKIE_MAX_AGE_SECONDS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


async def verify_admin_credentials(email: str, password: str) -> bool:
    """Look up the admin in Mongo and verify the bcrypt-hashed password."""
    if not email or not password:
        return False
    normalized = email.strip().lower()
    user = await db.admin_users.find_one({"email": normalized, "is_active": True})
    if not user:
        return False
    return _check_password(password, user.get("password_hash", ""))


async def ensure_admin_seeded() -> None:
    """Idempotent seed & self-heal for admin credentials.

    Behaviour:
      * If the `admin_users` collection is empty, create an admin from the
        `ADMIN_EMAIL` / `ADMIN_PASSWORD` env vars (bootstrap).
      * If those env vars specify an email that is NOT in the DB, ADD that
        admin (so a fresh deploy with new env vars self-heals).
      * NEVER overwrites an existing admin's password from env — password
        changes must go through a proper "change password" flow later.
    """
    from models import new_id, now_iso  # local import to avoid cycles

    env_email = os.environ.get("ADMIN_EMAIL", "").strip().lower()
    env_password = os.environ.get("ADMIN_PASSWORD", "")

    count = await db.admin_users.count_documents({})

    if count == 0:
        # First boot / fresh DB — seed the bootstrap admin.
        if not env_email or not env_password:
            env_email = env_email or "admin@constructons.in"
            env_password = env_password or "admin123"
        await db.admin_users.insert_one({
            "id": new_id(),
            "email": env_email,
            "password_hash": _hash_password(env_password),
            "role": "admin",
            "is_active": True,
            "created_at": now_iso(),
            "updated_at": now_iso(),
        })
        return

    # Self-heal: if the env vars name a new admin email that doesn't exist,
    # add them alongside any existing admins. Helps a fresh production deploy
    # where the .env has the owner's real email pick that up automatically.
    if env_email and env_password:
        existing = await db.admin_users.find_one({"email": env_email})
        if not existing:
            await db.admin_users.insert_one({
                "id": new_id(),
                "email": env_email,
                "password_hash": _hash_password(env_password),
                "role": "admin",
                "is_active": True,
                "created_at": now_iso(),
                "updated_at": now_iso(),
            })


def set_admin_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        max_age=COOKIE_MAX_AGE_SECONDS,
        expires=COOKIE_MAX_AGE_SECONDS,
        path=COOKIE_PATH,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
    )


def clear_admin_cookie(response: Response) -> None:
    response.delete_cookie(
        key=COOKIE_NAME,
        path=COOKIE_PATH,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
    )


def _decode_and_check(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    if payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return payload


async def require_admin(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
):
    cookie_token = request.cookies.get(COOKIE_NAME)
    if cookie_token:
        return _decode_and_check(cookie_token)
    if credentials and credentials.credentials:
        return _decode_and_check(credentials.credentials)
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated"
    )