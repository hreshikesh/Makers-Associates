"""Core Project CRUD, Portal Overview, Team Management & Attendance."""
import uuid
import asyncio
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, Request, File, UploadFile
from db import db
from auth import require_admin
from customer_auth import get_current_customer
from media_service import put_object, build_storage_path
from project_schemas import (
    ProjectCreateBody, ProjectUpdateBody, TeamInviteBody, 
    AttendanceBody, NotificationMarkReadBody
)
from project_utils import (
    _ist_today, apply_rate_limit, _enforce_full_access, 
    _default_stage_list, _log_activity, _push_notification,
    _build_unified_team, _auto_activate_pending_user
)

router = APIRouter(prefix="/api", tags=["core_projects"])

# ============================================================================
# PORTAL CORE & TEAM
# ============================================================================

@router.post("/portal/upload/image")
async def portal_upload_image(
    file: UploadFile = File(...), 
    folder: str = "issues",
    customer=Depends(get_current_customer)
):
    """Allows authenticated clients to upload photos."""
    data = await file.read()
    path = build_storage_path(folder, file.filename, file.content_type)
    res = put_object(path, data, file.content_type)
    return {"url": res.get("url") or res.get("secure_url")}

@router.get("/portal/my-projects-list")
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

@router.get("/portal/my-project")
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
    
    client_stages = []
    for s in (proj.get("stages") or []):
        if s.get("published_data"):
            client_stages.append(s["published_data"])
        else:
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

@router.get("/portal/my-project/team-data")
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

@router.post("/portal/my-project/team/invite")
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

@router.delete("/portal/my-project/team/{member_id}")
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

@router.patch("/portal/my-project/notifications/read")
async def portal_mark_notification_read(body: NotificationMarkReadBody, customer=Depends(get_current_customer)):
    email = (customer.get("email") or "").lower()
    proj = await db.projects.find_one({"$or": [{"customer_email": email}, {"team_directory.email": email}]}, {"id": 1, "notifications": 1})
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    await db.projects.update_one({"id": proj["id"], "notifications.id": body.notification_id}, {"$set": {"notifications.$.is_read": True}})
    return {"success": True}


# ============================================================================
# ADMIN CORE & ATTENDANCE
# ============================================================================

@router.get("/admin/projects", dependencies=[Depends(require_admin)])
async def list_projects(q: Optional[str] = None):
    query: Dict[str, Any] = {}
    if q:
        query["$or"] = [{"customer_email": {"$regex": q, "$options": "i"}}, {"customer_name": {"$regex": q, "$options": "i"}}, {"title": {"$regex": q, "$options": "i"}}]
    docs = await db.projects.find(query, {"_id": 0}).sort("created_at", -1).limit(500).to_list(500)
    return docs

@router.get("/admin/projects/{project_id}", dependencies=[Depends(require_admin)])
async def get_project(project_id: str):
    p = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not p:
        raise HTTPException(status_code=404, detail="Not found")
    return p

@router.post("/admin/projects", dependencies=[Depends(require_admin)])
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
    owner_record = {"id": f"usr_{uuid.uuid4().hex[:12]}", "name": owner_name, "email": email, "phone": body.customer_phone or "", "role": "Project Owner", "company": "Home Owner","contact": body.customer_phone or "",  "access": "Full Access", "status": "Active", "avatar": None}
    init_activity = {"id": str(uuid.uuid4()), "user_name": "System Admin", "action": "Project initialized", "module": "System", "timestamp": now}
    init_notif = {"id": str(uuid.uuid4()), "title": "Project Created", "message": f"Welcome to {body.title}! Your digital home tracker is active.", "link": "/portal", "icon": "system", "is_read": False, "timestamp": now}
    doc = {
        "id": str(uuid.uuid4()), "project_code": proj_code, "customer_email": email, "customer_name": owner_name,"customer_phone": body.customer_phone,
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

@router.put("/admin/projects/{project_id}", dependencies=[Depends(require_admin)])
async def update_project(project_id: str, body: ProjectUpdateBody):
    # This endpoint updates team_ids, team_directory, and base project settings
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

@router.delete("/admin/projects/{project_id}", dependencies=[Depends(require_admin)])
async def delete_project(project_id: str):
    res = await db.projects.delete_one({"id": project_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"success": True}

@router.patch("/admin/projects/{project_id}/attendance", dependencies=[Depends(require_admin)])
async def set_attendance(project_id: str, body: AttendanceBody):
    """Admin marks daily attendance for site team members."""
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