"""Premium PDF brochure generator for ConstructONS packages using ReportLab."""
from io import BytesIO
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm, cm
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle,
    KeepTogether, Image, HRFlowable,
)
from reportlab.pdfgen import canvas

# Brand palette
ORANGE = colors.HexColor("#FF5A00")
NAVY = colors.HexColor("#0B1220")
NAVY_SOFT = colors.HexColor("#111A2E")
GREY = colors.HexColor("#64748B")
LIGHT = colors.HexColor("#F1F5F9")
LINE = colors.HexColor("#E2E8F0")
WHITE = colors.white
GREEN = colors.HexColor("#22C55E")


def _styles():
    ss = getSampleStyleSheet()
    return {
        "h1": ParagraphStyle("h1", parent=ss["Heading1"], fontName="Helvetica-Bold",
                              fontSize=26, leading=30, textColor=NAVY, spaceAfter=8),
        "h2": ParagraphStyle("h2", parent=ss["Heading2"], fontName="Helvetica-Bold",
                              fontSize=16, leading=20, textColor=NAVY, spaceBefore=12, spaceAfter=6),
        "h3": ParagraphStyle("h3", parent=ss["Heading3"], fontName="Helvetica-Bold",
                              fontSize=12, leading=16, textColor=ORANGE, spaceBefore=8, spaceAfter=4),
        "body": ParagraphStyle("body", parent=ss["BodyText"], fontName="Helvetica",
                                fontSize=10, leading=14, textColor=NAVY, alignment=TA_JUSTIFY),
        "small": ParagraphStyle("small", parent=ss["BodyText"], fontName="Helvetica",
                                 fontSize=8.5, leading=12, textColor=GREY),
        "tiny": ParagraphStyle("tiny", parent=ss["BodyText"], fontName="Helvetica",
                                fontSize=7.5, leading=10, textColor=GREY),
        "eyebrow": ParagraphStyle("eyebrow", parent=ss["BodyText"], fontName="Helvetica-Bold",
                                   fontSize=8, textColor=ORANGE, spaceAfter=2),
        "cover_title": ParagraphStyle("cover_title", parent=ss["Heading1"], fontName="Helvetica-Bold",
                                       fontSize=42, leading=46, textColor=WHITE, alignment=TA_LEFT),
        "cover_sub": ParagraphStyle("cover_sub", parent=ss["BodyText"], fontName="Helvetica",
                                     fontSize=12, textColor=colors.HexColor("#C4C9D3"),
                                     alignment=TA_LEFT, leading=18),
        "price": ParagraphStyle("price", parent=ss["Heading1"], fontName="Helvetica-Bold",
                                 fontSize=32, leading=36, textColor=ORANGE),
    }


def _draw_logo(c, x, y, size=20):
    """Draw the ConstructONS 'C' logo mark."""
    r = size / 2
    c.setFillColor(ORANGE)
    c.circle(x + r, y + r, r, fill=1, stroke=0)
    # Small white C (approximation)
    c.setFillColor(WHITE)
    c.setStrokeColor(WHITE)
    c.setLineWidth(size * 0.15)
    from reportlab.graphics.shapes import Path
    # simple arc: draw a wedge as text
    c.setFont("Helvetica-Bold", size * 0.75)
    tw = c.stringWidth("C", "Helvetica-Bold", size * 0.75)
    c.drawString(x + (size - tw) / 2, y + size * 0.22, "C")


def _draw_header_footer(pkg_name):
    def draw(canvas_obj, doc):
        canvas_obj.saveState()
        # Header
        canvas_obj.setStrokeColor(LINE)
        canvas_obj.setLineWidth(0.5)
        canvas_obj.line(15 * mm, A4[1] - 15 * mm, A4[0] - 15 * mm, A4[1] - 15 * mm)

        _draw_logo(canvas_obj, 15 * mm, A4[1] - 12 * mm, size=10)
        canvas_obj.setFillColor(NAVY)
        canvas_obj.setFont("Helvetica-Bold", 9)
        canvas_obj.drawString(28 * mm, A4[1] - 9 * mm, "ConstructONS")
        canvas_obj.setFillColor(GREY)
        canvas_obj.setFont("Helvetica", 7)
        canvas_obj.drawString(28 * mm, A4[1] - 12.5 * mm, "EVERYTHING CONSTRUCTION. ALWAYS ON.")

        canvas_obj.setFillColor(GREY)
        canvas_obj.setFont("Helvetica", 8)
        canvas_obj.drawRightString(A4[0] - 15 * mm, A4[1] - 10 * mm, pkg_name)

        # Footer
        canvas_obj.setStrokeColor(LINE)
        canvas_obj.line(15 * mm, 15 * mm, A4[0] - 15 * mm, 15 * mm)
        canvas_obj.setFont("Helvetica", 7.5)
        canvas_obj.setFillColor(GREY)
        canvas_obj.drawString(15 * mm, 10 * mm, "© ConstructONS Pvt. Ltd. — This brochure is indicative. Final specs per signed agreement.")
        canvas_obj.drawRightString(A4[0] - 15 * mm, 10 * mm, f"Page {canvas_obj.getPageNumber()}")
        canvas_obj.restoreState()
    return draw


def _cover_page(canvas_obj, doc):
    """Full-bleed cover page."""
    W, H = A4
    # Background
    canvas_obj.setFillColor(NAVY)
    canvas_obj.rect(0, 0, W, H, fill=1, stroke=0)

    # Orange accent bar
    canvas_obj.setFillColor(ORANGE)
    canvas_obj.rect(0, H - 8, W, 8, fill=1, stroke=0)

    # Logo top-left
    _draw_logo(canvas_obj, 20 * mm, H - 40 * mm, size=18)
    canvas_obj.setFillColor(WHITE)
    canvas_obj.setFont("Helvetica-Bold", 14)
    canvas_obj.drawString(43 * mm, H - 32 * mm, "ConstructONS")
    canvas_obj.setFillColor(colors.HexColor("#98A2B3"))
    canvas_obj.setFont("Helvetica", 8)
    canvas_obj.drawString(43 * mm, H - 37 * mm, "EVERYTHING CONSTRUCTION. ALWAYS ON.")

    canvas_obj.setFillColor(colors.HexColor("#98A2B3"))
    canvas_obj.setFont("Helvetica-Bold", 9)
    canvas_obj.drawRightString(W - 20 * mm, H - 32 * mm, "BUILD PACKAGE BROCHURE")


def _cover_content(pkg, styles, personalization=None):
    story = []
    story.append(Spacer(1, 20 * mm))
    story.append(Paragraph(f"<font color='#FF5A00'>{pkg.get('name','Package').upper()}</font>", styles["eyebrow"]))
    story.append(Spacer(1, 8))
    story.append(Paragraph(f"Build your dream home<br/>with confidence & clarity.", styles["cover_title"]))
    story.append(Spacer(1, 14))
    story.append(Paragraph(pkg.get("tagline", ""), styles["cover_sub"]))
    story.append(Spacer(1, 6))
    story.append(Paragraph(pkg.get("description", ""), styles["cover_sub"]))
    story.append(Spacer(1, 20))

    # Personalisation card
    if personalization and (personalization.get("customer_name") or personalization.get("quote_ref")):
        prep_rows = []
        if personalization.get("customer_name"):
            prep_rows.append(["PREPARED FOR", personalization["customer_name"].upper()])
        if personalization.get("quote_ref"):
            prep_rows.append(["QUOTE REFERENCE", personalization["quote_ref"]])
        if personalization.get("customer_city"):
            prep_rows.append(["CITY", personalization["customer_city"]])
        prep_rows.append(["DATE", datetime.now().strftime("%d %b %Y")])
        prep_rows.append(["VALIDITY", "30 days from date of issue"])

        prep_table = Table(prep_rows, colWidths=[40 * mm, 90 * mm], hAlign="LEFT")
        prep_table.setStyle(TableStyle([
            ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (0, -1), 7.5),
            ("TEXTCOLOR", (0, 0), (0, -1), ORANGE),
            ("FONTNAME", (1, 0), (1, -1), "Helvetica-Bold"),
            ("FONTSIZE", (1, 0), (1, -1), 10),
            ("TEXTCOLOR", (1, 0), (1, -1), WHITE),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 12),
            ("RIGHTPADDING", (0, 0), (-1, -1), 12),
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#111A2E")),
            ("LINEBELOW", (0, 0), (-1, -2), 0.3, colors.HexColor("#2A3441")),
            ("BOX", (0, 0), (-1, -1), 1.4, ORANGE),
            ("ROUNDEDCORNERS", [6, 6, 6, 6]),
        ]))
        story.append(prep_table)
        story.append(Spacer(1, 14))

    # Price + key stats
    unit = pkg.get("price_unit") or ""
    price_html = f"<font color='#FF5A00'><b>{pkg.get('price_display','—')}</b></font><font color='#C4C9D3' size='12'> {unit}</font>"
    story.append(Paragraph(price_html, styles["price"]))
    story.append(Spacer(1, 16))

    stats = [
        ["Timeline", pkg.get("timeline_months") or "8–10 months"],
        ["Warranty", f"Up to {pkg.get('warranty_years',1)} years"],
        ["Min. Area", f"{pkg.get('min_area_sqft', 800)} Sq.ft"],
        ["AI Platform", "Included"],
    ]
    table = Table(stats, colWidths=[35 * mm, 60 * mm], hAlign="LEFT")
    table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#98A2B3")),
        ("TEXTCOLOR", (1, 0), (1, -1), WHITE),
        ("FONTNAME", (1, 0), (1, -1), "Helvetica-Bold"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("LINEBELOW", (0, 0), (-1, -2), 0.4, colors.HexColor("#2A3441")),
    ]))
    story.append(table)
    story.append(Spacer(1, 20 * mm))
    return story


def _section_title(text, styles):
    return [
        Paragraph(f"<font color='#FF5A00'><b>{text.upper()}</b></font>", styles["eyebrow"]),
        HRFlowable(width="12%", thickness=1.4, color=ORANGE, spaceBefore=2, spaceAfter=6),
    ]


def _spec_category_table(cat):
    """Build a table for a single spec category."""
    rows = [["Item", "Specification", "Brand", "Notes"]]
    for it in cat.get("items", []):
        rows.append([
            it.get("spec", ""),
            it.get("value", ""),
            it.get("brand", "") or "",
            it.get("warranty") or it.get("notes") or "",
        ])
    tbl = Table(rows, colWidths=[38 * mm, 68 * mm, 34 * mm, 40 * mm], repeatRows=1)
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 8.5),
        ("ALIGN", (0, 0), (-1, 0), "LEFT"),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 1), (-1, -1), 8.5),
        ("TEXTCOLOR", (0, 1), (-1, -1), NAVY),
        ("TEXTCOLOR", (0, 1), (0, -1), NAVY),
        ("FONTNAME", (0, 1), (0, -1), "Helvetica-Bold"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT]),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("BOX", (0, 0), (-1, -1), 0.4, LINE),
        ("INNERGRID", (0, 0), (-1, -1), 0.3, LINE),
    ]))
    return tbl


def _bullet_list(items, styles, use_check=True):
    bullets = []
    for it in items:
        icon = "✔" if use_check else "•"
        bullets.append(Paragraph(f"<font color='#FF5A00'><b>{icon}</b></font>&nbsp;&nbsp;{it}", styles["body"]))
        bullets.append(Spacer(1, 2))
    return bullets


def _addons_table(addons):
    rows = [["Add-on", "Description", "Price"]]
    for a in addons:
        rows.append([
            a.get("name", ""),
            a.get("description", ""),
            f"{a.get('price','')}\n{a.get('unit','')}",
        ])
    tbl = Table(rows, colWidths=[46 * mm, 90 * mm, 34 * mm], repeatRows=1)
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 1), (-1, -1), 9),
        ("FONTNAME", (0, 1), (0, -1), "Helvetica-Bold"),
        ("TEXTCOLOR", (2, 1), (2, -1), ORANGE),
        ("FONTNAME", (2, 1), (2, -1), "Helvetica-Bold"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT]),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("BOX", (0, 0), (-1, -1), 0.4, LINE),
        ("INNERGRID", (0, 0), (-1, -1), 0.3, LINE),
    ]))
    return tbl


def _payment_schedule_table(schedule):
    rows = [["Milestone", "% Payable", "Description"]]
    for m in schedule:
        rows.append([m.get("milestone", ""), f"{m.get('percentage',0)}%", m.get("description", "")])
    tbl = Table(rows, colWidths=[50 * mm, 26 * mm, 94 * mm], repeatRows=1)
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("ALIGN", (1, 0), (1, -1), "CENTER"),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTNAME", (0, 1), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (1, 1), (1, -1), "Helvetica-Bold"),
        ("TEXTCOLOR", (1, 1), (1, -1), ORANGE),
        ("FONTSIZE", (0, 1), (-1, -1), 9),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT]),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("BOX", (0, 0), (-1, -1), 0.4, LINE),
        ("INNERGRID", (0, 0), (-1, -1), 0.3, LINE),
    ]))
    return tbl


def generate_brochure(package: dict, settings: dict = None, personalization: dict = None) -> bytes:
    """Generate a full PDF brochure for a package. Returns raw PDF bytes.

    personalization = {
        'customer_name': 'Ramesh Kumar',
        'quote_ref': 'CONS-2026-BASIC-042',
        'customer_city': 'Bangalore',
    }
    """
    settings = settings or {}
    buf = BytesIO()
    styles = _styles()

    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=15 * mm, rightMargin=15 * mm,
        topMargin=22 * mm, bottomMargin=18 * mm,
        title=f"{package.get('name','Package')} — ConstructONS Brochure",
        author="ConstructONS",
        subject=f"{package.get('name','')} Package Brochure",
    )

    story = []

    # ---------- Cover ----------
    story.extend(_cover_content(package, styles, personalization=personalization))
    story.append(PageBreak())

    # ---------- Overview ----------
    story.extend(_section_title(package.get("overview_title") or "Package Overview", styles))
    story.append(Paragraph(f"<b>{package.get('name','')}</b> — {package.get('tagline','')}", styles["h2"]))
    story.append(Spacer(1, 4))
    story.append(Paragraph(package.get("description", ""), styles["body"]))
    story.append(Spacer(1, 10))

    # Highlights
    story.append(Paragraph(package.get("highlights_eyebrow") or "Key Highlights", styles["h3"]))
    story.extend(_bullet_list(package.get("highlights", []), styles))
    story.append(Spacer(1, 8))

    # ---------- Detailed Specifications ----------
    spec_cats = package.get("spec_categories", [])
    if spec_cats:
        story.append(PageBreak())
        story.extend(_section_title(package.get("specs_title") or "Detailed Specifications", styles))
        story.append(Paragraph(
            package.get("specs_subtitle") or (
                "Every material, brand and quality standard used in your home is documented below. "
                "Actual delivered brand may vary within the same or higher tier as per availability."
            ),
            styles["small"],
        ))
        story.append(Spacer(1, 10))
        for i, cat in enumerate(spec_cats):
            story.append(Paragraph(cat.get("name", ""), styles["h3"]))
            story.append(_spec_category_table(cat))
            story.append(Spacer(1, 8))

    # ---------- Scope of Work ----------
    if package.get("scope_of_work"):
        story.append(PageBreak())
        story.extend(_section_title(package.get("scope_title") or "Scope of Work", styles))
        story.append(Paragraph("What's included in this package (turnkey unless noted):", styles["small"]))
        story.append(Spacer(1, 6))
        story.extend(_bullet_list(package["scope_of_work"], styles))

    # ---------- Exclusions ----------
    if package.get("exclusions"):
        story.append(Spacer(1, 12))
        story.extend(_section_title(package.get("exclusions_title") or "Exclusions", styles))
        story.append(Paragraph(
            "The following are <b>not</b> included in the package price and are quoted separately:",
            styles["small"],
        ))
        story.append(Spacer(1, 6))
        story.extend(_bullet_list(package["exclusions"], styles, use_check=False))

    # ---------- Add-ons ----------
    if package.get("addons"):
        story.append(PageBreak())
        story.extend(_section_title(package.get("addons_title") or "Available Add-ons & Upgrades", styles))
        story.append(Paragraph(
            "Personalise your home with these popular upgrades. Prices are indicative.",
            styles["small"],
        ))
        story.append(Spacer(1, 6))
        story.append(_addons_table(package["addons"]))

    # ---------- Payment schedule ----------
    if package.get("payment_schedule"):
        story.append(Spacer(1, 14))
        story.extend(_section_title(package.get("schedule_title") or "Payment Schedule", styles))
        story.append(Paragraph(
            "Payments are milestone-based. You only pay after each stage is verified & signed off.",
            styles["small"],
        ))
        story.append(Spacer(1, 6))
        story.append(_payment_schedule_table(package["payment_schedule"]))

    # ---------- FAQs ----------
    if package.get("package_faqs"):
        story.append(PageBreak())
        story.extend(_section_title(package.get("faqs_title") or "Frequently Asked Questions", styles))
        for f in package["package_faqs"]:
            story.append(Paragraph(f"<b>{f.get('question','')}</b>", styles["h3"]))
            story.append(Paragraph(f.get("answer", ""), styles["body"]))
            story.append(Spacer(1, 8))

    # ---------- CTA & Contact ----------
    story.append(PageBreak())
    story.extend(_section_title("Ready to build your dream home?", styles))
    story.append(Paragraph(
        "Book a free consultation with our team. We'll answer every question, walk you through the plan, and share a fixed itemised quote — no obligations, no spam.",
        styles["body"],
    ))
    story.append(Spacer(1, 14))

    contact_rows = [
        ["Phone", settings.get("phone", "+91 98765 43210")],
        ["WhatsApp", settings.get("whatsapp", "+91 98765 43210")],
        ["Email", settings.get("email", "hello@constructons.in")],
        ["Website", "constructons.in"],
        ["Office", settings.get("address", "Bangalore, Karnataka, India")],
    ]
    tbl = Table(contact_rows, colWidths=[30 * mm, 130 * mm])
    tbl.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("TEXTCOLOR", (0, 0), (0, -1), ORANGE),
        ("TEXTCOLOR", (1, 0), (1, -1), NAVY),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("LINEBELOW", (0, 0), (-1, -2), 0.3, LINE),
    ]))
    story.append(tbl)

    story.append(Spacer(1, 20))
    story.append(Paragraph(
        f"<font color='#94A3B8'>Brochure generated on {datetime.now().strftime('%d %b %Y')} — subject to revisions.</font>",
        styles["small"],
    ))

    # ---------- Build ----------
    def on_first_page(canvas_obj, doc):
        _cover_page(canvas_obj, doc)
        canvas_obj.saveState()
        canvas_obj.setFillColor(GREY)
        canvas_obj.setFont("Helvetica", 7.5)
        canvas_obj.drawString(15 * mm, 10 * mm, "© ConstructONS Pvt. Ltd. — Everything Construction. Always On.")
        canvas_obj.drawRightString(A4[0] - 15 * mm, 10 * mm, "Confidential — Customer Brochure")
        canvas_obj.restoreState()

    doc.build(
        story,
        onFirstPage=on_first_page,
        onLaterPages=_draw_header_footer(package.get("name", "Package")),
    )
    return buf.getvalue()
