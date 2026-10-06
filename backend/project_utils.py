"""Shared helper services and utility functions for ConstructONS backend."""
import uuid
import time
import asyncio
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
from fastapi import HTTPException, Request
from auth import require_admin
from db import db
from email_service import send_project_notification_email

logger = logging.getLogger(__name__)

# Timezone
IST = timezone(timedelta(hours=5, minutes=30))

def _ist_today() -> str:
    return datetime.now(IST).date().isoformat()

# Rate Limiting Service
_RATE_LIMITS: Dict[str, List[float]] = {}

def apply_rate_limit(request: Request, limit: int = 5, window_sec: int = 60):
    ip = request.client.host
    path = request.url.path
    key = f"{ip}:{path}"
    now = time.time()
    if key not in _RATE_LIMITS:
        _RATE_LIMITS[key] = []
    _RATE_LIMITS[key] = [t for t in _RATE_LIMITS[key] if now - t < window_sec]
    if len(_RATE_LIMITS[key]) >= limit:
        raise HTTPException(status_code=429, detail="Too many requests. Please wait a minute and try again.")
    _RATE_LIMITS[key].append(now)

# Security Access Verification
def _enforce_full_access(proj: dict, user_email: str):
    if proj.get("customer_email", "").lower() == user_email:
        return True
    for member in proj.get("team_directory", []):
        if member.get("email", "").lower() == user_email:
            if member.get("access") == "Full Access":
                return True
            break
    raise HTTPException(status_code=403, detail="Security Action Blocked: You require 'Full Access' permissions to perform this action.")

# Default Stage Initialization
DEFAULT_STAGES = [
    ("Discovery", "Understanding your brief, budget, style and site."),
    ("Design", "Floor plans, 3D elevations and interior direction approved."),
    ("Approvals", "Municipal sanctions, permits and utility clearances."),
    ("Booking", "Contract signed and advance payment received."),
    ("Site Preparation", "Excavation, marking and levelling on your plot."),
    ("Foundation", "Footings, plinth beams and DPC waterproofing."),
    ("Structure", "RCC columns, beams and slabs for every floor."),
    ("Walls & MEP", "Masonry, electrical, plumbing rough-ins."),
    ("Finishing", "Plaster, paint, flooring, joinery and interiors."),
    ("Handover", "Snags fixed, cleaning done, keys and documents handed over."),
]

def _default_stage_list() -> List[Dict[str, Any]]:
    return [{
        "id": f"stg_{uuid.uuid4().hex[:8]}",
        "index": i, "name": name, "description": desc, "status": "pending",
        "started_at": None, "completed_at": None, 
        "start_date": None, "planned_end_date": None, "actual_end_date": None,
        "progress_pct": 0, "photos": [], "documents": [], "notes": "",
        "substages": []
    } for i, (name, desc) in enumerate(DEFAULT_STAGES)]

# Progress Engine Calculators
def _recalculate_stage_from_substages(stage: dict) -> dict:
    substages = stage.get("substages") or []
    active_subs = [s for s in substages if not s.get("archived")]
    
    if not active_subs:
        return stage
    
    total = sum(float(s.get("progress_pct") or 0) for s in active_subs)
    parent_progress = round(total / len(active_subs))
    stage["progress_pct"] = parent_progress
    
    if parent_progress == 100:
        stage["status"] = "completed"
    elif parent_progress > 0:
        stage["status"] = "in_progress"
    else:
        stage["status"] = "pending"
    
    planned_starts = [s.get("start_date") for s in active_subs if s.get("start_date")]
    planned_ends = [s.get("planned_end_date") for s in active_subs if s.get("planned_end_date")]
    
    if planned_starts:
        stage["start_date"] = min(planned_starts)
    if planned_ends:
        stage["planned_end_date"] = max(planned_ends)
        stage["expected_date"] = max(planned_ends)
    
    actual_starts = [s.get("actual_start_date") for s in active_subs if s.get("actual_start_date")]
    if actual_starts:
        stage["actual_start_date"] = min(actual_starts)
        stage["started_at"] = min(actual_starts)
    
    if all(s.get("progress_pct") == 100 for s in active_subs):
        actual_ends = [s.get("actual_end_date") for s in active_subs if s.get("actual_end_date")]
        if actual_ends:
            stage["actual_end_date"] = max(actual_ends)
            stage["completed_at"] = max(actual_ends)
    else:
        stage["actual_end_date"] = None
        stage["completed_at"] = None
    
    return stage

def _apply_progress_rules_to_substage(sub: dict, new_progress: float) -> dict:
    old_progress = float(sub.get("progress_pct") or 0)
    new_progress = max(0, min(100, round(float(new_progress))))
    today_iso = datetime.now(timezone.utc).date().isoformat()
    
    sub["progress_pct"] = new_progress
    
    if old_progress == 0 and new_progress > 0:
        if not sub.get("actual_start_date"):
            sub["actual_start_date"] = today_iso
    
    if new_progress == 100:
        if not sub.get("actual_end_date"):
            sub["actual_end_date"] = today_iso
        sub["status"] = "completed"
    elif old_progress == 100 and new_progress < 100:
        sub["actual_end_date"] = None
        sub["status"] = "in_progress" if new_progress > 0 else "pending"
    elif new_progress > 0 and new_progress < 100:
        sub["status"] = "in_progress"
    elif new_progress == 0:
        sub["status"] = "pending"
    
    return sub

# Logging & Notifications
async def _log_activity(project_id: str, user_name: str, action: str, module: str):
    await db.projects.update_one(
        {"id": project_id, "$or": [{"activities": {"$exists": False}}, {"activities": None}]},
        {"$set": {"activities": []}}
    )
    activity = {
        "id": str(uuid.uuid4()), "user_name": user_name, "action": action,
        "module": module, "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    await db.projects.update_one(
        {"id": project_id},
        {"$push": {"activities": {"$each": [activity], "$slice": -100}}},
    )

async def _push_notification(project_id: str, title: str, message: str, link: str, icon_type: str = "general"):
    await db.projects.update_one(
        {"id": project_id, "$or": [{"notifications": {"$exists": False}}, {"notifications": None}]},
        {"$set": {"notifications": []}}
    )
    notif = {
        "id": str(uuid.uuid4()), "title": title, "message": message,
        "link": link, "icon": icon_type, "is_read": False,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    await db.projects.update_one(
        {"id": project_id},
        {"$push": {"notifications": {"$each": [notif], "$slice": 50, "$sort": {"timestamp": -1}}}},
    )

    try:
        proj = await db.projects.find_one({"id": project_id}, {"customer_email": 1, "customer_name": 1, "title": 1})
        if proj and proj.get("customer_email"):
            asyncio.create_task(
                send_project_notification_email(
                    to_email=proj.get("customer_email"),
                    customer_name=proj.get("customer_name") or "",
                    project_title=proj.get("title") or "My Home Project",
                    notification_title=title,
                    notification_message=message,
                    portal_link=link
                )
            )
    except Exception as e:
        logger.warning(f"Failed to schedule email notification for project {project_id}: {e}")

async def _build_unified_team(proj: dict) -> List[Dict[str, Any]]:
    unified: List[Dict[str, Any]] = []
    team_ids = proj.get("team_ids") or []
    if team_ids:
        docs = await db.team_members.find({"id": {"$in": team_ids}, "is_published": True}, {"_id": 0}).to_list(100)
        id_map = {d["id"]: d for d in docs}
        for tid in team_ids:
            if tid in id_map:
                m = id_map[tid]
                unified.append({
                    "id": m["id"], "name": m.get("name"), "email": None,
                    "role": m.get("designation") or m.get("role") or "Staff",
                    "company": "ConstructONS",
                    "contact": m.get("phone") or m.get("whatsapp") or "",
                    "access": "Full Access", "status": "Active",
                    "photo": m.get("photo"),
                    "whatsapp": m.get("whatsapp") or m.get("phone"),
                    "bio": m.get("bio"), "linkedin": m.get("linkedin"),
                    "is_core": True,
                })
    for ext in proj.get("team_directory") or []:
        unified.append({
            "id": ext.get("id"), "name": ext.get("name"), "email": ext.get("email"),
            "role": ext.get("role"), "company": ext.get("company") or "—",
            "contact": ext.get("contact") or "",
            "access": ext.get("access") or "View Access",
            "status": ext.get("status") or "Pending",
            "photo": ext.get("avatar"), "whatsapp": ext.get("contact"),
            "bio": None, "linkedin": None, "is_core": False,
        })
    return unified

async def _auto_activate_pending_user(project_id: str, email: str, name: str):
    proj = await db.projects.find_one({"id": project_id}, {"team_directory": 1})
    if not proj:
        return
    directory = proj.get("team_directory") or []
    updated = False
    activated_role = ""
    for item in directory:
        if item.get("email") and item.get("email").lower() == email.lower() and item.get("status") == "Pending":
            item["status"] = "Active"
            if name and not item.get("name"):
                item["name"] = name
            updated = True
            activated_role = item.get("role") or "Team Member"
    if updated:
        await db.projects.update_one({"id": project_id}, {"$set": {"team_directory": directory}})
        await _log_activity(project_id, name or email, f"{name or email} joined the project as {activated_role}", "Team")

async def _push_admin_notification(title: str, message: str, link: str, type_tag: str = "general", project_id: str = None, severity: str = "info"):
    """Push a notification visible to all admins in the admin dashboard."""
    from db import db
    import uuid
    from datetime import datetime, timezone
    
    try:
        notif = {
            "id": f"notif_{uuid.uuid4().hex[:12]}",
            "title": title,
            "message": message,
            "link": link,
            "type": type_tag,
            "severity": severity,
            "project_id": project_id,
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.admin_notifications.insert_one(notif)
    except Exception as e:
        import logging
        logging.error(f"[Admin Notification Error] {e}")

