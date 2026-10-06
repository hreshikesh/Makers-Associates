"""Daily Progress Reports & PDF Generators with Labor Force Metrics."""
import uuid
import asyncio
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from db import db
from auth import require_admin
from project_schemas import DailyReportCreateBody, DailyReportUpdateBody
from project_utils import _log_activity, _push_notification

router = APIRouter(prefix="/api", tags=["reports"])

# ============================================================================
# UNIFIED COMPREHENSIVE PROGRESS REPORT PDF
# ============================================================================

@router.get("/portal/my-project/{project_id}/full-progress-report/pdf")
async def download_full_progress_report_pdf(project_id: str):
    """Full Progress Report PDF:
    Overview + Stages/Substages + Monthly Progress + ALL Daily Reports (with labor strength & yesterday/today briefing).
    """
    p = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")

    stages = p.get("stages", []) or []
    total_pct = sum(float(s.get("progress_pct") or 0) for s in stages)
    overall = total_pct / (len(stages) or 1)

    project_title = p.get("title") or "Unnamed Project"
    project_address = p.get("address") or "N/A"
    project_code = p.get("project_code") or "—"
    customer_name = p.get("customer_name") or "Client"
    generated_on = datetime.now(timezone.utc).strftime("%d %b %Y, %I:%M %p UTC")

    # Days completed
    start_dt = p.get("start_date") or p.get("created_at") or datetime.now(timezone.utc).isoformat()[:10]
    try:
        start_d = datetime.strptime(str(start_dt)[:10], "%Y-%m-%d")
        days_completed = max(0, (datetime.now() - start_d).days)
    except Exception:
        days_completed = 0

    stages_completed = sum(1 for s in stages if s.get("status") == "completed")
    forecast = p.get("expected_completion") or "TBD"
    contract_value = p.get("contract_value") or 0
    amount_spent = p.get("amount_spent") or 0

    # ---------- 1) STAGES + SUBSTAGES ----------
    def _status_label(st):
        return (st or "pending").replace("_", " ").title()

    def _date_label(s):
        return s.get("actual_end_date") or s.get("planned_end_date") or s.get("expected_date") or "—"

    stages_rows = []
    for i, s in enumerate(stages):
        stages_rows.append(f"""
        <tr class="stage-row">
            <td style="font-weight:700; color:#000F1B;">{i + 1}. {s.get('name') or '—'}</td>
            <td>{_status_label(s.get('status'))}</td>
            <td>{str(s.get('start_date') or s.get('started_at') or '—')[:10]}</td>
            <td>{str(_date_label(s))[:10]}</td>
            <td style="text-align:right; font-weight:800; color:#FF5A00;">{float(s.get('progress_pct') or 0):.0f}%</td>
        </tr>
        """)
        for j, sub in enumerate(s.get("substages") or []):
            stages_rows.append(f"""
            <tr class="sub-row">
                <td style="padding-left:22px; color:#444;">↳ {sub.get('name') or 'Substage'}</td>
                <td>{_status_label(sub.get('status'))}</td>
                <td>{str(sub.get('start_date') or '—')[:10]}</td>
                <td>{str(sub.get('actual_end_date') or sub.get('planned_end_date') or '—')[:10]}</td>
                <td style="text-align:right; color:#FF5A00; font-weight:700;">{float(sub.get('progress_pct') or 0):.0f}%</td>
            </tr>
            """)

    stages_html = "".join(stages_rows) or """
        <tr><td colspan="5" style="text-align:center; color:#888; font-style:italic;">No stages configured</td></tr>
    """

    # ---------- 2) MONTHLY PROGRESS ----------
    monthly = p.get("monthly_progress") or []
    if monthly:
        monthly_rows = "".join(
            f"""
            <tr>
                <td><strong>{m.get('month') or '—'}</strong></td>
                <td style="text-align:center;">{m.get('planned_pct', '—')}{'%' if m.get('planned_pct') is not None else ''}</td>
                <td style="text-align:center; font-weight:800; color:#FF5A00;">{m.get('actual_pct', 0)}%</td>
            </tr>
            """
            for m in monthly
        )
        monthly_html = f"""
        <h2>2. Monthly Progress</h2>
        <table>
          <thead>
            <tr>
              <th>Month</th>
              <th style="text-align:center;">Planned %</th>
              <th style="text-align:center;">Actual % (Verified)</th>
            </tr>
          </thead>
          <tbody>{monthly_rows}</tbody>
        </table>
        """
    else:
        monthly_html = """
        <h2>2. Monthly Progress</h2>
        <p class="muted">No monthly progress snapshots recorded yet.</p>
        """

    # ---------- 3) ALL DAILY REPORTS ----------
    daily_reports = p.get("daily_reports") or []
    daily_reports = sorted(daily_reports, key=lambda r: r.get("date") or "", reverse=True)

    def _photo_count(r):
        return len(r.get("photos") or [])

    def _list_html(items, empty="—"):
        items = items or []
        if not items:
            return f"<em style='color:#999'>{empty}</em>"
        return "<ul style='margin:4px 0 0 16px; padding:0;'>" + "".join(f"<li>{x}</li>" for x in items) + "</ul>"

    if daily_reports:
        reports_blocks = []
        for idx, r in enumerate(daily_reports, start=1):
            approved = bool(r.get("is_approved"))
            badge = (
                "<span class='badge ok'>Published to Client</span>"
                if approved
                else "<span class='badge pending'>Awaiting / Internal</span>"
            )
            photos = r.get("photos") or []
            photo_bits = ""
            if photos:
                photo_bits = "<div class='photo-meta'><strong>Photos (" + str(len(photos)) + "):</strong> " + ", ".join(
                    [
                        (ph.get("caption") if isinstance(ph, dict) else "Site Photo")
                        or "Site Photo"
                        for ph in photos[:12]
                    ]
                ) + ("…" if len(photos) > 12 else "") + "</div>"

            # Render Labor deployment stats
            workers = r.get("workers_count", 0)
            masteries = r.get("masteries_count", 0)
            work_yesterday = r.get("work_done_yesterday") or "—"
            work_completed_today_text = r.get("work_completed_today") or "—"

            reports_blocks.append(f"""
            <div class="report-card">
              <div class="report-head">
                <div>
                  <div class="report-title">#{idx} · {r.get('date') or '—'} {badge}</div>
                  <div class="report-sub">
                    Status: <strong>{r.get('overall_status') or '—'}</strong>
                    · Submitted by {r.get('submitted_by') or 'Site Engineer'}
                    {(' · Approved ' + str(r.get('approved_at') or '')[:10]) if approved else ''}
                  </div>
                </div>
                <div class="report-side">{_photo_count(r)} photo(s)</div>
              </div>
              
              <!-- Workforce Metrics Block -->
              <div style="background:#f1f5f9; padding:8px 12px; border-radius:6px; margin:8px 0; font-size:10.5px; display:flex; gap:16px;">
                <div><strong>Workers Strength:</strong> {workers} Laborers</div>
                <div><strong>Masteries (Mistry / Masons):</strong> {masteries} Skilled</div>
              </div>

              {f"<p class='notes'><strong>Overall Site Notes:</strong> {r.get('status_notes')}</p>" if r.get('status_notes') else ''}
              
              <!-- Core Chronological Metrics -->
              <div style="background:#fafafa; border:1px solid #e2e8f0; border-radius:6px; padding:10px; margin:8px 0; font-size:11px;">
                <div style="margin-bottom:6px;"><strong>Work Done Yesterday:</strong> {work_yesterday}</div>
               <div><strong>Work Planned for Today:</strong> {work_completed_today_text}</div>
              </div>

              <div class="two-col" style="margin-top:8px;">
                <div>
                  <div class="label">Completed Line Items</div>
                  {_list_html(r.get('work_completed'), 'No items listed')}
                </div>
                <div>
                  <div class="label">Targeted for Tomorrow</div>
                  {_list_html(r.get('planned_tomorrow'), 'No items listed')}
                </div>
              </div>
              {photo_bits}
            </div>
            """)
        reports_html = f"""
        <h2>3. Daily Progress Reports <span class="count">({len(daily_reports)} total)</span></h2>
        <p class="muted">All logged daily reports are included below (newest first).</p>
        {''.join(reports_blocks)}
        """
    else:
        reports_html = """
        <h2>3. Daily Progress Reports</h2>
        <p class="muted">No daily progress reports have been logged yet.</p>
        """

    # Precise ConstructONS Power 'O' SVG
    power_o_svg = """<svg viewBox="0 0 24 24" width="17" height="17" style="vertical-align:-1.5px; display:inline-block; margin:0 -1px;" xmlns="http://www.w3.org/2000/svg">
      <path fill="none" stroke="#FF5A00" stroke-width="3.2" stroke-linecap="round" d="M12 2.5v7.5"/>
      <path fill="none" stroke="#FF5A00" stroke-width="3.2" stroke-linecap="round" d="M18.36 6.64a9 9 0 1 1-12.73 0"/>
    </svg>"""

    brand_logo_html = f"""<span style="letter-spacing:0.04em;"><span style="color:#000F1B; font-weight:900;">CONSTRUCT</span>{power_o_svg}<span style="color:#FF5A00; font-weight:900;">NS</span><span style="font-size:11px; vertical-align:super; color:#000F1B; font-weight:700;">™</span></span>"""

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>ConstructONS™ Full Progress Report — {project_code}</title>
  <style>
    :root {{
      --orange:#FF5A00; --navy:#000F1B; --muted:#666; --line:#e5e5e5; --bg:#f7f8fa;
    }}
    * {{ box-sizing:border-box; }}
    body {{
      font-family: Arial, Helvetica, sans-serif;
      color:#111; line-height:1.45;
      padding: 28px 32px; margin:0; font-size:12px;
    }}
    .header {{
      display:flex; justify-content:space-between; align-items:flex-end;
      border-bottom:3px solid var(--orange); padding-bottom:10px; margin-bottom:18px;
    }}
    .brand {{ font-size:20px; font-family: Arial, sans-serif; }}
    .meta {{ text-align:right; font-size:10px; color:var(--muted); line-height:1.4; }}
    h1 {{ margin:0 0 4px; font-size:20px; color:var(--navy); }}
    .sub {{ margin:0 0 14px; font-size:11px; color:var(--muted); }}
    .kpi-grid {{
      display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin:14px 0 18px;
    }}
    .kpi {{
      background:var(--bg); border:1px solid var(--line); border-radius:8px;
      padding:10px 8px; text-align:center;
    }}
    .kpi-title {{ font-size:9px; font-weight:700; color:#777; text-transform:uppercase; letter-spacing:0.06em; }}
    .kpi-val {{ font-size:18px; font-weight:900; color:var(--navy); margin-top:4px; }}
    h2 {{
      font-size:12px; text-transform:uppercase; letter-spacing:0.06em;
      color:var(--navy); border-bottom:1px solid var(--line);
      padding-bottom:5px; margin:22px 0 10px;
    }}
    h2 .count {{ color:var(--orange); font-weight:800; }}
    table {{ width:100%; border-collapse:collapse; margin-bottom:10px; font-size:11px; }}
    th, td {{ border:1px solid var(--line); padding:7px 8px; text-align:left; vertical-align:top; }}
    th {{ background:var(--navy); color:#fff; font-size:9px; text-transform:uppercase; letter-spacing:0.05em; }}
    tr.sub-row td {{ background:#fafafa; font-size:10.5px; }}
    .muted {{ color:#888; font-style:italic; margin:6px 0 12px; }}
    .report-card {{
      border:1px solid var(--line); border-radius:8px; background:#fff;
      padding:12px; margin-bottom:12px; page-break-inside:avoid;
    }}
    .report-head {{ display:flex; justify-content:space-between; gap:10px; margin-bottom:6px; }}
    .report-title {{ font-size:13px; font-weight:800; color:var(--navy); }}
    .report-sub {{ font-size:10px; color:#666; margin-top:2px; }}
    .report-side {{ font-size:10px; color:#888; white-space:nowrap; }}
    .notes {{
      background:#fff7f2; border-left:3px solid var(--orange);
      padding:6px 8px; margin:6px 0 8px; font-size:11px; color:#333;
    }}
    .two-col {{ display:grid; grid-template-columns:1fr 1fr; gap:12px; }}
    .label {{ font-size:9px; font-weight:800; text-transform:uppercase; color:#777; margin-bottom:2px; }}
    .badge {{
      display:inline-block; font-size:9px; font-weight:800; padding:2px 7px;
      border-radius:999px; margin-left:6px; vertical-align:middle;
    }}
    .badge.ok {{ background:#ecfdf5; color:#047857; border:1px solid #a7f3d0; }}
    .badge.pending {{ background:#fff7ed; color:#c2410c; border:1px solid #fed7aa; }}
    .photo-meta {{ margin-top:8px; font-size:10px; color:#555; }}
    .footer {{
      margin-top:28px; padding-top:10px; border-top:1px solid var(--line);
      text-align:center; font-size:9px; color:#999;
    }}
    .info-box {{
      background:var(--bg); border-left:4px solid var(--orange);
      padding:10px 12px; border-radius:0 8px 8px 0; margin-bottom:8px; font-size:11px;
    }}
    @media print {{
      body {{ padding:16px; }}
      .report-card, table, .kpi {{ break-inside: avoid; }}
      th {{ -webkit-print-color-adjust:exact; print-color-adjust:exact; }}
    }}
  </style>
</head>
<body onload="window.print()">
  <div class="header">
    <div class="brand">{brand_logo_html}</div>
    <div class="meta">
      Full Progress Report<br/>
      Generated {generated_on}
    </div>
  </div>

  <h1>{project_title}</h1>
  <p class="sub">
    Code: <strong>{project_code}</strong> · Client: <strong>{customer_name}</strong> · Site: {project_address}
  </p>

  <div class="info-box">
    This document consolidates <strong>Overview</strong>, <strong>Stage / Substage progress</strong>,
    <strong>Monthly progress</strong>, and <strong>all Daily Progress Reports</strong>
    from the ConstructONS™ Client Portal.
  </div>

  <!-- ========== 1. OVERVIEW ========== -->
  <h2>1. Project Overview</h2>
  <div class="kpi-grid">
    <div class="kpi">
      <div class="kpi-title">Overall Progress</div>
      <div class="kpi-val" style="color:#FF5A00;">{round(overall)}%</div>
    </div>
    <div class="kpi">
      <div class="kpi-title">Days Completed</div>
      <div class="kpi-val">{days_completed}</div>
    </div>
    <div class="kpi">
      <div class="kpi-title">Stages Completed</div>
      <div class="kpi-val">{stages_completed}/{len(stages)}</div>
    </div>
    <div class="kpi">
      <div class="kpi-title">Forecast Delivery</div>
      <div class="kpi-val" style="font-size:13px;">{str(forecast)[:10]}</div>
    </div>
  </div>
  <table>
    <tbody>
      <tr><th style="width:30%; background:#000F1B; color:#fff;">Contract Value</th><td>₹ {float(contract_value):,.0f}</td></tr>
      <tr><th style="background:#000F1B; color:#fff;">Amount Received</th><td>₹ {float(amount_spent):,.0f}</td></tr>
      <tr><th style="background:#000F1B; color:#fff;">Project Start</th><td>{str(start_dt)[:10]}</td></tr>
      <tr><th style="background:#000F1B; color:#fff;">Project Status</th><td>{(p.get('status') or 'active').title()}</td></tr>
    </tbody>
  </table>

  <h2>1b. Construction Stages &amp; Substages</h2>
  <table>
    <thead>
      <tr>
        <th>Stage / Substage</th>
        <th>Status</th>
        <th>Start</th>
        <th>End (Actual / Planned)</th>
        <th style="text-align:right;">Progress</th>
      </tr>
    </thead>
    <tbody>
      {stages_html}
    </tbody>
  </table>

  <!-- ========== 2. MONTHLY ========== -->
  {monthly_html}

  <!-- ========== 3. ALL DAILY REPORTS ========== -->
  {reports_html}

  <div class="footer">
    <div style="font-size:14px; margin-bottom:4px;">
      {brand_logo_html}
    </div>
    Official Full Progress Report · Generated from ConstructONS Client Portal<br/>
    Everything Construction. Always On.
  </div>
</body>
</html>
"""
    return HTMLResponse(content=html_content)

# The remaining routes (GET list, POST create, PUT update, PATCH approve, patch unapprove, DELETE)
# naturally inherit the schema updates to support labor & yesterday/today briefing:

@router.get("/admin/projects/{project_id}/daily-reports", dependencies=[Depends(require_admin)])
async def list_daily_reports(project_id: str, status: Optional[str] = None):
    p = await db.projects.find_one({"id": project_id}, {"daily_reports": 1, "_id": 0})
    if not p: raise HTTPException(status_code=404, detail="Project not found")
    reports = p.get("daily_reports") or []
    if status == "pending": reports = [r for r in reports if not r.get("is_approved")]
    elif status == "approved": reports = [r for r in reports if r.get("is_approved")]
    reports.sort(key=lambda r: r.get("date", ""), reverse=True)
    return {"reports": reports, "count": len(reports)}

@router.post("/admin/projects/{project_id}/daily-reports", dependencies=[Depends(require_admin)])
async def submit_daily_report(project_id: str, body: DailyReportCreateBody):
    p = await db.projects.find_one({"id": project_id}, {"id": 1})
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")

    await db.projects.update_one(
        {"id": project_id, "$or": [{"daily_reports": {"$exists": False}}, {"daily_reports": None}]},
        {"$set": {"daily_reports": []}},
    )

    now = datetime.now(timezone.utc).isoformat()
    report_data = body.model_dump()
    report_data["id"] = f"rep_{uuid.uuid4().hex[:10]}"
    # AUTO PUBLISH — no PM approval
    report_data["is_approved"] = True
    report_data["approved_at"] = now
    report_data["approved_by"] = "System"
    report_data["submitted_at"] = now
    report_data["submitted_by"] = "Site Engineer"

    await db.projects.update_one(
        {"id": project_id},
        {
            "$push": {"daily_reports": {"$each": [report_data], "$position": 0}},
            "$set": {"updated_at": now},
        },
    )

    await _log_activity(
        project_id,
        "Site Engineer",
        f"Published Daily Report for {body.date}",
        "Progress",
    )
    # Notify client immediately
    asyncio.create_task(
        _push_notification(
            project_id,
            "New Daily Progress Report",
            f"Your site update for {body.date} is published.",
            "/portal/progress",
            "progress",
        )
    )
    return {"success": True, "report": report_data}

@router.put("/admin/projects/{project_id}/daily-reports/{report_id}", dependencies=[Depends(require_admin)])
async def update_daily_report(project_id: str, report_id: str, body: DailyReportUpdateBody):
    p = await db.projects.find_one({"id": project_id}, {"id": 1, "daily_reports": 1})
    if not p: raise HTTPException(status_code=404, detail="Project not found")
    reports = p.get("daily_reports") or []
    idx = next((i for i, r in enumerate(reports) if r["id"] == report_id), -1)
    if idx == -1: raise HTTPException(status_code=404, detail="Report not found")

    update_data = {k: v for k, v in body.model_dump().items() if v is not None}
    now = datetime.now(timezone.utc).isoformat()
    for key, value in update_data.items(): reports[idx][key] = value
    reports[idx]["updated_at"] = now
    reports[idx]["is_approved"] = True
    reports[idx]["updated_at"] = now

    await db.projects.update_one({"id": project_id}, {"$set": {"daily_reports": reports, "updated_at": now}})
    return {"success": True, "report": reports[idx]}

@router.patch("/admin/projects/{project_id}/daily-reports/{report_id}/approve", dependencies=[Depends(require_admin)])
async def approve_daily_report(project_id: str, report_id: str):
    p = await db.projects.find_one({"id": project_id}, {"id": 1, "daily_reports": 1})
    if not p: raise HTTPException(status_code=404, detail="Project not found")
    reports = p.get("daily_reports") or []
    idx = next((i for i, r in enumerate(reports) if r["id"] == report_id), -1)
    if idx == -1: raise HTTPException(status_code=404, detail="Report not found")

    now = datetime.now(timezone.utc).isoformat()
    reports[idx]["is_approved"] = True
    reports[idx]["approved_at"] = now
    reports[idx]["approved_by"] = "Project Manager"

    await db.projects.update_one({"id": project_id}, {"$set": {"daily_reports": reports, "updated_at": now}})
    await _log_activity(project_id, "Project Manager", f"Approved Daily Report for {reports[idx]['date']}", "Progress")
    asyncio.create_task(_push_notification(project_id, "New Daily Progress Report", f"Your site update for {reports[idx]['date']} is published.", "/portal/progress", "progress"))
    return {"success": True, "report": reports[idx]}

@router.patch("/admin/projects/{project_id}/daily-reports/{report_id}/unapprove", dependencies=[Depends(require_admin)])
async def unapprove_daily_report(project_id: str, report_id: str):
    p = await db.projects.find_one({"id": project_id}, {"id": 1, "daily_reports": 1})
    if not p: raise HTTPException(status_code=404, detail="Project not found")
    reports = p.get("daily_reports") or []
    idx = next((i for i, r in enumerate(reports) if r["id"] == report_id), -1)
    if idx == -1: raise HTTPException(status_code=404, detail="Report not found")
    reports[idx]["is_approved"] = False
    await db.projects.update_one({"id": project_id}, {"$set": {"daily_reports": reports, "updated_at": datetime.now(timezone.utc).isoformat()}})
    return {"success": True}

@router.delete("/admin/projects/{project_id}/daily-reports/{report_id}", dependencies=[Depends(require_admin)])
async def delete_daily_report(project_id: str, report_id: str):
    p = await db.projects.find_one({"id": project_id}, {"id": 1, "daily_reports": 1})
    if not p: raise HTTPException(status_code=404, detail="Project not found")
    await db.projects.update_one({"id": project_id}, {"$pull": {"daily_reports": {"id": report_id}}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}})
    return {"success": True}