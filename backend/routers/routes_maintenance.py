"""Warranty Management & Post-Handover Maintenance Tickets."""
import random
import asyncio
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from db import db
from auth import require_admin
from customer_auth import get_current_customer
from project_schemas import WarrantyUpdateBody, MaintenanceTicketCreateBody, MaintenanceTicketUpdateBody
from project_utils import _log_activity, _push_notification, _enforce_full_access

router = APIRouter(prefix="/api", tags=["maintenance"])

@router.put("/admin/projects/{project_id}/warranty", dependencies=[Depends(require_admin)])
async def update_warranty(project_id: str, body: WarrantyUpdateBody):
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
    if is_active and not was_active:
        await _log_activity(project_id, "Admin", f"{body.warranty_years}-Year Warranty Activated", "System")
        asyncio.create_task(_push_notification(project_id, "Warranty Activated 🛡️", f"Your {body.warranty_years}-Year Warranty is active.", "/portal/maintenance", "system"))
    return {"success": True, "warranty": update_data}

@router.post("/portal/my-project/maintenance")
async def portal_raise_ticket(body: MaintenanceTicketCreateBody, customer=Depends(get_current_customer)):
    email = (customer.get("email") or "").lower()
    proj = await db.projects.find_one({"$or": [{"customer_email": email}, {"team_directory.email": email}]}, {"id": 1, "customer_email": 1, "team_directory": 1})
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
    await db.projects.update_one({"id": proj["id"]}, {"$push": {"maintenance_tickets": {"$each": [ticket], "$position": 0}}, "$set": {"updated_at": now}})
    await _log_activity(proj["id"], customer.get("name") or "Client", f"Raised Maintenance Ticket: {ticket_id}", "System")
    return {"success": True, "ticket": ticket}

@router.put("/admin/projects/{project_id}/maintenance/{ticket_id}", dependencies=[Depends(require_admin)])
async def admin_update_ticket(project_id: str, ticket_id: str, body: MaintenanceTicketUpdateBody):
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

    await db.projects.update_one({"id": project_id}, {"$set": {"maintenance_tickets": tickets, "updated_at": now}})
    if old_status != body.status or body.admin_notes != p["maintenance_tickets"][idx].get("admin_notes"):
        status_display = body.status.replace("_", " ").title()
        msg = f"Ticket {ticket_id} status is now '{status_display}'."
        if body.admin_notes: msg += f" Note: {body.admin_notes}"
        asyncio.create_task(_push_notification(project_id, f"Maintenance Ticket Updated: {ticket_id}", msg, "/portal/maintenance", "system"))

    return {"success": True, "ticket": tickets[idx]}