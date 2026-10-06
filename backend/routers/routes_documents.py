"""Central Document Vault & Revisions."""
import uuid
import asyncio
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from db import db
from auth import require_admin
from project_schemas import DocumentCreateBody, DocumentRevisionBody, DocumentPatchBody
from project_utils import _log_activity, _push_notification

router = APIRouter(prefix="/api", tags=["documents"])

@router.post("/admin/projects/{project_id}/documents", dependencies=[Depends(require_admin)])
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
    asyncio.create_task(_push_notification(project_id, "New Document Added", f"A new document ({body.name}) is in your vault.", "/portal/documents", "system"))
    return {"success": True, "document": doc_entry}

@router.post("/admin/projects/{project_id}/documents/{document_id}/revision", dependencies=[Depends(require_admin)])
async def revise_document(project_id: str, document_id: str, body: DocumentRevisionBody):
    p = await db.projects.find_one({"id": project_id}, {"id": 1, "documents": 1})
    if not p: raise HTTPException(status_code=404, detail="Not found")
    
    docs = p.get("documents") or []
    idx = next((i for i, d in enumerate(docs) if d["id"] == document_id), -1)
    if idx == -1: raise HTTPException(status_code=404, detail="Document not found")
    
    now = datetime.now(timezone.utc).isoformat()
    doc = docs[idx]
    if "versions" not in doc:
        doc["versions"] = [{"version": 1, "url": doc.get("url", ""), "uploaded_at": doc.get("uploaded_at", now), "uploaded_by": "Admin"}]

    new_version = doc.get("current_version", 1) + 1
    revision = {"version": new_version, "url": body.url, "uploaded_at": now, "uploaded_by": "Admin"}
    
    doc["versions"].append(revision)
    doc["current_version"] = new_version
    doc["status"] = body.status
    doc["uploaded_at"] = now
    
    await db.projects.update_one({"id": project_id}, {"$set": {f"documents.{idx}": doc, "updated_at": now}})
    await _log_activity(project_id, "Admin", f"Uploaded Revision R{new_version:02d} for {doc['name']}", "Documents")
    return {"success": True, "document": doc}

@router.patch("/admin/projects/{project_id}/documents/{document_id}", dependencies=[Depends(require_admin)])
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

@router.delete("/admin/projects/{project_id}/documents/{document_id}", dependencies=[Depends(require_admin)])
async def delete_document(project_id: str, document_id: str):
    p = await db.projects.find_one({"id": project_id}, {"id": 1, "documents": 1})
    if not p: raise HTTPException(status_code=404, detail="Not found")
    await db.projects.update_one({"id": project_id}, {"$pull": {"documents": {"id": document_id}}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}})
    return {"success": True}