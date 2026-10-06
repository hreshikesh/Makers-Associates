"""Stages, Substages & Workflows (Auto-Published)."""
import uuid
import asyncio
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from db import db
from auth import require_admin
from project_schemas import (
    StageAddBody, StagePatchBody, SubstageBody, 
    ReorderStagesBody
)
from project_utils import (
    _log_activity, _push_notification, 
    _recalculate_stage_from_substages, _apply_progress_rules_to_substage
)

router = APIRouter(prefix="/api", tags=["stages"])

def _make_stage_live(stage: dict):
    """Automatically marks a stage as approved and syncs published_data for the client portal."""
    stage["approval_status"] = "approved"
    stage["reject_reason"] = None
    snap = dict(stage)
    snap.pop("published_data", None)
    stage["published_data"] = snap
    return stage

@router.post("/admin/projects/{project_id}/stages", dependencies=[Depends(require_admin)])
async def add_stage(project_id: str, body: StageAddBody):
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
    
    new_stage = _make_stage_live(new_stage)
    
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

@router.put("/admin/projects/{project_id}/stages/reorder", dependencies=[Depends(require_admin)])
async def reorder_stages(project_id: str, body: ReorderStagesBody):
    p = await db.projects.find_one({"id": project_id}, {"_id": 0, "stages": 1})
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    stages = p.get("stages") or []
    stage_map = {s.get("id", str(s.get("index"))): s for s in stages}
    reordered = []
    for sid in body.stage_ids:
        if sid in stage_map:
            reordered.append(stage_map[sid])
    for s in stages:
        if s not in reordered:
            reordered.append(s)
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

@router.patch("/admin/projects/{project_id}/stages/{index}", dependencies=[Depends(require_admin)])
async def patch_stage(project_id: str, index: int, body: StagePatchBody):
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
    
    old_progress = float(stage.get("progress_pct") or 0)
    patch = body.model_dump(exclude_unset=True)
    
    if has_active_children:
        patch.pop("progress_pct", None)
        patch.pop("start_date", None)
        patch.pop("planned_end_date", None)
        patch.pop("expected_date", None)
        patch.pop("actual_end_date", None)
        patch.pop("actual_start_date", None)
        patch.pop("status", None)
        patch.pop("started_at", None)
        patch.pop("completed_at", None)
    else:
        if "progress_pct" in patch:
            stage = _apply_progress_rules_to_substage(stage, patch["progress_pct"])
            patch.pop("progress_pct", None)
            patch.pop("status", None)
        if patch.get("status") == "in_progress" and not stage.get("started_at"):
            patch["started_at"] = datetime.now(timezone.utc).isoformat()
    
    stage.update(patch)
    if has_active_children:
        stage = _recalculate_stage_from_substages(stage)
        
    # INSTANT PUBLISH
    stage = _make_stage_live(stage)
    stages[index] = stage
    
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
        
    await db.projects.update_one(
        {"id": project_id}, 
        {"$set": {"stages": stages, "monthly_progress": monthly_records, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # TRIGGER NOTIFICATIONS
    new_photos_count = len(stage.get("photos") or [])
    if new_photos_count > old_photos_count:
        photos_added = new_photos_count - old_photos_count
        await _log_activity(project_id, "Site Engineer", f"Uploaded {photos_added} photo(s) for {stage['name']}", "Progress")
        asyncio.create_task(_push_notification(project_id, "📸 New Site Photos", f"{photos_added} progress photo(s) for '{stage['name']}'.", "/portal/progress", "progress"))
    
    new_progress = float(stage.get("progress_pct") or 0)
    if not has_active_children and new_progress != old_progress:
        await _log_activity(project_id, "Site Engineer", f"Updated stage: {stage['name']} to {new_progress}%", "Progress")
        asyncio.create_task(_push_notification(
            project_id, 
            "📊 Progress Updated", 
            f"Stage '{stage['name']}' is now {new_progress}% complete.", 
            "/portal/progress", 
            "progress"
        ))

    return stage

@router.delete("/admin/projects/{project_id}/stages/{index}", dependencies=[Depends(require_admin)])
async def delete_stage(project_id: str, index: int):
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

@router.post("/admin/projects/{project_id}/stages/{stage_index}/substages", dependencies=[Depends(require_admin)])
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
    if body.progress_pct and float(body.progress_pct) > 0:
        new_sub = _apply_progress_rules_to_substage(new_sub, body.progress_pct)
    substages.append(new_sub)
    stage["substages"] = substages
    stage = _recalculate_stage_from_substages(stage)
    
    # INSTANT PUBLISH
    stage = _make_stage_live(stage)
    stages[stage_index] = stage
    
    await db.projects.update_one(
        {"id": project_id},
        {"$set": {"stages": stages, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"success": True, "stage": stage}

@router.patch("/admin/projects/{project_id}/stages/{stage_index}/substages/{sub_id}", dependencies=[Depends(require_admin)])
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
        raise HTTPException(status_code=400, detail="Substage not found")
    sub = substages[sub_idx]
    old_progress = float(sub.get("progress_pct") or 0)
    
    if not sub.get("start_date") and body.start_date:
        sub["start_date"] = body.start_date
    elif body.start_date:
        sub["start_date"] = body.start_date
        
    sub["name"] = body.name
    sub["planned_end_date"] = body.planned_end_date
    new_progress = float(body.progress_pct or 0)
    sub = _apply_progress_rules_to_substage(sub, new_progress)
    if new_progress == 100 and body.actual_end_date:
        sub["actual_end_date"] = body.actual_end_date
    substages[sub_idx] = sub
    stage["substages"] = substages
    stage = _recalculate_stage_from_substages(stage)
    
    # INSTANT PUBLISH
    stage = _make_stage_live(stage)
    stages[stage_index] = stage
    
    await db.projects.update_one(
        {"id": project_id},
        {"$set": {"stages": stages, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # TRIGGER NOTIFICATIONS
    if old_progress < 100 and new_progress == 100:
        await _log_activity(project_id, "Site Engineer", f"Completed task: {sub['name']}", "Progress")
        asyncio.create_task(_push_notification(project_id, "✅ Task Completed", f"'{sub['name']}' is now 100% complete.", "/portal/progress", "progress"))
    elif new_progress != old_progress:
        await _log_activity(project_id, "Site Engineer", f"Updated task '{sub['name']}' to {new_progress}%", "Progress")
        asyncio.create_task(_push_notification(project_id, "📊 Progress Updated", f"Task '{sub['name']}' is now {new_progress}% complete.", "/portal/progress", "progress"))

    return {"success": True, "stage": stage}

@router.delete("/admin/projects/{project_id}/stages/{stage_index}/substages/{sub_id}", dependencies=[Depends(require_admin)])
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
    stage = _recalculate_stage_from_substages(stage)
    
    # INSTANT PUBLISH
    stage = _make_stage_live(stage)
    stages[stage_index] = stage
    
    await db.projects.update_one(
        {"id": project_id},
        {"$set": {"stages": stages, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"success": True, "stage": stage}

@router.post("/admin/projects/{project_id}/stages/{stage_index}/substages/{sub_id}/mark-complete", dependencies=[Depends(require_admin)])
async def mark_substage_complete(project_id: str, stage_index: int, sub_id: str):
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
        raise HTTPException(status_code=400, detail="Substage not found")
    substages[sub_idx] = _apply_progress_rules_to_substage(substages[sub_idx], 100)
    stage["substages"] = substages
    stage = _recalculate_stage_from_substages(stage)
    
    # INSTANT PUBLISH
    stage = _make_stage_live(stage)
    stages[stage_index] = stage
    
    await db.projects.update_one(
        {"id": project_id},
        {"$set": {"stages": stages, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    await _log_activity(project_id, "Site Engineer", f"Marked complete: {substages[sub_idx]['name']}", "Progress")
    asyncio.create_task(_push_notification(project_id, "✅ Task Completed", f"'{substages[sub_idx]['name']}' is now 100% complete.", "/portal/progress", "progress"))
    return {"success": True, "stage": stage}

@router.post("/admin/projects/{project_id}/stages/{stage_index}/mark-all-complete", dependencies=[Depends(require_admin)])
async def mark_stage_all_complete(project_id: str, stage_index: int):
    p = await db.projects.find_one({"id": project_id}, {"_id": 0, "stages": 1})
    if not p:
        raise HTTPException(status_code=404, detail="Not found")
    stages = p.get("stages") or []
    if stage_index < 0 or stage_index >= len(stages):
        raise HTTPException(status_code=400, detail="Invalid stage index")
    stage = stages[stage_index]
    substages = stage.get("substages") or []
    if not substages:
        raise HTTPException(status_code=400, detail="Cannot mark parent complete: no substages exist")
    for i, sub in enumerate(substages):
        if not sub.get("archived"):
            substages[i] = _apply_progress_rules_to_substage(sub, 100)
    stage["substages"] = substages
    stage = _recalculate_stage_from_substages(stage)
    
    # INSTANT PUBLISH
    stage = _make_stage_live(stage)
    stages[stage_index] = stage
    
    await db.projects.update_one(
        {"id": project_id},
        {"$set": {"stages": stages, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    await _log_activity(project_id, "Site Engineer", f"Marked all substages complete for: {stage['name']}", "Progress")
    asyncio.create_task(_push_notification(project_id, "🎉 Stage Completed", f"'{stage['name']}' is fully complete.", "/portal/progress", "progress"))
    return {"success": True, "stage": stage}