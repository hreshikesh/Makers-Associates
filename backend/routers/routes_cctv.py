"""Live CCTV Camera Feed Management."""
import uuid
import asyncio
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from db import db
from auth import require_admin
from project_schemas import CCTVCameraBody, CCTVCameraUpdateBody
from project_utils import _log_activity, _push_notification

router = APIRouter(prefix="/api", tags=["cctv"])

@router.post("/admin/projects/{project_id}/cameras", dependencies=[Depends(require_admin)])
async def add_camera(project_id: str, body: CCTVCameraBody):
    p = await db.projects.find_one({"id": project_id}, {"id": 1})
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    
    name = (body.name or "").strip()
    url = (body.url or "").strip()
    if not name or not url:
        raise HTTPException(status_code=400, detail="Name and Stream URL are required")
    
    cam_type = (body.camera_type or "iframe").lower().strip()

    await db.projects.update_one(
        {"id": project_id, "$or": [{"cctv_cameras": {"$exists": False}}, {"cctv_cameras": None}]},
        {"$set": {"cctv_cameras": []}}
    )

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
    return {"success": True, "camera": camera}


@router.put("/admin/projects/{project_id}/cameras/{camera_id}", dependencies=[Depends(require_admin)])
async def update_camera(project_id: str, camera_id: str, body: CCTVCameraUpdateBody):
    p = await db.projects.find_one({"id": project_id}, {"id": 1, "cctv_cameras": 1})
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    
    cameras = p.get("cctv_cameras") or []
    idx = next((i for i, c in enumerate(cameras) if c["id"] == camera_id), -1)
    if idx == -1:
        raise HTTPException(status_code=404, detail="Camera not found")
    
    name = (body.name or "").strip()
    url = (body.url or "").strip()
    if not name or not url:
        raise HTTPException(status_code=400, detail="Name and Stream URL are required")

    cam_type = (body.camera_type or "iframe").lower().strip()
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

    await db.projects.update_one({"id": project_id}, {"$set": {"cctv_cameras": cameras, "updated_at": now}})
    await _log_activity(project_id, "Admin", f"Updated CCTV camera: {name}", "CCTV")
    return {"success": True, "camera": cameras[idx]}


@router.delete("/admin/projects/{project_id}/cameras/{camera_id}", dependencies=[Depends(require_admin)])
async def remove_camera(project_id: str, camera_id: str):
    p = await db.projects.find_one({"id": project_id}, {"id": 1, "cctv_cameras": 1})
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")

    await db.projects.update_one(
        {"id": project_id},
        {"$pull": {"cctv_cameras": {"id": camera_id}}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"success": True}


@router.patch("/admin/projects/{project_id}/cameras/{camera_id}/status", dependencies=[Depends(require_admin)])
async def toggle_camera_status(project_id: str, camera_id: str):
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

    await db.projects.update_one({"id": project_id}, {"$set": {"cctv_cameras": cameras, "updated_at": datetime.now(timezone.utc).isoformat()}})
    return {"success": True, "status": new_status}