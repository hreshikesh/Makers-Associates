"""Client Proposal PDF generator.

Produces a branded 7-page proposal for a ConstructONS customer using
ReportLab. Shares brochure.py styling (heading colors, table styles) to
keep visual consistency with the marketing brochure.

Signature: generate_proposal_pdf(proposal_dict, package_dict, site_settings_dict) -> bytes
"""
from io import BytesIO
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle,
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT

BRAND_NAVY = colors.HexColor("#0B1B32")
BRAND_ORANGE = colors.HexColor("#FF5A00")
BRAND_BG = colors.HexColor("#F5F5F0")
GREY = colors.HexColor("#666666")


def _styles():
    ss = getSampleStyleSheet()
    ss.add(ParagraphStyle(name="Cover", parent=ss["Title"], fontSize=32, leading=38,
                          textColor=BRAND_NAVY, alignment=TA_LEFT, spaceBefore=24))
    ss.add(ParagraphStyle(name="CoverSub", parent=ss["Normal"], fontSize=14,
                          textColor=BRAND_ORANGE, alignment=TA_LEFT, spaceBefore=8))
    ss.add(ParagraphStyle(name="H1", parent=ss["Heading1"], fontSize=22, leading=28,
                          textColor=BRAND_NAVY, spaceAfter=8))
    ss.add(ParagraphStyle(name="H2Brand", parent=ss["Heading2"], fontSize=16, leading=22,
                          textColor=BRAND_NAVY, spaceBefore=10, spaceAfter=6))
    ss.add(ParagraphStyle(name="Body2", parent=ss["Normal"], fontSize=10.5, leading=15,
                          textColor=BRAND_NAVY, spaceAfter=4))
    ss.add(ParagraphStyle(name="Small2", parent=ss["Normal"], fontSize=9, leading=12,
                          textColor=GREY))
    ss.add(ParagraphStyle(name="Eyebrow", parent=ss["Normal"], fontSize=9, leading=12,
                          textColor=BRAND_ORANGE, spaceAfter=2))
    return ss


def _header_footer(company_name):
    def draw(canvas_obj, doc):
        canvas_obj.saveState()
        # Top brand strip
        canvas_obj.setFillColor(BRAND_NAVY)
        canvas_obj.rect(0, A4[1] - 15 * mm, A4[0], 15 * mm, fill=1, stroke=0)
        canvas_obj.setFillColor(colors.white)
        canvas_obj.setFont("Helvetica-Bold", 10)
        canvas_obj.drawString(20 * mm, A4[1] - 10 * mm, company_name)
        canvas_obj.setFont("Helvetica", 8)
        canvas_obj.drawRightString(A4[0] - 20 * mm, A4[1] - 10 * mm,
                                   "CLIENT PROPOSAL — CONFIDENTIAL")
        # Footer
        canvas_obj.setFillColor(BRAND_NAVY)
        canvas_obj.setFont("Helvetica", 8)
        canvas_obj.drawString(20 * mm, 12 * mm,
                              f"Page {doc.page} · Generated {datetime.now(timezone.utc).strftime('%d %b %Y')}")
        canvas_obj.drawRightString(A4[0] - 20 * mm, 12 * mm, "constructons.com")
        canvas_obj.restoreState()
    return draw


def _kv_table(rows: List[List[str]]) -> Table:
    tbl = Table(rows, colWidths=[55 * mm, 110 * mm])
    tbl.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("FONT", (0, 0), (0, -1), "Helvetica-Bold", 10),
        ("FONT", (1, 0), (1, -1), "Helvetica", 10),
        ("TEXTCOLOR", (0, 0), (0, -1), GREY),
        ("TEXTCOLOR", (1, 0), (1, -1), BRAND_NAVY),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LINEBELOW", (0, 0), (-1, -1), 0.4, colors.HexColor("#E5E7EB")),
    ]))
    return tbl


def _bullet_list(items: List[str], styles, check=True) -> List:
    out = []
    marker = "✓" if check else "✗"
    for it in items:
        if not it:
            continue
        out.append(Paragraph(f'<font color="{"#22C55E" if check else "#EF4444"}">{marker}</font>  {it}', styles["Body2"]))
    return out


def _rupees(n) -> str:
    try:
        return f"₹{float(n):,.0f}"
    except Exception:
        return "₹0"


def generate_proposal_pdf(proposal: dict, package: dict, settings: dict) -> bytes:
    buf = BytesIO()
    styles = _styles()
    company = (settings.get("company_name") or "ConstructONS")
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=20 * mm, rightMargin=20 * mm,
        topMargin=25 * mm, bottomMargin=20 * mm,
        title=f"{proposal.get('ref_number') or 'Proposal'} — {proposal.get('client_name','')}",
    )
    story: List[Any] = []

    ref = proposal.get("ref_number") or "—"
    client = proposal.get("client_name") or "Valued Customer"
    today = datetime.now(timezone.utc)
    valid_until = today + timedelta(days=proposal.get("valid_days", 30) or 30)

    # ---------- Page 1: Cover ----------
    story.append(Spacer(1, 30 * mm))
    story.append(Paragraph("HOME CONSTRUCTION PROPOSAL", styles["Eyebrow"]))
    story.append(Paragraph(f"Prepared for<br/><b>{client}</b>", styles["Cover"]))
    story.append(Paragraph(proposal.get("package_name") or (package.get("name") or "Custom Home"), styles["CoverSub"]))
    story.append(Spacer(1, 40 * mm))
    story.append(_kv_table([
        ["Reference", ref],
        ["Date of Issue", today.strftime("%d %B %Y")],
        ["Valid Until", valid_until.strftime("%d %B %Y")],
        ["Prepared By", proposal.get("prepared_by") or company],
    ]))
    story.append(PageBreak())

    # ---------- Page 2: Client + Site + Project ----------
    story.append(Paragraph("Project Brief", styles["H1"]))
    if proposal.get("intro_note"):
        story.append(Paragraph(proposal["intro_note"], styles["Body2"]))
        story.append(Spacer(1, 8))
    story.append(Paragraph("Client Details", styles["H2Brand"]))
    story.append(_kv_table([
        ["Name", client],
        ["Phone", proposal.get("client_phone") or "—"],
        ["Email", proposal.get("client_email") or "—"],
        ["Address", proposal.get("client_address") or "—"],
    ]))
    story.append(Spacer(1, 10))
    story.append(Paragraph("Site Details", styles["H2Brand"]))
    story.append(_kv_table([
        ["Site Address", proposal.get("site_address") or "—"],
        ["Plot Area", f"{proposal.get('plot_area') or '—'} sq.ft" if proposal.get("plot_area") else "—"],
        ["Floors", proposal.get("floors") or "—"],
        ["Built-up Area", f"{proposal.get('built_up_area') or 0:,.0f} sq.ft"],
        ["Expected Start", proposal.get("expected_start") or "—"],
        ["Expected Completion", proposal.get("expected_completion") or proposal.get("package_timeline") or "—"],
    ]))
    story.append(PageBreak())

    # ---------- Page 3: Package & Pricing ----------
    story.append(Paragraph("Package & Pricing", styles["H1"]))
    story.append(Paragraph(
        f"You have selected the <b>{proposal.get('package_name') or (package.get('name') or 'Package')}</b> "
        f"with a per sq.ft rate of {_rupees(proposal.get('package_price_per_sqft') or 0)}.",
        styles["Body2"],
    ))
    area = float(proposal.get("built_up_area") or 0)
    rate = float(proposal.get("package_price_per_sqft") or 0)
    base = area * rate
    addons = proposal.get("addons_selected") or []
    addon_total = sum(float(a.get("price") or 0) for a in addons)
    subtotal = base + addon_total
    discount = float(proposal.get("discount_amount") or 0)
    net = max(0, subtotal - discount)
    gst_pct = float(proposal.get("gst_percent") or 18)
    gst_amt = net * gst_pct / 100
    grand = net + gst_amt

    # Pricing table
    rows = [
        ["Line Item", "Detail", "Amount"],
        [f"{proposal.get('package_name','Package')}", f"{area:,.0f} sq.ft × {_rupees(rate)}", _rupees(base)],
    ]
    for a in addons:
        rows.append([a.get("name", "Add-on"), a.get("description") or (a.get("unit") or ""), _rupees(a.get("price") or 0)])
    rows.append(["Subtotal", "", _rupees(subtotal)])
    if discount > 0:
        label = proposal.get("discount_label") or "Discount"
        rows.append([label, "", f"− {_rupees(discount)}"])
        rows.append(["Net", "", _rupees(net)])
    rows.append([f"GST @ {gst_pct:g}%", "", _rupees(gst_amt)])
    rows.append(["Grand Total", "", _rupees(grand)])

    pricing_tbl = Table(rows, colWidths=[65 * mm, 65 * mm, 40 * mm])
    pricing_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), BRAND_NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONT", (0, 0), (-1, 0), "Helvetica-Bold", 10),
        ("FONT", (0, 1), (-1, -1), "Helvetica", 10),
        ("BACKGROUND", (0, -1), (-1, -1), BRAND_ORANGE),
        ("TEXTCOLOR", (0, -1), (-1, -1), colors.white),
        ("FONT", (0, -1), (-1, -1), "Helvetica-Bold", 11),
        ("ALIGN", (2, 0), (2, -1), "RIGHT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#E5E7EB")),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
    ]))
    story.append(Spacer(1, 6))
    story.append(pricing_tbl)
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        "All figures are indicative and finalised at booking. GST is charged on service value only.",
        styles["Small2"],
    ))
    story.append(PageBreak())

    # ---------- Page 4: Scope + Exclusions ----------
    story.append(Paragraph("What's Included", styles["H1"]))
    scope = proposal.get("scope_of_work") or package.get("scope_of_work") or []
    if scope:
        story.extend(_bullet_list(scope, styles, check=True))
    else:
        story.append(Paragraph("Scope will be finalised on booking.", styles["Small2"]))
    story.append(Spacer(1, 14))
    story.append(Paragraph("Exclusions", styles["H1"]))
    excl = proposal.get("exclusions") or package.get("exclusions") or []
    if excl:
        story.extend(_bullet_list(excl, styles, check=False))
    else:
        story.append(Paragraph("None.", styles["Small2"]))
    story.append(PageBreak())

    # ---------- Page 5: Specifications ----------
    story.append(Paragraph("Material Specifications", styles["H1"]))
    story.append(Paragraph(
        "Exact brands and grades of every material used in your home.",
        styles["Small2"],
    ))
    story.append(Spacer(1, 8))
    for cat in (package.get("spec_categories") or [])[:12]:
        story.append(Paragraph(cat.get("name", ""), styles["H2Brand"]))
        rows = [["Spec", "Value", "Brand", "Warranty"]]
        for it in (cat.get("items") or []):
            rows.append([
                it.get("spec", ""), it.get("value", ""),
                it.get("brand", "—"), it.get("warranty", "—"),
            ])
        if len(rows) > 1:
            t = Table(rows, colWidths=[38 * mm, 55 * mm, 42 * mm, 35 * mm])
            t.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), BRAND_BG),
                ("FONT", (0, 0), (-1, 0), "Helvetica-Bold", 9),
                ("FONT", (0, 1), (-1, -1), "Helvetica", 9),
                ("TEXTCOLOR", (0, 0), (-1, 0), BRAND_NAVY),
                ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#E5E7EB")),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]))
            story.append(t)
            story.append(Spacer(1, 6))
    story.append(PageBreak())

    # ---------- Page 6: Payment Schedule + Timeline ----------
    story.append(Paragraph("Payment Schedule", styles["H1"]))
    story.append(Paragraph(
        "Payments are strictly milestone-based. You only pay once a stage is verified & signed off.",
        styles["Small2"],
    ))
    story.append(Spacer(1, 6))
    schedule = proposal.get("payment_schedule") or package.get("payment_schedule") or []
    if schedule:
        rows = [["Milestone", "%", "Description", "Est. Amount"]]
        for s in schedule:
            pct = float(s.get("percentage") or 0)
            rows.append([s.get("milestone", ""), f"{pct:g}%", s.get("description", ""), _rupees(grand * pct / 100)])
        t = Table(rows, colWidths=[55 * mm, 15 * mm, 65 * mm, 35 * mm])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), BRAND_NAVY),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONT", (0, 0), (-1, 0), "Helvetica-Bold", 9.5),
            ("FONT", (0, 1), (-1, -1), "Helvetica", 9.5),
            ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#E5E7EB")),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("ALIGN", (1, 0), (1, -1), "CENTER"),
            ("ALIGN", (3, 0), (3, -1), "RIGHT"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ]))
        story.append(t)
    else:
        story.append(Paragraph("Payment schedule will be finalised at booking.", styles["Small2"]))
    story.append(PageBreak())

    # ---------- Page 7: Terms + Signature ----------
    story.append(Paragraph("Terms & Conditions", styles["H1"]))
    default_terms = (
        f"1. This proposal is valid for {proposal.get('valid_days', 30)} days from the date of issue.<br/>"
        "2. Prices are indicative and confirmed at time of booking.<br/>"
        "3. Payments are milestone-based; each milestone requires signed customer approval before the next stage begins.<br/>"
        f"4. Warranty of {proposal.get('package_warranty_years') or 10} years on structure, waterproofing and workmanship.<br/>"
        "5. Any change in scope after booking is quoted separately as a variation order.<br/>"
        "6. Municipal approvals, land-related legal fees and utility deposits are excluded.<br/>"
        "7. This proposal does not constitute a binding contract until a formal work order is signed by both parties."
    )
    story.append(Paragraph(proposal.get("terms") or default_terms, styles["Body2"]))
    story.append(Spacer(1, 30))
    sign_tbl = Table([
        ["For ConstructONS", "For Client"],
        ["\n\n_________________________", "\n\n_________________________"],
        [company, client],
    ], colWidths=[80 * mm, 80 * mm])
    sign_tbl.setStyle(TableStyle([
        ("FONT", (0, 0), (-1, 0), "Helvetica-Bold", 10),
        ("FONT", (0, 2), (-1, 2), "Helvetica", 10),
        ("TEXTCOLOR", (0, 0), (-1, -1), BRAND_NAVY),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(sign_tbl)

    doc.build(story, onFirstPage=_header_footer(company), onLaterPages=_header_footer(company))
    buf.seek(0)
    return buf.getvalue()
