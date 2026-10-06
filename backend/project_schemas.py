"""Pydantic schemas and request models for ConstructONS API."""
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

# --- Project Schemas ---
class ProjectCreateBody(BaseModel):
    customer_email: str
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None 
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
    expected_completion: Optional[str] = None
    start_date: Optional[str] = None

class ProjectUpdateBody(BaseModel):
    title: Optional[str] = None
    customer_name: Optional[str] = None # <--- ADD THIS LINE
    customer_phone: Optional[str] = None
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
    expected_completion: Optional[str] = None
    start_date: Optional[str] = None

# --- Stages & Substages Schemas ---
class SubstageBody(BaseModel):
    name: str = Field(..., min_length=2)
    start_date: Optional[str] = None
    planned_end_date: Optional[str] = None
    actual_start_date: Optional[str] = None
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

class RejectStageBody(BaseModel):
    reason: str

# --- Team & Attendance Schemas ---
class TeamInviteBody(BaseModel):
    name: Optional[str] = ""
    email: Optional[str] = None
    phone: Optional[str] = None
    role: str
    access: str = "View Access"
    company: Optional[str] = ""
    contact: Optional[str] = None

class AttendanceBody(BaseModel):
    member_ids: List[str] = Field(default_factory=list)

class NotificationMarkReadBody(BaseModel):
    notification_id: str

# --- Drawings Schemas ---
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

# --- Materials Schemas ---
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

# --- Financial Ledger Schemas ---
class PaymentLogBody(BaseModel):
    amount: float
    date: str
    method: str = "Bank Transfer"
    reference: Optional[str] = ""
    notes: Optional[str] = ""

# --- Documents Vault Schemas ---
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

# --- Warranty & Maintenance Schemas ---
class WarrantyUpdateBody(BaseModel):
    warranty_start_date: Optional[str] = None
    warranty_years: Optional[int] = None

class MaintenanceTicketCreateBody(BaseModel):
    title: str = Field(..., min_length=3, max_length=100)
    category: str
    priority: str
    description: str
    photo_urls: List[str] = Field(default_factory=list)

class MaintenanceTicketUpdateBody(BaseModel):
    status: str
    admin_notes: Optional[str] = None

# --- Daily Progress Reports Schemas ---
class DailyReportPhotoBody(BaseModel):
    url: str
    caption: Optional[str] = None
    time: Optional[str] = None

class DailyReportCreateBody(BaseModel):
    date: str
    overall_status: str = "Work as per plan"
    status_notes: Optional[str] = None
    work_completed: List[str] = Field(default_factory=list)
    planned_tomorrow: List[str] = Field(default_factory=list)
    photos: List[DailyReportPhotoBody] = Field(default_factory=list)
    # ★ New Fields
    workers_count: Optional[int] = 0
    masteries_count: Optional[int] = 0
    work_done_yesterday: Optional[str] = ""
    work_completed_today: Optional[str] = ""

class DailyReportUpdateBody(BaseModel):
    date: Optional[str] = None
    overall_status: Optional[str] = None
    status_notes: Optional[str] = None
    work_completed: Optional[List[str]] = None
    planned_tomorrow: Optional[List[str]] = None
    photos: Optional[List[DailyReportPhotoBody]] = None
    # ★ New Fields
    workers_count: Optional[int] = None
    masteries_count: Optional[int] = None
    work_done_yesterday: Optional[str] = None
    work_completed_today: Optional[str] = None

# --- Quality & Issues Schemas ---
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
    status: str
    resolution_remark: Optional[str] = None
    resolution_photos: List[str] = Field(default_factory=list)

class IssueClientReviewBody(BaseModel):
    approved: bool
    remark: Optional[str] = None

class QualityInspectionBody(BaseModel):
    name: str = Field(..., min_length=3, max_length=100)
    category: str
    status: str = "pending"
    inspector_name: str = Field(..., min_length=2)
    remarks: Optional[str] = None
    photo_url: Optional[str] = None
    inspected_at: Optional[str] = None

class QualityInspectionUpdateBody(QualityInspectionBody):
    pass

# --- CCTV Cameras Schemas ---
class CCTVCameraBody(BaseModel):
    name: str
    camera_type: str
    url: str
    status: str = "online"
    location_label: Optional[str] = None

class CCTVCameraUpdateBody(CCTVCameraBody):
    pass