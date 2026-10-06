"""Drawings, Revisions, Client Approvals & Client Drawing Requests."""
import uuid
import asyncio
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from db import db
from auth import require_admin
from customer_auth import get_current_customer
from project_schemas import (
    DrawingCreateBody, DrawingRevisionBody, DrawingDecisionBody,
    DrawingRequestBody, DrawingRequestUpdateBody
)
from project_utils import _log_activity, _push_notification, _enforce_full_access

router = APIRouter(prefix="/api", tags=["drawings"])

@router.post("/portal/my-project/drawings/request")
async def portal_request_new_drawing(body: DrawingRequestBody, customer=Depends(get_current_customer)):
    email = (customer.get("email") or "").lower()
    proj = await db.projects.find_one({"$or": [{"customer_email": email}, {"team_directory.email": email}]}, {"id": 1, "customer_email": 1, "team_directory": 1})
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    _enforce_full_access(proj, email)
    await db.projects.update_one({"id": proj["id"], "$or": [{"drawing_requests": {"$exists": False}}, {"drawing_requests": None}]}, {"$set": {"drawing_requests": []}})
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
    await db.projects.update_one({"id": proj["id"]}, {"$push": {"drawing_requests": {"$each": [req_entry], "$position": 0}}, "$set": {"updated_at": now}})
    await _log_activity(proj["id"], client_name, f"Requested new drawing: {body.title}", "Drawings")
    asyncio.create_task(_push_notification(proj["id"], "Drawing Request Submitted 📐", f"Your request for a new {body.category} drawing '{body.title}' has been sent.", "/portal/drawings", "system"))
    return {"success": True, "request": req_entry}

@router.patch("/admin/projects/{project_id}/drawings/requests/{request_id}", dependencies=[Depends(require_admin)])
async def admin_update_drawing_request(project_id: str, request_id: str, body: DrawingRequestUpdateBody):
    p = await db.projects.find_one({"id": project_id}, {"id": 1, "drawing_requests": 1})
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    requests = p.get("drawing_requests") or []
    idx = next((i for i, r in enumerate(requests) if r["id"] == request_id), -1)
    if idx == -1:
        raise HTTPException(status_code=404, detail="Request not found")
    requests[idx]["status"] = body.status
    now = datetime.now(timezone.utc).isoformat()
    await db.projects.update_one({"id": project_id}, {"$set": {"drawing_requests": requests, "updated_at": now}})
    if body.status == "fulfilled":
        asyncio.create_task(_push_notification(project_id, "Drawing Request Fulfilled ✅", f"Your request for '{requests[idx]['title']}' has been fulfilled.", "/portal/drawings", "system"))
    return {"success": True, "request": requests[idx]}

@router.post("/portal/my-project/drawings/{drawing_id}/decision")
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

@router.post("/admin/projects/{project_id}/drawings", dependencies=[Depends(require_admin)])
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

@router.post("/admin/projects/{project_id}/drawings/{drawing_id}/revision", dependencies=[Depends(require_admin)])
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

@router.delete("/admin/projects/{project_id}/drawings/{drawing_id}", dependencies=[Depends(require_admin)])
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