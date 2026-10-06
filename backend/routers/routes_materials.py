"""Material Logs & Procurement Tracking."""
import uuid
import asyncio
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from db import db
from auth import require_admin
from customer_auth import get_current_customer
from project_schemas import MaterialCreateBody, MaterialUpdateBody, MaterialDecisionBody
from project_utils import _log_activity, _push_notification, _enforce_full_access

router = APIRouter(prefix="/api", tags=["materials"])

@router.post("/portal/my-project/materials/{material_id}/decision")
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

@router.post("/admin/projects/{project_id}/materials", dependencies=[Depends(require_admin)])
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

@router.put("/admin/projects/{project_id}/materials/{material_id}", dependencies=[Depends(require_admin)])
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
    if old_status == "pending" and body.status == "ordered":
        update_data["ordered_on"] = now
    else:
        update_data["ordered_on"] = mat.get("ordered_on")
    if old_status not in ["delivered", "inspected", "installed"] and body.status in ["delivered", "inspected", "installed"]:
        update_data["delivered_on"] = now
        await _log_activity(project_id, "Procurement", f"Material Delivered: {body.item_name}", "Materials")
        asyncio.create_task(_push_notification(project_id, "Material Delivered", f"{body.quantity} {body.unit} of {body.item_name} has arrived on site.", "/portal/materials", "system"))
    else:
        update_data["delivered_on"] = mat.get("delivered_on")
    update_data["created_at"] = mat.get("created_at", now)
    update_data["updated_at"] = now
    materials[idx] = update_data
    await db.projects.update_one({"id": project_id}, {"$set": {"materials": materials, "updated_at": now}})
    return {"success": True, "material": update_data}

@router.delete("/admin/projects/{project_id}/materials/{material_id}", dependencies=[Depends(require_admin)])
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