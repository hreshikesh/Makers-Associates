import io
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


def draw_watermark_and_header(canvas, doc):
    """Same watermark + logo + header as invoice, but title = RECEIPT."""
    canvas.saveState()

    # --- WATERMARK ---
    canvas.setFont("Helvetica-Bold", 70)
    canvas.setFillAlpha(0.03)
    canvas.setFillColorRGB(0, 0, 0)
    canvas.translate(300, 400)
    canvas.rotate(45)
    canvas.drawCentredString(0, 0, "CONSTRUCTONS")
    canvas.restoreState()

    # --- HEADER BRANDING ---
    canvas.saveState()

    start_x = 40
    y_pos = 790
    font_name = "Helvetica-Bold"
    font_size = 24

    # 1. "CONSTRUCT" text (Black / Dark Navy)
    canvas.setFont(font_name, font_size)
    canvas.setFillColorRGB(0, 0.06, 0.11)
    canvas.drawString(start_x, y_pos, "YOUR")

    construct_width = canvas.stringWidth("YOUR", font_name, font_size)
    o_width = canvas.stringWidth("O", font_name, font_size)

    o_center_x = start_x + construct_width + (o_width / 2)
    o_center_y = y_pos + 8.5
    o_radius = 8.0

    # 2. Power Button "O" (Saffron / Orange)
    # canvas.setStrokeColorRGB(1.0, 0.35, 0)
    # canvas.setLineWidth(2.5)
    # canvas.setLineCap(1)

    # canvas.arc(
    #     o_center_x - o_radius,
    #     o_center_y - o_radius,
    #     o_center_x + o_radius,
    #     o_center_y + o_radius,
    #     120,
    #     300,
    # )
    # canvas.line(
    #     o_center_x, o_center_y + 1, o_center_x, o_center_y + o_radius + 3
    # )

    # 3. "NS" text (Saffron / Orange)
    ns_start_x = start_x + construct_width + o_width
    canvas.setFont(font_name, font_size)
    canvas.setFillColorRGB(1.0, 0.35, 0)
    canvas.drawString(ns_start_x, y_pos, "Brand")

    # 4. "TM"
    # ns_width = canvas.stringWidth("Brand", font_name, font_size)
    # tm_start_x = ns_start_x + ns_width + 2
    # canvas.setFont(font_name, 10)
    # canvas.setFillColorRGB(0, 0.06, 0.11)
    # canvas.drawString(tm_start_x, y_pos + 10, "TM")

    # Tagline
    canvas.setFont("Helvetica", 8)
    canvas.setFillColorRGB(0.5, 0.5, 0.5)
    canvas.drawString(40, 772, "Everything Construction. Always On.")

    # ★ Document Title - CHANGED TO "RECEIPT"
    canvas.setFont("Helvetica-Bold", 28)
    canvas.setFillColorRGB(0.85, 0.85, 0.85)
    canvas.drawRightString(550, 785, "RECEIPT")

    # ★ Add a small "PAYMENT ACKNOWLEDGEMENT" subtitle in emerald
    canvas.setFont("Helvetica-Bold", 9)
    canvas.setFillColorRGB(0.02, 0.59, 0.41)  # emerald
    canvas.drawRightString(550, 770, "PAYMENT ACKNOWLEDGEMENT")

    # Separator Line
    canvas.setStrokeColorRGB(0.9, 0.9, 0.9)
    canvas.setLineWidth(1)
    canvas.line(40, 755, 550, 755)
    canvas.restoreState()


def generate_receipt_pdf(payment: dict, project: dict, settings: dict, linked_invoice: dict = None) -> bytes:
    """Branded receipt PDF — matches invoice styling exactly."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=40,
        leftMargin=40,
        topMargin=110,
        bottomMargin=50,
    )

    styles = getSampleStyleSheet()
    normal_style = styles["Normal"]
    normal_style.fontSize = 10
    normal_style.textColor = colors.Color(0.2, 0.2, 0.2)
    normal_style.leading = 14
    bold_style = ParagraphStyle(
        "Bold",
        parent=normal_style,
        fontName="Helvetica-Bold",
        textColor=colors.Color(0, 0.06, 0.11),
    )

    elements = []

    # ── Receipt Info Grid ──
    client_name = project.get("customer_name") or "Valued Client"
    client_address = project.get("address") or "Address not provided"
    proj_code = project.get("project_code") or "N/A"
    rcp_number = payment.get("receipt_number", "RCP-000")
    rcp_date = payment.get("date", datetime.now().strftime("%Y-%m-%d"))
    method = payment.get("method", "—")
    reference = payment.get("reference") or "—"

    billing_data = [
        [
            Paragraph("<b>Received From:</b>", normal_style),
            Paragraph("<b>Receipt Details:</b>", normal_style),
        ],
        [
            Paragraph(f"<b>{client_name}</b>", normal_style),
            Paragraph(f"Receipt Number: <b>{rcp_number}</b>", normal_style),
        ],
        [
            Paragraph(client_address, normal_style),
            Paragraph(f"Date Received: {rcp_date}", normal_style),
        ],
        [
            Paragraph(f"Project Code: {proj_code}", normal_style),
            Paragraph(f"Payment Method: <b>{method}</b>", normal_style),
        ],
        [
            Paragraph("", normal_style),
            Paragraph(f"Reference / UTR: <b>{reference}</b>", normal_style),
        ],
    ]

    billing_table = Table(billing_data, colWidths=[270, 240])
    billing_table.setStyle(
        TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ])
    )
    elements.append(billing_table)
    elements.append(Spacer(1, 30))

    # ── Payment Allocation Table ──
    amount = float(payment.get("amount") or 0)

    if linked_invoice:
        inv_num = linked_invoice.get("number", "—")
        inv_desc = linked_invoice.get("milestone_name") or linked_invoice.get("description") or "Project Milestone Payment"
        inv_stage = linked_invoice.get("stage", "General")
        inv_total = float(linked_invoice.get("amount") or 0)
        inv_paid = float(linked_invoice.get("paid_amount") or 0)
        inv_balance = max(0, inv_total - inv_paid)

        line_items = [
            ["Description", "Stage", "Amount (INR)"],
            [f"Payment towards: {inv_desc}\n(Proforma Invoice: {inv_num})", inv_stage, f"{amount:,.2f}"],
            ["", "Amount Received:", f"{amount:,.2f}"],
            ["", "Proforma Total:", f"{inv_total:,.2f}"],
            ["", "Balance Due:", f"{inv_balance:,.2f}"],
        ]
    else:
        notes_text = payment.get("notes") or "General payment received (not linked to a specific proforma)."
        line_items = [
            ["Description", "Type", "Amount (INR)"],
            [notes_text, "General", f"{amount:,.2f}"],
            ["", "Amount Received:", f"{amount:,.2f}"],
        ]

    item_table = Table(line_items, colWidths=[310, 100, 100])
    item_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.Color(0, 0.06, 0.11)),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
            ("ALIGN", (0, 0), (-1, 0), "LEFT"),
            ("ALIGN", (2, 0), (2, -1), "RIGHT"),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
            ("TOPPADDING", (0, 0), (-1, 0), 12),
            ("BOTTOMPADDING", (0, 1), (-1, 1), 20),
            ("TOPPADDING", (0, 1), (-1, 1), 20),
            ("LINEBELOW", (0, 1), (-1, 1), 1, colors.lightgrey),
            ("FONTNAME", (1, -3), (-1, -1), "Helvetica-Bold"),
            # ★ Emerald for Amount Received (success tone)
            ("TEXTCOLOR", (2, 2), (2, 2), colors.Color(0.02, 0.59, 0.41)),
            ("BACKGROUND", (1, 2), (-1, 2), colors.Color(0.92, 0.98, 0.95)),
            ("TOPPADDING", (1, 2), (-1, 2), 8),
            ("BOTTOMPADDING", (1, 2), (-1, 2), 8),
        ])
    )
    elements.append(item_table)
    elements.append(Spacer(1, 40))

    # ── Acknowledgement ──
    elements.append(Paragraph("<b>Acknowledgement</b>", bold_style))
    elements.append(Spacer(1, 8))
    ack_text = (
        f"This is to formally acknowledge receipt of <b>INR {amount:,.2f}</b> "
        f"({method})"
        + (f" against Proforma Invoice <b>{linked_invoice.get('number')}</b>" if linked_invoice else "")
        + f" on <b>{rcp_date}</b>. "
        "This document is a computer-generated receipt and does not constitute a tax invoice."
    )
    elements.append(Paragraph(ack_text, normal_style))
    elements.append(Spacer(1, 25))

    # ── Bank Details ──
    elements.append(Paragraph("<b>Bank Details (for future payments)</b>", bold_style))
    elements.append(Spacer(1, 10))
    bank_details = (
        settings.get("invoice_bank_details")
        or "YOUR BRAND.\nBank: HDFC Bank\nA/C: 50200000000000\nIFSC: HDFC0001234"
    )
    for line in bank_details.split("\n"):
        elements.append(Paragraph(line, normal_style))
    elements.append(Spacer(1, 25))

    # ── Footer ──
  # ★ AFTER — Prefer admin's custom receipt note, fallback to default
    custom_note = (payment.get("notes") or "").strip()
    if custom_note:
        footer_notes = custom_note
    else:
        footer_notes = "Thank you for constructing with ConstructONS."

    elements.append(
        Paragraph(
            f"<font color='gray'><i>Note: {footer_notes}</i></font>",
            normal_style,
        )
    )

    doc.build(
        elements,
        onFirstPage=draw_watermark_and_header,
        onLaterPages=draw_watermark_and_header,
    )
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes