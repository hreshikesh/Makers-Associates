"""Quality Reviews, Stage-wise Checks & Issues Lifecycle."""
import uuid
import asyncio
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from db import db
from auth import require_admin
from customer_auth import get_current_customer
from project_schemas import (
    QualityStageCreate, QualityCheckCreate, ClientApproveCheckBody,
    ClientRaiseIssueBody, IssueAdminUpdateBody, IssueClientReviewBody,
    QualityInspectionBody, QualityInspectionUpdateBody
)
from project_utils import _log_activity, _push_notification

router = APIRouter(prefix="/api", tags=["quality"])

@router.post("/admin/projects/{project_id}/quality-reviews", dependencies=[Depends(require_admin)])
async def admin_create_quality_stage_review(project_id: str, body: QualityStageCreate):
    p = await db.projects.find_one({"id": project_id}, {"id": 1})
    if not p: raise HTTPException(status_code=404, detail="Project not found")

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
    await db.projects.update_one({"id": project_id}, {"$push": {"quality_stage_reviews": {"$each": [stage_review], "$position": 0}}})
    return {"success": True, "stage_review": stage_review}

@router.patch("/admin/projects/{project_id}/quality-reviews/{review_id}", dependencies=[Depends(require_admin)])
async def admin_patch_quality_stage(project_id: str, review_id: str, body: QualityStageCreate):
    p = await db.projects.find_one({"id": project_id}, {"quality_stage_reviews": 1})
    if not p: raise HTTPException(404, "Not found")
    reviews = p.get("quality_stage_reviews") or []
    idx = next((i for i, r in enumerate(reviews) if r["id"] == review_id), -1)
    if idx < 0: raise HTTPException(404, "Stage not found")
    if body.name: reviews[idx]["name"] = body.name.strip()
    await db.projects.update_one({"id": project_id}, {"$set": {"quality_stage_reviews": reviews}})
    return {"success": True, "stage_review": reviews[idx]}

@router.delete("/admin/projects/{project_id}/quality-reviews/{review_id}", dependencies=[Depends(require_admin)])
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

@router.post("/admin/projects/{project_id}/quality-reviews/{review_id}/checks", dependencies=[Depends(require_admin)])
async def admin_add_quality_check(project_id: str, review_id: str, body: QualityCheckCreate):
    p = await db.projects.find_one({"id": project_id}, {"quality_stage_reviews": 1})
    if not p: raise HTTPException(status_code=404, detail="Project not found")
    reviews = p.get("quality_stage_reviews") or []
    idx = next((i for i, r in enumerate(reviews) if r["id"] == review_id), -1)
    if idx == -1: raise HTTPException(status_code=404, detail="Stage review not found")

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
    await db.projects.update_one({"id": project_id}, {"$set": {"quality_stage_reviews": reviews, "updated_at": datetime.now(timezone.utc).isoformat()}})
    return {"success": True, "check": check}

@router.patch("/admin/projects/{project_id}/quality-reviews/{review_id}/checks/{check_id}", dependencies=[Depends(require_admin)])
async def admin_patch_quality_check(project_id: str, review_id: str, check_id: str, body: QualityCheckCreate):
    p = await db.projects.find_one({"id": project_id}, {"quality_stage_reviews": 1})
    if not p: raise HTTPException(status_code=404, detail="Project not found")
    reviews = p.get("quality_stage_reviews") or []
    ridx = next((i for i, r in enumerate(reviews) if r["id"] == review_id), -1)
    if ridx < 0: raise HTTPException(status_code=404, detail="Stage not found")
    checks = reviews[ridx].get("checks") or []
    cidx = next((i for i, c in enumerate(checks) if c["id"] == check_id), -1)
    if cidx < 0: raise HTTPException(status_code=404, detail="Check not found")

    checks[cidx]["area"] = body.area.strip()
    checks[cidx]["check_text"] = body.check_text.strip()
    checks[cidx]["pm_remark"] = (body.pm_remark or "").strip()
    checks[cidx]["photo_urls"] = body.photo_urls or []

    reviews[ridx]["checks"] = checks
    await db.projects.update_one({"id": project_id}, {"$set": {"quality_stage_reviews": reviews, "updated_at": datetime.now(timezone.utc).isoformat()}})
    return {"success": True, "check": checks[cidx]}

@router.delete("/admin/projects/{project_id}/quality-reviews/{review_id}/checks/{check_id}", dependencies=[Depends(require_admin)])
async def admin_delete_quality_check(project_id: str, review_id: str, check_id: str):
    p = await db.projects.find_one({"id": project_id}, {"quality_stage_reviews": 1})
    reviews = p.get("quality_stage_reviews") or []
    ridx = next((i for i, r in enumerate(reviews) if r["id"] == review_id), -1)
    if ridx < 0: raise HTTPException(status_code=404, detail="Stage not found")
    checks = reviews[ridx].get("checks") or []
    target = next((c for c in checks if c["id"] == check_id), None)
    if not target: raise HTTPException(status_code=404, detail="Check not found")
    if target.get("client_status") in ("approved", "issue_raised"):
        raise HTTPException(status_code=400, detail="Cannot delete a check the client already acted on")
    reviews[ridx]["checks"] = [c for c in checks if c["id"] != check_id]
    await db.projects.update_one({"id": project_id}, {"$set": {"quality_stage_reviews": reviews, "updated_at": datetime.now(timezone.utc).isoformat()}})
    return {"success": True}

@router.patch("/admin/projects/{project_id}/quality-reviews/{review_id}/release", dependencies=[Depends(require_admin)])
async def admin_release_quality_stage(project_id: str, review_id: str):
    p = await db.projects.find_one({"id": project_id}, {"quality_stage_reviews": 1})
    reviews = p.get("quality_stage_reviews") or []
    idx = next((i for i, r in enumerate(reviews) if r["id"] == review_id), -1)
    if idx == -1: raise HTTPException(status_code=404, detail="Stage not found")
    reviews[idx]["status"] = "released"
    reviews[idx]["released_at"] = datetime.now(timezone.utc).isoformat()
    await db.projects.update_one({"id": project_id}, {"$set": {"quality_stage_reviews": reviews}})
    asyncio.create_task(_push_notification(project_id, "Quality Review Required 🔍", f"The '{reviews[idx]['name']}' quality checks have been released.", "/portal/quality", "quality"))
    return {"success": True}

@router.post("/portal/my-project/quality-checks/{check_id}/approve")
async def client_approve_quality_check(check_id: str, body: ClientApproveCheckBody, customer=Depends(get_current_customer)):
    email = (customer.get("email") or "").lower()
    proj = await db.projects.find_one({"$or": [{"customer_email": email}, {"team_directory.email": email}]}, {"id": 1, "quality_stage_reviews": 1})
    if not proj: raise HTTPException(status_code=404, detail="Project not found")
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
    if not found: raise HTTPException(status_code=404, detail="Check not found")
    await db.projects.update_one({"id": proj["id"]}, {"$set": {"quality_stage_reviews": reviews}})
    await _log_activity(proj["id"], customer.get("name") or "Client", "Approved a quality check", "Quality")
    return {"success": True}

@router.post("/portal/my-project/quality-checks/{check_id}/raise-issue")
async def client_raise_quality_issue(check_id: str, body: ClientRaiseIssueBody, customer=Depends(get_current_customer)):
    email = (customer.get("email") or "").lower()
    proj = await db.projects.find_one({"$or": [{"customer_email": email}, {"team_directory.email": email}]}, {"id": 1, "quality_stage_reviews": 1})
    if not proj: raise HTTPException(status_code=404, detail="Project not found")
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
    if not found_check: raise HTTPException(status_code=404, detail="Check not found")
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
    await db.projects.update_one({"id": proj["id"], "$or": [{"issues": {"$exists": False}}, {"issues": None}]}, {"$set": {"issues": []}})
    await db.projects.update_one({"id": proj["id"]}, {"$set": {"quality_stage_reviews": reviews}, "$push": {"issues": {"$each": [issue_stub], "$position": 0}}})
    await _log_activity(proj["id"], customer.get("name") or "Client", f"Raised an issue for {found_check['check_text']}", "Issues")
    return {"success": True, "issue_id": issue_id}

@router.put("/admin/projects/{project_id}/issues/{issue_id}", dependencies=[Depends(require_admin)])
async def admin_update_quality_issue(project_id: str, issue_id: str, body: IssueAdminUpdateBody):
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
        asyncio.create_task(_push_notification(project_id, "Issue Ready for Review 🔍", f"The issue regarding '{issues[idx]['check_text_snapshot']}' has been rectified.", "/portal/quality", "quality"))
    await db.projects.update_one({"id": project_id}, {"$set": {"issues": issues}})
    return {"success": True, "issue": issues[idx]}

@router.patch("/admin/projects/{project_id}/issues/{issue_id}/close", dependencies=[Depends(require_admin)])
async def admin_close_quality_issue(project_id: str, issue_id: str):
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

@router.post("/portal/my-project/issues/{issue_id}/client-review")
async def client_review_issue_resolution(issue_id: str, body: IssueClientReviewBody, customer=Depends(get_current_customer)):
    email = (customer.get("email") or "").lower()
    proj = await db.projects.find_one({"$or": [{"customer_email": email}, {"team_directory.email": email}]}, {"id": 1, "issues": 1, "quality_stage_reviews": 1})
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
        reviews = proj.get("quality_stage_reviews") or []
        for r in reviews:
            for c in r.get("checks", []):
                if c["open_issue_id"] == issue_id:
                    c["client_status"] = "approved"
                    c["open_issue_id"] = None
        await db.projects.update_one({"id": proj["id"]}, {"$set": {"quality_stage_reviews": reviews}})
        await _log_activity(proj["id"], client_name, f"Approved resolution for issue: {issues[idx]['check_text_snapshot']}", "Issues")
    else:
        issues[idx]["client_review_status"] = "not_approved"
        issues[idx]["status"] = "in_progress"
        await _log_activity(proj["id"], client_name, f"Rejected resolution for issue: {issues[idx]['check_text_snapshot']}", "Issues")
    await db.projects.update_one({"id": proj["id"]}, {"$set": {"issues": issues}})
    return {"success": True}

# --- Legacy Audits ---
@router.post("/admin/projects/{project_id}/quality", dependencies=[Depends(require_admin)])
async def create_quality_inspection(project_id: str, body: QualityInspectionBody):
    p = await db.projects.find_one({"id": project_id}, {"id": 1})
    if not p: raise HTTPException(status_code=404, detail="Project not found")
    await db.projects.update_one({"id": project_id, "$or": [{"quality_inspections": {"$exists": False}}, {"quality_inspections": None}]}, {"$set": {"quality_inspections": []}})
    now = datetime.now(timezone.utc).isoformat()
    inspection_data = body.model_dump()
    inspection_data["id"] = f"qual_{uuid.uuid4().hex[:10]}"
    inspection_data["created_at"] = now
    inspection_data["updated_at"] = now
    if not inspection_data["inspected_at"]: inspection_data["inspected_at"] = now
    await db.projects.update_one({"id": project_id}, {"$push": {"quality_inspections": {"$each": [inspection_data], "$position": 0}}, "$set": {"updated_at": now}})
    await _log_activity(project_id, "Quality Team", f"Logged Quality Audit: {body.name}", "Quality")
    return {"success": True, "inspection": inspection_data}

@router.put("/admin/projects/{project_id}/quality/{inspection_id}", dependencies=[Depends(require_admin)])
async def update_quality_inspection(project_id: str, inspection_id: str, body: QualityInspectionUpdateBody):
    p = await db.projects.find_one({"id": project_id}, {"id": 1, "quality_inspections": 1})
    if not p: raise HTTPException(status_code=404, detail="Project not found")
    inspections = p.get("quality_inspections") or []
    idx = next((i for i, q in enumerate(inspections) if q["id"] == inspection_id), -1)
    if idx == -1: raise HTTPException(status_code=404, detail="Quality inspection not found")
    now = datetime.now(timezone.utc).isoformat()
    update_data = body.model_dump()
    update_data["id"] = inspection_id
    update_data["created_at"] = inspections[idx].get("created_at", now)
    update_data["updated_at"] = now
    inspections[idx] = update_data
    await db.projects.update_one({"id": project_id}, {"$set": {"quality_inspections": inspections, "updated_at": now}})
    return {"success": True, "inspection": update_data}

@router.delete("/admin/projects/{project_id}/quality/{inspection_id}", dependencies=[Depends(require_admin)])
async def delete_quality_inspection(project_id: str, inspection_id: str):
    p = await db.projects.find_one({"id": project_id}, {"id": 1, "quality_inspections": 1})
    if not p: raise HTTPException(status_code=404, detail="Not found")
    await db.projects.update_one({"id": project_id}, {"$pull": {"quality_inspections": {"id": inspection_id}}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}})
    return {"success": True}