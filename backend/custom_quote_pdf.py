"""Custom Quote PDF — Branded for ConstructONS™.

Sections:
  1. Cover (Navy + Orange accent + client card)
  2. Project brief (client + site + requirements)
  3. Pricing breakdown (base + addons + interiors + line items + 15% service charge, NO GST)
  4. Material specifications (with per-item rate + notes)
  5. Interior fit-out sheet (with per-item rate)
  6. Scope of work + Exclusions
  7. Payment schedule
  8. Floor plans (one per page with CAD-style title block)
  9. Elevations (same format)
 10. Visual boards (image galleries)
 11. Terms & signature
"""
from io import BytesIO
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional
import logging
import re
from html import escape as _html_escape
from html.parser import HTMLParser

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.enums import TA_LEFT, TA_JUSTIFY, TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, Image,
)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Colors
# ---------------------------------------------------------------------------
ORANGE = colors.HexColor("#FF5A00")
NAVY = colors.HexColor("#000F1B")
NAVY_SOFT = colors.HexColor("#0B1E30")
GREY = colors.HexColor("#64748B")
LIGHT = colors.HexColor("#F8F9FA")
LINE = colors.HexColor("#E2E8F0")
WHITE = colors.white


# ---------------------------------------------------------------------------
# Rich-text sanitizer
# ---------------------------------------------------------------------------
_RL_INLINE_MAP = {
    "strong": ("b", "b"),
    "b":      ("b", "b"),
    "em":     ("i", "i"),
    "i":      ("i", "i"),
    "u":      ("u", "u"),
    "s":      ("strike", "strike"),
    "strike": ("strike", "strike"),
    "del":    ("strike", "strike"),
    "code":   ("font face='Courier'", "font"),
    "span":   (None, None),
}
_RL_BLOCK_TAGS = {"p", "div", "blockquote", "h1", "h2", "h3", "h4", "h5", "h6", "pre", "figure"}
_RL_LIST_TAGS = {"ul", "ol"}
_RL_ITEM_TAG = "li"
_RL_BREAK_TAGS = {"br"}


class _TipTapToReportLabParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.paragraphs: List[tuple] = []
        self._buf: List[str] = []
        self._list_stack: List[str] = []
        self._ol_index: List[int] = []
        self._pending_kind: str = "p"

    def _flush(self):
        text = "".join(self._buf).strip()
        self._buf = []
        if not text:
            return
        text = re.sub(r"\s+", " ", text)
        self.paragraphs.append((self._pending_kind, text))

    def _start_new(self, kind: str = "p"):
        self._flush()
        self._pending_kind = kind

    def handle_starttag(self, tag, attrs):
        t = tag.lower()
        if t in _RL_BREAK_TAGS:
            self._buf.append("<br/>")
            return
        if t in _RL_LIST_TAGS:
            self._flush()
            self._list_stack.append(t)
            if t == "ol":
                self._ol_index.append(0)
            return
        if t == _RL_ITEM_TAG:
            self._flush()
            if self._list_stack and self._list_stack[-1] == "ol":
                self._ol_index[-1] += 1
                self._pending_kind = f"number:{self._ol_index[-1]}"
            else:
                self._pending_kind = "bullet"
            return
        if t in _RL_BLOCK_TAGS:
            self._start_new("p")
            return
        if t in _RL_INLINE_MAP:
            open_tag, _ = _RL_INLINE_MAP[t]
            if open_tag:
                self._buf.append(f"<{open_tag}>")
            return
        if t == "a":
            href = ""
            for k, v in attrs:
                if k.lower() == "href" and v:
                    href = _html_escape(v, quote=True)
                    break
            if href:
                self._buf.append(f'<link href="{href}"><u>')
            else:
                self._buf.append("<u>")
            return

    def handle_endtag(self, tag):
        t = tag.lower()
        if t in _RL_BREAK_TAGS:
            return
        if t in _RL_LIST_TAGS:
            self._flush()
            if self._list_stack:
                self._list_stack.pop()
            if t == "ol" and self._ol_index:
                self._ol_index.pop()
            self._pending_kind = "p"
            return
        if t == _RL_ITEM_TAG:
            self._flush()
            self._pending_kind = "p"
            return
        if t in _RL_BLOCK_TAGS:
            self._flush()
            self._pending_kind = "p"
            return
        if t in _RL_INLINE_MAP:
            _, close_tag = _RL_INLINE_MAP[t]
            if close_tag:
                self._buf.append(f"</{close_tag}>")
            return
        if t == "a":
            joined = "".join(self._buf)
            if "<link " in joined:
                self._buf.append("</u></link>")
            else:
                self._buf.append("</u>")
            return

    def handle_data(self, data):
        self._buf.append(_html_escape(data, quote=False))

    def close(self):
        super().close()
        self._flush()


def _tiptap_to_rl_paragraphs(html: Optional[str], styles: Dict[str, ParagraphStyle]) -> List[Paragraph]:
    if not html:
        return []
    text = str(html)
    body_style = styles.get("body")
    try:
        parser = _TipTapToReportLabParser()
        parser.feed(text)
        parser.close()
        entries = parser.paragraphs
    except Exception as e:
        logger.warning("[pdf] TipTap parser failed: %s", e)
        entries = [("p", _html_escape(re.sub(r"<[^>]+>", " ", text), quote=False))]

    flowables: List[Paragraph] = []
    for kind, safe_html in entries:
        if not safe_html.strip():
            continue
        try:
            if kind == "bullet":
                flowables.append(Paragraph(f"&bull;&nbsp;&nbsp;{safe_html}", body_style))
            elif kind.startswith("number:"):
                idx = kind.split(":", 1)[1]
                flowables.append(Paragraph(f"{idx}.&nbsp;&nbsp;{safe_html}", body_style))
            else:
                flowables.append(Paragraph(safe_html, body_style))
        except Exception:
            plain = _html_escape(re.sub(r"<[^>]+>", " ", safe_html), quote=False)
            try:
                flowables.append(Paragraph(plain, body_style))
            except Exception:
                pass
    return flowables


def _safe_inline(text: Optional[str]) -> str:
    if text is None:
        return ""
    return _html_escape(str(text), quote=False)


def _styles():
    ss = getSampleStyleSheet()
    return {
        "h1": ParagraphStyle("h1", parent=ss["Heading1"], fontName="Helvetica-Bold",
                             fontSize=22, leading=26, textColor=NAVY, spaceAfter=8),
        "h2": ParagraphStyle("h2", parent=ss["Heading2"], fontName="Helvetica-Bold",
                             fontSize=14, leading=18, textColor=NAVY, spaceBefore=10, spaceAfter=6),
        "h3": ParagraphStyle("h3", parent=ss["Heading3"], fontName="Helvetica-Bold",
                             fontSize=11, leading=15, textColor=ORANGE, spaceBefore=6, spaceAfter=3),
        "body": ParagraphStyle("body", parent=ss["BodyText"], fontName="Helvetica",
                               fontSize=9.5, leading=13.5, textColor=NAVY, alignment=TA_JUSTIFY),
        "small": ParagraphStyle("small", parent=ss["BodyText"], fontName="Helvetica",
                                fontSize=8.5, leading=12, textColor=GREY),
        "eyebrow": ParagraphStyle("eyebrow", parent=ss["BodyText"], fontName="Helvetica-Bold",
                                  fontSize=8, textColor=ORANGE, spaceAfter=2),
        "cover_title": ParagraphStyle("cover_title", parent=ss["Heading1"], fontName="Helvetica-Bold",
                                      fontSize=36, leading=40, textColor=WHITE),
        "cover_sub": ParagraphStyle("cover_sub", parent=ss["BodyText"], fontName="Helvetica",
                                    fontSize=12, textColor=colors.HexColor("#C4C9D3"), leading=18),
    }


def _rupees(n) -> str:
    """Helvetica-safe Rupee formatting without Unicode symbols that break ReportLab."""
    try:
        v = float(n or 0)
        return f"Rs. {v:,.0f}"
    except Exception:
        return "Rs. 0"


# ---------------------------------------------------------------------------
# BRAND LOCKUP VECTOR DRAWING (No logo image)
# CONSTRUCT [Orange Power Icon] NS ™
# ---------------------------------------------------------------------------
def _draw_brand_lockup(c, x, y, font_size=14, dark_bg=False):
    """Draws CONSTRUCT ⏻ NS™ natively on canvas without image assets or broken characters."""
    c.saveState()
    
    # 1. "CONSTRUCT" Text
    c.setFont("Helvetica-Bold", font_size)
    c.setFillColor(WHITE if dark_bg else NAVY)
    c.drawString(x, y, "CONSTRUCT")
    w1 = c.stringWidth("CONSTRUCT", "Helvetica-Bold", font_size)
    
    # 2. Vector Power Icon ⏻
    cap_h = font_size * 0.72
    icon_r = cap_h * 0.55
    
    cx = x + w1 + icon_r + (font_size * 0.1) 
    cy = y + (cap_h / 2.0)                   
    
    c.setStrokeColor(ORANGE)
    c.setLineWidth(font_size * 0.12)
    c.setLineCap(1)  
    
    # Outer Power Arc
    c.arc(cx - icon_r, cy - icon_r, cx + icon_r, cy + icon_r, 125, 290)
    
    # Vertical Power Stem
    c.line(cx, cy - (icon_r * 0.1), cx, cy + (icon_r * 1.25))
    
    # 3. "NS" Text
    ns_x = cx + icon_r + (font_size * 0.1) 
    c.setFillColor(ORANGE)
    c.setFont("Helvetica-Bold", font_size)
    c.drawString(ns_x, y, "NS")
    w2 = c.stringWidth("NS", "Helvetica-Bold", font_size)
    
    # 4. "™" Symbol
    tm_x = ns_x + w2 + (font_size * 0.05)
    c.setFont("Helvetica-Bold", font_size * 0.45)
    c.drawString(tm_x, y + (cap_h * 0.7), "TM")
    
    c.restoreState()


def _header_footer(ref: str, doc_kind: str = "CUSTOM QUOTATION"):
    def draw(canvas_obj, doc):
        canvas_obj.saveState()
        W, H = A4
        
        # Top Running Header
        canvas_obj.setStrokeColor(LINE)
        canvas_obj.setLineWidth(0.5)
        canvas_obj.line(15 * mm, H - 15 * mm, W - 15 * mm, H - 15 * mm)
        
        # Brand lockup on left
        _draw_brand_lockup(canvas_obj, 15 * mm, H - 12 * mm, font_size=11, dark_bg=False)
        
        # Document ref on right
        canvas_obj.setFont("Helvetica-Bold", 8)
        canvas_obj.setFillColor(GREY)
        canvas_obj.drawRightString(W - 15 * mm, H - 11 * mm, f"{doc_kind} | {ref}")

        # Bottom Footer
        canvas_obj.setStrokeColor(LINE)
        canvas_obj.line(15 * mm, 15 * mm, W - 15 * mm, 15 * mm)
        canvas_obj.setFont("Helvetica", 7.5)
        canvas_obj.setFillColor(GREY)
        canvas_obj.drawString(15 * mm, 10 * mm,
                              "(c) ConstructONS Pvt. Ltd. - Confidential quotation. Not a legal contract.")
        canvas_obj.drawRightString(W - 15 * mm, 10 * mm, f"Page {canvas_obj.getPageNumber()}")
        canvas_obj.restoreState()
    return draw


def _cover_page(client_name: str, doc_ref: str):
    def draw(canvas_obj, doc):
        W, H = A4
        # Dark Navy Background
        canvas_obj.setFillColor(NAVY)
        canvas_obj.rect(0, 0, W, H, fill=1, stroke=0)
        
        # Top Orange Accent Bar
        canvas_obj.setFillColor(ORANGE)
        canvas_obj.rect(0, H - 8, W, 8, fill=1, stroke=0)
        
        # Header Brand Lockup on Cover
        _draw_brand_lockup(canvas_obj, 20 * mm, H - 35 * mm, font_size=18, dark_bg=True)
        
        canvas_obj.setFillColor(colors.HexColor("#98A2B3"))
        canvas_obj.setFont("Helvetica-Bold", 8)
        canvas_obj.drawString(20 * mm, H - 42 * mm, "EVERYTHING CONSTRUCTION. ALWAYS ON.")
        
        canvas_obj.setFont("Helvetica-Bold", 9)
        canvas_obj.drawRightString(W - 20 * mm, H - 35 * mm, "CUSTOM QUOTATION")
    return draw


def _kv_table(rows: List[List[str]], col1=45, col2=125):
    """Formats Key-Value tables with Paragraph wrapping to prevent overflow."""
    styles = _styles()
    processed_rows = []
    for r in rows:
        if len(r) == 2:
            processed_rows.append([
                r[0],
                Paragraph(_safe_inline(r[1]), styles["body"])
            ])

    tbl = Table(processed_rows, colWidths=[col1 * mm, col2 * mm])
    tbl.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("FONT", (0, 0), (0, -1), "Helvetica-Bold", 9),
        ("TEXTCOLOR", (0, 0), (0, -1), GREY),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LINEBELOW", (0, 0), (-1, -1), 0.4, LINE),
    ]))
    return tbl


def _compute_pricing(quote: dict) -> dict:
    area = float(quote.get("built_up_area") or 0)
    rate = float(quote.get("price_per_sqft") or 0)
    base = area * rate

    addons = quote.get("addons") or []
    addon_total = sum(float(a.get("price") or 0) for a in addons)

    line_items = quote.get("line_items") or []
    line_total = sum(float(l.get("amount") or 0) for l in line_items)

    interiors_total = 0.0
    for cat in (quote.get("interiors") or []):
        for it in (cat.get("items") or []):
            if it.get("include_in_total"):
                try:
                    qty = float(it.get("quantity") or 1)
                except Exception:
                    qty = 1.0
                interiors_total += float(it.get("rate") or 0) * qty

    subtotal = base + addon_total + line_total + interiors_total
    discount = float(quote.get("discount_amount") or 0)
    net = max(0.0, subtotal - discount)
    svc_pct = float(quote.get("service_charge_percent") if quote.get("service_charge_percent") is not None else 15)
    svc_amt = net * svc_pct / 100
    grand = net + svc_amt
    return {
        "base": base, "addon_total": addon_total, "line_total": line_total,
        "interiors_total": interiors_total, "subtotal": subtotal, "discount": discount,
        "net": net, "svc_pct": svc_pct, "svc_amt": svc_amt, "grand": grand,
    }


def _fetch_image_flowable(url_or_path: str, max_w_mm: float, max_h_mm: float) -> Optional[Image]:
    if not url_or_path:
        return None
    path = url_or_path
    if path.startswith("/api/media/"):
        path = path[len("/api/media/"):]
    elif path.startswith("http"):
        return None
    try:
        from media_service import get_object
        data, _ct = get_object(path)
        buf = BytesIO(data)
        img = Image(buf)
        iw, ih = img.imageWidth, img.imageHeight
        max_w = max_w_mm * mm
        max_h = max_h_mm * mm
        if iw <= 0 or ih <= 0:
            return None
        scale = min(max_w / iw, max_h / ih, 1.0)
        img.drawWidth = iw * scale
        img.drawHeight = ih * scale
        return img
    except Exception as e:
        logger.warning(f"[pdf] failed to fetch image {path}: {e}")
        return None


def generate_custom_quote_pdf(quote: Dict[str, Any], settings: Dict[str, Any]) -> bytes:
    buf = BytesIO()
    styles = _styles()
    ref = quote.get("ref_number") or "CUSTOM"
    client = quote.get("client_name") or "Valued Customer"
    
    # Clean up company name to remove old test DB values (e.g., OYAYA)
    raw_company = settings.get("company_name") or "ConstructONS Pvt. Ltd."
    company = "ConstructONS Pvt. Ltd." if "OYAYA" in raw_company.upper() else raw_company

    today = datetime.now(timezone.utc)
    valid_until = today + timedelta(days=int(quote.get("valid_days") or 30))

    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=18 * mm, rightMargin=18 * mm,
        topMargin=22 * mm, bottomMargin=20 * mm,
        title=f"{ref} - {client}",
    )
    story: List[Any] = []

    # ---------- 1. Cover Page ----------
    story.append(Spacer(1, 42 * mm))
    story.append(Paragraph("PREPARED FOR", styles["eyebrow"]))
    story.append(Spacer(1, 6))
    story.append(Paragraph(client.upper(), styles["cover_title"]))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        quote.get("package_name") or "Your bespoke home, engineered and priced honestly.",
        styles["cover_sub"],
    ))
    story.append(Spacer(1, 20 * mm))

    prep_rows = [
        ["QUOTE REFERENCE", ref],
        ["DATE", today.strftime("%d %b %Y").upper()],
        ["VALID UNTIL", valid_until.strftime("%d %b %Y").upper()],
        ["PREPARED BY", (quote.get("prepared_by") or company).upper()],
    ]
    prep_table = Table(prep_rows, colWidths=[45 * mm, 95 * mm], hAlign="LEFT")
    prep_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (0, -1), 7.5),
        ("TEXTCOLOR", (0, 0), (0, -1), ORANGE),
        ("FONTNAME", (1, 0), (1, -1), "Helvetica-Bold"),
        ("FONTSIZE", (1, 0), (1, -1), 9.5),
        ("TEXTCOLOR", (1, 0), (1, -1), WHITE),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("BACKGROUND", (0, 0), (-1, -1), NAVY_SOFT),
        ("LINEBELOW", (0, 0), (-1, -2), 0.3, colors.HexColor("#2A3441")),
        ("BOX", (0, 0), (-1, -1), 1.4, ORANGE),
    ]))
    story.append(prep_table)
    story.append(PageBreak())

    # ---------- 2. Project Brief ----------
    story.append(Paragraph("Project Brief", styles["h1"]))
    if quote.get("intro_note"):
        for flow in _tiptap_to_rl_paragraphs(quote.get("intro_note"), styles):
            story.append(flow)
        story.append(Spacer(1, 8))

    story.append(Paragraph("Client Details", styles["h2"]))
    story.append(_kv_table([
        ["Name", client],
        ["Phone", quote.get("client_phone") or "-"],
        ["Email", quote.get("client_email") or "-"],
        ["Client Address", quote.get("client_address") or "-"],
    ]))
    story.append(Spacer(1, 8))

    story.append(Paragraph("Site & Requirements", styles["h2"]))
    plot = quote.get("plot_area")
    built = quote.get("built_up_area") or 0
    story.append(_kv_table([
        ["Site Address", quote.get("site_address") or "-"],
        ["Plot Area", f"{float(plot):,.0f} sq.ft" if plot else "-"],
        ["Built-up Area", f"{float(built):,.0f} sq.ft"],
        ["Floors", quote.get("floors") or "-"],
        ["Configuration", quote.get("bhk") or "-"],
        ["Style Preference", quote.get("style_pref") or "-"],
        ["Client Budget", _rupees(quote.get("budget")) if quote.get("budget") else "-"],
        ["Expected Start", quote.get("expected_start") or "-"],
        ["Expected Completion", quote.get("expected_completion") or "-"],
    ]))
    story.append(PageBreak())

    # ---------- 3. Pricing ----------
    p = _compute_pricing(quote)
    story.append(Paragraph("Pricing Breakdown", styles["h1"]))
    story.append(Paragraph(
        "Transparent line-item pricing. A flat 15% contractor service charge is applied "
        "on the net total. No GST is levied by ConstructONS on this quotation.",
        styles["small"],
    ))
    story.append(Spacer(1, 8))

    rows = [["Item", "Detail", "Amount"]]
    pkg_label = quote.get("package_name") or "Custom Base Build"
    area = float(built or 0)
    rate = float(quote.get("price_per_sqft") or 0)
    if p["base"] > 0:
        rows.append([Paragraph(pkg_label, styles["body"]), Paragraph(f"{area:,.0f} sq.ft x {_rupees(rate)}", styles["body"]), _rupees(p["base"])])
    if p["addon_total"] > 0:
        rows.append([Paragraph("Add-ons (Total)", styles["body"]), f"{len(quote.get('addons') or [])} items", _rupees(p["addon_total"])])
    if p["interiors_total"] > 0:
        rows.append([Paragraph("Interior Fit-out", styles["body"]), "See interiors sheet", _rupees(p["interiors_total"])])
    if p["line_total"] > 0:
        rows.append([Paragraph("Custom Line Items", styles["body"]), f"{len(quote.get('line_items') or [])} items", _rupees(p["line_total"])])
    rows.append([Paragraph("Subtotal", styles["body"]), "", _rupees(p["subtotal"])])
    if p["discount"] > 0:
        rows.append([Paragraph(quote.get("discount_label") or "Discount", styles["body"]), "", f"- {_rupees(p['discount'])}"])
        rows.append([Paragraph("Net", styles["body"]), "", _rupees(p["net"])])
    rows.append([Paragraph(f"Contractor Service Charge @ {p['svc_pct']:g}%", styles["body"]), "", _rupees(p["svc_amt"])])
    rows.append([Paragraph("Grand Total", styles["body"]), "", _rupees(p["grand"])])

    tbl = Table(rows, colWidths=[70 * mm, 60 * mm, 40 * mm])
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONT", (0, 0), (-1, 0), "Helvetica-Bold", 9.5),
        ("BACKGROUND", (0, -1), (-1, -1), ORANGE),
        ("TEXTCOLOR", (0, -1), (-1, -1), WHITE),
        ("FONT", (0, -1), (-1, -1), "Helvetica-Bold", 10.5),
        ("ALIGN", (2, 0), (2, -1), "RIGHT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.3, LINE),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(tbl)
    story.append(Spacer(1, 8))
    
    if quote.get("budget"):
        try:
            b = float(quote.get("budget"))
            delta = p["grand"] - b
            if abs(delta) < 1:
                story.append(Paragraph(f"Client budget {_rupees(b)} - matches this quote.", styles["small"]))
            else:
                sign = "over" if delta > 0 else "under"
                story.append(Paragraph(
                    f"Client budget {_rupees(b)} - quote is {_rupees(abs(delta))} {sign} budget.",
                    styles["small"],
                ))
        except Exception:
            pass
    story.append(PageBreak())

    # ---------- 4. Material Specifications ----------
    story.append(Paragraph("Material Specifications", styles["h1"]))
    story.append(Paragraph(
        "Every material, brand and grade proposed for your home - with indicative rates for full transparency.",
        styles["small"],
    ))
    story.append(Spacer(1, 6))
    
    for cat in (quote.get("spec_categories") or [])[:16]:
        story.append(Paragraph(cat.get("name", ""), styles["h2"]))
        cat_rows = [["Spec", "Value", "Brand", "Rate", "Warranty"]]
        for it in (cat.get("items") or []):
            rate_txt = ""
            if it.get("rate"):
                try:
                    rate_txt = f"{_rupees(it.get('rate'))} {it.get('rate_unit') or ''}".strip()
                except Exception:
                    rate_txt = ""
            
            cat_rows.append([
                Paragraph(_safe_inline(it.get("spec", "")), styles["small"]),
                Paragraph(_safe_inline(it.get("value", "")), styles["small"]),
                Paragraph(_safe_inline(it.get("brand") or "-"), styles["small"]),
                Paragraph(_safe_inline(rate_txt or "-"), styles["small"]),
                Paragraph(_safe_inline(it.get("warranty") or "-"), styles["small"]),
            ])
            
        if len(cat_rows) > 1:
            t = Table(cat_rows, colWidths=[30 * mm, 60 * mm, 35 * mm, 25 * mm, 24 * mm])
            t.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), LIGHT),
                ("FONT", (0, 0), (-1, 0), "Helvetica-Bold", 8.5),
                ("TEXTCOLOR", (0, 0), (-1, 0), NAVY),
                ("GRID", (0, 0), (-1, -1), 0.25, LINE),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]))
            story.append(t)
            story.append(Spacer(1, 6))
    story.append(PageBreak())

    # ---------- 5. Interior Fit-Out ----------
    if quote.get("interiors"):
        story.append(Paragraph("Interior Fit-Out", styles["h1"]))
        story.append(Paragraph("Interior scope with brands, quantities and indicative unit rates.", styles["small"]))
        story.append(Spacer(1, 6))
        for cat in (quote.get("interiors") or [])[:16]:
            story.append(Paragraph(cat.get("name", ""), styles["h2"]))
            cat_rows = [["Item", "Description", "Brand", "Rate", "Qty"]]
            for it in (cat.get("items") or []):
                rate_txt = _rupees(it.get("rate") or 0)
                if it.get("rate_unit"):
                    rate_txt += f" {it.get('rate_unit')}"
                
                cat_rows.append([
                    Paragraph(_safe_inline(it.get("spec", "")), styles["small"]),
                    Paragraph(_safe_inline(it.get("value", "")), styles["small"]),
                    Paragraph(_safe_inline(it.get("brand") or "-"), styles["small"]),
                    Paragraph(_safe_inline(rate_txt), styles["small"]),
                    Paragraph(_safe_inline(str(it.get("quantity") or "-")), styles["small"]),
                ])
                
            if len(cat_rows) > 1:
                t = Table(cat_rows, colWidths=[30 * mm, 65 * mm, 35 * mm, 25 * mm, 19 * mm])
                t.setStyle(TableStyle([
                    ("BACKGROUND", (0, 0), (-1, 0), LIGHT),
                    ("FONT", (0, 0), (-1, 0), "Helvetica-Bold", 8.5),
                    ("GRID", (0, 0), (-1, -1), 0.25, LINE),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                    ("TOPPADDING", (0, 0), (-1, -1), 5),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ]))
                story.append(t)
                story.append(Spacer(1, 6))
        story.append(PageBreak())

    # ---------- 6. Scope + Exclusions ----------
    story.append(Paragraph("What's Included", styles["h1"]))
    for s in (quote.get("scope_of_work") or []):
        story.append(Paragraph(f"<font color='#22C55E'>&bull;</font>&nbsp;&nbsp;{s}", styles["body"]))
    if not (quote.get("scope_of_work") or []):
        story.append(Paragraph("Scope will be finalised at booking.", styles["small"]))
    story.append(Spacer(1, 14))
    
    story.append(Paragraph("Exclusions", styles["h1"]))
    for s in (quote.get("exclusions") or []):
        story.append(Paragraph(f"<font color='#EF4444'>&bull;</font>&nbsp;&nbsp;{s}", styles["body"]))
    if not (quote.get("exclusions") or []):
        story.append(Paragraph("None.", styles["small"]))
    story.append(PageBreak())

    # ---------- 6.5 Material Specification Sheet ----------
    mats = quote.get("material_specs") or []
    if mats:
        story.append(Paragraph("Material Specification", styles["h1"]))
        story.append(Paragraph("Standard brand/grade included per line-item.", styles["small"]))
        story.append(Spacer(1, 6))
        m_rows = [["Category", "Item", "Standard Included Brand/Grade", "Notes"]]
        for row in mats:
            m_rows.append([
                Paragraph(_safe_inline(row.get("category")), styles["small"]),
                Paragraph(_safe_inline(row.get("item")), styles["small"]),
                Paragraph(_safe_inline(row.get("brand_grade")), styles["small"]),
                Paragraph(f"<i>{_safe_inline(row.get('notes'))}</i>", styles["small"]),
            ])
        mt = Table(m_rows, colWidths=[32 * mm, 42 * mm, 55 * mm, 45 * mm], repeatRows=1)
        mt.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), NAVY),
            ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
            ("FONT", (0, 0), (-1, 0), "Helvetica-Bold", 8.5),
            ("GRID", (0, 0), (-1, -1), 0.25, LINE),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]))
        story.append(mt)
        story.append(PageBreak())

    # ---------- 7. Payment Schedule ----------
    schedule = quote.get("payment_schedule") or []
    if schedule:
        story.append(Paragraph("Payment Schedule", styles["h1"]))
        story.append(Paragraph("Milestone-based payments.", styles["small"]))
        story.append(Spacer(1, 6))
        s_rows = [["Milestone", "%", "Description", "Est. Amount"]]
        for s in schedule:
            pct = float(s.get("percentage") or 0)
            s_rows.append([
                Paragraph(_safe_inline(s.get("milestone", "")), styles["small"]),
                f"{pct:g}%",
                Paragraph(_safe_inline(s.get("description", "")), styles["small"]),
                _rupees(p["grand"] * pct / 100),
            ])
        t = Table(s_rows, colWidths=[45 * mm, 15 * mm, 75 * mm, 39 * mm])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), NAVY),
            ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
            ("FONT", (0, 0), (-1, 0), "Helvetica-Bold", 8.5),
            ("GRID", (0, 0), (-1, -1), 0.25, LINE),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("ALIGN", (1, 0), (1, -1), "CENTER"),
            ("ALIGN", (3, 0), (3, -1), "RIGHT"),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]))
        story.append(t)
        story.append(PageBreak())

    # ---------- 8/9. Drawings (Floor plans & Elevations) ----------
    def _drawing_pages(drawings: List[Dict[str, Any]], kind: str):
        for i, dr in enumerate(drawings or []):
            story.append(Paragraph(f"{kind} - Sheet {dr.get('sheet_number') or (i + 1)}", styles["h1"]))
            title = dr.get("title") or f"{kind} {i + 1}"
            story.append(Paragraph(title, styles["h3"]))
            img = _fetch_image_flowable(dr.get("image_url") or "", max_w_mm=170, max_h_mm=160)
            if img:
                story.append(img)
            else:
                story.append(Paragraph(f"<i>Drawing preview unavailable. Sheet: {title}</i>", styles["small"]))
            story.append(Spacer(1, 6))

            tb_rows = [[
                "PROJECT", "SHEET TITLE", "SHEET NO.", "SCALE",
            ], [
                (quote.get("package_name") or "Custom Home")[:30],
                title[:30], str(dr.get("sheet_number") or (i + 1)),
                dr.get("scale") or "1:100",
            ]]
            tb = Table(tb_rows, colWidths=[45 * mm, 55 * mm, 30 * mm, 40 * mm])
            tb.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), NAVY),
                ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
                ("FONT", (0, 0), (-1, 0), "Helvetica-Bold", 7),
                ("FONT", (0, 1), (-1, 1), "Helvetica", 8.5),
                ("GRID", (0, 0), (-1, -1), 0.4, NAVY),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
            ]))
            story.append(tb)
            story.append(PageBreak())

    _drawing_pages(quote.get("floor_plans") or [], "FLOOR PLAN")
    _drawing_pages(quote.get("elevations") or [], "ELEVATION")

    # ---------- 10. Visual Boards ----------
    for board in (quote.get("visual_boards") or []):
        story.append(Paragraph(board.get("title") or "Visual Reference", styles["h1"]))
        if board.get("description"):
            story.append(Paragraph(board["description"], styles["body"]))
            story.append(Spacer(1, 8))
        images = board.get("images") or []
        row_pairs = []
        i = 0
        while i < len(images):
            left = _fetch_image_flowable(images[i].get("url") or "", max_w_mm=80, max_h_mm=60)
            right_flow = None
            if i + 1 < len(images):
                right_flow = _fetch_image_flowable(images[i + 1].get("url") or "", max_w_mm=80, max_h_mm=60)
            left_cell = [left, Paragraph(images[i].get("caption") or "", styles["small"])] if left else [Paragraph(images[i].get("caption") or "Image unavailable", styles["small"])]
            if right_flow:
                right_cell = [right_flow, Paragraph(images[i + 1].get("caption") or "", styles["small"])]
            elif i + 1 < len(images):
                right_cell = [Paragraph(images[i + 1].get("caption") or "Image unavailable", styles["small"])]
            else:
                right_cell = [Paragraph("", styles["small"])]
            row_pairs.append([left_cell, right_cell])
            i += 2
        if row_pairs:
            for pair in row_pairs:
                t = Table([pair], colWidths=[85 * mm, 85 * mm])
                t.setStyle(TableStyle([
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ]))
                story.append(t)
        story.append(PageBreak())

    # ---------- 11. Terms & Signature (WRAPPED PARAGRAPHS FIX) ----------
    story.append(Paragraph("Terms & Conditions", styles["h1"]))
    default_terms = (
        f"1. This quotation is valid for {quote.get('valid_days', 30)} days.<br/>"
        "2. A flat 15% contractor service charge is included in the grand total.<br/>"
        "3. Payments are milestone-based; each milestone requires signed customer approval.<br/>"
        f"4. Warranty of {quote.get('warranty_years') or 10} years on structure and waterproofing.<br/>"
        "5. Rates and specifications shown are indicative and confirmed at booking."
    )
    if quote.get("terms"):
        for flow in _tiptap_to_rl_paragraphs(quote.get("terms"), styles):
            story.append(flow)
    else:
        story.append(Paragraph(default_terms, styles["body"]))
    
    story.append(Spacer(1, 24))

    # WRAPPED PARAGRAPHS FIX: Ensures Company & Client text NEVER overlap in 80mm columns
    sign_rows = [
        [
            Paragraph("<b>For ConstructONS</b>", styles["body"]), 
            Paragraph("<b>For Client</b>", styles["body"])
        ],
        [
            Paragraph("<br/><br/>_________________________", styles["body"]), 
            Paragraph("<br/><br/>_________________________", styles["body"])
        ],
        [
            Paragraph(_safe_inline(company), styles["body"]), 
            Paragraph(_safe_inline(client), styles["body"])
        ],
    ]
    
    sign_tbl = Table(sign_rows, colWidths=[80 * mm, 80 * mm])
    sign_tbl.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]))
    story.append(sign_tbl)

    # Build PDF
    doc.build(
        story,
        onFirstPage=_cover_page(client, ref),
        onLaterPages=_header_footer(ref),
    )
    buf.seek(0)
    return buf.getvalue()