"""Project routes — customer view + admin management.
Phase 3: Stages, Substages, Progress Engine & Comprehensive PDF Reporting.
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone, timedelta
import uuid
import time
import asyncio
import random
from db import db
from auth import require_admin
from customer_auth import get_current_customer
from fastapi.responses import HTMLResponse
from fastapi import File, UploadFile
from media_service import put_object, build_storage_path 
proj_router = APIRouter(prefix="/api", tags=["projects"])

IST = timezone(timedelta(hours=5, minutes=30))

def _ist_today() -> str:
    return datetime.now(IST).date().isoformat()

_RATE_LIMITS = {}

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

def _enforce_full_access(proj: dict, user_email: str):
    if proj.get("customer_email", "").lower() == user_email:
        return True
    for member in proj.get("team_directory", []):
        if member.get("email", "").lower() == user_email:
            if member.get("access") == "Full Access":
                return True
            break
    raise HTTPException(status_code=403, detail="Security Action Blocked: You require 'Full Access' permissions to perform this action.")


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
# ============================================================================
# CANONICAL PROGRESS CALCULATION SERVICE (PRD Rule #9)
# Single source of truth — used by ALL stage/substage mutations
# ============================================================================

def _recalculate_stage_from_substages(stage: dict) -> dict:
    """
    FROZEN PRD RULES:
    - Parent Progress = arithmetic mean of active child progress percentages
    - Parent Planned Start = earliest child planned_start
    - Parent Planned End = latest child planned_end
    - Parent Actual Start = earliest child actual_start (if all children have started)
    - Parent Actual End = latest child actual_end (only if all children completed)
    - When all children reach 100%, parent auto-becomes 100% + Completed
    """
    substages = stage.get("substages") or []
    active_subs = [s for s in substages if not s.get("archived")]
    
    if not active_subs:
        # No children → parent stays as-is (but warning shown in UI)
        return stage
    
    # 1. Arithmetic mean progress
    total = sum(float(s.get("progress_pct") or 0) for s in active_subs)
    parent_progress = round(total / len(active_subs))
    stage["progress_pct"] = parent_progress
    
    # 2. Auto status transitions
    if parent_progress == 100:
        stage["status"] = "completed"
    elif parent_progress > 0:
        stage["status"] = "in_progress"
    else:
        stage["status"] = "pending"
    
    # 3. Derived planned dates from children
    planned_starts = [s.get("start_date") for s in active_subs if s.get("start_date")]
    planned_ends = [s.get("planned_end_date") for s in active_subs if s.get("planned_end_date")]
    
    if planned_starts:
        stage["start_date"] = min(planned_starts)
    if planned_ends:
        stage["planned_end_date"] = max(planned_ends)
        stage["expected_date"] = max(planned_ends)  # legacy field sync
    
    # 4. Derived actual dates
    actual_starts = [s.get("actual_start_date") for s in active_subs if s.get("actual_start_date")]
    if actual_starts:
        stage["actual_start_date"] = min(actual_starts)
        stage["started_at"] = min(actual_starts)  # legacy field sync
    
    # Only set parent actual_end when ALL children completed
    if all(s.get("progress_pct") == 100 for s in active_subs):
        actual_ends = [s.get("actual_end_date") for s in active_subs if s.get("actual_end_date")]
        if actual_ends:
            stage["actual_end_date"] = max(actual_ends)
            stage["completed_at"] = max(actual_ends)  # legacy field sync
    else:
        # If reverted from all-complete, clear parent actual_end
        stage["actual_end_date"] = None
        stage["completed_at"] = None
    
    return stage


def _apply_progress_rules_to_substage(sub: dict, new_progress: float) -> dict:
    """
    FROZEN PRD RULES for substage progress transitions:
    - 0 → >0: auto-set actual_start_date if blank, status = in_progress
    - Reaches 100: auto-set actual_end_date if blank, status = completed
    - 100 → <100: CLEAR actual_end_date, status = in_progress
    """
    old_progress = float(sub.get("progress_pct") or 0)
    new_progress = max(0, min(100, round(float(new_progress))))
    today_iso = datetime.now(timezone.utc).date().isoformat()
    
    sub["progress_pct"] = new_progress
    
    # Rule: 0 → >0 : auto actual_start_date
    if old_progress == 0 and new_progress > 0:
        if not sub.get("actual_start_date"):
            sub["actual_start_date"] = today_iso
    
    # Rule: reaches 100: auto actual_end_date + status
    if new_progress == 100:
        if not sub.get("actual_end_date"):
            sub["actual_end_date"] = today_iso
        sub["status"] = "completed"
    # Rule: 100 → <100 : clear actual_end_date + revert status
    elif old_progress == 100 and new_progress < 100:
        sub["actual_end_date"] = None
        sub["status"] = "in_progress" if new_progress > 0 else "pending"
    # Rule: normal in-progress transitions
    elif new_progress > 0 and new_progress < 100:
        sub["status"] = "in_progress"
    elif new_progress == 0:
        sub["status"] = "pending"
    
    return sub

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


from email_service import send_project_notification_email

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

    # 📧 Email Integration: Fetch project customer info and dispatch email notification
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

# ---------------- Schemas ----------------
class ProjectCreateBody(BaseModel):
    customer_email: str
    customer_name: Optional[str] = None
    title: str = "My Home Project"
    address: Optional[str] = None
    package_slug: Optional[str] = None
    quote_id: Optional[str] = None
    contract_value: Optional[float] = 0
    amount_spent: Optional[float] = 0
    cover_image: Optional[str] = None
    team_ids: Optional[List[str]] = Field(default_factory=list)
    site_lat: Optional[float] = None
    site_lng: Optional[float] = None
    expected_completion: Optional[str] = None   # ADD — ISO date "YYYY-MM-DD"
    start_date: Optional[str] = None            # optional — project start

class ProjectUpdateBody(BaseModel):
    title: Optional[str] = None
    address: Optional[str] = None
    status: Optional[str] = None
    package_slug: Optional[str] = None
    quote_id: Optional[str] = None
    contract_value: Optional[float] = None
    amount_spent: Optional[float] = None
    cover_image: Optional[str] = None
    team_ids: Optional[List[str]] = None
    documents: Optional[List[Dict[str, Any]]] = None
    approvals: Optional[List[Dict[str, Any]]] = None
    cctv_cameras: Optional[List[Dict[str, Any]]] = None
    site_lat: Optional[float] = None
    site_lng: Optional[float] = None
    expected_completion: Optional[str] = None   # ADD
    start_date: Optional[str] = None            # ADD if you want editable start

class SubstageBody(BaseModel):
    name: str = Field(..., min_length=2)
    start_date: Optional[str] = None
    planned_end_date: Optional[str] = None
    actual_start_date: Optional[str] = None  # NEW - explicit field per PRD
    actual_end_date: Optional[str] = None
    status: str = "pending"
    progress_pct: float = 0

class StageAddBody(BaseModel):
    name: str = Field(..., min_length=2)
    description: Optional[str] = ""
    start_date: Optional[str] = None
    planned_end_date: Optional[str] = None
    actual_end_date: Optional[str] = None
    status: str = "pending"
    progress_pct: float = 0
    notes: Optional[str] = ""

class StagePatchBody(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    expected_date: Optional[str] = None
    start_date: Optional[str] = None
    planned_end_date: Optional[str] = None
    actual_end_date: Optional[str] = None
    progress_pct: Optional[float] = None
    photos: Optional[List[str]] = None
    documents: Optional[List[Dict[str, Any]]] = None
    notes: Optional[str] = None
    substages: Optional[List[Dict[str, Any]]] = None

class ReorderStagesBody(BaseModel):
    stage_ids: List[str]
class TeamInviteBody(BaseModel):
    name: Optional[str] = ""
    email: Optional[str] = None
    phone: Optional[str] = None
    role: str
    access: str = "View Access"
    company: Optional[str] = ""
    contact: Optional[str] = None
class RejectStageBody(BaseModel):
    reason: str
class AttendanceBody(BaseModel):
    member_ids: List[str] = Field(default_factory=list)

class NotificationMarkReadBody(BaseModel):
    notification_id: str
class DrawingRequestBody(BaseModel):
    category: str
    title: str
    reason: Optional[str] = None

class DrawingRequestUpdateBody(BaseModel):
    status: str  # 'fulfilled' or 'dismissed'
class DrawingCreateBody(BaseModel):
    name: str
    category: str
    url: str

class DrawingRevisionBody(BaseModel):
    url: str

class DrawingDecisionBody(BaseModel):
    decision: str
    comment: Optional[str] = None

class MaterialCreateBody(BaseModel):
    category: str
    item_name: str
    brand: Optional[str] = None
    grade_spec: Optional[str] = None
    quantity: float = 0
    unit: str = "Nos"
    unit_price: float = 0
    status: str = "ordered"
    payment_status: str = "pending"
    photo_url: Optional[str] = None
    invoice_url: Optional[str] = None
    notes: Optional[str] = None

class MaterialUpdateBody(MaterialCreateBody):
    pass

class MaterialDecisionBody(BaseModel):
    decision: str
    comment: Optional[str] = None

class PaymentLogBody(BaseModel):
    amount: float
    date: str
    method: str = "Bank Transfer"
    reference: Optional[str] = ""
    notes: Optional[str] = ""

class DocumentCreateBody(BaseModel):
    name: str
    category: str  
    stage: Optional[str] = None
    status: str = "Current"
    description: Optional[str] = None
    url: str

class DocumentRevisionBody(BaseModel):
    url: str
    status: Optional[str] = "Current"

class DocumentPatchBody(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    stage: Optional[str] = None
    status: Optional[str] = None
    description: Optional[str] = None
class WarrantyUpdateBody(BaseModel):
    warranty_start_date: Optional[str] = None
    warranty_years: Optional[int] = None

class MaintenanceTicketCreateBody(BaseModel):
    title: str = Field(..., min_length=3, max_length=100)
    category: str  # 'Plumbing', 'Electrical', 'Structural', 'General', etc.
    priority: str  # 'Low', 'Medium', 'High', 'Emergency'
    description: str
    photo_urls: List[str] = Field(default_factory=list)

class MaintenanceTicketUpdateBody(BaseModel):
    status: str  # 'open', 'in_progress', 'resolved'
    admin_notes: Optional[str] = None


# ---------------- Daily Reports Schemas ----------------
class DailyReportPhotoBody(BaseModel):
    url: str
    caption: Optional[str] = None
    time: Optional[str] = None

class DailyReportCreateBody(BaseModel):
    date: str  # YYYY-MM-DD
    overall_status: str = "Work as per plan"
    status_notes: Optional[str] = None
    work_completed: List[str] = Field(default_factory=list)
    planned_tomorrow: List[str] = Field(default_factory=list)
    photos: List[DailyReportPhotoBody] = Field(default_factory=list)

class DailyReportUpdateBody(BaseModel):
    date: Optional[str] = None
    overall_status: Optional[str] = None
    status_notes: Optional[str] = None
    work_completed: Optional[List[str]] = None
    planned_tomorrow: Optional[List[str]] = None
    photos: Optional[List[DailyReportPhotoBody]] = None
class QualityStageCreate(BaseModel):
    name: str = Field(..., min_length=2)

class QualityCheckCreate(BaseModel):
    area: str = Field(..., min_length=1)
    check_text: str = Field(..., min_length=2)
    pm_remark: Optional[str] = ""
    photo_urls: List[str] = Field(default_factory=list)

class ClientApproveCheckBody(BaseModel):
    remark: Optional[str] = None

class ClientRaiseIssueBody(BaseModel):
    description: str = Field(..., min_length=3)
    photo_urls: List[str] = Field(default_factory=list)

class IssueAdminUpdateBody(BaseModel):
    assigned_to: Optional[str] = None
    target_date: Optional[str] = None
    status: str  # 'open', 'in_progress', 'ready_for_client_review'
    resolution_remark: Optional[str] = None
    resolution_photos: List[str] = Field(default_factory=list)

class IssueClientReviewBody(BaseModel):
    approved: bool
    remark: Optional[str] = None
# ---------- PORTAL UPLOAD (client-safe, same storage as admin) ----------
@proj_router.post("/portal/upload/image")
async def portal_upload_image(
    file: UploadFile = File(...), 
    folder: str = "issues",
    customer=Depends(get_current_customer)
):
    """Allows authenticated clients to upload issue photos."""
    data = await file.read()
    path = build_storage_path(folder, file.filename, file.content_type)
    res = put_object(path, data, file.content_type)
    return {"url": res.get("url") or res.get("secure_url")}

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


# ============================================================================
# Customer Portal Endpoints
# ============================================================================

@proj_router.get("/portal/my-projects-list")
async def portal_my_projects_list(customer=Depends(get_current_customer)):
    email = (customer.get("email") or "").lower()
    if not email:
        return {"projects": []}
    cursor = db.projects.find(
        {"$or": [{"customer_email": email}, {"team_directory.email": email}]},
        {"id": 1, "title": 1, "project_code": 1, "address": 1, "cover_image": 1, "customer_email": 1, "team_directory": 1, "updated_at": 1}
    ).sort("updated_at", -1)
    projects = await cursor.to_list(100)
    out = []
    for p in projects:
        role = "Project Owner" if p.get("customer_email") == email else "Guest"
        for t in p.get("team_directory", []):
            if t.get("email") == email:
                role = t.get("role") or role
                break
        out.append({"id": p["id"], "title": p.get("title") or "Unnamed Project", "project_code": p.get("project_code"), "address": p.get("address"), "cover_image": p.get("cover_image"), "user_role": role})
    return {"projects": out}


@proj_router.get("/portal/my-project")
async def portal_my_project(project_id: Optional[str] = None, customer=Depends(get_current_customer)):
    email = (customer.get("email") or "").lower()
    name = customer.get("name") or ""
    if not email:
        raise HTTPException(status_code=404, detail="No user email found")
    query = {"$or": [{"customer_email": email}, {"team_directory.email": email}]}
    if project_id:
        query["id"] = project_id
    proj = await db.projects.find_one(query, {"_id": 0}, sort=[("updated_at", -1)])
    if not proj:
        return {"project": None}
    await _auto_activate_pending_user(proj["id"], email, name)
    proj["team"] = await _build_unified_team(proj)
    notifs = proj.get("notifications") or []
    drawings = proj.get("drawings") or []
    materials = proj.get("materials") or []
    proj["unread_notifications"] = len([n for n in notifs if not n.get("is_read")])
    proj["pending_approvals"] = len([d for d in drawings if d.get("status") == "pending"]) + len([m for m in materials if m.get("status") == "pending"])
    # PRD Rule 6: Client only sees approved snapshot
    client_stages = []
    for s in (proj.get("stages") or []):
        if s.get("published_data"):
            # Has been approved before -> show the last approved snapshot
            client_stages.append(s["published_data"])
        else:
            # Never approved -> show structure but zero out progress/dates
            safe_s = dict(s)
            safe_s["progress_pct"] = 0
            safe_s["status"] = "pending"
            safe_s["actual_end_date"] = None
            safe_s["started_at"] = None
            for sub in safe_s.get("substages", []):
                sub["progress_pct"] = 0
                sub["status"] = "pending"
                sub["actual_end_date"] = None
            client_stages.append(safe_s)
    proj["stages"] = client_stages
    return {"project": proj}


@proj_router.get("/portal/my-project/team-data")
async def portal_team_data(project_id: Optional[str] = None, customer=Depends(get_current_customer)):
    email = (customer.get("email") or "").lower()
    name = customer.get("name") or ""
    query = {"$or": [{"customer_email": email}, {"team_directory.email": email}]}
    if project_id:
        query["id"] = project_id
    proj = await db.projects.find_one(query, {"_id": 0, "id": 1, "customer_email": 1, "team_ids": 1, "team_directory": 1, "activities": 1, "attendance": 1, "title": 1}, sort=[("updated_at", -1)])
    if not proj:
        raise HTTPException(status_code=404, detail="No project found")
    await _auto_activate_pending_user(proj["id"], email, name)
    members = await _build_unified_team(proj)
    today = _ist_today()
    attendance = sorted(proj.get("attendance") or [], key=lambda a: a.get("date", ""), reverse=True)
    today_entry = next((a for a in attendance if a.get("date") == today), None)
    on_site_ids = set((today_entry or {}).get("member_ids") or [])
    for m in members:
        m["on_site"] = m["id"] in on_site_ids
    kpis = {
        "total_members": len(members), "on_site_today": len(on_site_ids),
        "contractors": sum(1 for t in members if "contractor" in str(t.get("role", "")).lower()),
        "consultants": sum(1 for t in members if any(k in str(t.get("role", "")).lower() for k in ("consultant", "architect", "designer"))),
        "clients": sum(1 for t in members if any(k in str(t.get("role", "")).lower() for k in ("owner", "client", "spouse", "family"))),
        "pending_invites": sum(1 for t in members if t.get("status") == "Pending"),
    }
    activities = proj.get("activities") or []
    activities.sort(key=lambda x: x.get("timestamp") or "", reverse=True)
    return {"kpis": kpis, "team_members": members, "activities": activities, "attendance": attendance[:7], "on_site_ids": list(on_site_ids), "date_today": today}


@proj_router.post("/portal/my-project/team/invite")
async def portal_invite_team_member(request: Request, body: TeamInviteBody, customer=Depends(get_current_customer)):
    apply_rate_limit(request, limit=5, window_sec=60)
    email = (customer.get("email") or "").lower()
    proj = await db.projects.find_one({"$or": [{"customer_email": email}, {"team_directory.email": email}]}, {"id": 1, "title": 1, "customer_email": 1, "team_directory": 1})
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    _enforce_full_access(proj, email)
    contact = (body.phone or body.contact or "").strip()
    invitee_email = (body.email or "").lower().strip()
    if not invitee_email:
        raise HTTPException(status_code=400, detail="Google Email is required for authentication")
    status = "Active" if invitee_email == email else "Pending"
    new_member = {"id": f"usr_{uuid.uuid4().hex[:12]}", "name": (body.name or "").strip() or invitee_email.split("@")[0], "email": invitee_email, "phone": contact, "role": body.role, "company": (body.company or "Family").strip(), "contact": contact, "access": body.access, "status": status, "avatar": None, "invited_at": datetime.now(timezone.utc).isoformat()}
    existing = await db.projects.find_one({"id": proj["id"], "team_directory.email": invitee_email}, {"_id": 1})
    if existing:
        raise HTTPException(status_code=409, detail="This email has already been added to the project team")
    await db.projects.update_one({"id": proj["id"]}, {"$push": {"team_directory": new_member}})
    await _log_activity(proj["id"], customer.get("name") or "Project Owner", f"Invited {new_member['name']} ({invitee_email}) as {new_member['role']}", "Team")
    return {"success": True, "member": new_member, "project_title": proj.get("title")}


@proj_router.delete("/portal/my-project/team/{member_id}")
async def portal_remove_invited_team_member(request: Request, member_id: str, customer=Depends(get_current_customer)):
    apply_rate_limit(request, limit=10, window_sec=60)
    email = (customer.get("email") or "").lower()
    proj = await db.projects.find_one({"$or": [{"customer_email": email}, {"team_directory.email": email}]}, {"id": 1, "customer_email": 1, "team_directory": 1})
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    _enforce_full_access(proj, email)
    primary_owner_email = (proj.get("customer_email") or "").lower()
    is_primary_owner = (email == primary_owner_email)
    target = next((m for m in proj.get("team_directory", []) if m.get("id") == member_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Member not found or is a core staff member assigned by Admin")
    target_email = (target.get("email") or "").lower()
    if target_email == primary_owner_email:
        raise HTTPException(status_code=400, detail="The Primary Project Owner cannot be removed.")
    if target_email == email:
        raise HTTPException(status_code=400, detail="You cannot remove yourself.")
    if not is_primary_owner and target.get("access") == "Full Access":
        raise HTTPException(status_code=403, detail="Only the Primary Project Owner can remove Co-Owners.")
    await db.projects.update_one({"id": proj["id"]}, {"$pull": {"team_directory": {"id": member_id}}})
    await _log_activity(proj["id"], customer.get("name") or "Client", f"Removed {target.get('name')} ({target.get('role')}) from project", "Team")
    return {"success": True}


@proj_router.patch("/portal/my-project/notifications/read")
async def portal_mark_notification_read(body: NotificationMarkReadBody, customer=Depends(get_current_customer)):
    email = (customer.get("email") or "").lower()
    proj = await db.projects.find_one({"$or": [{"customer_email": email}, {"team_directory.email": email}]}, {"id": 1, "notifications": 1})
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    await db.projects.update_one({"id": proj["id"], "notifications.id": body.notification_id}, {"$set": {"notifications.$.is_read": True}})
    return {"success": True}

# ============================================================================
# Admin CRUD + Stage/Substage Endpoints
# ============================================================================

@proj_router.get("/admin/projects", dependencies=[Depends(require_admin)])
async def list_projects(q: Optional[str] = None):
    query: Dict[str, Any] = {}
    if q:
        query["$or"] = [{"customer_email": {"$regex": q, "$options": "i"}}, {"customer_name": {"$regex": q, "$options": "i"}}, {"title": {"$regex": q, "$options": "i"}}]
    docs = await db.projects.find(query, {"_id": 0}).sort("created_at", -1).limit(500).to_list(500)
    return docs


@proj_router.get("/admin/projects/{project_id}", dependencies=[Depends(require_admin)])
async def get_project(project_id: str):
    p = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not p:
        raise HTTPException(status_code=404, detail="Not found")
    return p


@proj_router.post("/admin/projects", dependencies=[Depends(require_admin)])
async def create_project(body: ProjectCreateBody):
    email = body.customer_email.lower().strip()
    if not email:
        raise HTTPException(status_code=400, detail="customer_email required")
    existing = await db.projects.find_one({"customer_email": email}, {"id": 1})
    if existing:
        raise HTTPException(status_code=409, detail="Project already exists for this customer")
    now = datetime.now(timezone.utc).isoformat()
    count = await db.projects.count_documents({})
    proj_code = f"CON-{datetime.now(timezone.utc).year}-{(count + 1):04d}"
    owner_name = body.customer_name or email.split("@")[0]
    owner_record = {"id": f"usr_{uuid.uuid4().hex[:12]}", "name": owner_name, "email": email, "role": "Project Owner", "company": "Home Owner", "contact": "", "access": "Full Access", "status": "Active", "avatar": None}
    init_activity = {"id": str(uuid.uuid4()), "user_name": "System Admin", "action": "Project initialized", "module": "System", "timestamp": now}
    init_notif = {"id": str(uuid.uuid4()), "title": "Project Created", "message": f"Welcome to {body.title}! Your digital home tracker is active.", "link": "/portal", "icon": "system", "is_read": False, "timestamp": now}
    doc = {
        "id": str(uuid.uuid4()), "project_code": proj_code, "customer_email": email, "customer_name": owner_name,
        "title": body.title, "address": body.address, "package_slug": body.package_slug, "quote_id": body.quote_id,
        "status": "active", "stages": _default_stage_list(),
        "contract_value": body.contract_value or 0, "amount_spent": body.amount_spent or 0,
        "cover_image": body.cover_image, "team_ids": body.team_ids or [],
        "team_directory": [owner_record], "activities": [init_activity], "notifications": [init_notif],
        "drawings": [], "materials": [], "payments_log": [],
        "attendance": [], "documents": [], "approvals": [], "cctv_cameras": [],
        "created_at": now, "updated_at": now,
        "site_lat": body.site_lat, "site_lng": body.site_lng,
        "expected_completion": body.expected_completion,
        "start_date": body.start_date or now[:10],
    }
    await db.projects.insert_one(doc)
    doc.pop("_id", None)
    return doc


@proj_router.put("/admin/projects/{project_id}", dependencies=[Depends(require_admin)])
async def update_project(project_id: str, body: ProjectUpdateBody):
    upd = {k: v for k, v in body.model_dump().items() if v is not None}
    upd["updated_at"] = datetime.now(timezone.utc).isoformat()
    if body.team_ids is not None:
        await _log_activity(project_id, "System Admin", "Updated internal team assignments", "Team")
        if len(body.team_ids) > 0:
            asyncio.create_task(_push_notification(project_id, "Team Update", "New staff members have been assigned to your project.", "/portal/team", "team"))
    res = await db.projects.update_one({"id": project_id}, {"$set": upd})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return await db.projects.find_one({"id": project_id}, {"_id": 0})


# ---------------- Stages & Substages Management ----------------

@proj_router.post("/admin/projects/{project_id}/stages", dependencies=[Depends(require_admin)])
async def add_stage(project_id: str, body: StageAddBody):
    """Admin adds a new main stage to the project."""
    p = await db.projects.find_one({"id": project_id}, {"_id": 0, "stages": 1})
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    
    stages = p.get("stages") or []
    
    new_stage = {
        "id": f"stg_{uuid.uuid4().hex[:8]}",
        "index": len(stages),
        "name": body.name.strip(),
        "description": body.description or "",
        "status": body.status or "pending",
        "start_date": body.start_date,
        "planned_end_date": body.planned_end_date,
        "actual_end_date": body.actual_end_date,
        "started_at": body.start_date,
        "completed_at": body.actual_end_date if body.status == "completed" else None,
        "expected_date": body.planned_end_date,
        "progress_pct": body.progress_pct or 0,
        "notes": body.notes or "",
        "photos": [],
        "documents": [],
        "substages": []
    }
    
    # Keep Handover & Maintenance locked at the end
    handover_idx = next((i for i, s in enumerate(stages) if "handover" in s.get("name", "").lower()), -1)
    if handover_idx != -1:
        stages.insert(handover_idx, new_stage)
    else:
        stages.append(new_stage)
        
    for i, s in enumerate(stages):
        s["index"] = i
    
    await db.projects.update_one(
        {"id": project_id},
        {"$set": {"stages": stages, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    await _log_activity(project_id, "Admin", f"Added new stage: {body.name}", "Stages")
    return {"success": True, "stages": stages}


@proj_router.put("/admin/projects/{project_id}/stages/reorder", dependencies=[Depends(require_admin)])
async def reorder_stages(project_id: str, body: ReorderStagesBody):
    """Reorder main stages, while strictly keeping Handover locked at the end."""
    p = await db.projects.find_one({"id": project_id}, {"_id": 0, "stages": 1})
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    
    stages = p.get("stages") or []
    stage_map = {s.get("id", str(s.get("index"))): s for s in stages}
    
    reordered = []
    for sid in body.stage_ids:
        if sid in stage_map:
            reordered.append(stage_map[sid])
            
    # Include any missing ones
    for s in stages:
        if s not in reordered:
            reordered.append(s)
            
    # Guarantee Handover / Maintenance remains last
    handover_stage = next((s for s in reordered if "handover" in s.get("name", "").lower()), None)
    if handover_stage:
        reordered.remove(handover_stage)
        reordered.append(handover_stage)
        
    for i, s in enumerate(reordered):
        s["index"] = i
        
    await db.projects.update_one(
        {"id": project_id},
        {"$set": {"stages": reordered, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    await _log_activity(project_id, "Admin", "Reordered project stages", "Stages")
    return {"success": True, "stages": reordered}


@proj_router.patch("/admin/projects/{project_id}/stages/{index}", dependencies=[Depends(require_admin)])
async def patch_stage(project_id: str, index: int, body: StagePatchBody):
    """
    FROZEN PRD: Parent stage cannot have progress/dates independently edited when substages exist.
    Only name, description, notes, photos are directly editable.
    Progress/dates are always derived from children.
    """
    p = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not p:
        raise HTTPException(status_code=404, detail="Not found")
    stages = p.get("stages") or []
    if index < 0 or index >= len(stages):
        raise HTTPException(status_code=400, detail="Invalid stage index")
    
    stage = stages[index]
    substages = stage.get("substages") or []
    has_active_children = len([s for s in substages if not s.get("archived")]) > 0
    old_photos_count = len(stage.get("photos") or [])
    
    patch = body.model_dump(exclude_unset=True)
    
    # ═══════════════════════════════════════════════════════
    # FROZEN PRD RULES ENFORCEMENT
    # ═══════════════════════════════════════════════════════
    if has_active_children:
        # STRIP fields that must be derived from children — cannot be manually set
        patch.pop("progress_pct", None)
        patch.pop("start_date", None)
        patch.pop("planned_end_date", None)
        patch.pop("expected_date", None)
        patch.pop("actual_end_date", None)
        patch.pop("actual_start_date", None)
        patch.pop("status", None)  # status also derived from children progress
        patch.pop("started_at", None)
        patch.pop("completed_at", None)
    else:
        # No children → parent is a leaf; apply PRD progress rules directly
        if "progress_pct" in patch:
            stage = _apply_progress_rules_to_substage(stage, patch["progress_pct"])
            patch.pop("progress_pct", None)  # already applied
            patch.pop("status", None)  # derived
        
        # If admin sets planned dates on childless parent, allow
        if patch.get("status") == "in_progress" and not stage.get("started_at"):
            patch["started_at"] = datetime.now(timezone.utc).isoformat()
    
    # Apply remaining allowed edits (name, description, notes, photos, documents)
    stage.update(patch)
    
    # Always recompute from children if they exist
    if has_active_children:
        stage = _recalculate_stage_from_substages(stage)
    
    stages[index] = stage
    
    # Update monthly progress snapshot
    total_pct = sum(float(s.get("progress_pct") or 0) for s in stages)
    overall_progress = round(total_pct / (len(stages) or 1))
    current_month_label = datetime.now(timezone.utc).strftime("%b %Y")
    monthly_records = p.get("monthly_progress") or []
    month_found = False
    for rec in monthly_records:
        if rec.get("month") == current_month_label:
            rec["actual_pct"] = overall_progress
            month_found = True
            break
    if not month_found:
        monthly_records.append({"month": current_month_label, "actual_pct": overall_progress})
    stages[index]["approval_status"] = "draft"
    await db.projects.update_one(
        {"id": project_id}, 
        {"$set": {
            "stages": stages, 
            "monthly_progress": monthly_records,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Notification triggers
    new_photos_count = len(stage.get("photos") or [])
    if new_photos_count > old_photos_count:
        photos_added = new_photos_count - old_photos_count
        await _log_activity(project_id, "Site Engineer", f"Uploaded {photos_added} photo(s) for {stage['name']}", "Progress")
        asyncio.create_task(_push_notification(
            project_id, "📸 New Site Photos",
            f"{photos_added} progress photo{'s' if photos_added > 1 else ''} for '{stage['name']}'.",
            "/portal/progress", "progress"
        ))
    
    return stage


@proj_router.delete("/admin/projects/{project_id}/stages/{index}", dependencies=[Depends(require_admin)])
async def delete_stage(project_id: str, index: int):
    """Delete a stage (unless it's Handover)."""
    p = await db.projects.find_one({"id": project_id}, {"_id": 0, "stages": 1})
    if not p:
        raise HTTPException(status_code=404, detail="Not found")
    stages = p.get("stages") or []
    if index < 0 or index >= len(stages):
        raise HTTPException(status_code=400, detail="Invalid stage index")
        
    target = stages[index]
    if "handover" in target.get("name", "").lower():
        raise HTTPException(status_code=400, detail="Handover stage is mandatory and cannot be deleted.")
        
    deleted = stages.pop(index)
    for i, s in enumerate(stages):
        s["index"] = i
        
    await db.projects.update_one(
        {"id": project_id},
        {"$set": {"stages": stages, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    await _log_activity(project_id, "Admin", f"Deleted stage: {deleted.get('name')}", "Stages")
    return {"success": True, "stages": stages}


# ---------------- Substages CRUD Endpoints ----------------

@proj_router.post("/admin/projects/{project_id}/stages/{stage_index}/substages", dependencies=[Depends(require_admin)])
async def add_substage(project_id: str, stage_index: int, body: SubstageBody):
    p = await db.projects.find_one({"id": project_id}, {"_id": 0, "stages": 1})
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    stages = p.get("stages") or []
    if stage_index < 0 or stage_index >= len(stages):
        raise HTTPException(status_code=400, detail="Invalid stage index")
        
    stage = stages[stage_index]
    substages = stage.get("substages") or []
    
    new_sub = {
        "id": f"sub_{uuid.uuid4().hex[:8]}",
        "name": body.name.strip(),
        "start_date": body.start_date,
        "planned_end_date": body.planned_end_date,
        "actual_start_date": None,
        "actual_end_date": None,
        "status": "pending",
        "progress_pct": 0,
        "archived": False,
    }
    
    # Apply progress rules if creating with non-zero progress
    if body.progress_pct and float(body.progress_pct) > 0:
        new_sub = _apply_progress_rules_to_substage(new_sub, body.progress_pct)
    
    substages.append(new_sub)
    stage["substages"] = substages
    
    # Recompute parent from all children (canonical)
    stage = _recalculate_stage_from_substages(stage)
    stages[stage_index] = stage
    stages[stage_index]["approval_status"] = "draft"
    await db.projects.update_one(
        {"id": project_id},
        {"$set": {"stages": stages, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"success": True, "stage": stage}


@proj_router.patch("/admin/projects/{project_id}/stages/{stage_index}/substages/{sub_id}", dependencies=[Depends(require_admin)])
async def patch_substage(project_id: str, stage_index: int, sub_id: str, body: SubstageBody):
    p = await db.projects.find_one({"id": project_id}, {"_id": 0, "stages": 1})
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    stages = p.get("stages") or []
    if stage_index < 0 or stage_index >= len(stages):
        raise HTTPException(status_code=400, detail="Invalid stage index")
        
    stage = stages[stage_index]
    substages = stage.get("substages") or []
    sub_idx = next((i for i, s in enumerate(substages) if s.get("id") == sub_id), -1)
    if sub_idx == -1:
        raise HTTPException(status_code=404, detail="Substage not found")
        
    sub = substages[sub_idx]
    old_progress = float(sub.get("progress_pct") or 0)
    
    if not sub.get("start_date") and body.start_date:
        sub["start_date"] = body.start_date
    
    sub["name"] = body.name
    sub["planned_end_date"] = body.planned_end_date
    
    new_progress = float(body.progress_pct or 0)
    sub = _apply_progress_rules_to_substage(sub, new_progress)
    
    if new_progress == 100 and body.actual_end_date:
        sub["actual_end_date"] = body.actual_end_date
    
    substages[sub_idx] = sub
    stage["substages"] = substages
    
    # RECALCULATE PARENT
    stage = _recalculate_stage_from_substages(stage)
    stages[stage_index] = stage
    stages[stage_index]["approval_status"] = "draft" 
    
    await db.projects.update_one(
        {"id": project_id},
        {"$set": {"stages": stages, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if old_progress < 100 and new_progress == 100:
        await _log_activity(project_id, "Site Engineer", f"Completed substage: {sub['name']}", "Progress")
        asyncio.create_task(_push_notification(
            project_id, "✅ Task Completed",
            f"'{sub['name']}' is now 100% complete.",
            "/portal/progress", "progress"
        ))
    elif old_progress == 0 and new_progress > 0:
        await _log_activity(project_id, "Site Engineer", f"Started substage: {sub['name']}", "Progress")
    
    return {"success": True, "stage": stage}

@proj_router.delete("/admin/projects/{project_id}/stages/{stage_index}/substages/{sub_id}", dependencies=[Depends(require_admin)])
async def delete_substage(project_id: str, stage_index: int, sub_id: str):
    p = await db.projects.find_one({"id": project_id}, {"_id": 0, "stages": 1})
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    stages = p.get("stages") or []
    if stage_index < 0 or stage_index >= len(stages):
        raise HTTPException(status_code=400, detail="Invalid stage index")
        
    stage = stages[stage_index]
    substages = [s for s in (stage.get("substages") or []) if s.get("id") != sub_id]
    stage["substages"] = substages
    
    # Recompute parent — canonical
    stage = _recalculate_stage_from_substages(stage)
    stages[stage_index] = stage
    stages[stage_index]["approval_status"] = "draft"
    await db.projects.update_one(
        {"id": project_id},
        {"$set": {"stages": stages, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"success": True, "stage": stage}
@proj_router.post("/admin/projects/{project_id}/stages/{stage_index}/substages/{sub_id}/mark-complete", dependencies=[Depends(require_admin)])
async def mark_substage_complete(project_id: str, stage_index: int, sub_id: str):
    """PRD Rule: Mark Complete sets child to 100% after confirmation."""
    p = await db.projects.find_one({"id": project_id}, {"_id": 0, "stages": 1})
    if not p:
        raise HTTPException(status_code=404, detail="Not found")
    stages = p.get("stages") or []
    if stage_index < 0 or stage_index >= len(stages):
        raise HTTPException(status_code=400, detail="Invalid stage index")
    
    stage = stages[stage_index]
    substages = stage.get("substages") or []
    sub_idx = next((i for i, s in enumerate(substages) if s.get("id") == sub_id), -1)
    if sub_idx == -1:
        raise HTTPException(status_code=404, detail="Substage not found")
    
    substages[sub_idx] = _apply_progress_rules_to_substage(substages[sub_idx], 100)
    stage["substages"] = substages
    stage = _recalculate_stage_from_substages(stage)
    stages[stage_index] = stage
    stages[stage_index]["approval_status"] = "draft"
    await db.projects.update_one(
        {"id": project_id},
        {"$set": {"stages": stages, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    await _log_activity(project_id, "Site Engineer", f"Marked complete: {substages[sub_idx]['name']}", "Progress")
    return {"success": True, "stage": stage}


@proj_router.post("/admin/projects/{project_id}/stages/{stage_index}/mark-all-complete", dependencies=[Depends(require_admin)])
async def mark_stage_all_complete(project_id: str, stage_index: int):
    """PRD Rule: Mark Parent Complete cascades 100% to all children."""
    p = await db.projects.find_one({"id": project_id}, {"_id": 0, "stages": 1})
    if not p:
        raise HTTPException(status_code=404, detail="Not found")
    stages = p.get("stages") or []
    if stage_index < 0 or stage_index >= len(stages):
        raise HTTPException(status_code=400, detail="Invalid stage index")
    
    stage = stages[stage_index]
    substages = stage.get("substages") or []
    
    if not substages:
        raise HTTPException(status_code=400, detail="Cannot mark parent complete: no substages exist (invalid configuration per PRD)")
    
    # Cascade 100% to all active children
    for i, sub in enumerate(substages):
        if not sub.get("archived"):
            substages[i] = _apply_progress_rules_to_substage(sub, 100)
    
    stage["substages"] = substages
    stage = _recalculate_stage_from_substages(stage)
    stages[stage_index] = stage
    stages[stage_index]["approval_status"] = "draft"
    await db.projects.update_one(
        {"id": project_id},
        {"$set": {"stages": stages, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    await _log_activity(project_id, "Site Engineer", f"Marked all substages complete for: {stage['name']}", "Progress")
    asyncio.create_task(_push_notification(
        project_id, "🎉 Stage Completed",
        f"'{stage['name']}' is fully complete — all sub-tasks done.",
        "/portal/progress", "progress"
    ))
    return {"success": True, "stage": stage}

# ============================================================================
# PM APPROVAL WORKFLOW FOR STAGES (FROZEN PRD RULE #6)
# ============================================================================

@proj_router.post("/admin/projects/{project_id}/stages/{index}/submit", dependencies=[Depends(require_admin)])
async def submit_stage_for_approval(project_id: str, index: int):
    """Site Engineer submits draft changes to PM for approval."""
    p = await db.projects.find_one({"id": project_id}, {"_id": 0, "stages": 1})
    stages = p.get("stages") or []
    if index < 0 or index >= len(stages):
        raise HTTPException(status_code=400, detail="Invalid stage index")
    
    stages[index]["approval_status"] = "submitted"
    
    await db.projects.update_one(
        {"id": project_id},
        {"$set": {"stages": stages, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    await _log_activity(project_id, "Site Engineer", f"Submitted stage '{stages[index]['name']}' for PM approval", "Progress")
    return {"success": True, "stage": stages[index]}


@proj_router.post("/admin/projects/{project_id}/stages/{index}/approve", dependencies=[Depends(require_admin)])
async def approve_stage_changes(project_id: str, index: int):
    """Project Manager approves changes. Copies current state to 'published_data' for client view."""
    p = await db.projects.find_one({"id": project_id}, {"_id": 0, "stages": 1})
    stages = p.get("stages") or []
    if index < 0 or index >= len(stages):
        raise HTTPException(status_code=400, detail="Invalid stage index")
    
    stage = stages[index]
    stage["approval_status"] = "approved"
    stage["reject_reason"] = None
    
    # Create a snapshot for the client portal
    snapshot = dict(stage)
    snapshot.pop("published_data", None) # Don't nest infinitely
    stage["published_data"] = snapshot
    
    stages[index] = stage
    
    await db.projects.update_one(
        {"id": project_id},
        {"$set": {"stages": stages, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    await _log_activity(project_id, "Project Manager", f"Approved & Published stage '{stage['name']}'", "Progress")
    
    # Notify client
    asyncio.create_task(_push_notification(
        project_id, "📊 Progress Verified",
        f"New progress updates for '{stage['name']}' have been verified and published.",
        "/portal/progress", "progress"
    ))
    return {"success": True, "stage": stage}


@proj_router.post("/admin/projects/{project_id}/stages/{index}/reject", dependencies=[Depends(require_admin)])
async def reject_stage_changes(project_id: str, index: int, body: RejectStageBody):
    """Project Manager rejects draft changes back to Site Engineer."""
    p = await db.projects.find_one({"id": project_id}, {"_id": 0, "stages": 1})
    stages = p.get("stages") or []
    if index < 0 or index >= len(stages):
        raise HTTPException(status_code=400, detail="Invalid stage index")
    
    stages[index]["approval_status"] = "rejected"
    stages[index]["reject_reason"] = body.reason
    
    await db.projects.update_one(
        {"id": project_id},
        {"$set": {"stages": stages, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    await _log_activity(project_id, "Project Manager", f"Rejected stage '{stages[index]['name']}' updates", "Progress")
    return {"success": True, "stage": stages[index]}

# ============================================================================
# UNIFIED COMPREHENSIVE PROGRESS REPORT PDF
# ============================================================================

@proj_router.get("/portal/my-project/{project_id}/full-progress-report/pdf")
async def download_full_progress_report_pdf(project_id: str):
    """Full Progress Report PDF:
    Overview + Stages/Substages + Monthly Progress + ALL Daily Reports.
    """
    p = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")

    stages = p.get("stages", []) or []
    total_pct = sum(float(s.get("progress_pct") or 0) for s in stages)
    overall = total_pct / (len(stages) or 1)

    project_title = p.get("title") or "Unnamed Project"
    project_address = p.get("address") or "N/A"
    project_code = p.get("project_code") or "—"
    customer_name = p.get("customer_name") or "Client"
    generated_on = datetime.now(timezone.utc).strftime("%d %b %Y, %I:%M %p UTC")

    # Days completed
    start_dt = p.get("start_date") or p.get("created_at") or datetime.now(timezone.utc).isoformat()[:10]
    try:
        start_d = datetime.strptime(str(start_dt)[:10], "%Y-%m-%d")
        days_completed = max(0, (datetime.now() - start_d).days)
    except Exception:
        days_completed = 0

    stages_completed = sum(1 for s in stages if s.get("status") == "completed")
    forecast = p.get("expected_completion") or "TBD"
    contract_value = p.get("contract_value") or 0
    amount_spent = p.get("amount_spent") or 0

    # ---------- 1) STAGES + SUBSTAGES ----------
    def _status_label(st):
        return (st or "pending").replace("_", " ").title()

    def _date_label(s):
        return s.get("actual_end_date") or s.get("planned_end_date") or s.get("expected_date") or "—"

    stages_rows = []
    for i, s in enumerate(stages):
        stages_rows.append(f"""
        <tr class="stage-row">
            <td style="font-weight:700; color:#000F1B;">{i + 1}. {s.get('name') or '—'}</td>
            <td>{_status_label(s.get('status'))}</td>
            <td>{s.get('start_date') or s.get('started_at') or '—'}</td>
            <td>{_date_label(s)}</td>
            <td style="text-align:right; font-weight:800; color:#FF5A00;">{float(s.get('progress_pct') or 0):.0f}%</td>
        </tr>
        """)
        for j, sub in enumerate(s.get("substages") or []):
            stages_rows.append(f"""
            <tr class="sub-row">
                <td style="padding-left:22px; color:#444;">↳ {sub.get('name') or 'Substage'}</td>
                <td>{_status_label(sub.get('status'))}</td>
                <td>{sub.get('start_date') or '—'}</td>
                <td>{sub.get('actual_end_date') or sub.get('planned_end_date') or '—'}</td>
                <td style="text-align:right; color:#FF5A00; font-weight:700;">{float(sub.get('progress_pct') or 0):.0f}%</td>
            </tr>
            """)

    stages_html = "".join(stages_rows) or """
        <tr><td colspan="5" style="text-align:center; color:#888; font-style:italic;">No stages configured</td></tr>
    """

    # ---------- 2) MONTHLY PROGRESS ----------
    monthly = p.get("monthly_progress") or []
    if monthly:
        monthly_rows = "".join(
            f"""
            <tr>
                <td><strong>{m.get('month') or '—'}</strong></td>
                <td style="text-align:center;">{m.get('planned_pct', '—')}{'%' if m.get('planned_pct') is not None else ''}</td>
                <td style="text-align:center; font-weight:800; color:#FF5A00;">{m.get('actual_pct', 0)}%</td>
            </tr>
            """
            for m in monthly
        )
        monthly_html = f"""
        <h2>2. Monthly Progress</h2>
        <table>
          <thead>
            <tr>
              <th>Month</th>
              <th style="text-align:center;">Planned %</th>
              <th style="text-align:center;">Actual % (Verified)</th>
            </tr>
          </thead>
          <tbody>{monthly_rows}</tbody>
        </table>
        """
    else:
        monthly_html = """
        <h2>2. Monthly Progress</h2>
        <p class="muted">No monthly progress snapshots recorded yet.</p>
        """

    # ---------- 3) ALL DAILY REPORTS ----------
    daily_reports = p.get("daily_reports") or []
    daily_reports = sorted(daily_reports, key=lambda r: r.get("date") or "", reverse=True)

    def _photo_count(r):
        return len(r.get("photos") or [])

    def _list_html(items, empty="—"):
        items = items or []
        if not items:
            return f"<em style='color:#999'>{empty}</em>"
        return "<ul style='margin:4px 0 0 16px; padding:0;'>" + "".join(f"<li>{x}</li>" for x in items) + "</ul>"

    if daily_reports:
        reports_blocks = []
        for idx, r in enumerate(daily_reports, start=1):
            approved = bool(r.get("is_approved"))
            badge = (
                "<span class='badge ok'>Published to Client</span>"
                if approved
                else "<span class='badge pending'>Awaiting / Internal</span>"
            )
            photos = r.get("photos") or []
            photo_bits = ""
            if photos:
                photo_bits = "<div class='photo-meta'><strong>Photos (" + str(len(photos)) + "):</strong> " + ", ".join(
                    [
                        (ph.get("caption") if isinstance(ph, dict) else "Site Photo")
                        or "Site Photo"
                        for ph in photos[:12]
                    ]
                ) + ("…" if len(photos) > 12 else "") + "</div>"

            reports_blocks.append(f"""
            <div class="report-card">
              <div class="report-head">
                <div>
                  <div class="report-title">#{idx} · {r.get('date') or '—'} {badge}</div>
                  <div class="report-sub">
                    Status: <strong>{r.get('overall_status') or '—'}</strong>
                    · Submitted by {r.get('submitted_by') or 'Site Engineer'}
                    {(' · Approved ' + str(r.get('approved_at') or '')[:10]) if approved else ''}
                  </div>
                </div>
                <div class="report-side">{_photo_count(r)} photo(s)</div>
              </div>
              {f"<p class='notes'>{r.get('status_notes')}</p>" if r.get('status_notes') else ''}
              <div class="two-col">
                <div>
                  <div class="label">Work Completed</div>
                  {_list_html(r.get('work_completed'), 'No items listed')}
                </div>
                <div>
                  <div class="label">Planned Tomorrow</div>
                  {_list_html(r.get('planned_tomorrow'), 'No items listed')}
                </div>
              </div>
              {photo_bits}
            </div>
            """)
        reports_html = f"""
        <h2>3. Daily Progress Reports <span class="count">({len(daily_reports)} total)</span></h2>
        <p class="muted">All logged daily reports are included below (newest first).</p>
        {''.join(reports_blocks)}
        """
    else:
        reports_html = """
        <h2>3. Daily Progress Reports</h2>
        <p class="muted">No daily progress reports have been logged yet.</p>
        """

    # Precise ConstructONS Power 'O' SVG
    power_o_svg = """<svg viewBox="0 0 24 24" width="17" height="17" style="vertical-align:-1.5px; display:inline-block; margin:0 -1px;" xmlns="http://www.w3.org/2000/svg">
      <path fill="none" stroke="#FF5A00" stroke-width="3.2" stroke-linecap="round" d="M12 2.5v7.5"/>
      <path fill="none" stroke="#FF5A00" stroke-width="3.2" stroke-linecap="round" d="M18.36 6.64a9 9 0 1 1-12.73 0"/>
    </svg>"""

    brand_logo_html = f"""<span style="letter-spacing:0.04em;"><span style="color:#000F1B; font-weight:900;">CONSTRUCT</span>{power_o_svg}<span style="color:#FF5A00; font-weight:900;">NS</span><span style="font-size:11px; vertical-align:super; color:#000F1B; font-weight:700;">™</span></span>"""

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>ConstructONS™ Full Progress Report — {project_code}</title>
  <style>
    :root {{
      --orange:#FF5A00; --navy:#000F1B; --muted:#666; --line:#e5e5e5; --bg:#f7f8fa;
    }}
    * {{ box-sizing:border-box; }}
    body {{
      font-family: Arial, Helvetica, sans-serif;
      color:#111; line-height:1.45;
      padding: 28px 32px; margin:0; font-size:12px;
    }}
    .header {{
      display:flex; justify-content:space-between; align-items:flex-end;
      border-bottom:3px solid var(--orange); padding-bottom:10px; margin-bottom:18px;
    }}
    .brand {{ font-size:20px; font-family: Arial, sans-serif; }}
    .meta {{ text-align:right; font-size:10px; color:var(--muted); line-height:1.4; }}
    h1 {{ margin:0 0 4px; font-size:20px; color:var(--navy); }}
    .sub {{ margin:0 0 14px; font-size:11px; color:var(--muted); }}
    .kpi-grid {{
      display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin:14px 0 18px;
    }}
    .kpi {{
      background:var(--bg); border:1px solid var(--line); border-radius:8px;
      padding:10px 8px; text-align:center;
    }}
    .kpi-title {{ font-size:9px; font-weight:700; color:#777; text-transform:uppercase; letter-spacing:0.06em; }}
    .kpi-val {{ font-size:18px; font-weight:900; color:var(--navy); margin-top:4px; }}
    h2 {{
      font-size:12px; text-transform:uppercase; letter-spacing:0.06em;
      color:var(--navy); border-bottom:1px solid var(--line);
      padding-bottom:5px; margin:22px 0 10px;
    }}
    h2 .count {{ color:var(--orange); font-weight:800; }}
    table {{ width:100%; border-collapse:collapse; margin-bottom:10px; font-size:11px; }}
    th, td {{ border:1px solid var(--line); padding:7px 8px; text-align:left; vertical-align:top; }}
    th {{ background:var(--navy); color:#fff; font-size:9px; text-transform:uppercase; letter-spacing:0.05em; }}
    tr.sub-row td {{ background:#fafafa; font-size:10.5px; }}
    .muted {{ color:#888; font-style:italic; margin:6px 0 12px; }}
    .report-card {{
      border:1px solid var(--line); border-radius:8px; background:#fff;
      padding:12px; margin-bottom:12px; page-break-inside:avoid;
    }}
    .report-head {{ display:flex; justify-content:space-between; gap:10px; margin-bottom:6px; }}
    .report-title {{ font-size:13px; font-weight:800; color:var(--navy); }}
    .report-sub {{ font-size:10px; color:#666; margin-top:2px; }}
    .report-side {{ font-size:10px; color:#888; white-space:nowrap; }}
    .notes {{
      background:#fff7f2; border-left:3px solid var(--orange);
      padding:6px 8px; margin:6px 0 8px; font-size:11px; color:#333;
    }}
    .two-col {{ display:grid; grid-template-columns:1fr 1fr; gap:12px; }}
    .label {{ font-size:9px; font-weight:800; text-transform:uppercase; color:#777; margin-bottom:2px; }}
    .badge {{
      display:inline-block; font-size:9px; font-weight:800; padding:2px 7px;
      border-radius:999px; margin-left:6px; vertical-align:middle;
    }}
    .badge.ok {{ background:#ecfdf5; color:#047857; border:1px solid #a7f3d0; }}
    .badge.pending {{ background:#fff7ed; color:#c2410c; border:1px solid #fed7aa; }}
    .photo-meta {{ margin-top:8px; font-size:10px; color:#555; }}
    .footer {{
      margin-top:28px; padding-top:10px; border-top:1px solid var(--line);
      text-align:center; font-size:9px; color:#999;
    }}
    .info-box {{
      background:var(--bg); border-left:4px solid var(--orange);
      padding:10px 12px; border-radius:0 8px 8px 0; margin-bottom:8px; font-size:11px;
    }}
    @media print {{
      body {{ padding:16px; }}
      .report-card, table, .kpi {{ break-inside: avoid; }}
      th {{ -webkit-print-color-adjust:exact; print-color-adjust:exact; }}
    }}
  </style>
</head>
<body onload="window.print()">
  <div class="header">
    <div class="brand">{brand_logo_html}</div>
    <div class="meta">
      Full Progress Report<br/>
      Generated {generated_on}
    </div>
  </div>

  <h1>{project_title}</h1>
  <p class="sub">
    Code: <strong>{project_code}</strong> · Client: <strong>{customer_name}</strong> · Site: {project_address}
  </p>

  <div class="info-box">
    This document consolidates <strong>Overview</strong>, <strong>Stage / Substage progress</strong>,
    <strong>Monthly progress</strong>, and <strong>all Daily Progress Reports</strong>
    from the ConstructONS™ Client Portal.
  </div>

  <!-- ========== 1. OVERVIEW ========== -->
  <h2>1. Project Overview</h2>
  <div class="kpi-grid">
    <div class="kpi">
      <div class="kpi-title">Overall Progress</div>
      <div class="kpi-val" style="color:#FF5A00;">{round(overall)}%</div>
    </div>
    <div class="kpi">
      <div class="kpi-title">Days Completed</div>
      <div class="kpi-val">{days_completed}</div>
    </div>
    <div class="kpi">
      <div class="kpi-title">Stages Completed</div>
      <div class="kpi-val">{stages_completed}/{len(stages)}</div>
    </div>
    <div class="kpi">
      <div class="kpi-title">Forecast Delivery</div>
      <div class="kpi-val" style="font-size:13px;">{forecast}</div>
    </div>
  </div>
  <table>
    <tbody>
      <tr><th style="width:30%; background:#000F1B; color:#fff;">Contract Value</th><td>₹ {float(contract_value):,.0f}</td></tr>
      <tr><th style="background:#000F1B; color:#fff;">Amount Received</th><td>₹ {float(amount_spent):,.0f}</td></tr>
      <tr><th style="background:#000F1B; color:#fff;">Project Start</th><td>{str(start_dt)[:10]}</td></tr>
      <tr><th style="background:#000F1B; color:#fff;">Project Status</th><td>{(p.get('status') or 'active').title()}</td></tr>
    </tbody>
  </table>

  <h2>1b. Construction Stages &amp; Substages</h2>
  <table>
    <thead>
      <tr>
        <th>Stage / Substage</th>
        <th>Status</th>
        <th>Start</th>
        <th>End (Actual / Planned)</th>
        <th style="text-align:right;">Progress</th>
      </tr>
    </thead>
    <tbody>
      {stages_html}
    </tbody>
  </table>

  <!-- ========== 2. MONTHLY ========== -->
  {monthly_html}

  <!-- ========== 3. ALL DAILY REPORTS ========== -->
  {reports_html}

  <div class="footer">
    <div style="font-size:14px; margin-bottom:4px;">
      {brand_logo_html}
    </div>
    Official Full Progress Report · Generated from ConstructONS Client Portal<br/>
    Everything Construction. Always On.
  </div>
</body>
</html>
"""
    return HTMLResponse(content=html_content)
# ============================================================================
# Drawings & Materials Approvals (Client Side)
# ============================================================================

# 1. Add this Schema at the top with your other schemas
class DrawingRequestBody(BaseModel):
    category: str
    title: str
    reason: Optional[str] = None

# 2. Add this Route (Client Side)
@proj_router.post("/portal/my-project/drawings/request")
async def portal_request_new_drawing(body: DrawingRequestBody, customer=Depends(get_current_customer)):
    """Client requests a new drawing from the design team."""
    email = (customer.get("email") or "").lower()
    proj = await db.projects.find_one(
        {"$or": [{"customer_email": email}, {"team_directory.email": email}]},
        {"id": 1, "customer_email": 1, "team_directory": 1}
    )
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    _enforce_full_access(proj, email)

    await db.projects.update_one(
        {"id": proj["id"], "$or": [{"drawing_requests": {"$exists": False}}, {"drawing_requests": None}]},
        {"$set": {"drawing_requests": []}}
    )

    now = datetime.now(timezone.utc).isoformat()
    client_name = customer.get("name") or "Client"
    
    req_entry = {
        "id": f"dreq_{uuid.uuid4().hex[:10]}",
        "title": body.title.strip(),
        "category": body.category,
        "reason": body.reason,
        "status": "pending",
        "requested_at": now,
        "requested_by": client_name
    }

    await db.projects.update_one(
        {"id": proj["id"]},
        {"$push": {"drawing_requests": {"$each": [req_entry], "$position": 0}}, "$set": {"updated_at": now}}
    )

    await _log_activity(proj["id"], client_name, f"Requested new drawing: {body.title}", "Drawings")
    asyncio.create_task(_push_notification(
        proj["id"], "Drawing Request Submitted 📐", 
        f"Your request for a new {body.category} drawing '{body.title}' has been successfully sent to the design team.", 
        "/portal/drawings", "system"
    ))

    return {"success": True, "request": req_entry}
@proj_router.patch("/admin/projects/{project_id}/drawings/requests/{request_id}", dependencies=[Depends(require_admin)])
async def admin_update_drawing_request(project_id: str, request_id: str, body: DrawingRequestUpdateBody):
    """Admin marks a drawing request as fulfilled or dismissed."""
    p = await db.projects.find_one({"id": project_id}, {"id": 1, "drawing_requests": 1})
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")

    requests = p.get("drawing_requests") or []
    idx = next((i for i, r in enumerate(requests) if r["id"] == request_id), -1)
    if idx == -1:
        raise HTTPException(status_code=404, detail="Request not found")

    requests[idx]["status"] = body.status
    now = datetime.now(timezone.utc).isoformat()
    
    await db.projects.update_one(
        {"id": project_id},
        {"$set": {"drawing_requests": requests, "updated_at": now}}
    )

    # Notify client if fulfilled
    if body.status == "fulfilled":
        asyncio.create_task(_push_notification(
            project_id, "Drawing Request Fulfilled ✅", 
            f"Your request for '{requests[idx]['title']}' has been fulfilled. The new drawing is available.", 
            "/portal/drawings", "system"
        ))

    return {"success": True, "request": requests[idx]}

@proj_router.post("/portal/my-project/drawings/{drawing_id}/decision")
async def portal_submit_drawing_decision(drawing_id: str, body: DrawingDecisionBody, customer=Depends(get_current_customer)):
    email = (customer.get("email") or "").lower()
    proj = await db.projects.find_one({"$or": [{"customer_email": email}, {"team_directory.email": email}]}, {"id": 1, "customer_email": 1, "team_directory": 1, "drawings": 1})
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    _enforce_full_access(proj, email)
    drawings = proj.get("drawings") or []
    drawing_idx = next((i for i, d in enumerate(drawings) if d["id"] == drawing_id), -1)
    if drawing_idx == -1:
        raise HTTPException(status_code=404, detail="Drawing not found")
    drawing = drawings[drawing_idx]
    if drawing["status"] != "pending":
        raise HTTPException(status_code=400, detail="This drawing is not pending an approval.")
    now = datetime.now(timezone.utc).isoformat()
    latest_version_idx = len(drawing["versions"]) - 1
    drawing["versions"][latest_version_idx]["client_decision"] = body.decision
    drawing["versions"][latest_version_idx]["client_comment"] = body.comment
    drawing["versions"][latest_version_idx]["decided_at"] = now
    drawing["status"] = body.decision
    await db.projects.update_one({"id": proj["id"]}, {"$set": {f"drawings.{drawing_idx}": drawing, "updated_at": now}})
    action_text = "Approved" if body.decision == "approved" else "Rejected" if body.decision == "rejected" else "Requested Changes on"
    await _log_activity(proj["id"], customer.get("name") or "Client", f"{action_text} drawing: {drawing['name']}", "Drawings")
    return {"success": True, "status": body.decision}


@proj_router.post("/portal/my-project/materials/{material_id}/decision")
async def portal_submit_material_decision(material_id: str, body: MaterialDecisionBody, customer=Depends(get_current_customer)):
    email = (customer.get("email") or "").lower()
    proj = await db.projects.find_one({"$or": [{"customer_email": email}, {"team_directory.email": email}]}, {"id": 1, "customer_email": 1, "team_directory": 1, "materials": 1})
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    _enforce_full_access(proj, email)
    materials = proj.get("materials") or []
    mat_idx = next((i for i, m in enumerate(materials) if m["id"] == material_id), -1)
    if mat_idx == -1:
        raise HTTPException(status_code=404, detail="Material not found")
    mat = materials[mat_idx]
    if mat.get("status") != "pending":
        raise HTTPException(status_code=400, detail="This material is not pending an approval.")
    now = datetime.now(timezone.utc).isoformat()
    new_status = "ordered" if body.decision == "approved" else "rejected"
    mat["status"] = new_status
    mat["client_comment"] = body.comment
    mat["decided_at"] = now
    if new_status == "ordered":
        mat["ordered_on"] = now
    await db.projects.update_one({"id": proj["id"]}, {"$set": {f"materials.{mat_idx}": mat, "updated_at": now}})
    action_text = "Approved" if body.decision == "approved" else "Rejected"
    await _log_activity(proj["id"], customer.get("name") or "Client", f"{action_text} material procurement: {mat['item_name']}", "Materials")
    return {"success": True, "status": new_status}


# ============================================================================
# Admin CRUD
# ============================================================================

@proj_router.get("/admin/projects", dependencies=[Depends(require_admin)])
async def list_projects(q: Optional[str] = None):
    query: Dict[str, Any] = {}
    if q:
        query["$or"] = [{"customer_email": {"$regex": q, "$options": "i"}}, {"customer_name": {"$regex": q, "$options": "i"}}, {"title": {"$regex": q, "$options": "i"}}]
    docs = await db.projects.find(query, {"_id": 0}).sort("created_at", -1).limit(500).to_list(500)
    return docs


@proj_router.get("/admin/projects/{project_id}", dependencies=[Depends(require_admin)])
async def get_project(project_id: str):
    p = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not p:
        raise HTTPException(status_code=404, detail="Not found")
    return p


@proj_router.patch("/admin/projects/{project_id}/attendance", dependencies=[Depends(require_admin)])
async def set_attendance(project_id: str, body: AttendanceBody):
    p = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not p:
        raise HTTPException(status_code=404, detail="Not found")
    today = _ist_today()
    await db.projects.update_one({"id": project_id, "$or": [{"attendance": {"$exists": False}}, {"attendance": None}]}, {"$set": {"attendance": []}})
    await db.projects.update_one({"id": project_id}, {"$pull": {"attendance": {"date": today}}})
    entry = {"date": today, "member_ids": body.member_ids, "count": len(body.member_ids), "marked_at": datetime.now(timezone.utc).isoformat(), "marked_by": "Admin"}
    await db.projects.update_one({"id": project_id}, {"$push": {"attendance": {"$each": [entry], "$slice": -30}}})
    await _log_activity(project_id, "Site Admin", f"Attendance marked: {len(body.member_ids)} member(s) on site", "Attendance")
    asyncio.create_task(_push_notification(project_id, "Daily Site Update", f"{len(body.member_ids)} members checked in on site today.", "/portal/team", "attendance"))
    return {"success": True, "date": today, "on_site": len(body.member_ids)}


@proj_router.post("/admin/projects", dependencies=[Depends(require_admin)])
async def create_project(body: ProjectCreateBody):
    email = body.customer_email.lower().strip()
    if not email:
        raise HTTPException(status_code=400, detail="customer_email required")
    existing = await db.projects.find_one({"customer_email": email}, {"id": 1})
    if existing:
        raise HTTPException(status_code=409, detail="Project already exists for this customer")
    now = datetime.now(timezone.utc).isoformat()
    count = await db.projects.count_documents({})
    proj_code = f"CON-{datetime.now(timezone.utc).year}-{(count + 1):04d}"
    owner_name = body.customer_name or email.split("@")[0]
    owner_record = {"id": f"usr_{uuid.uuid4().hex[:12]}", "name": owner_name, "email": email, "role": "Project Owner", "company": "Home Owner", "contact": "", "access": "Full Access", "status": "Active", "avatar": None}
    init_activity = {"id": str(uuid.uuid4()), "user_name": "System Admin", "action": "Project initialized", "module": "System", "timestamp": now}
    init_notif = {"id": str(uuid.uuid4()), "title": "Project Created", "message": f"Welcome to {body.title}! Your digital home tracker is active.", "link": "/portal", "icon": "system", "is_read": False, "timestamp": now}
    doc = {
        "id": str(uuid.uuid4()), "project_code": proj_code, "customer_email": email, "customer_name": owner_name,
        "title": body.title, "address": body.address, "package_slug": body.package_slug, "quote_id": body.quote_id,
        "status": "active", "stages": _default_stage_list(),
        "contract_value": body.contract_value or 0, "amount_spent": body.amount_spent or 0,
        "cover_image": body.cover_image, "team_ids": body.team_ids or [],
        "team_directory": [owner_record], "activities": [init_activity], "notifications": [init_notif],
        "drawings": [], "materials": [], "payments_log": [],
        "attendance": [], "documents": [], "approvals": [], "cctv_cameras": [],
        "created_at": now, "updated_at": now,
        "site_lat": body.site_lat,
        "expected_completion": body.expected_completion,
"start_date": body.start_date or now[:10],  # or None
"site_lng": body.site_lng,
    }
    await db.projects.insert_one(doc)
    doc.pop("_id", None)
    return doc


@proj_router.put("/admin/projects/{project_id}", dependencies=[Depends(require_admin)])
async def update_project(project_id: str, body: ProjectUpdateBody):
    upd = {k: v for k, v in body.model_dump().items() if v is not None}
    upd["updated_at"] = datetime.now(timezone.utc).isoformat()
    if body.team_ids is not None:
        await _log_activity(project_id, "System Admin", "Updated internal team assignments", "Team")
        if len(body.team_ids) > 0:
            asyncio.create_task(_push_notification(project_id, "Team Update", "New staff members have been assigned to your project.", "/portal/team", "team"))
    res = await db.projects.update_one({"id": project_id}, {"$set": upd})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return await db.projects.find_one({"id": project_id}, {"_id": 0})


@proj_router.patch("/admin/projects/{project_id}/stages/{index}", dependencies=[Depends(require_admin)])
async def patch_stage(project_id: str, index: int, body: StagePatchBody):
    p = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not p:
        raise HTTPException(status_code=404, detail="Not found")
    stages = p.get("stages") or []
    if index < 0 or index >= len(stages):
        raise HTTPException(status_code=400, detail="Invalid stage index")
    
    stage = stages[index]
    old_status = stage.get("status")
    old_progress = float(stage.get("progress_pct") or 0)
    old_photos_count = len(stage.get("photos") or [])
    
    patch = body.model_dump(exclude_unset=True)
    
    # Auto-manage timestamps based on status transitions
    if patch.get("status") == "in_progress" and not stage.get("started_at"):
        patch["started_at"] = datetime.now(timezone.utc).isoformat()
    if patch.get("status") == "completed" and not stage.get("completed_at"):
        patch["completed_at"] = datetime.now(timezone.utc).isoformat()
        patch["progress_pct"] = 100
    
    stage.update(patch)
    stages[index] = stage

    # ==========================================================
    # 🆕 REAL MONTHLY PROGRESS SNAPSHOT LOGIC
    # ==========================================================
    total_pct = sum(float(s.get("progress_pct") or 0) for s in stages)
    overall_progress = round(total_pct / (len(stages) or 1))
    
    # Get current month label (e.g., "Sep 2026")
    current_month_label = datetime.now(timezone.utc).strftime("%b %Y")
    
    monthly_records = p.get("monthly_progress") or []
    month_found = False
    
    for rec in monthly_records:
        if rec.get("month") == current_month_label:
            rec["actual_pct"] = overall_progress
            month_found = True
            break
            
    if not month_found:
        monthly_records.append({
            "month": current_month_label,
            "actual_pct": overall_progress
        })
    # ==========================================================

    await db.projects.update_one(
        {"id": project_id}, 
        {"$set": {
            "stages": stages, 
            "monthly_progress": monthly_records, # Save the real snapshot
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # ==== NOTIFICATION LOGIC ====
    new_status = stage.get("status")
    new_progress = float(stage.get("progress_pct") or 0)
    new_photos_count = len(stage.get("photos") or [])
    
    # 1. Status transition: pending → in_progress
    if old_status != "in_progress" and new_status == "in_progress":
        await _log_activity(project_id, "Site Engineer", f"Started stage: {stage['name']}", "Progress")
        asyncio.create_task(_push_notification(
            project_id, "🚧 Stage Started",
            f"Work on '{stage['name']}' has officially begun on your site.",
            "/portal/progress", "progress"
        ))
    
    # 2. Status transition: → completed
    elif old_status != "completed" and new_status == "completed":
        await _log_activity(project_id, "Site Engineer", f"Completed stage: {stage['name']} (100%)", "Progress")
        asyncio.create_task(_push_notification(
            project_id, "🎉 Milestone Achieved!",
            f"Stage '{stage['name']}' has been completed. View the full progress update on your portal.",
            "/portal/progress", "progress"
        ))
    
    # 3. Progress % changed significantly (≥5% jump) without status change
    elif new_status == "in_progress" and abs(new_progress - old_progress) >= 5:
        await _log_activity(
            project_id, "Site Engineer",
            f"Progress update on '{stage['name']}': {int(old_progress)}% → {int(new_progress)}%",
            "Progress"
        )
        asyncio.create_task(_push_notification(
            project_id, "📊 Progress Update",
            f"'{stage['name']}' is now {int(new_progress)}% complete (was {int(old_progress)}%).",
            "/portal/progress", "progress"
        ))
    
    # 4. New photos uploaded
    if new_photos_count > old_photos_count:
        photos_added = new_photos_count - old_photos_count
        await _log_activity(
            project_id, "Site Engineer",
            f"Uploaded {photos_added} new photo(s) for {stage['name']}",
            "Progress"
        )
        asyncio.create_task(_push_notification(
            project_id, "📸 New Site Photos",
            f"{photos_added} fresh progress photo{'s' if photos_added > 1 else ''} uploaded for '{stage['name']}'.",
            "/portal/progress", "progress"
        ))
    
    return stage

@proj_router.delete("/admin/projects/{project_id}", dependencies=[Depends(require_admin)])
async def delete_project(project_id: str):
    res = await db.projects.delete_one({"id": project_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"success": True}


# --- DRAWINGS ---
@proj_router.post("/admin/projects/{project_id}/drawings", dependencies=[Depends(require_admin)])
async def create_drawing(project_id: str, body: DrawingCreateBody):
    p = await db.projects.find_one({"id": project_id}, {"id": 1, "drawings": 1})
    if not p:
        raise HTTPException(status_code=404, detail="Not found")
    await db.projects.update_one({"id": project_id, "$or": [{"drawings": {"$exists": False}}, {"drawings": None}]}, {"$set": {"drawings": []}})
    now = datetime.now(timezone.utc).isoformat()
    drawing = {"id": f"dwg_{uuid.uuid4().hex[:10]}", "name": body.name.strip(), "category": body.category, "current_version": 1, "status": "pending", "uploaded_at": now, "uploaded_by": "Admin", "versions": [{"version": 1, "url": body.url, "uploaded_at": now, "client_decision": None, "client_comment": None, "decided_at": None}]}
    await db.projects.update_one({"id": project_id}, {"$push": {"drawings": {"$each": [drawing], "$position": 0}}, "$set": {"updated_at": now}})
    await _log_activity(project_id, "Admin", f"Uploaded new drawing for approval: {body.name}", "Drawings")
    asyncio.create_task(_push_notification(project_id, "Action Required: Drawing Approval", f"Please review and approve the new {body.category} drawing: {body.name}.", "/portal/approvals", "system"))
    return {"success": True, "drawing": drawing}


@proj_router.post("/admin/projects/{project_id}/drawings/{drawing_id}/revision", dependencies=[Depends(require_admin)])
async def revise_drawing(project_id: str, drawing_id: str, body: DrawingRevisionBody):
    p = await db.projects.find_one({"id": project_id}, {"id": 1, "drawings": 1})
    if not p:
        raise HTTPException(status_code=404, detail="Not found")
    drawings = p.get("drawings") or []
    drawing_idx = next((i for i, d in enumerate(drawings) if d["id"] == drawing_id), -1)
    if drawing_idx == -1:
        raise HTTPException(status_code=404, detail="Drawing not found")
    drawing = drawings[drawing_idx]
    if drawing["status"] == "pending":
        raise HTTPException(status_code=400, detail="Cannot upload revision while current version is still pending.")
    now = datetime.now(timezone.utc).isoformat()
    new_version_num = drawing["current_version"] + 1
    revision = {"version": new_version_num, "url": body.url, "uploaded_at": now, "client_decision": None, "client_comment": None, "decided_at": None}
    drawing["versions"].append(revision)
    drawing["current_version"] = new_version_num
    drawing["status"] = "pending"
    drawing["uploaded_at"] = now
    await db.projects.update_one({"id": project_id}, {"$set": {f"drawings.{drawing_idx}": drawing, "updated_at": now}})
    await _log_activity(project_id, "Admin", f"Uploaded Revision V{new_version_num} for {drawing['name']}", "Drawings")
    asyncio.create_task(_push_notification(project_id, "Action Required: Drawing Revision", f"A revised version of {drawing['name']} is ready for your review.", "/portal/approvals", "system"))
    return {"success": True, "drawing": drawing}


@proj_router.delete("/admin/projects/{project_id}/drawings/{drawing_id}", dependencies=[Depends(require_admin)])
async def delete_drawing(project_id: str, drawing_id: str):
    p = await db.projects.find_one({"id": project_id}, {"id": 1, "drawings": 1})
    if not p:
        raise HTTPException(status_code=404, detail="Not found")
    target = next((d for d in (p.get("drawings") or []) if d["id"] == drawing_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Drawing not found")
    await db.projects.update_one({"id": project_id}, {"$pull": {"drawings": {"id": drawing_id}}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}})
    await _log_activity(project_id, "Admin", f"Deleted drawing: {target['name']}", "Drawings")
    return {"success": True}


# --- MATERIALS ---
@proj_router.post("/admin/projects/{project_id}/materials", dependencies=[Depends(require_admin)])
async def create_material(project_id: str, body: MaterialCreateBody):
    p = await db.projects.find_one({"id": project_id}, {"id": 1})
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    await db.projects.update_one({"id": project_id, "$or": [{"materials": {"$exists": False}}, {"materials": None}]}, {"$set": {"materials": []}})
    mat_data = body.model_dump()
    mat_data["id"] = f"mat_{uuid.uuid4().hex[:10]}"
    mat_data["total_cost"] = body.quantity * body.unit_price
    now = datetime.now(timezone.utc).isoformat()
    mat_data["ordered_on"] = now if body.status == "ordered" else None
    mat_data["delivered_on"] = now if body.status in ["delivered", "inspected", "installed"] else None
    mat_data["created_at"] = now
    mat_data["updated_at"] = now
    await db.projects.update_one({"id": project_id}, {"$push": {"materials": {"$each": [mat_data], "$position": 0}}, "$set": {"updated_at": now}})
    await _log_activity(project_id, "Procurement", f"Logged material: {body.quantity} {body.unit} of {body.item_name}", "Materials")
    if body.status in ["delivered", "installed", "inspected"]:
        asyncio.create_task(_push_notification(project_id, "Material Delivered", f"{body.quantity} {body.unit} of {body.item_name} arrived on site.", "/portal/materials", "system"))
    
    return {"success": True, "material": mat_data}


@proj_router.put("/admin/projects/{project_id}/materials/{material_id}", dependencies=[Depends(require_admin)])
async def update_material(project_id: str, material_id: str, body: MaterialUpdateBody):
    p = await db.projects.find_one({"id": project_id}, {"id": 1, "materials": 1})
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
        
    materials = p.get("materials") or []
    idx = next((i for i, m in enumerate(materials) if m["id"] == material_id), -1)
    if idx == -1:
        raise HTTPException(status_code=404, detail="Material not found")
        
    mat = materials[idx]
    old_status = mat.get("status")
    
    update_data = body.model_dump()
    update_data["id"] = mat["id"]
    update_data["total_cost"] = body.quantity * body.unit_price
    now = datetime.now(timezone.utc).isoformat()
    
    # 1. Track Ordered Date
    if old_status == "pending" and body.status == "ordered":
        update_data["ordered_on"] = now
    else:
        update_data["ordered_on"] = mat.get("ordered_on")
        
    # 2. Track Delivered/Received Date & Notify Client on Arrival
    if old_status not in ["delivered", "inspected", "installed"] and body.status in ["delivered", "inspected", "installed"]:
        update_data["delivered_on"] = now
        await _log_activity(project_id, "Procurement", f"Material Delivered: {body.item_name}", "Materials")
        asyncio.create_task(_push_notification(
            project_id, 
            "Material Delivered", 
            f"{body.quantity} {body.unit} of {body.item_name} has arrived on site.", 
            "/portal/materials", 
            "system"
        ))
    else:
        update_data["delivered_on"] = mat.get("delivered_on")
        
    update_data["created_at"] = mat.get("created_at", now)
    update_data["updated_at"] = now
    materials[idx] = update_data
    
    await db.projects.update_one({"id": project_id}, {"$set": {"materials": materials, "updated_at": now}})
    
    # ❌ REMOVED: "Action Required: Material Approval" notification trigger
    # Per PRD: Materials MVP is read-only for clients with no approval workflow.
    
    return {"success": True, "material": update_data}

@proj_router.delete("/admin/projects/{project_id}/materials/{material_id}", dependencies=[Depends(require_admin)])
async def delete_material(project_id: str, material_id: str):
    p = await db.projects.find_one({"id": project_id}, {"id": 1, "materials": 1})
    if not p:
        raise HTTPException(status_code=404, detail="Not found")
    target = next((m for m in (p.get("materials") or []) if m["id"] == material_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Material not found")
    await db.projects.update_one({"id": project_id}, {"$pull": {"materials": {"id": material_id}}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}})
    await _log_activity(project_id, "Procurement", f"Removed material log: {target['item_name']}", "Materials")
    return {"success": True}


# --- FINANCIAL LEDGER ---
@proj_router.post("/admin/projects/{project_id}/payments", dependencies=[Depends(require_admin)])
async def add_payment_log(project_id: str, body: PaymentLogBody):
    p = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not p:
        raise HTTPException(status_code=404, detail="Not found")
    await db.projects.update_one({"id": project_id, "$or": [{"payments_log": {"$exists": False}}, {"payments_log": None}]}, {"$set": {"payments_log": []}})
    now = datetime.now(timezone.utc).isoformat()
    payment_entry = {"id": f"pay_{uuid.uuid4().hex[:10]}", "amount": body.amount, "date": body.date, "method": body.method, "reference": body.reference, "notes": body.notes, "logged_at": now, "logged_by": "Admin"}
    await db.projects.update_one({"id": project_id}, {"$push": {"payments_log": {"$each": [payment_entry], "$sort": {"date": -1}}}, "$inc": {"amount_spent": body.amount}, "$set": {"updated_at": now}})
    formatted_amt = f"₹{body.amount:,.0f}"
    await _log_activity(project_id, "Accounts", f"Payment logged: {formatted_amt} via {body.method}", "Payments")
    asyncio.create_task(_push_notification(project_id, "Payment Received", f"We have successfully received your payment of {formatted_amt}.", "/portal/payments", "payments"))
    return {"success": True, "payment": payment_entry}


@proj_router.delete("/admin/projects/{project_id}/payments/{payment_id}", dependencies=[Depends(require_admin)])
async def delete_payment_log(project_id: str, payment_id: str):
    p = await db.projects.find_one({"id": project_id}, {"_id": 0, "payments_log": 1})
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    payments = p.get("payments_log") or []
    target = next((m for m in payments if m["id"] == payment_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Payment log not found")
    await db.projects.update_one({"id": project_id}, {"$pull": {"payments_log": {"id": payment_id}}, "$inc": {"amount_spent": -target["amount"]}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}})
    formatted_amt = f"₹{target['amount']:,.0f}"
    await _log_activity(project_id, "Accounts", f"Payment record reversed: {formatted_amt}", "Payments")
    return {"success": True}
# ============================================================================
# LIVE CCTV CAMERA MANAGEMENT
# ============================================================================

class CCTVCameraBody(BaseModel):
    name: str
    camera_type: str  # 'hls' | 'iframe' | 'youtube' | 'rtsp'
    url: str
    status: str = "online"  # online | offline | maintenance
    location_label: Optional[str] = None  # e.g. "Ground Floor", "Terrace"

class CCTVCameraUpdateBody(CCTVCameraBody):
    pass


@proj_router.post("/admin/projects/{project_id}/cameras", dependencies=[Depends(require_admin)])
async def add_camera(project_id: str, body: CCTVCameraBody):
    """Admin adds a new CCTV camera feed to the project."""
    p = await db.projects.find_one({"id": project_id}, {"id": 1})
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Validate camera name
    name = (body.name or "").strip()
    if not name or len(name) < 2 or len(name) > 50:
        raise HTTPException(status_code=400, detail="Camera name must be 2-50 characters")
    
    # Validate URL format
    url = (body.url or "").strip()
    if not url:
        raise HTTPException(status_code=400, detail="Stream URL is required")
    
    # Validate URL based on type
    cam_type = (body.camera_type or "").lower().strip()
    if cam_type not in ("hls", "iframe", "youtube", "rtsp"):
        raise HTTPException(status_code=400, detail="Camera type must be one of: hls, iframe, youtube, rtsp")
    
    if cam_type == "hls" and not (url.endswith(".m3u8") or ".m3u8" in url):
        raise HTTPException(status_code=400, detail="HLS stream URL must contain .m3u8")
    
    if cam_type == "youtube" and "youtube.com" not in url and "youtu.be" not in url:
        raise HTTPException(status_code=400, detail="YouTube URL must contain youtube.com or youtu.be")
    
    if cam_type == "iframe" and not (url.startswith("http://") or url.startswith("https://")):
        raise HTTPException(status_code=400, detail="Iframe URL must start with http:// or https://")

    # Ensure array exists
    await db.projects.update_one(
        {"id": project_id, "$or": [{"cctv_cameras": {"$exists": False}}, {"cctv_cameras": None}]},
        {"$set": {"cctv_cameras": []}}
    )

    # Check duplicate name
    existing = await db.projects.find_one(
        {"id": project_id, "cctv_cameras.name": name},
        {"_id": 1}
    )
    if existing:
        raise HTTPException(status_code=409, detail=f"A camera named '{name}' already exists for this project")

    now = datetime.now(timezone.utc).isoformat()
    camera = {
        "id": f"cam_{uuid.uuid4().hex[:10]}",
        "name": name,
        "camera_type": cam_type,
        "url": url,
        "status": body.status or "online",
        "location_label": (body.location_label or "").strip() or None,
        "added_at": now,
        "updated_at": now,
    }

    await db.projects.update_one(
        {"id": project_id},
        {"$push": {"cctv_cameras": camera}, "$set": {"updated_at": now}}
    )

    await _log_activity(project_id, "Admin", f"Added CCTV camera: {name}", "CCTV")
    asyncio.create_task(_push_notification(
        project_id, 
        "New Camera Added", 
        f"Live camera '{name}' is now streaming on your portal.", 
        "/portal/cctv", 
        "system"
    ))

    return {"success": True, "camera": camera}


@proj_router.put("/admin/projects/{project_id}/cameras/{camera_id}", dependencies=[Depends(require_admin)])
async def update_camera(project_id: str, camera_id: str, body: CCTVCameraUpdateBody):
    """Admin updates an existing camera's details or URL."""
    p = await db.projects.find_one({"id": project_id}, {"id": 1, "cctv_cameras": 1})
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    
    cameras = p.get("cctv_cameras") or []
    idx = next((i for i, c in enumerate(cameras) if c["id"] == camera_id), -1)
    if idx == -1:
        raise HTTPException(status_code=404, detail="Camera not found")
    
    # Validate
    name = (body.name or "").strip()
    if not name or len(name) < 2 or len(name) > 50:
        raise HTTPException(status_code=400, detail="Camera name must be 2-50 characters")
    
    url = (body.url or "").strip()
    if not url:
        raise HTTPException(status_code=400, detail="Stream URL is required")
    
    cam_type = (body.camera_type or "").lower().strip()
    if cam_type not in ("hls", "iframe", "youtube", "rtsp"):
        raise HTTPException(status_code=400, detail="Camera type must be one of: hls, iframe, youtube, rtsp")

    now = datetime.now(timezone.utc).isoformat()
    cameras[idx] = {
        "id": camera_id,
        "name": name,
        "camera_type": cam_type,
        "url": url,
        "status": body.status or "online",
        "location_label": (body.location_label or "").strip() or None,
        "added_at": cameras[idx].get("added_at", now),
        "updated_at": now,
    }

    await db.projects.update_one(
        {"id": project_id},
        {"$set": {"cctv_cameras": cameras, "updated_at": now}}
    )

    await _log_activity(project_id, "Admin", f"Updated CCTV camera: {name}", "CCTV")
    return {"success": True, "camera": cameras[idx]}


@proj_router.delete("/admin/projects/{project_id}/cameras/{camera_id}", dependencies=[Depends(require_admin)])
async def remove_camera(project_id: str, camera_id: str):
    """Admin removes a camera feed from the project."""
    p = await db.projects.find_one({"id": project_id}, {"id": 1, "cctv_cameras": 1})
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    
    cameras = p.get("cctv_cameras") or []
    target = next((c for c in cameras if c["id"] == camera_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Camera not found")

    await db.projects.update_one(
        {"id": project_id},
        {"$pull": {"cctv_cameras": {"id": camera_id}}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
    )

    await _log_activity(project_id, "Admin", f"Removed CCTV camera: {target['name']}", "CCTV")
    return {"success": True}


@proj_router.patch("/admin/projects/{project_id}/cameras/{camera_id}/status", dependencies=[Depends(require_admin)])
async def toggle_camera_status(project_id: str, camera_id: str):
    """Quick toggle: online ↔ offline."""
    p = await db.projects.find_one({"id": project_id}, {"id": 1, "cctv_cameras": 1})
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    
    cameras = p.get("cctv_cameras") or []
    idx = next((i for i, c in enumerate(cameras) if c["id"] == camera_id), -1)
    if idx == -1:
        raise HTTPException(status_code=404, detail="Camera not found")
    
    current_status = cameras[idx].get("status", "online")
    new_status = "offline" if current_status == "online" else "online"
    cameras[idx]["status"] = new_status
    cameras[idx]["updated_at"] = datetime.now(timezone.utc).isoformat()

    await db.projects.update_one(
        {"id": project_id},
        {"$set": {"cctv_cameras": cameras, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )

    await _log_activity(project_id, "Admin", f"Camera '{cameras[idx]['name']}' marked as {new_status}", "CCTV")
    return {"success": True, "status": new_status}

# Document
@proj_router.post("/admin/projects/{project_id}/documents", dependencies=[Depends(require_admin)])
async def create_document(project_id: str, body: DocumentCreateBody):
    p = await db.projects.find_one({"id": project_id}, {"id": 1})
    if not p: raise HTTPException(status_code=404, detail="Project not found")

    await db.projects.update_one(
        {"id": project_id, "$or": [{"documents": {"$exists": False}}, {"documents": None}]},
        {"$set": {"documents": []}}
    )

    now = datetime.now(timezone.utc).isoformat()
    doc_entry = {
        "id": f"doc_{uuid.uuid4().hex[:10]}",
        "name": body.name.strip(),
        "category": body.category,
        "stage": body.stage,
        "status": body.status,
        "description": body.description,
        "current_version": 1,
        "uploaded_at": now,
        "uploaded_by": "Admin",
        "versions": [{
            "version": 1, 
            "url": body.url, 
            "uploaded_at": now,
            "uploaded_by": "Admin"
        }]
    }

    await db.projects.update_one(
        {"id": project_id},
        {"$push": {"documents": {"$each": [doc_entry], "$position": 0}}, "$set": {"updated_at": now}}
    )
    await _log_activity(project_id, "Admin", f"Uploaded Document: {body.name}", "Documents")
    return {"success": True, "document": doc_entry}

@proj_router.post("/admin/projects/{project_id}/documents/{document_id}/revision", dependencies=[Depends(require_admin)])
async def revise_document(project_id: str, document_id: str, body: DocumentRevisionBody):
    p = await db.projects.find_one({"id": project_id}, {"id": 1, "documents": 1})
    if not p: raise HTTPException(status_code=404, detail="Not found")
    
    docs = p.get("documents") or []
    idx = next((i for i, d in enumerate(docs) if d["id"] == document_id), -1)
    if idx == -1: raise HTTPException(status_code=404, detail="Document not found")
    
    now = datetime.now(timezone.utc).isoformat()
    doc = docs[idx]
    new_version = doc.get("current_version", 1) + 1
    
    revision = {
        "version": new_version,
        "url": body.url,
        "uploaded_at": now,
        "uploaded_by": "Admin"
    }
    
    doc["versions"].append(revision)
    doc["current_version"] = new_version
    doc["status"] = body.status
    doc["uploaded_at"] = now
    
    await db.projects.update_one({"id": project_id}, {"$set": {f"documents.{idx}": doc, "updated_at": now}})
    await _log_activity(project_id, "Admin", f"Uploaded Revision R{new_version:02d} for {doc['name']}", "Documents")
    return {"success": True, "document": doc}

@proj_router.patch("/admin/projects/{project_id}/documents/{document_id}", dependencies=[Depends(require_admin)])
async def patch_document(project_id: str, document_id: str, body: DocumentPatchBody):
    p = await db.projects.find_one({"id": project_id}, {"id": 1, "documents": 1})
    if not p: raise HTTPException(status_code=404, detail="Not found")
    
    docs = p.get("documents") or []
    idx = next((i for i, d in enumerate(docs) if d["id"] == document_id), -1)
    if idx == -1: raise HTTPException(status_code=404, detail="Document not found")
    
    patch_data = body.model_dump(exclude_unset=True)
    docs[idx].update(patch_data)
    
    await db.projects.update_one({"id": project_id}, {"$set": {f"documents.{idx}": docs[idx], "updated_at": datetime.now(timezone.utc).isoformat()}})
    return {"success": True, "document": docs[idx]}

@proj_router.delete("/admin/projects/{project_id}/documents/{document_id}", dependencies=[Depends(require_admin)])
async def delete_document(project_id: str, document_id: str):
    p = await db.projects.find_one({"id": project_id}, {"id": 1, "documents": 1})
    if not p: raise HTTPException(status_code=404, detail="Not found")
    await db.projects.update_one({"id": project_id}, {"$pull": {"documents": {"id": document_id}}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}})
    return {"success": True}

@proj_router.post("/admin/projects/{project_id}/documents", dependencies=[Depends(require_admin)])
async def create_document(project_id: str, body: DocumentCreateBody):
    p = await db.projects.find_one({"id": project_id}, {"id": 1})
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")

    await db.projects.update_one(
        {"id": project_id, "$or": [{"documents": {"$exists": False}}, {"documents": None}]},
        {"$set": {"documents": []}}
    )

    now = datetime.now(timezone.utc).isoformat()
    doc_entry = {
        "id": f"doc_{uuid.uuid4().hex[:10]}",
        "name": body.name.strip(),
        "category": body.category,
        "url": body.url,
        "uploaded_at": now,
        "uploaded_by": "Admin"
    }

    await db.projects.update_one(
        {"id": project_id},
        {"$push": {"documents": {"$each": [doc_entry], "$position": 0}}, "$set": {"updated_at": now}}
    )

    await _log_activity(project_id, "Admin", f"Uploaded Document: {body.name} ({body.category})", "Documents")
    
    # 🔔 Notify Client
    asyncio.create_task(_push_notification(
        project_id, 
        "New Document Added", 
        f"A new document ({body.name}) has been uploaded to your project vault.", 
        "/portal/documents", 
        "system"
    ))

    return {"success": True, "document": doc_entry}


@proj_router.delete("/admin/projects/{project_id}/documents/{document_id}", dependencies=[Depends(require_admin)])
async def delete_document(project_id: str, document_id: str):
    p = await db.projects.find_one({"id": project_id}, {"id": 1, "documents": 1})
    if not p:
        raise HTTPException(status_code=404, detail="Not found")

    docs = p.get("documents") or []
    target = next((d for d in docs if d["id"] == document_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Document not found")

    await db.projects.update_one(
        {"id": project_id},
        {"$pull": {"documents": {"id": document_id}}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    await _log_activity(project_id, "Admin", f"Deleted Document: {target['name']}", "Documents")
    return {"success": True}

# ============================================================================
# QUALITY INSPECTIONS MANAGEMENT
# ============================================================================
@proj_router.put("/admin/projects/{project_id}/issues/{issue_id}", dependencies=[Depends(require_admin)])
async def admin_update_quality_issue(project_id: str, issue_id: str, body: IssueAdminUpdateBody):
    """Admin updates issue details (assignment, resolution, sends to client)."""
    p = await db.projects.find_one({"id": project_id}, {"issues": 1})
    if not p: raise HTTPException(404, "Project not found")
    
    issues = p.get("issues") or []
    idx = next((i for i, iss in enumerate(issues) if iss["id"] == issue_id), -1)
    if idx < 0: raise HTTPException(404, "Issue not found")

    old_status = issues[idx].get("status")
    now = datetime.now(timezone.utc).isoformat()

    issues[idx]["assigned_to"] = body.assigned_to
    issues[idx]["target_date"] = body.target_date
    issues[idx]["resolution_remark"] = body.resolution_remark
    issues[idx]["resolution_photos"] = body.resolution_photos
    issues[idx]["status"] = body.status
    
    if body.status == "ready_for_client_review" and old_status != "ready_for_client_review":
        issues[idx]["ready_for_review_at"] = now
        asyncio.create_task(_push_notification(
            project_id, "Issue Ready for Review 🔍", 
            f"The issue regarding '{issues[idx]['check_text_snapshot']}' has been rectified. Please review it.", 
            "/portal/issues", "quality"
        ))

    await db.projects.update_one({"id": project_id}, {"$set": {"issues": issues}})
    return {"success": True, "issue": issues[idx]}


@proj_router.patch("/admin/projects/{project_id}/issues/{issue_id}/close", dependencies=[Depends(require_admin)])
async def admin_close_quality_issue(project_id: str, issue_id: str):
    """Admin officially closes the issue (PRD Rule: Must be client_approved first)."""
    p = await db.projects.find_one({"id": project_id}, {"issues": 1})
    issues = p.get("issues") or []
    idx = next((i for i, iss in enumerate(issues) if iss["id"] == issue_id), -1)
    if idx < 0: raise HTTPException(404, "Issue not found")

    if issues[idx].get("client_review_status") != "approved":
        raise HTTPException(400, "Cannot close issue until Client approves the resolution.")

    issues[idx]["status"] = "closed"
    issues[idx]["closed_at"] = datetime.now(timezone.utc).isoformat()

    await db.projects.update_one({"id": project_id}, {"$set": {"issues": issues}})
    return {"success": True}


@proj_router.post("/portal/my-project/issues/{issue_id}/client-review")
async def client_review_issue_resolution(issue_id: str, body: IssueClientReviewBody, customer=Depends(get_current_customer)):
    """Client approves or rejects the team's resolution."""
    email = (customer.get("email") or "").lower()
    proj = await db.projects.find_one(
        {"$or": [{"customer_email": email}, {"team_directory.email": email}]},
        {"id": 1, "issues": 1, "quality_stage_reviews": 1}
    )
    if not proj: raise HTTPException(404, "Project not found")
    
    issues = proj.get("issues") or []
    idx = next((i for i, iss in enumerate(issues) if iss["id"] == issue_id), -1)
    if idx < 0: raise HTTPException(404, "Issue not found")

    if issues[idx]["status"] != "ready_for_client_review":
        raise HTTPException(400, "Issue is not pending your review.")

    now = datetime.now(timezone.utc).isoformat()
    client_name = customer.get("name") or "Client"

    issues[idx]["client_reviewed_at"] = now
    issues[idx]["client_review_remark"] = body.remark

    if body.approved:
        issues[idx]["client_review_status"] = "approved"
        issues[idx]["status"] = "client_approved"
        
        # Auto-update the underlying quality check status to 'approved'
        reviews = proj.get("quality_stage_reviews") or []
        for r in reviews:
            for c in r.get("checks", []):
                if c["open_issue_id"] == issue_id:
                    c["client_status"] = "approved"
                    c["open_issue_id"] = None # Issue resolved, disconnect block
        await db.projects.update_one({"id": proj["id"]}, {"$set": {"quality_stage_reviews": reviews}})
        
        await _log_activity(proj["id"], client_name, f"Approved resolution for issue: {issues[idx]['check_text_snapshot']}", "Issues")
    else:
        # PRD Rule: Returns to In Progress
        issues[idx]["client_review_status"] = "not_approved"
        issues[idx]["status"] = "in_progress" 
        await _log_activity(proj["id"], client_name, f"Rejected resolution for issue: {issues[idx]['check_text_snapshot']}", "Issues")

    await db.projects.update_one({"id": proj["id"]}, {"$set": {"issues": issues}})
    return {"success": True}
# ---------- ALLOW ADD CHECK AFTER RELEASE (new checks = pending_review) ----------
@proj_router.post("/admin/projects/{project_id}/quality-reviews/{review_id}/checks", dependencies=[Depends(require_admin)])
async def admin_add_quality_check(project_id: str, review_id: str, body: QualityCheckCreate):
    p = await db.projects.find_one({"id": project_id}, {"quality_stage_reviews": 1})
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    reviews = p.get("quality_stage_reviews") or []
    idx = next((i for i, r in enumerate(reviews) if r["id"] == review_id), -1)
    if idx == -1:
        raise HTTPException(status_code=404, detail="Stage review not found")

    # PRD: PM can add checks after release; new check awaits client
    check = {
        "id": f"qchk_{uuid.uuid4().hex[:10]}",
        "area": body.area.strip(),
        "check_text": body.check_text.strip(),
        "pm_remark": (body.pm_remark or "Verified on site.").strip(),
        "photo_urls": body.photo_urls or [],
        "client_status": "pending_review",
        "client_remark": None,
        "client_responded_at": None,
        "open_issue_id": None,
    }
    if "checks" not in reviews[idx] or reviews[idx]["checks"] is None:
        reviews[idx]["checks"] = []
    reviews[idx]["checks"].append(check)

    await db.projects.update_one(
        {"id": project_id},
        {"$set": {"quality_stage_reviews": reviews, "updated_at": datetime.now(timezone.utc).isoformat()}},
    )
    return {"success": True, "check": check}


# ---------- ALLOW EDIT AFTER RELEASE + re-review if client already acted ----------
@proj_router.patch("/admin/projects/{project_id}/quality-reviews/{review_id}/checks/{check_id}", dependencies=[Depends(require_admin)])
async def admin_patch_quality_check(project_id: str, review_id: str, check_id: str, body: QualityCheckCreate):
    p = await db.projects.find_one({"id": project_id}, {"quality_stage_reviews": 1})
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    reviews = p.get("quality_stage_reviews") or []
    ridx = next((i for i, r in enumerate(reviews) if r["id"] == review_id), -1)
    if ridx < 0:
        raise HTTPException(status_code=404, detail="Stage not found")

    checks = reviews[ridx].get("checks") or []
    cidx = next((i for i, c in enumerate(checks) if c["id"] == check_id), -1)
    if cidx < 0:
        raise HTTPException(status_code=404, detail="Check not found")

    prev = checks[cidx]
    # Material edit after client response → invalidate client decision (PRD edge case)
    had_client_action = prev.get("client_status") in ("approved", "issue_raised", "rereview_required")

    checks[cidx]["area"] = body.area.strip()
    checks[cidx]["check_text"] = body.check_text.strip()
    checks[cidx]["pm_remark"] = (body.pm_remark or "").strip()
    checks[cidx]["photo_urls"] = body.photo_urls or []

    if had_client_action or reviews[ridx].get("status") == "released":
        # Send back for client re-review when PM updates released/reviewed check
        if had_client_action:
            checks[cidx]["client_status"] = "pending_review"
            checks[cidx]["client_remark"] = None
            checks[cidx]["client_responded_at"] = None
            # keep open_issue_id history; do not auto-close issues here

    reviews[ridx]["checks"] = checks
    await db.projects.update_one(
        {"id": project_id},
        {"$set": {"quality_stage_reviews": reviews, "updated_at": datetime.now(timezone.utc).isoformat()}},
    )
    return {"success": True, "check": checks[cidx]}


# ---------- Delete check: only if not approved/issue (or draft stage) ----------
@proj_router.delete("/admin/projects/{project_id}/quality-reviews/{review_id}/checks/{check_id}", dependencies=[Depends(require_admin)])
async def admin_delete_quality_check(project_id: str, review_id: str, check_id: str):
    p = await db.projects.find_one({"id": project_id}, {"quality_stage_reviews": 1})
    reviews = p.get("quality_stage_reviews") or []
    ridx = next((i for i, r in enumerate(reviews) if r["id"] == review_id), -1)
    if ridx < 0:
        raise HTTPException(status_code=404, detail="Stage not found")

    checks = reviews[ridx].get("checks") or []
    target = next((c for c in checks if c["id"] == check_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Check not found")

    if target.get("client_status") in ("approved", "issue_raised"):
        raise HTTPException(status_code=400, detail="Cannot delete a check the client already acted on")

    reviews[ridx]["checks"] = [c for c in checks if c["id"] != check_id]
    await db.projects.update_one(
        {"id": project_id},
        {"$set": {"quality_stage_reviews": reviews, "updated_at": datetime.now(timezone.utc).isoformat()}},
    )
    return {"success": True}

@proj_router.patch("/admin/projects/{project_id}/quality-reviews/{review_id}", dependencies=[Depends(require_admin)])
async def admin_patch_quality_stage(project_id: str, review_id: str, body: QualityStageCreate):
    p = await db.projects.find_one({"id": project_id}, {"quality_stage_reviews": 1})
    if not p: raise HTTPException(404, "Not found")
    reviews = p.get("quality_stage_reviews") or []
    idx = next((i for i, r in enumerate(reviews) if r["id"] == review_id), -1)
    if idx < 0: raise HTTPException(404, "Stage not found")
    if body.name: reviews[idx]["name"] = body.name.strip()
    await db.projects.update_one({"id": project_id}, {"$set": {"quality_stage_reviews": reviews}})
    return {"success": True, "stage_review": reviews[idx]}

@proj_router.delete("/admin/projects/{project_id}/quality-reviews/{review_id}", dependencies=[Depends(require_admin)])
async def admin_delete_quality_stage(project_id: str, review_id: str):
    p = await db.projects.find_one({"id": project_id}, {"quality_stage_reviews": 1})
    reviews = p.get("quality_stage_reviews") or []
    target = next((r for r in reviews if r["id"] == review_id), None)
    if not target: raise HTTPException(404, "Not found")
    if target.get("status") == "released":
        raise HTTPException(400, "Cannot delete released stage")
    reviews = [r for r in reviews if r["id"] != review_id]
    await db.projects.update_one({"id": project_id}, {"$set": {"quality_stage_reviews": reviews}})
    return {"success": True}

@proj_router.patch("/admin/projects/{project_id}/quality-reviews/{review_id}/checks/{check_id}", dependencies=[Depends(require_admin)])
async def admin_patch_quality_check(project_id: str, review_id: str, check_id: str, body: QualityCheckCreate):
    p = await db.projects.find_one({"id": project_id}, {"quality_stage_reviews": 1})
    reviews = p.get("quality_stage_reviews") or []
    ridx = next((i for i, r in enumerate(reviews) if r["id"] == review_id), -1)
    if ridx < 0: raise HTTPException(404, "Stage not found")
    if reviews[ridx].get("status") == "released":
        raise HTTPException(400, "Cannot edit checks on released stage")
    checks = reviews[ridx].get("checks") or []
    cidx = next((i for i, c in enumerate(checks) if c["id"] == check_id), -1)
    if cidx < 0: raise HTTPException(404, "Check not found")
    checks[cidx]["area"] = body.area
    checks[cidx]["check_text"] = body.check_text
    checks[cidx]["pm_remark"] = body.pm_remark
    checks[cidx]["photo_urls"] = body.photo_urls or []
    reviews[ridx]["checks"] = checks
    await db.projects.update_one({"id": project_id}, {"$set": {"quality_stage_reviews": reviews}})
    return {"success": True, "check": checks[cidx]}

@proj_router.delete("/admin/projects/{project_id}/quality-reviews/{review_id}/checks/{check_id}", dependencies=[Depends(require_admin)])
async def admin_delete_quality_check(project_id: str, review_id: str, check_id: str):
    p = await db.projects.find_one({"id": project_id}, {"quality_stage_reviews": 1})
    reviews = p.get("quality_stage_reviews") or []
    ridx = next((i for i, r in enumerate(reviews) if r["id"] == review_id), -1)
    if ridx < 0: raise HTTPException(404, "Stage not found")
    if reviews[ridx].get("status") == "released":
        raise HTTPException(400, "Cannot delete checks on released stage")
    reviews[ridx]["checks"] = [c for c in (reviews[ridx].get("checks") or []) if c["id"] != check_id]
    await db.projects.update_one({"id": project_id}, {"$set": {"quality_stage_reviews": reviews}})
    return {"success": True}

@proj_router.post("/admin/projects/{project_id}/quality-reviews", dependencies=[Depends(require_admin)])
async def admin_create_quality_stage_review(project_id: str, body: QualityStageCreate):
    """Admin creates a new Quality Stage Review (Draft)."""
    p = await db.projects.find_one({"id": project_id}, {"id": 1})
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")

    await db.projects.update_one(
        {"id": project_id, "$or": [{"quality_stage_reviews": {"$exists": False}}, {"quality_stage_reviews": None}]},
        {"$set": {"quality_stage_reviews": []}}
    )

    stage_review = {
        "id": f"qsr_{uuid.uuid4().hex[:10]}",
        "name": body.name,
        "status": "draft",
        "released_at": None,
        "checks": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    await db.projects.update_one(
        {"id": project_id},
        {"$push": {"quality_stage_reviews": {"$each": [stage_review], "$position": 0}}}
    )
    return {"success": True, "stage_review": stage_review}

@proj_router.post("/admin/projects/{project_id}/quality-reviews/{review_id}/checks", dependencies=[Depends(require_admin)])
async def admin_add_quality_check(project_id: str, review_id: str, body: QualityCheckCreate):
    """Admin adds a check to a draft stage review."""
    p = await db.projects.find_one({"id": project_id}, {"quality_stage_reviews": 1})
    reviews = p.get("quality_stage_reviews") or []
    idx = next((i for i, r in enumerate(reviews) if r["id"] == review_id), -1)
    if idx == -1:
        raise HTTPException(status_code=404, detail="Stage review not found")

    if reviews[idx]["status"] == "released":
        raise HTTPException(status_code=400, detail="Cannot add checks to a released stage")

    check = {
        "id": f"qchk_{uuid.uuid4().hex[:10]}",
        "area": body.area,
        "check_text": body.check_text,
        "pm_remark": body.pm_remark,
        "photo_urls": body.photo_urls,
        "client_status": "pending_review",
        "client_remark": None,
        "client_responded_at": None,
        "open_issue_id": None
    }

    reviews[idx]["checks"].append(check)
    await db.projects.update_one(
        {"id": project_id},
        {"$set": {"quality_stage_reviews": reviews}}
    )
    return {"success": True, "check": check}

@proj_router.patch("/admin/projects/{project_id}/quality-reviews/{review_id}/release", dependencies=[Depends(require_admin)])
async def admin_release_quality_stage(project_id: str, review_id: str):
    """Admin explicitly releases the stage to the client."""
    p = await db.projects.find_one({"id": project_id}, {"quality_stage_reviews": 1})
    reviews = p.get("quality_stage_reviews") or []
    idx = next((i for i, r in enumerate(reviews) if r["id"] == review_id), -1)
    if idx == -1:
        raise HTTPException(status_code=404, detail="Stage not found")

    reviews[idx]["status"] = "released"
    reviews[idx]["released_at"] = datetime.now(timezone.utc).isoformat()

    await db.projects.update_one(
        {"id": project_id},
        {"$set": {"quality_stage_reviews": reviews}}
    )
    
    asyncio.create_task(_push_notification(
        project_id, "Quality Review Required 🔍", 
        f"The '{reviews[idx]['name']}' quality checks have been released for your review.", 
        "/portal/quality", "quality"
    ))
    return {"success": True}

@proj_router.post("/portal/my-project/quality-checks/{check_id}/approve")
async def client_approve_quality_check(check_id: str, body: ClientApproveCheckBody, customer=Depends(get_current_customer)):
    """Client approves a specific quality check."""
    email = (customer.get("email") or "").lower()
    proj = await db.projects.find_one(
        {"$or": [{"customer_email": email}, {"team_directory.email": email}]},
        {"id": 1, "quality_stage_reviews": 1}
    )
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    reviews = proj.get("quality_stage_reviews") or []
    found = False
    for r in reviews:
        for c in r.get("checks", []):
            if c["id"] == check_id:
                if c["client_status"] != "pending_review":
                    raise HTTPException(status_code=400, detail="Check already reviewed")
                c["client_status"] = "approved"
                c["client_remark"] = body.remark
                c["client_responded_at"] = datetime.now(timezone.utc).isoformat()
                found = True
                break
        if found: break

    if not found:
        raise HTTPException(status_code=404, detail="Check not found")

    await db.projects.update_one({"id": proj["id"]}, {"$set": {"quality_stage_reviews": reviews}})
    await _log_activity(proj["id"], customer.get("name") or "Client", "Approved a quality check", "Quality")
    return {"success": True}

@proj_router.post("/portal/my-project/quality-checks/{check_id}/raise-issue")
async def client_raise_quality_issue(check_id: str, body: ClientRaiseIssueBody, customer=Depends(get_current_customer)):
    """Client rejects a check and creates an Issue stub."""
    email = (customer.get("email") or "").lower()
    proj = await db.projects.find_one(
        {"$or": [{"customer_email": email}, {"team_directory.email": email}]},
        {"id": 1, "quality_stage_reviews": 1}
    )
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    reviews = proj.get("quality_stage_reviews") or []
    found_check = None
    found_review = None
    
    for r in reviews:
        for c in r.get("checks", []):
            if c["id"] == check_id:
                if c["client_status"] != "pending_review":
                    raise HTTPException(status_code=400, detail="Check already reviewed")
                found_check = c
                found_review = r
                break
        if found_check: break

    if not found_check:
        raise HTTPException(status_code=404, detail="Check not found")

    now = datetime.now(timezone.utc).isoformat()
    issue_id = f"iss_{uuid.uuid4().hex[:10]}"

    found_check["client_status"] = "issue_raised"
    found_check["client_remark"] = body.description
    found_check["client_responded_at"] = now
    found_check["open_issue_id"] = issue_id

    issue_stub = {
        "id": issue_id,
        "quality_check_id": check_id,
        "stage_review_id": found_review["id"],
        "area": found_check["area"],
        "check_text_snapshot": found_check["check_text"],
        "description": body.description,
        "photos": body.photo_urls,
        "status": "open",
        "raised_by": customer.get("name") or "Client",
        "raised_at": now
    }

    await db.projects.update_one(
        {"id": proj["id"], "$or": [{"issues": {"$exists": False}}, {"issues": None}]},
        {"$set": {"issues": []}}
    )

    await db.projects.update_one(
        {"id": proj["id"]},
        {
            "$set": {"quality_stage_reviews": reviews},
            "$push": {"issues": {"$each": [issue_stub], "$position": 0}}
        }
    )

    await _log_activity(proj["id"], customer.get("name") or "Client", f"Raised an issue for {found_check['check_text']}", "Issues")
    return {"success": True, "issue_id": issue_id}
class QualityInspectionBody(BaseModel):
    name: str = Field(..., min_length=3, max_length=100)
    category: str  # 'Foundation', 'Structure', 'MEP', 'Finishing', 'General'
    status: str = "pending"  # 'passed', 'rectification', 'in_progress', 'pending'
    inspector_name: str = Field(..., min_length=2)
    remarks: Optional[str] = None
    photo_url: Optional[str] = None  # Single verified image as requested
    inspected_at: Optional[str] = None

class QualityInspectionUpdateBody(QualityInspectionBody):
    pass


@proj_router.post("/admin/projects/{project_id}/quality", dependencies=[Depends(require_admin)])
async def create_quality_inspection(project_id: str, body: QualityInspectionBody):
    """Admin logs a new quality inspection audit."""
    p = await db.projects.find_one({"id": project_id}, {"id": 1})
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")

    await db.projects.update_one(
        {"id": project_id, "$or": [{"quality_inspections": {"$exists": False}}, {"quality_inspections": None}]},
        {"$set": {"quality_inspections": []}}
    )

    now = datetime.now(timezone.utc).isoformat()
    inspection_data = body.model_dump()
    inspection_data["id"] = f"qual_{uuid.uuid4().hex[:10]}"
    inspection_data["created_at"] = now
    inspection_data["updated_at"] = now
    if not inspection_data["inspected_at"]:
        inspection_data["inspected_at"] = now

    await db.projects.update_one(
        {"id": project_id},
        {"$push": {"quality_inspections": {"$each": [inspection_data], "$position": 0}}, "$set": {"updated_at": now}}
    )

    await _log_activity(project_id, "Quality Team", f"Logged Quality Audit: {body.name} ({body.status.upper()})", "Quality")
    
    # 🔔 Notify Client via App + Email
    if body.status == "passed":
        asyncio.create_task(_push_notification(
            project_id, "Quality Check Passed ✅", 
            f"The '{body.name}' inspection has been cleared by {body.inspector_name}.", 
            "/portal/quality", "quality"
        ))
    elif body.status == "rectification":
        asyncio.create_task(_push_notification(
            project_id, "Quality Rectification Required ⚠️", 
            f"The '{body.name}' inspection flagged items for rectification. Our team is resolving this immediately.", 
            "/portal/quality", "quality"
        ))
    # 🔔 Notify Client via App + Email (All Statuses)
    if body.status == "passed":
        notif_title, notif_msg = "Quality Check Passed ✅", f"The '{body.name}' inspection has been cleared by {body.inspector_name}."
    elif body.status == "rectification":
        notif_title, notif_msg = "Quality Rectification Required ⚠️", f"The '{body.name}' inspection flagged items for rectification. Our team is resolving this."
    elif body.status == "in_progress":
        notif_title, notif_msg = "Quality Audit In Progress ⏳", f"The quality inspection for '{body.name}' is currently underway by {body.inspector_name}."
    else: # pending
        notif_title, notif_msg = "Quality Audit Scheduled 📅", f"A new quality check for '{body.name}' has been scheduled."

    asyncio.create_task(_push_notification(
        project_id, notif_title, notif_msg, "/portal/quality", "quality"
    ))
    return {"success": True, "inspection": inspection_data}


@proj_router.put("/admin/projects/{project_id}/quality/{inspection_id}", dependencies=[Depends(require_admin)])
async def update_quality_inspection(project_id: str, inspection_id: str, body: QualityInspectionUpdateBody):
    """Admin updates an existing quality inspection (e.g. changing status from rectification to passed, updating image)."""
    p = await db.projects.find_one({"id": project_id}, {"id": 1, "quality_inspections": 1})
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")

    inspections = p.get("quality_inspections") or []
    idx = next((i for i, q in enumerate(inspections) if q["id"] == inspection_id), -1)
    if idx == -1:
        raise HTTPException(status_code=404, detail="Quality inspection not found")

    old_status = inspections[idx].get("status")
    now = datetime.now(timezone.utc).isoformat()
    
    update_data = body.model_dump()
    update_data["id"] = inspection_id
    update_data["created_at"] = inspections[idx].get("created_at", now)
    update_data["updated_at"] = now
    if not update_data["inspected_at"]:
        update_data["inspected_at"] = inspections[idx].get("inspected_at", now)

    inspections[idx] = update_data

    await db.projects.update_one(
        {"id": project_id},
        {"$set": {"quality_inspections": inspections, "updated_at": now}}
    )

    await _log_activity(project_id, "Quality Team", f"Updated Quality Audit: {body.name}", "Quality")

    # Notify if status changed to passed
    if old_status != "passed" and body.status == "passed":
        asyncio.create_task(_push_notification(
            project_id, "Quality Rectification Cleared ✅", 
            f"The '{body.name}' inspection has been fully rectified and passed.", 
            "/portal/quality", "quality"
        ))
    # 🔔 Notify if status changed
    if old_status != body.status:
        if body.status == "passed":
            notif_title, notif_msg = "Quality Rectification Cleared ✅", f"The '{body.name}' inspection has been fully rectified and passed."
        elif body.status == "rectification":
            notif_title, notif_msg = "Quality Rectification Required ⚠️", f"The '{body.name}' inspection flagged items for rectification."
        elif body.status == "in_progress":
            notif_title, notif_msg = "Quality Audit In Progress ⏳", f"The '{body.name}' inspection is now in progress."
        else:
            notif_title, notif_msg = "Quality Audit Scheduled 📅", f"The '{body.name}' inspection has been scheduled."

        asyncio.create_task(_push_notification(
            project_id, notif_title, notif_msg, "/portal/quality", "quality"
        ))
    return {"success": True, "inspection": update_data}


@proj_router.delete("/admin/projects/{project_id}/quality/{inspection_id}", dependencies=[Depends(require_admin)])
async def delete_quality_inspection(project_id: str, inspection_id: str):
    p = await db.projects.find_one({"id": project_id}, {"id": 1, "quality_inspections": 1})
    if not p:
        raise HTTPException(status_code=404, detail="Not found")

    await db.projects.update_one(
        {"id": project_id},
        {"$pull": {"quality_inspections": {"id": inspection_id}}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"success": True}

# warranty and maintainence 
@proj_router.put("/admin/projects/{project_id}/warranty", dependencies=[Depends(require_admin)])
async def update_warranty(project_id: str, body: WarrantyUpdateBody):
    """Admin configures the Warranty timer."""
    p = await db.projects.find_one({"id": project_id}, {"id": 1, "warranty_active": 1})
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")

    is_active = bool(body.warranty_start_date and body.warranty_years)
    was_active = p.get("warranty_active", False)
    
    update_data = {
        "warranty_start_date": body.warranty_start_date,
        "warranty_years": body.warranty_years,
        "warranty_active": is_active,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.projects.update_one({"id": project_id}, {"$set": update_data})
    
    # Notify client if warranty just got activated
    if is_active and not was_active:
        await _log_activity(project_id, "Admin", f"{body.warranty_years}-Year Warranty Activated", "System")
        asyncio.create_task(_push_notification(
            project_id, "Warranty Activated 🛡️", 
            f"Your {body.warranty_years}-Year Post-Handover Warranty is now active. View your benefits in the Maintenance tab.", 
            "/portal/maintenance", "system"
        ))

    return {"success": True, "warranty": update_data}


@proj_router.post("/portal/my-project/maintenance")
async def portal_raise_ticket(body: MaintenanceTicketCreateBody, customer=Depends(get_current_customer)):
    """Client raises a maintenance ticket from the portal."""
    email = (customer.get("email") or "").lower()
    proj = await db.projects.find_one(
        {"$or": [{"customer_email": email}, {"team_directory.email": email}]},
        {"id": 1, "customer_email": 1, "team_directory": 1}
    )
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    _enforce_full_access(proj, email)

    await db.projects.update_one(
        {"id": proj["id"], "$or": [{"maintenance_tickets": {"$exists": False}}, {"maintenance_tickets": None}]},
        {"$set": {"maintenance_tickets": []}}
    )

    now = datetime.now(timezone.utc).isoformat()
    ticket_id = f"TKT-{random.randint(1000, 9999)}"
    
    ticket = {
        "id": ticket_id,
        "title": body.title.strip(),
        "category": body.category,
        "priority": body.priority,
        "description": body.description.strip(),
        "photo_urls": body.photo_urls,
        "status": "open",
        "admin_notes": None,
        "raised_at": now,
        "raised_by": customer.get("name") or "Client",
        "resolved_at": None,
        "updated_at": now
    }

    await db.projects.update_one(
        {"id": proj["id"]},
        {"$push": {"maintenance_tickets": {"$each": [ticket], "$position": 0}}, "$set": {"updated_at": now}}
    )

    await _log_activity(proj["id"], customer.get("name") or "Client", f"Raised Maintenance Ticket: {ticket_id}", "System")
    return {"success": True, "ticket": ticket}


@proj_router.put("/admin/projects/{project_id}/maintenance/{ticket_id}", dependencies=[Depends(require_admin)])
async def admin_update_ticket(project_id: str, ticket_id: str, body: MaintenanceTicketUpdateBody):
    """Admin updates ticket status and adds notes."""
    p = await db.projects.find_one({"id": project_id}, {"id": 1, "maintenance_tickets": 1})
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")

    tickets = p.get("maintenance_tickets") or []
    idx = next((i for i, t in enumerate(tickets) if t["id"] == ticket_id), -1)
    if idx == -1:
        raise HTTPException(status_code=404, detail="Ticket not found")

    old_status = tickets[idx].get("status")
    now = datetime.now(timezone.utc).isoformat()
    
    tickets[idx]["status"] = body.status
    tickets[idx]["admin_notes"] = body.admin_notes
    tickets[idx]["updated_at"] = now
    
    if body.status == "resolved" and old_status != "resolved":
        tickets[idx]["resolved_at"] = now
    elif body.status != "resolved":
        tickets[idx]["resolved_at"] = None

    await db.projects.update_one(
        {"id": project_id},
        {"$set": {"maintenance_tickets": tickets, "updated_at": now}}
    )

    # 🔔 Notify Client of Update
    if old_status != body.status or body.admin_notes != p["maintenance_tickets"][idx].get("admin_notes"):
        status_display = body.status.replace("_", " ").title()
        msg = f"Ticket {ticket_id} status is now '{status_display}'."
        if body.admin_notes:
            msg += f" Note: {body.admin_notes}"
        
        asyncio.create_task(_push_notification(
            project_id, f"Maintenance Ticket Updated: {ticket_id}", msg, "/portal/maintenance", "system"
        ))

    return {"success": True, "ticket": tickets[idx]}

# ============================================================================
# PROGRESS REPORTING SCHEMAS & ENDPOINTS
# ============================================================================

class DailyReportPhoto(BaseModel):
    url: str
    caption: Optional[str] = None
    time: Optional[str] = None

class DailyReportCreateBody(BaseModel):
    date: str  # YYYY-MM-DD
    overall_status: str = "Work as per plan"
    status_notes: Optional[str] = None
    work_completed: List[str] = Field(default_factory=list)
    planned_tomorrow: List[str] = Field(default_factory=list)
    photos: List[DailyReportPhoto] = Field(default_factory=list)

@proj_router.post("/admin/projects/{project_id}/daily-reports", dependencies=[Depends(require_admin)])
async def submit_daily_report(project_id: str, body: DailyReportCreateBody):
    """Site Engineer submits a daily report. Defaults to UNAPPROVED."""
    p = await db.projects.find_one({"id": project_id}, {"id": 1})
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")

    await db.projects.update_one(
        {"id": project_id, "$or": [{"daily_reports": {"$exists": False}}, {"daily_reports": None}]},
        {"$set": {"daily_reports": []}}
    )

    report_data = body.model_dump()
    report_data["id"] = f"rep_{uuid.uuid4().hex[:10]}"
    report_data["is_approved"] = False  # Client CANNOT see this yet
    report_data["submitted_at"] = datetime.now(timezone.utc).isoformat()
    report_data["submitted_by"] = "Site Engineer"

    # Push to array
    await db.projects.update_one(
        {"id": project_id},
        {"$push": {"daily_reports": {"$each": [report_data], "$position": 0}}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
    )

    await _log_activity(project_id, "Site Engineer", f"Submitted Daily Report for {body.date} (Awaiting Approval)", "Progress")
    return {"success": True, "report": report_data}


@proj_router.patch("/admin/projects/{project_id}/daily-reports/{report_id}/approve", dependencies=[Depends(require_admin)])
async def approve_daily_report(project_id: str, report_id: str):
    """Project Manager approves the report, making it visible to the client."""
    p = await db.projects.find_one({"id": project_id}, {"id": 1, "daily_reports": 1})
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")

    reports = p.get("daily_reports", [])
    idx = next((i for i, r in enumerate(reports) if r["id"] == report_id), -1)
    if idx == -1:
        raise HTTPException(status_code=404, detail="Report not found")

    reports[idx]["is_approved"] = True
    reports[idx]["approved_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.projects.update_one(
        {"id": project_id},
        {"$set": {"daily_reports": reports, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )

    await _log_activity(project_id, "Project Manager", f"Approved Daily Report for {reports[idx]['date']}", "Progress")
    
    # 🔔 ONLY notify client AFTER PM approves
    asyncio.create_task(_push_notification(
        project_id, 
        "New Daily Progress Report", 
        f"Your daily site update for {reports[idx]['date']} has been verified and published.", 
        "/portal/progress", 
        "progress"
    ))

    return {"success": True, "report": reports[idx]}


@proj_router.delete("/admin/projects/{project_id}/daily-reports/{report_id}", dependencies=[Depends(require_admin)])
async def delete_daily_report(project_id: str, report_id: str):
    """Admin deletes a report."""
    res = await db.projects.update_one(
        {"id": project_id},
        {"$pull": {"daily_reports": {"id": report_id}}}
    )
    if res.modified_count == 0:
        raise HTTPException(status_code=404, detail="Report not found")
    return {"success": True}


# ============================================================================
# MONTHLY REPORT PDF GENERATOR — ConstructONS™ branding (no logo)
# ============================================================================
from fastapi.responses import HTMLResponse

@proj_router.get("/portal/my-project/{project_id}/monthly-report/{month_slug}/pdf")
async def download_monthly_pdf(project_id: str, month_slug: str):
    p = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")

    stages = p.get("stages", []) or []
    total_pct = sum(float(s.get("progress_pct") or 0) for s in stages)
    overall = total_pct / (len(stages) or 1)

    month_label = month_slug.replace("-", " ").title()
    project_title = p.get("title") or "Unnamed Project"
    project_address = p.get("address") or "N/A"
    project_code = p.get("project_code") or "—"

    rows_html = "".join(
        f"""
        <tr>
            <td>{(s.get("name") or "—")}</td>
            <td>{(s.get("status") or "pending").replace("_", " ").title()}</td>
            <td class="pct">{float(s.get("progress_pct") or 0):.0f}%</td>
        </tr>
        """
        for s in stages
    ) or """
        <tr>
            <td colspan="3" style="text-align:center;color:#777;font-style:italic;">No stages configured</td>
        </tr>
    """

    # Power "O" as inline SVG (print-safe, matches Lucide Power)
    power_svg = """<svg class="power-o" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path fill="none" stroke="#FF5A00" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round"
        d="M12 2v10"/>
      <path fill="none" stroke="#FF5A00" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round"
        d="M18.36 6.64a9 9 0 1 1-12.73 0"/>
    </svg>"""

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>ConstructONS™ Monthly Progress — {month_label}</title>
  <style>
    :root {{
      --orange: #FF5A00;
      --navy: #000F1B;
      --charcoal: #111111;
      --grey: #A6A6A6;
      --light: #F2F2F2;
    }}
    * {{ box-sizing: border-box; }}
    body {{
      font-family: Arial, Helvetica, sans-serif;
      padding: 40px 48px;
      color: var(--charcoal);
      line-height: 1.55;
      margin: 0;
    }}
    .brand-row {{
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      border-bottom: 3px solid var(--orange);
      padding-bottom: 14px;
      margin-bottom: 28px;
    }}
    .brand-lockup {{
      display: flex;
      align-items: center;
      gap: 2px;
      line-height: 1;
    }}
    .brand-construct {{
      font-weight: 800;
      font-size: 22px;
      letter-spacing: 0.14em;
      color: var(--navy);
      text-transform: uppercase;
    }}
    .power-o {{
      display: inline-block;
      vertical-align: middle;
      margin: 0 1px 1px 1px;
      flex-shrink: 0;
    }}
    .brand-ns {{
      font-weight: 800;
      font-size: 22px;
      letter-spacing: 0.14em;
      color: var(--orange);
      text-transform: uppercase;
    }}
    .brand-tm {{
      color: var(--orange);
      font-size: 11px;
      font-weight: 700;
      margin-left: 2px;
      position: relative;
      top: -8px;
    }}
    .tagline {{
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--grey);
      text-align: right;
      line-height: 1.4;
    }}
    .tagline strong {{
      color: var(--orange);
      display: block;
      margin-top: 4px;
      letter-spacing: 0.1em;
    }}
    h1 {{
      color: var(--navy);
      font-size: 22px;
      font-weight: 700;
      margin: 0 0 6px 0;
    }}
    h1 span {{ color: var(--orange); }}
    .subtitle {{
      font-size: 13px;
      color: #666;
      margin: 0 0 22px 0;
    }}
    .header-info {{
      background: var(--light);
      border-left: 4px solid var(--orange);
      padding: 16px 20px;
      border-radius: 0 8px 8px 0;
      margin-bottom: 28px;
    }}
    .header-info p {{ margin: 6px 0; font-size: 13px; }}
    .header-info strong {{
      color: var(--navy);
      font-weight: 600;
      min-width: 140px;
      display: inline-block;
    }}
    .badge {{
      display: inline-block;
      background: var(--orange);
      color: #fff;
      font-size: 12px;
      font-weight: 700;
      padding: 4px 12px;
      border-radius: 999px;
      margin-left: 6px;
    }}
    h3 {{
      color: var(--navy);
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin: 0 0 12px 0;
      border-bottom: 1px solid #e5e5e5;
      padding-bottom: 8px;
    }}
    table {{
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }}
    th, td {{
      border: 1px solid #e0e0e0;
      padding: 10px 12px;
      text-align: left;
    }}
    th {{
      background: var(--navy);
      color: #fff;
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }}
    tr:nth-child(even) td {{ background: #fafafa; }}
    td.pct {{
      font-weight: 700;
      color: var(--orange);
      text-align: right;
    }}
    .footer {{
      margin-top: 48px;
      padding-top: 16px;
      border-top: 1px solid #e5e5e5;
      font-size: 11px;
      text-align: center;
      color: var(--grey);
    }}
    .footer-brand {{
      font-weight: 800;
      letter-spacing: 0.12em;
      color: var(--navy);
      margin-bottom: 8px;
      font-size: 12px;
    }}
    .footer-brand .ns {{ color: var(--orange); }}
    @media print {{
      body {{ padding: 24px; }}
      .badge, th, .power-o path {{
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }}
    }}
  </style>
</head>
<body onload="window.print()">
  <div class="brand-row">
    <div class="brand-lockup">
      <span class="brand-construct">CONSTRUCT</span>{power_svg}<span class="brand-ns">NS</span><span class="brand-tm">™</span>
    </div>
    <div class="tagline">
      Everything Construction.
      <strong>Always On.</strong>
    </div>
  </div>

  <h1>Monthly Progress <span>Report</span></h1>
  <p class="subtitle">Verified stage progress for client review · Auto-generated from portal data</p>

  <div class="header-info">
    <p><strong>Project</strong> {project_title}</p>
    <p><strong>Project ID</strong> {project_code}</p>
    <p><strong>Location</strong> {project_address}</p>
    <p><strong>Reporting period</strong> {month_label}</p>
    <p>
      <strong>Overall progress</strong>
      <span class="badge">{round(overall)}% Verified</span>
    </p>
  </div>

  <h3>Stage-wise breakdown</h3>
  <table>
    <thead>
      <tr>
        <th>Stage name</th>
        <th>Status</th>
        <th style="text-align:right;">Completion %</th>
      </tr>
    </thead>
    <tbody>
      {rows_html}
    </tbody>
  </table>

  <div class="footer">
    <div class="footer-brand">CONSTRUCT<span class="ns">ONS</span>™</div>
    Generated securely from the ConstructONS Client Portal.<br/>
    Auto-generated system report based on site progress data.<br/>
    India's First Integrated Construction Ecosystem · Everything Construction. Always On.
  </div>
</body>
</html>
"""

    return HTMLResponse(content=html_content)
# ============================================================================
# DAILY PROGRESS REPORTS — Site Engineer submits, PM approves
# ============================================================================

@proj_router.get("/admin/projects/{project_id}/daily-reports", dependencies=[Depends(require_admin)])
async def list_daily_reports(project_id: str, status: Optional[str] = None):
    """List all daily reports for admin. Filter by status: 'pending' | 'approved' | 'all' """
    p = await db.projects.find_one({"id": project_id}, {"daily_reports": 1, "_id": 0})
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    
    reports = p.get("daily_reports") or []
    
    if status == "pending":
        reports = [r for r in reports if not r.get("is_approved")]
    elif status == "approved":
        reports = [r for r in reports if r.get("is_approved")]
    
    reports.sort(key=lambda r: r.get("date", ""), reverse=True)
    return {"reports": reports, "count": len(reports)}


@proj_router.post("/admin/projects/{project_id}/daily-reports", dependencies=[Depends(require_admin)])
async def submit_daily_report(project_id: str, body: DailyReportCreateBody):
    """Site Engineer submits a daily report. Defaults to UNAPPROVED (not client-visible)."""
    p = await db.projects.find_one({"id": project_id}, {"id": 1})
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")

    # Ensure array exists
    await db.projects.update_one(
        {"id": project_id, "$or": [{"daily_reports": {"$exists": False}}, {"daily_reports": None}]},
        {"$set": {"daily_reports": []}}
    )

    # Check duplicate for same date
    existing = await db.projects.find_one(
        {"id": project_id, "daily_reports.date": body.date},
        {"_id": 1}
    )
    if existing:
        raise HTTPException(status_code=409, detail=f"A report already exists for {body.date}. Edit or delete the existing one.")

    now = datetime.now(timezone.utc).isoformat()
    report_data = body.model_dump()
    report_data["id"] = f"rep_{uuid.uuid4().hex[:10]}"
    report_data["is_approved"] = False
    report_data["submitted_at"] = now
    report_data["submitted_by"] = "Site Engineer"
    report_data["approved_at"] = None
    report_data["approved_by"] = None

    await db.projects.update_one(
        {"id": project_id},
        {"$push": {"daily_reports": {"$each": [report_data], "$position": 0}},
         "$set": {"updated_at": now}}
    )

    await _log_activity(project_id, "Site Engineer", f"Submitted Daily Report for {body.date} — awaiting PM approval", "Progress")
    return {"success": True, "report": report_data}


@proj_router.put("/admin/projects/{project_id}/daily-reports/{report_id}", dependencies=[Depends(require_admin)])
async def update_daily_report(project_id: str, report_id: str, body: DailyReportUpdateBody):
    """Edit a daily report. If it was approved, editing resets to pending re-approval."""
    p = await db.projects.find_one({"id": project_id}, {"id": 1, "daily_reports": 1})
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")

    reports = p.get("daily_reports") or []
    idx = next((i for i, r in enumerate(reports) if r["id"] == report_id), -1)
    if idx == -1:
        raise HTTPException(status_code=404, detail="Report not found")

    update_data = {k: v for k, v in body.model_dump().items() if v is not None}
    now = datetime.now(timezone.utc).isoformat()
    
    for key, value in update_data.items():
        reports[idx][key] = value
    reports[idx]["updated_at"] = now
    
    # If report was approved and content changed, reset to pending
    if reports[idx].get("is_approved") and update_data:
        reports[idx]["is_approved"] = False
        reports[idx]["approved_at"] = None
        reports[idx]["approved_by"] = None

    await db.projects.update_one(
        {"id": project_id},
        {"$set": {"daily_reports": reports, "updated_at": now}}
    )

    await _log_activity(project_id, "Site Engineer", f"Updated Daily Report for {reports[idx]['date']}", "Progress")
    return {"success": True, "report": reports[idx]}


@proj_router.patch("/admin/projects/{project_id}/daily-reports/{report_id}/approve", dependencies=[Depends(require_admin)])
async def approve_daily_report(project_id: str, report_id: str):
    """Project Manager approves the daily report → client gets notified."""
    p = await db.projects.find_one({"id": project_id}, {"id": 1, "daily_reports": 1})
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")

    reports = p.get("daily_reports") or []
    idx = next((i for i, r in enumerate(reports) if r["id"] == report_id), -1)
    if idx == -1:
        raise HTTPException(status_code=404, detail="Report not found")

    if reports[idx].get("is_approved"):
        raise HTTPException(status_code=400, detail="Report is already approved")

    now = datetime.now(timezone.utc).isoformat()
    reports[idx]["is_approved"] = True
    reports[idx]["approved_at"] = now
    reports[idx]["approved_by"] = "Project Manager"

    await db.projects.update_one(
        {"id": project_id},
        {"$set": {"daily_reports": reports, "updated_at": now}}
    )

    await _log_activity(project_id, "Project Manager", f"Approved Daily Report for {reports[idx]['date']}", "Progress")
    
    # 🔔 Notify client ONLY after PM approval
    asyncio.create_task(_push_notification(
        project_id,
        "New Daily Progress Report",
        f"Your site update for {reports[idx]['date']} has been verified and published by the Project Manager.",
        "/portal/progress",
        "progress"
    ))

    return {"success": True, "report": reports[idx]}


@proj_router.patch("/admin/projects/{project_id}/daily-reports/{report_id}/unapprove", dependencies=[Depends(require_admin)])
async def unapprove_daily_report(project_id: str, report_id: str):
    """PM can revoke approval to hide from client (e.g. incorrect data)."""
    p = await db.projects.find_one({"id": project_id}, {"id": 1, "daily_reports": 1})
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")

    reports = p.get("daily_reports") or []
    idx = next((i for i, r in enumerate(reports) if r["id"] == report_id), -1)
    if idx == -1:
        raise HTTPException(status_code=404, detail="Report not found")

    reports[idx]["is_approved"] = False
    reports[idx]["approved_at"] = None
    reports[idx]["approved_by"] = None
    
    await db.projects.update_one(
        {"id": project_id},
        {"$set": {"daily_reports": reports, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )

    await _log_activity(project_id, "Project Manager", f"Revoked approval for Daily Report {reports[idx]['date']}", "Progress")
    return {"success": True}


@proj_router.delete("/admin/projects/{project_id}/daily-reports/{report_id}", dependencies=[Depends(require_admin)])
async def delete_daily_report(project_id: str, report_id: str):
    """Delete a daily report entirely."""
    p = await db.projects.find_one({"id": project_id}, {"id": 1, "daily_reports": 1})
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")

    target = next((r for r in (p.get("daily_reports") or []) if r["id"] == report_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Report not found")

    await db.projects.update_one(
        {"id": project_id},
        {"$pull": {"daily_reports": {"id": report_id}}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    await _log_activity(project_id, "Admin", f"Deleted Daily Report for {target['date']}", "Progress")
    return {"success": True}