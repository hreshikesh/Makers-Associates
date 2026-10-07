import io
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


def draw_watermark_and_header(canvas, doc):
    canvas.saveState()

    # --- WATERMARK ---
    canvas.setFont("Helvetica-Bold", 70)
    canvas.setFillAlpha(0.03)
    canvas.setFillColorRGB(0, 0, 0)
    canvas.translate(300, 400)
    canvas.rotate(45)
    canvas.drawCentredString(0, 0, "YOUR BRAND")
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
    # ns_width = canvas.stringWidth("NS", font_name, font_size)
    # tm_start_x = ns_start_x + ns_width + 2
    # canvas.setFont(font_name, 10)
    # canvas.setFillColorRGB(0, 0.06, 0.11)
    # canvas.drawString(tm_start_x, y_pos + 10, "TM")

    # Tagline
    canvas.setFont("Helvetica", 8)
    canvas.setFillColorRGB(0.5, 0.5, 0.5)
    canvas.drawString(40, 772, "Everything Construction. Always On.")

    # ★ Document Title
    canvas.setFont("Helvetica-Bold", 22)
    canvas.setFillColorRGB(0.85, 0.85, 0.85)
    canvas.drawRightString(550, 785, "PROFORMA INVOICE")

    # Separator Line
    canvas.setStrokeColorRGB(0.9, 0.9, 0.9)
    canvas.setLineWidth(1)
    canvas.line(40, 755, 550, 755)
    canvas.restoreState()


def generate_invoice_pdf(invoice: dict, project: dict, settings: dict) -> bytes:
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

    # Billing Details Grid
    client_name = project.get("customer_name") or "Valued Client"
    client_address = project.get("address") or "Address not provided"
    proj_code = project.get("project_code") or "N/A"
    inv_number = invoice.get("number", "INV-000")
    inv_date = invoice.get("date", datetime.now().strftime("%Y-%m-%d"))
    due_date = invoice.get("due_date", "Upon Receipt")

    billing_data = [
        [
            Paragraph("<b>Billed To:</b>", normal_style),
            Paragraph("<b>Proforma Details:</b>", normal_style),
        ],
        [
            Paragraph(f"<b>{client_name}</b>", normal_style),
            Paragraph(f"Proforma Number: <b>{inv_number}</b>", normal_style),
        ],
        [
            Paragraph(client_address, normal_style),
            Paragraph(f"Date of Issue: {inv_date}", normal_style),
        ],
        [
            Paragraph(f"Project Code: {proj_code}", normal_style),
            Paragraph(
                f"Due Date: <font color='red'><b>{due_date}</b></font>",
                normal_style,
            ),
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

    # Line Items Table
    stage = invoice.get("milestone_stage") or invoice.get("stage", "General")
    desc = invoice.get("description") or "Project Milestone Payment"
    amount = float(invoice.get("amount") or 0)
    
    # Clean parsing of GST percentage from site settings
    try:
        gst_pct = float(settings.get("invoice_gst_percent", 0) or 0)
    except (ValueError, TypeError):
        gst_pct = 0.0

    gst_amount = amount * (gst_pct / 100)
    total_amount = amount + gst_amount

    line_items = [
        ["Description", "Stage", "Amount (INR)"],
        [desc, stage, f"{amount:,.2f}"],
        ["", "Subtotal:", f"{amount:,.2f}"],
    ]
    if gst_pct > 0:
        line_items.append(["", f"GST ({gst_pct:g}%):", f"{gst_amount:,.2f}"])
    line_items.append(["", "Total Due:", f"{total_amount:,.2f}"])

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
            ("TEXTCOLOR", (2, -1), (2, -1), colors.Color(1.0, 0.35, 0)),
            ("BACKGROUND", (1, -1), (-1, -1), colors.Color(0.97, 0.97, 0.97)),
            ("TOPPADDING", (1, -1), (-1, -1), 8),
            ("BOTTOMPADDING", (1, -1), (-1, -1), 8),
        ])
    )
    elements.append(item_table)
    elements.append(Spacer(1, 50))

    # Bank Details from Settings
    elements.append(Paragraph("<b>Payment Instructions</b>", bold_style))
    elements.append(Spacer(1, 10))
    bank_details = (
        settings.get("invoice_bank_details")
        if settings.get("invoice_bank_details") is not None
        else "ConstructONS Pvt. Ltd.\nBank: HDFC Bank\nA/C: 50200000000000\nIFSC: HDFC0001234"
    )
    for line in str(bank_details).split("\n"):
        elements.append(Paragraph(line, normal_style))
    elements.append(Spacer(1, 30))

    # Footer Notes from Settings
    # footer_notes = (
    #     settings.get("invoice_footer_notes")
    #     if settings.get("invoice_footer_notes") is not None
    #     else "Thank you for building with ConstructONS. Late payments may attract a penalty of 1.5% per month."
    # )
    # elements.append(
    #     Paragraph(
    #         f"<font color='gray'><i>Note: {footer_notes}</i></font>",
    #         normal_style,
    #     )
    # )

    doc.build(
        elements,
        onFirstPage=draw_watermark_and_header,
        onLaterPages=draw_watermark_and_header,
    )
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes