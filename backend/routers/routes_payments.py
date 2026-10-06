"""Financial Ledger, Proforma Invoices, Variations, Site Settings & Payment Allocations."""
import uuid
import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any, Union
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import Response as FastAPIResponse
from pydantic import BaseModel, Field
from db import db
from auth import require_admin
from project_utils import _log_activity, _push_notification

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["payments"])

# ─── SCHEMAS ───

class SiteSettingsBody(BaseModel):
    invoice_gst_percent: Optional[Union[float, int, str]] = 0
    invoice_bank_details: Optional[str] = None
    invoice_footer_notes: Optional[str] = None

class InvoiceBody(BaseModel):
    number: str
    description: str
    stage: Optional[str] = "General"
    date: str
    due_date: str
    amount: float
    status: str = "upcoming"
    document_url: Optional[str] = None
    milestone_id: Optional[str] = None

class InvoiceUpdateBody(BaseModel):
    number: Optional[str] = None
    description: Optional[str] = None
    stage: Optional[str] = None
    date: Optional[str] = None
    due_date: Optional[str] = None
    amount: Optional[float] = None
    status: Optional[str] = None
    document_url: Optional[str] = None

class VariationBody(BaseModel):
    description: str
    amount: float
    status: str = "approved"
    document_url: Optional[str] = None

class PaymentScheduleMilestoneBody(BaseModel):
    name: str
    due_date: Optional[str] = None
    amount: float = 0.0
    stage: Optional[str] = "General"
    status: str = "pending"
    invoice_id: Optional[str] = None

class MilestoneUpdateBody(BaseModel):
    name: Optional[str] = None
    due_date: Optional[str] = None
    amount: Optional[float] = None
    stage: Optional[str] = None

class EnhancedPaymentLogBody(BaseModel):
    amount: float
    date: str
    method: str = "Bank Transfer"
    reference: Optional[str] = ""
    notes: Optional[str] = ""
    invoice_id: Optional[str] = None

class ReceiptUpdateBody(BaseModel):
    amount: Optional[float] = None
    date: Optional[str] = None
    method: Optional[str] = None
    reference: Optional[str] = None
    notes: Optional[str] = None


# ═══════════════════════════════════════════
# ★ SITE SETTINGS ENDPOINTS
# ═══════════════════════════════════════════

@router.get("/site-settings")
async def get_site_settings():
    s = await db.site_settings.find_one({"id": "site_settings"}, {"_id": 0})
    if not s:
        s = await db.site_settings.find_one({"_id": "site_settings"}, {"_id": 0})
    if not s:
        s = {
            "id": "site_settings",
            "invoice_gst_percent": 0,
            "invoice_bank_details": "ConstructONS Pvt. Ltd.\nBank: HDFC Bank\nA/C: 50200000000000\nIFSC: HDFC0001234",
            "invoice_footer_notes": "Thank you for building with ConstructONS. Late payments may attract a penalty of 1.5% per month."
        }
    return s


@router.put("/site-settings", dependencies=[Depends(require_admin)])
async def update_site_settings(body: SiteSettingsBody):
    update_data = body.dict(exclude_unset=True)
    
    # Ensure invoice_gst_percent is converted cleanly to float
    if "invoice_gst_percent" in update_data and update_data["invoice_gst_percent"] is not None:
        try:
            update_data["invoice_gst_percent"] = float(update_data["invoice_gst_percent"])
        except (ValueError, TypeError):
            update_data["invoice_gst_percent"] = 0.0

    update_data["id"] = "site_settings"
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # Safe direct upsert on single unambiguous key
    await db.site_settings.update_one(
        {"id": "site_settings"},
        {"$set": update_data},
        upsert=True
    )
    
    s = await db.site_settings.find_one({"id": "site_settings"}, {"_id": 0})
    return {"success": True, "settings": s}


# ═══════════════════════════════════════════
#  PDF ENDPOINTS (Proforma Invoice + Receipt)
# ═══════════════════════════════════════════

@router.get("/admin/projects/{project_id}/invoices/{invoice_id}/pdf", dependencies=[Depends(require_admin)])
async def download_invoice_pdf(project_id: str, invoice_id: str):
    p = await db.projects.find_one(
        {"id": project_id},
        {"id": 1, "customer_name": 1, "address": 1, "project_code": 1, "invoices": 1}
    )
    if not p:
        raise HTTPException(404, "Project not found")

    invoices = p.get("invoices") or []
    idx = next((i for i, inv in enumerate(invoices) if inv["id"] == invoice_id), -1)
    if idx < 0:
        raise HTTPException(404, "Invoice not found")

    settings = await db.site_settings.find_one({"id": "site_settings"}, {"_id": 0})
    if not settings:
        settings = await db.site_settings.find_one({"_id": "site_settings"}, {"_id": 0}) or {}

    try:
        from invoice_pdf import generate_invoice_pdf
        pdf_bytes = generate_invoice_pdf(invoices[idx], p, settings)
    except Exception as e:
        logger.error(f"[Invoice PDF] {e}", exc_info=True)
        raise HTTPException(500, f"PDF generation failed: {e}")

    filename = f"Proforma_{invoices[idx]['number']}_{p.get('project_code', 'Proj')}.pdf"
    
    return FastAPIResponse(
        content=pdf_bytes, 
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'inline; filename="{filename}"',
            "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
            "Pragma": "no-cache",
            "Expires": "0"
        }
    )


@router.get("/portal/my-project/{project_id}/invoices/{invoice_id}/pdf")
async def client_download_invoice_pdf(project_id: str, invoice_id: str):
    p = await db.projects.find_one(
        {"id": project_id},
        {"id": 1, "customer_name": 1, "address": 1, "project_code": 1, "invoices": 1}
    )
    if not p:
        raise HTTPException(404, "Project not found")

    invoices = p.get("invoices") or []
    idx = next((i for i, inv in enumerate(invoices) if inv["id"] == invoice_id), -1)
    if idx < 0:
        raise HTTPException(404, "Invoice not found")

    settings = await db.site_settings.find_one({"id": "site_settings"}, {"_id": 0})
    if not settings:
        settings = await db.site_settings.find_one({"_id": "site_settings"}, {"_id": 0}) or {}

    try:
        from invoice_pdf import generate_invoice_pdf
        pdf_bytes = generate_invoice_pdf(invoices[idx], p, settings)
    except Exception as e:
        logger.error(f"[Client Invoice PDF] {e}", exc_info=True)
        raise HTTPException(500, "PDF generation failed")

    filename = f"Proforma_{invoices[idx]['number']}.pdf"
    return FastAPIResponse(
        content=pdf_bytes, 
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'inline; filename="{filename}"',
            "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
            "Pragma": "no-cache",
            "Expires": "0"
        }
    )


@router.get("/admin/projects/{project_id}/receipts/{payment_id}/pdf", dependencies=[Depends(require_admin)])
async def download_receipt_pdf(project_id: str, payment_id: str):
    p = await db.projects.find_one(
        {"id": project_id},
        {"id": 1, "customer_name": 1, "address": 1, "project_code": 1,
         "title": 1, "invoices": 1, "payments_log": 1}
    )
    if not p:
        raise HTTPException(404, "Project not found")

    payments = p.get("payments_log") or []
    pay = next((m for m in payments if m["id"] == payment_id), None)
    if not pay:
        raise HTTPException(404, "Receipt not found")

    linked_inv = None
    if pay.get("invoice_id"):
        invoices = p.get("invoices") or []
        linked_inv = next((i for i in invoices if i["id"] == pay["invoice_id"]), None)

    settings = await db.site_settings.find_one({"id": "site_settings"}, {"_id": 0})
    if not settings:
        settings = await db.site_settings.find_one({"_id": "site_settings"}, {"_id": 0}) or {}

    try:
        from receipt_pdf import generate_receipt_pdf
        pdf_bytes = generate_receipt_pdf(pay, p, settings, linked_invoice=linked_inv)
    except Exception as e:
        logger.error(f"[Receipt PDF] {e}", exc_info=True)
        raise HTTPException(500, f"Receipt PDF failed: {e}")

    rcp_num = pay.get("receipt_number", payment_id)
    return FastAPIResponse(
        content=pdf_bytes, 
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'inline; filename="Receipt_{rcp_num}.pdf"',
            "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
            "Pragma": "no-cache",
            "Expires": "0"
        }
    )


@router.get("/portal/my-project/{project_id}/receipts/{payment_id}/pdf")
async def client_download_receipt_pdf(project_id: str, payment_id: str):
    p = await db.projects.find_one(
        {"id": project_id},
        {"id": 1, "customer_name": 1, "address": 1, "project_code": 1,
         "title": 1, "invoices": 1, "payments_log": 1}
    )
    if not p:
        raise HTTPException(404, "Project not found")

    payments = p.get("payments_log") or []
    pay = next((m for m in payments if m["id"] == payment_id), None)
    if not pay:
        raise HTTPException(404, "Receipt not found")

    linked_inv = None
    if pay.get("invoice_id"):
        invoices = p.get("invoices") or []
        linked_inv = next((i for i in invoices if i["id"] == pay["invoice_id"]), None)

    settings = await db.site_settings.find_one({"id": "site_settings"}, {"_id": 0})
    if not settings:
        settings = await db.site_settings.find_one({"_id": "site_settings"}, {"_id": 0}) or {}

    try:
        from receipt_pdf import generate_receipt_pdf
        pdf_bytes = generate_receipt_pdf(pay, p, settings, linked_invoice=linked_inv)
    except Exception as e:
        logger.error(f"[Client Receipt PDF] {e}", exc_info=True)
        raise HTTPException(500, "Receipt PDF failed")

    rcp_num = pay.get("receipt_number", payment_id)
    return FastAPIResponse(
        content=pdf_bytes, 
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'inline; filename="Receipt_{rcp_num}.pdf"',
            "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
            "Pragma": "no-cache",
            "Expires": "0"
        }
    )


# ═══════════════════════════════════════════
#  PROFORMA INVOICES CRUD
# ═══════════════════════════════════════════

@router.post("/admin/projects/{project_id}/invoices", dependencies=[Depends(require_admin)])
async def create_invoice(project_id: str, body: InvoiceBody):
    p = await db.projects.find_one({"id": project_id}, {"id": 1, "payment_schedule": 1})
    if not p:
        raise HTTPException(404, "Project not found")

    await db.projects.update_one(
        {"id": project_id, "$or": [{"invoices": {"$exists": False}}, {"invoices": None}]},
        {"$set": {"invoices": []}}
    )

    now = datetime.now(timezone.utc).isoformat()

    milestone_name = None
    milestone_stage = None
    if body.milestone_id:
        schedule = p.get("payment_schedule") or []
        for ms in schedule:
            if ms["id"] == body.milestone_id:
                milestone_name = ms.get("name")
                milestone_stage = ms.get("stage", "General")
                ms["status"] = "invoiced"
                break

    inv_entry = {
        "id": f"inv_{uuid.uuid4().hex[:10]}",
        "number": body.number.strip(),
        "description": body.description.strip(),
        "stage": body.stage or "General",
        "date": body.date,
        "due_date": body.due_date,
        "amount": body.amount,
        "paid_amount": 0.0,
        "status": body.status,
        "document_url": body.document_url,
        "milestone_id": body.milestone_id,
        "milestone_name": milestone_name,
        "milestone_stage": milestone_stage,
        "created_at": now,
        "updated_at": now,
    }

    update_ops = {
        "$push": {"invoices": {"$each": [inv_entry], "$position": 0}},
        "$set": {"updated_at": now}
    }

    if body.milestone_id:
        schedule = p.get("payment_schedule") or []
        for ms in schedule:
            if ms["id"] == body.milestone_id:
                ms["status"] = "invoiced"
                ms["invoice_id"] = inv_entry["id"]
                break
        update_ops["$set"]["payment_schedule"] = schedule

    await db.projects.update_one({"id": project_id}, update_ops)

    await _log_activity(
        project_id, "Accounts",
        f"Raised Proforma Invoice #{body.number} for ₹{body.amount:,.0f}",
        "Payments"
    )
    asyncio.create_task(_push_notification(
        project_id,
        f"New Proforma Invoice #{body.number}",
        f"A proforma invoice for '{body.description}' (₹{body.amount:,.0f}) is ready for review.",
        "/portal/payments", "payments"
    ))
    return {"success": True, "invoice": inv_entry}


@router.put("/admin/projects/{project_id}/invoices/{invoice_id}", dependencies=[Depends(require_admin)])
async def update_invoice(project_id: str, invoice_id: str, body: InvoiceUpdateBody):
    p = await db.projects.find_one(
        {"id": project_id},
        {"id": 1, "invoices": 1, "customer_name": 1, "customer_email": 1, "title": 1, "project_code": 1}
    )
    if not p:
        raise HTTPException(404, "Project not found")

    invoices = p.get("invoices") or []
    idx = next((i for i, inv in enumerate(invoices) if inv["id"] == invoice_id), -1)
    if idx < 0:
        raise HTTPException(404, "Invoice not found")

    now = datetime.now(timezone.utc).isoformat()
    old_invoice = invoices[idx].copy()
    changes = []
    update_data = body.dict(exclude_unset=True)

    for field, new_val in update_data.items():
        if new_val is not None:
            old_val = old_invoice.get(field)
            if str(old_val) != str(new_val):
                if field == "amount":
                    changes.append(f"Amount: ₹{float(old_val or 0):,.0f} → ₹{float(new_val):,.0f}")
                elif field == "due_date":
                    changes.append(f"Due Date: {old_val or '—'} → {new_val}")
                elif field == "description":
                    changes.append("Description updated")
                elif field == "status":
                    changes.append(f"Status: {old_val} → {new_val}")
                else:
                    changes.append(f"{field} updated")
            invoices[idx][field] = new_val

    invoices[idx]["updated_at"] = now
    if "edit_history" not in invoices[idx]:
        invoices[idx]["edit_history"] = []
    invoices[idx]["edit_history"].append({
        "edited_at": now, "edited_by": "Admin", "changes": changes
    })

    await db.projects.update_one(
        {"id": project_id},
        {"$set": {"invoices": invoices, "updated_at": now}}
    )

    change_summary = ", ".join(changes) if changes else "Minor edits"
    await _log_activity(
        project_id, "Accounts",
        f"Edited Proforma Invoice #{invoices[idx]['number']}: {change_summary}",
        "Payments"
    )

    if changes:
        asyncio.create_task(_push_notification(
            project_id,
            f"Proforma Invoice Updated: #{invoices[idx]['number']}",
            f"Your proforma invoice #{invoices[idx]['number']} has been updated. Changes: {change_summary}",
            "/portal/payments", "payments"
        ))
        asyncio.create_task(_send_invoice_edit_email(
            project=p, invoice=invoices[idx], changes=changes
        ))

    return {"success": True, "invoice": invoices[idx], "changes": changes}


@router.delete("/admin/projects/{project_id}/invoices/{invoice_id}", dependencies=[Depends(require_admin)])
async def delete_invoice(project_id: str, invoice_id: str):
    p = await db.projects.find_one({"id": project_id}, {"id": 1, "invoices": 1})
    if not p:
        raise HTTPException(404, "Not found")
    await db.projects.update_one(
        {"id": project_id},
        {"$pull": {"invoices": {"id": invoice_id}}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"success": True}


# ═══════════════════════════════════════════
#  PAYMENT SCHEDULE MILESTONES
# ═══════════════════════════════════════════

@router.post("/admin/projects/{project_id}/payment-schedule", dependencies=[Depends(require_admin)])
async def add_schedule_milestone(project_id: str, body: PaymentScheduleMilestoneBody):
    p = await db.projects.find_one({"id": project_id}, {"id": 1})
    if not p:
        raise HTTPException(404, "Project not found")

    await db.projects.update_one(
        {"id": project_id, "$or": [{"payment_schedule": {"$exists": False}}, {"payment_schedule": None}]},
        {"$set": {"payment_schedule": []}}
    )

    milestone = {
        "id": f"ms_{uuid.uuid4().hex[:10]}",
        "name": body.name.strip(),
        "due_date": body.due_date or "",
        "amount": float(body.amount or 0),
        "stage": body.stage or "General",
        "status": body.status or "pending",
        "invoice_id": body.invoice_id,
    }

    await db.projects.update_one(
        {"id": project_id},
        {"$push": {"payment_schedule": milestone}}
    )
    await _log_activity(
        project_id, "Accounts",
        f"Added Milestone: {milestone['name']} (₹{milestone['amount']:,.0f})",
        "Payments"
    )
    return {"success": True, "milestone": milestone}


@router.put("/admin/projects/{project_id}/payment-schedule/{milestone_id}", dependencies=[Depends(require_admin)])
async def update_schedule_milestone(project_id: str, milestone_id: str, body: MilestoneUpdateBody):
    p = await db.projects.find_one({"id": project_id}, {"id": 1, "payment_schedule": 1})
    if not p:
        raise HTTPException(404, "Project not found")

    schedule = p.get("payment_schedule") or []
    idx = next((i for i, ms in enumerate(schedule) if ms["id"] == milestone_id), -1)
    if idx < 0:
        raise HTTPException(404, "Milestone not found")

    if schedule[idx].get("status") == "paid":
        raise HTTPException(400, "Cannot edit a milestone that is already marked as Paid.")

    now = datetime.now(timezone.utc).isoformat()
    update_data = body.dict(exclude_unset=True)
    changes = []

    for field, new_val in update_data.items():
        if new_val is not None:
            old_val = schedule[idx].get(field)
            if str(old_val) != str(new_val):
                changes.append(f"{field}: {old_val} → {new_val}")
            schedule[idx][field] = new_val

    await db.projects.update_one(
        {"id": project_id},
        {"$set": {"payment_schedule": schedule, "updated_at": now}}
    )

    change_summary = ", ".join(changes) if changes else "No changes"
    await _log_activity(
        project_id, "Accounts",
        f"Edited Milestone '{schedule[idx]['name']}': {change_summary}",
        "Payments"
    )
    return {"success": True, "milestone": schedule[idx], "changes": changes}


@router.delete("/admin/projects/{project_id}/payment-schedule/{milestone_id}", dependencies=[Depends(require_admin)])
async def delete_schedule_milestone(project_id: str, milestone_id: str):
    p = await db.projects.find_one({"id": project_id}, {"id": 1})
    if not p:
        raise HTTPException(404, "Project not found")
    await db.projects.update_one(
        {"id": project_id},
        {"$pull": {"payment_schedule": {"id": milestone_id}}}
    )
    return {"success": True}


# ═══════════════════════════════════════════
#  VARIATIONS CRUD & PORTAL APPROVALS
# ═══════════════════════════════════════════

@router.post("/admin/projects/{project_id}/variations", dependencies=[Depends(require_admin)])
async def create_variation(project_id: str, body: VariationBody):
    p = await db.projects.find_one({"id": project_id}, {"id": 1})
    if not p:
        raise HTTPException(404, "Project not found")

    await db.projects.update_one(
        {"id": project_id, "$or": [{"variations": {"$exists": False}}, {"variations": None}]},
        {"$set": {"variations": []}}
    )

    now = datetime.now(timezone.utc).isoformat()
    var_entry = {
        "id": f"var_{uuid.uuid4().hex[:10]}",
        "description": body.description.strip(),
        "amount": body.amount,
        "status": body.status,
        "document_url": body.document_url,
        "created_at": now,
        "approved_at": now if body.status == "approved" else None,
        "invoice_id": None,
        "receipt_logged": False,
    }

    await db.projects.update_one(
        {"id": project_id},
        {"$push": {"variations": {"$each": [var_entry], "$position": 0}}, "$set": {"updated_at": now}}
    )

    status_text = "Pre-Approved" if body.status == "approved" else "Awaiting Client Approval"
    await _log_activity(
        project_id, "Accounts",
        f"Added Variation: {body.description} (₹{body.amount:,.0f}) [{status_text}]",
        "Payments"
    )

    if body.status == "pending":
        asyncio.create_task(_push_notification(
            project_id, "New Scope Change / Variation Request",
            f"A new variation request of ₹{body.amount:,.0f} requires your review & approval.",
            "/portal/payments", "payments"
        ))

    return {"success": True, "variation": var_entry}


@router.patch("/admin/projects/{project_id}/variations/{variation_id}/link-invoice", dependencies=[Depends(require_admin)])
async def link_variation_to_invoice(project_id: str, variation_id: str, body: Dict[str, str]):
    invoice_id = body.get("invoice_id")
    p = await db.projects.find_one({"id": project_id}, {"variations": 1})
    if not p:
        raise HTTPException(404, "Project not found")

    variations = p.get("variations") or []
    idx = next((i for i, v in enumerate(variations) if v["id"] == variation_id), -1)
    if idx < 0:
        raise HTTPException(404, "Variation not found")

    now = datetime.now(timezone.utc).isoformat()
    variations[idx]["invoice_id"] = invoice_id
    variations[idx]["updated_at"] = now

    await db.projects.update_one(
        {"id": project_id},
        {"$set": {"variations": variations, "updated_at": now}}
    )
    return {"success": True}


@router.patch("/admin/projects/{project_id}/variations/{variation_id}/mark-receipt", dependencies=[Depends(require_admin)])
async def mark_variation_receipt(project_id: str, variation_id: str):
    p = await db.projects.find_one({"id": project_id}, {"variations": 1})
    if not p:
        raise HTTPException(404, "Project not found")
    variations = p.get("variations") or []
    idx = next((i for i, v in enumerate(variations) if v["id"] == variation_id), -1)
    if idx < 0:
        raise HTTPException(404, "Variation not found")
    variations[idx]["receipt_logged"] = True
    await db.projects.update_one({"id": project_id}, {"$set": {"variations": variations}})
    return {"success": True}


@router.patch("/portal/my-project/{project_id}/variations/{variation_id}/status")
async def client_update_variation_status(project_id: str, variation_id: str, body: Dict[str, str]):
    status = body.get("status")
    if status not in ["approved", "rejected"]:
        raise HTTPException(400, "Invalid status")

    p = await db.projects.find_one(
        {"id": project_id},
        {"variations": 1, "customer_name": 1, "title": 1, "project_code": 1}
    )
    if not p:
        raise HTTPException(404, "Project not found")

    variations = p.get("variations") or []
    idx = next((i for i, v in enumerate(variations) if v["id"] == variation_id), -1)
    if idx < 0:
        raise HTTPException(404, "Variation not found")

    now = datetime.now(timezone.utc).isoformat()
    variations[idx]["status"] = status
    variations[idx]["client_action_at"] = now
    if status == "approved":
        variations[idx]["approved_at"] = now
    else:
        variations[idx]["approved_at"] = None
        variations[idx]["rejected_at"] = now

    await db.projects.update_one(
        {"id": project_id},
        {"$set": {"variations": variations, "updated_at": now}}
    )

    action_str = "APPROVED ✅" if status == "approved" else "DECLINED ❌"
    amount_val = variations[idx].get("amount", 0)
    desc = variations[idx].get("description", "")
    client_name = p.get("customer_name", "Client")

    await _log_activity(
        project_id, "Client",
        f"Client {action_str} Variation: {desc} (₹{amount_val:,.0f})",
        "Payments"
    )

    try:
        admin_notification = {
            "id": f"notif_{uuid.uuid4().hex[:12]}",
            "title": f"Variation {action_str} by Client",
            "message": f"{client_name} has {status} the variation '{desc}' worth ₹{amount_val:,.0f}.",
            "type": "variation_response",
            "severity": "success" if status == "approved" else "warning",
            "project_id": project_id,
            "project_code": p.get("project_code"),
            "link": f"/admin/projects/{project_id}?tab=finance",
            "read": False,
            "created_at": now,
        }
        await db.admin_notifications.insert_one(admin_notification)
        asyncio.create_task(_push_notification(
            project_id, f"Variation {action_str}",
            f"You have {status} the variation for '{desc}' (₹{amount_val:,.0f}).",
            "/portal/payments", "payments"
        ))
    except Exception as e:
        logger.error(f"[Notification Error] {e}")

    return {"success": True, "variation": variations[idx]}


@router.patch("/admin/projects/{project_id}/variations/{variation_id}/status", dependencies=[Depends(require_admin)])
async def update_variation_status(project_id: str, variation_id: str, status: str):
    p = await db.projects.find_one({"id": project_id}, {"variations": 1})
    if not p:
        raise HTTPException(404, "Project not found")
    variations = p.get("variations") or []
    idx = next((i for i, v in enumerate(variations) if v["id"] == variation_id), -1)
    if idx < 0:
        raise HTTPException(404, "Variation not found")

    now = datetime.now(timezone.utc).isoformat()
    old_status = variations[idx]["status"]
    variations[idx]["status"] = status
    if status == "approved":
        variations[idx]["approved_at"] = now
    else:
        variations[idx]["approved_at"] = None

    await db.projects.update_one(
        {"id": project_id},
        {"$set": {"variations": variations, "updated_at": now}}
    )
    await _log_activity(
        project_id, "Accounts",
        f"Admin changed variation '{old_status}' → '{status}': {variations[idx]['description']}",
        "Payments"
    )
    return {"success": True, "variation": variations[idx]}


@router.delete("/admin/projects/{project_id}/variations/{variation_id}", dependencies=[Depends(require_admin)])
async def delete_variation(project_id: str, variation_id: str):
    p = await db.projects.find_one({"id": project_id}, {"id": 1})
    if not p:
        raise HTTPException(404, "Project not found")
    await db.projects.update_one(
        {"id": project_id},
        {"$pull": {"variations": {"id": variation_id}}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    await _log_activity(project_id, "Accounts", "Deleted variation item", "Payments")
    return {"success": True}


# ═══════════════════════════════════════════
#  PAYMENTS / RECEIPTS
# ═══════════════════════════════════════════

@router.post("/admin/projects/{project_id}/payments", dependencies=[Depends(require_admin)])
async def add_payment_log(project_id: str, body: EnhancedPaymentLogBody):
    p = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not p:
        raise HTTPException(404, "Project not found")

    await db.projects.update_one(
        {"id": project_id, "$or": [{"payments_log": {"$exists": False}}, {"payments_log": None}]},
        {"$set": {"payments_log": []}}
    )

    now = datetime.now(timezone.utc).isoformat()

    existing_payments = p.get("payments_log") or []
    rcp_seq = len(existing_payments) + 1
    receipt_number = f"RCP-{str(rcp_seq).zfill(3)}"

    payment_entry = {
        "id": f"pay_{uuid.uuid4().hex[:10]}",
        "receipt_number": receipt_number,
        "amount": body.amount,
        "date": body.date,
        "method": body.method,
        "reference": body.reference,
        "notes": body.notes,
        "invoice_id": body.invoice_id,
        "logged_at": now,
        "logged_by": "Admin",
    }

    invoices = p.get("invoices") or []
    schedule = p.get("payment_schedule") or []
    linked_invoice = None

    if body.invoice_id and invoices:
        inv_idx = next((i for i, inv in enumerate(invoices) if inv["id"] == body.invoice_id), -1)
        if inv_idx >= 0:
            linked_invoice = invoices[inv_idx]
            current_paid = float(invoices[inv_idx].get("paid_amount") or 0.0)
            new_paid = current_paid + body.amount
            invoices[inv_idx]["paid_amount"] = new_paid

            if new_paid >= float(invoices[inv_idx]["amount"]):
                invoices[inv_idx]["status"] = "paid"
                for ms in schedule:
                    if ms.get("invoice_id") == body.invoice_id:
                        ms["status"] = "paid"
                        break
            else:
                invoices[inv_idx]["status"] = "partially_paid"

            await db.projects.update_one(
                {"id": project_id},
                {"$set": {"invoices": invoices, "payment_schedule": schedule}}
            )

    await db.projects.update_one(
        {"id": project_id},
        {
            "$push": {"payments_log": {"$each": [payment_entry], "$sort": {"date": -1}}},
            "$inc": {"amount_spent": body.amount},
            "$set": {"updated_at": now},
        }
    )

    formatted_amt = f"₹{body.amount:,.0f}"
    await _log_activity(
        project_id, "Accounts",
        f"Receipt {receipt_number}: {formatted_amt} via {body.method}",
        "Payments"
    )
    asyncio.create_task(_push_notification(
        project_id, f"Payment Receipt {receipt_number}",
        f"Payment of {formatted_amt} has been received and logged.",
        "/portal/payments", "payments"
    ))

    asyncio.create_task(_send_receipt_email_with_pdf(
        project=p,
        payment=payment_entry,
        linked_invoice=linked_invoice,
    ))

    return {"success": True, "payment": payment_entry}


@router.put("/admin/projects/{project_id}/payments/{payment_id}", dependencies=[Depends(require_admin)])
async def update_payment_log(project_id: str, payment_id: str, body: ReceiptUpdateBody):
    p = await db.projects.find_one({"id": project_id}, {"_id": 0, "payments_log": 1, "invoices": 1})
    if not p:
        raise HTTPException(404, "Project not found")

    payments = p.get("payments_log") or []
    idx = next((i for i, pay in enumerate(payments) if pay["id"] == payment_id), -1)
    if idx < 0:
        raise HTTPException(404, "Receipt not found")

    now = datetime.now(timezone.utc).isoformat()
    old_payment = payments[idx].copy()
    update_data = body.dict(exclude_unset=True)
    changes = []

    old_amount = float(old_payment.get("amount", 0))
    new_amount = float(update_data.get("amount", old_amount))
    amount_diff = new_amount - old_amount

    if amount_diff != 0 and old_payment.get("invoice_id"):
        invoices = p.get("invoices") or []
        inv_idx = next((i for i, inv in enumerate(invoices) if inv["id"] == old_payment["invoice_id"]), -1)
        if inv_idx >= 0:
            current_paid = float(invoices[inv_idx].get("paid_amount") or 0.0)
            adjusted_paid = max(0.0, current_paid + amount_diff)
            invoices[inv_idx]["paid_amount"] = adjusted_paid
            if adjusted_paid >= float(invoices[inv_idx]["amount"]):
                invoices[inv_idx]["status"] = "paid"
            elif adjusted_paid > 0:
                invoices[inv_idx]["status"] = "partially_paid"
            else:
                invoices[inv_idx]["status"] = "upcoming"
            await db.projects.update_one(
                {"id": project_id},
                {"$set": {"invoices": invoices}}
            )

        await db.projects.update_one(
            {"id": project_id},
            {"$inc": {"amount_spent": amount_diff}}
        )

    for field, new_val in update_data.items():
        if new_val is not None:
            old_val = old_payment.get(field)
            if str(old_val) != str(new_val):
                if field == "amount":
                    changes.append(f"Amount: ₹{float(old_val or 0):,.0f} → ₹{float(new_val):,.0f}")
                else:
                    changes.append(f"{field} updated")
            payments[idx][field] = new_val

    payments[idx]["updated_at"] = now
    if "edit_history" not in payments[idx]:
        payments[idx]["edit_history"] = []
    payments[idx]["edit_history"].append({
        "edited_at": now, "edited_by": "Admin", "changes": changes
    })

    await db.projects.update_one(
        {"id": project_id},
        {"$set": {"payments_log": payments, "updated_at": now}}
    )

    await _log_activity(
        project_id, "Accounts",
        f"Edited Receipt {payments[idx].get('receipt_number', '')}: {', '.join(changes)}",
        "Payments"
    )
    return {"success": True, "payment": payments[idx], "changes": changes}


@router.delete("/admin/projects/{project_id}/payments/{payment_id}", dependencies=[Depends(require_admin)])
async def delete_payment_log(project_id: str, payment_id: str):
    p = await db.projects.find_one({"id": project_id}, {"_id": 0, "payments_log": 1, "invoices": 1})
    if not p:
        raise HTTPException(404, "Project not found")

    payments = p.get("payments_log") or []
    target = next((m for m in payments if m["id"] == payment_id), None)
    if not target:
        raise HTTPException(404, "Payment log not found")

    invoices = p.get("invoices") or []
    if target.get("invoice_id") and invoices:
        inv_idx = next((i for i, inv in enumerate(invoices) if inv["id"] == target["invoice_id"]), -1)
        if inv_idx >= 0:
            current_paid = float(invoices[inv_idx].get("paid_amount") or 0.0)
            new_paid = max(0.0, current_paid - target["amount"])
            invoices[inv_idx]["paid_amount"] = new_paid
            invoices[inv_idx]["status"] = "upcoming" if new_paid <= 0 else "partially_paid"
            await db.projects.update_one({"id": project_id}, {"$set": {"invoices": invoices}})

    await db.projects.update_one(
        {"id": project_id},
        {
            "$pull": {"payments_log": {"id": payment_id}},
            "$inc": {"amount_spent": -target["amount"]},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()},
        }
    )
    return {"success": True}


# ═══════════════════════════════════════════
#  EMAIL HELPERS
# ═══════════════════════════════════════════

async def _send_invoice_edit_email(project: dict, invoice: dict, changes: list):
    try:
        from email_service import send_email

        customer_email = project.get("customer_email")
        if not customer_email:
            return

        customer_name = project.get("customer_name", "Client")
        project_title = project.get("title", "Your Project")
        inv_number = invoice.get("number", "N/A")
        inv_amount = float(invoice.get("amount", 0))
        inv_due = invoice.get("due_date", "—")

        subject = f"Proforma Invoice #{inv_number} Updated — {project_title}"
        html_body = f"""
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #000F1B; padding: 24px; border-radius: 12px 12px 0 0;">
                <h2 style="color: #FF5A00; margin: 0; font-size: 20px;">Proforma Invoice Updated</h2>
                <p style="color: #ccc; margin: 8px 0 0; font-size: 13px;">{project_title}</p>
            </div>
            <div style="background: #fff; padding: 24px; border: 1px solid #e5e7eb; border-top: none;">
                <p style="color: #333; font-size: 14px;">Dear {customer_name},</p>
                <p style="color: #555; font-size: 13px;">
                    Proforma Invoice <strong>#{inv_number}</strong> has been updated.
                </p>
                <div style="background: #FFF7ED; border: 1px solid #FDBA74; border-radius: 8px; padding: 16px; margin: 16px 0;">
                    <p style="font-size: 12px; font-weight: bold; color: #9A3412; margin: 0 0 8px;">CHANGES:</p>
                    <ul style="margin: 0; padding: 0 0 0 16px; color: #333; font-size: 13px;">
                        {''.join([f'<li style="margin: 4px 0;">{c}</li>' for c in changes])}
                    </ul>
                </div>
                <div style="background: #F9FAFB; border-radius: 8px; padding: 16px;">
                    <table style="width: 100%; font-size: 13px;">
                        <tr><td style="padding: 4px 0; color: #888;">Proforma #</td><td style="text-align: right; font-weight: bold;">{inv_number}</td></tr>
                        <tr><td style="padding: 4px 0; color: #888;">Amount</td><td style="text-align: right; font-weight: bold; color: #FF5A00;">₹{inv_amount:,.0f}</td></tr>
                        <tr><td style="padding: 4px 0; color: #888;">Due Date</td><td style="text-align: right; font-weight: bold;">{inv_due}</td></tr>
                    </table>
                </div>
            </div>
            <div style="background: #F9FAFB; padding: 16px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
                <p style="color: #999; font-size: 11px; text-align: center; margin: 0;">
                    Automated notification from ConstructONS™
                </p>
            </div>
        </div>
        """
        await send_email(to_email=customer_email, subject=subject, html_content=html_body)
    except Exception as e:
        logger.error(f"[Invoice Edit Email] {e}", exc_info=True)


async def _send_receipt_email_with_pdf(project: dict, payment: dict, linked_invoice: dict = None):
    try:
        from email_service import send_receipt_email
        from receipt_pdf import generate_receipt_pdf

        customer_email = project.get("customer_email")
        if not customer_email:
            logger.info("[Receipt Email] No customer_email on project. Skipped.")
            return

        settings = await db.site_settings.find_one({"id": "site_settings"}, {"_id": 0})
        if not settings:
            settings = await db.site_settings.find_one({"_id": "site_settings"}, {"_id": 0}) or {}

        pdf_bytes = None
        try:
            pdf_bytes = generate_receipt_pdf(
                payment, project, settings,
                linked_invoice=linked_invoice
            )
        except Exception as e:
            logger.error(f"[Receipt PDF for email] {e}", exc_info=True)

        await send_receipt_email(
            to_email=customer_email,
            customer_name=project.get("customer_name", "Client"),
            project_title=project.get("title", "Your Project"),
            receipt_number=payment.get("receipt_number", "N/A"),
            amount=float(payment.get("amount", 0)),
            method=payment.get("method", "—"),
            date=payment.get("date", "—"),
            linked_invoice_number=linked_invoice.get("number") if linked_invoice else None,
            pdf_bytes=pdf_bytes,
        )
        logger.info(f"[Receipt Email] Sent to {customer_email}")
    except Exception as e:
        logger.error(f"[Receipt Email] {e}", exc_info=True)