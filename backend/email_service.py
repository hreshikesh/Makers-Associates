import os
import logging
import base64
import httpx
from typing import Optional

logger = logging.getLogger(__name__)

RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "ConstructONS Updates <onboarding@resend.dev>")
PUBLIC_PORTAL_URL = os.environ.get("PUBLIC_PORTAL_URL", "https://construct-ons-six.vercel.app")


def _get_branded_html_template(
    customer_name: str,
    project_title: str,
    notification_title: str,
    notification_message: str,
    portal_link: str
) -> str:
    """Generates branded HTML email (unchanged from your original)."""
    full_link = portal_link if portal_link.startswith("http") else f"{PUBLIC_PORTAL_URL}{portal_link}"
    client_greeting = customer_name if customer_name else "Valued Client"

    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{notification_title}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #F2F2F2; font-family: 'Poppins', 'Segoe UI', Arial, sans-serif; color: #111111;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F2F2F2; padding: 30px 10px;">
            <tr><td align="center">
                <table role="presentation" width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
                    <tr>
                        <td style="background-color: #000F1B; padding: 30px 40px; text-align: left; border-bottom: 4px solid #FF5A00;">
                            <h1 style="color: #FFFFFF; font-size: 24px; font-weight: 700; margin: 0;">
                                Construct<span style="color: #FF5A00;">ONS</span><span style="font-size: 14px; vertical-align: super; color: #FF5A00;">™</span>
                            </h1>
                            <p style="color: #A6A6A6; font-size: 12px; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 1px;">
                                Everything Construction. Always On.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 24px 40px 0 40px;">
                            <div style="display: inline-block; background-color: #FFF3EC; border-left: 3px solid #FF5A00; padding: 6px 12px; border-radius: 4px;">
                                <span style="color: #FF5A00; font-size: 12px; font-weight: 600; text-transform: uppercase;">
                                    PROJECT: {project_title}
                                </span>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 20px 40px 30px 40px;">
                            <h2 style="color: #000F1B; font-size: 20px; font-weight: 700; margin: 0 0 12px 0;">
                                {notification_title}
                            </h2>
                            <p style="font-size: 15px; line-height: 1.6; color: #333333; margin: 0 0 16px 0;">
                                Dear <strong>{client_greeting}</strong>,
                            </p>
                            <p style="font-size: 15px; line-height: 1.6; color: #4A4A4A; margin: 0 0 24px 0; background-color: #FAFAFA; padding: 16px; border-radius: 8px; border: 1px solid #EAEAEA;">
                                {notification_message}
                            </p>
                            <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0 12px 0;">
                                <tr>
                                    <td align="center" style="border-radius: 8px; background-color: #FF5A00;">
                                        <a href="{full_link}" target="_blank" style="font-size: 15px; color: #FFFFFF; text-decoration: none; border-radius: 8px; padding: 14px 28px; display: inline-block; font-weight: 600;">
                                            View Live Portal Update &rarr;
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            <p style="font-size: 12px; color: #888888; margin-top: 16px;">
                                Or copy & paste: <a href="{full_link}" style="color: #FF5A00;">{full_link}</a>
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #F9F9F9; padding: 24px 40px; text-align: center; border-top: 1px solid #EEEEEE; font-size: 12px; color: #777777;">
                            <p style="margin: 0 0 6px 0; font-weight: 600; color: #000F1B;">
                                ConstructONS™ — India's First Integrated Construction Ecosystem
                            </p>
                            <p style="margin: 0; color: #999; font-size: 11px;">
                                Automated notification from your ConstructONS Customer Portal.
                            </p>
                        </td>
                    </tr>
                </table>
            </td></tr>
        </table>
    </body>
    </html>
    """


async def send_email_via_resend(
    to_email: str,
    subject: str,
    html_content: str,
    attachments: Optional[list] = None
) -> bool:
    """Dispatches email via Resend. Now supports optional PDF attachments."""
    if not RESEND_API_KEY:
        logger.warning("[Resend] RESEND_API_KEY not configured. Skipped.")
        return False
    if not to_email or "@" not in to_email:
        logger.warning(f"[Resend] Invalid email '{to_email}'. Skipped.")
        return False

    payload = {
        "from": SENDER_EMAIL,
        "to": [to_email.strip().lower()],
        "subject": subject,
        "html": html_content,
    }

    # ★ NEW: Attachments support (base64-encoded)
    if attachments:
        payload["attachments"] = attachments

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                "https://api.resend.com/emails",
                json=payload,
                headers={
                    "Authorization": f"Bearer {RESEND_API_KEY}",
                    "Content-Type": "application/json",
                },
            )
            if response.status_code in (200, 201):
                logger.info(f"[Resend] Sent to {to_email}. ID: {response.json().get('id')}")
                return True
            else:
                logger.error(f"[Resend] Failed {response.status_code}: {response.text}")
                return False
    except Exception as e:
        logger.error(f"[Resend] Exception: {e}")
        return False


async def send_project_notification_email(
    to_email: str, customer_name: str, project_title: str,
    notification_title: str, notification_message: str, portal_link: str
):
    """Standard notification email (no attachment)."""
    subject = f"[{project_title}] {notification_title} — ConstructONS"
    html = _get_branded_html_template(
        customer_name, project_title,
        notification_title, notification_message, portal_link
    )
    await send_email_via_resend(to_email, subject, html)


# ★ NEW: Send receipt email with PDF attachment
async def send_receipt_email(
    to_email: str,
    customer_name: str,
    project_title: str,
    receipt_number: str,
    amount: float,
    method: str,
    date: str,
    linked_invoice_number: str = None,
    pdf_bytes: bytes = None,
):
    """Send payment receipt email with PDF attachment to client."""
    subject = f"Payment Receipt {receipt_number} — {project_title} — ConstructONS"

    invoice_line = (
        f"Linked to Proforma Invoice <strong>{linked_invoice_number}</strong>."
        if linked_invoice_number
        else "General payment (not linked to a specific proforma invoice)."
    )

    message = f"""
        We have received your payment of <strong>₹{amount:,.2f}</strong> via <strong>{method}</strong> on <strong>{date}</strong>.<br/><br/>
        {invoice_line}<br/><br/>
        Your official payment receipt is attached to this email as a PDF. 
        You can also download it anytime from your client portal.
    """

    html = _get_branded_html_template(
        customer_name=customer_name,
        project_title=project_title,
        notification_title=f"Payment Received — {receipt_number}",
        notification_message=message,
        portal_link="/portal/payments",
    )

    attachments = None
    if pdf_bytes:
        b64_content = base64.b64encode(pdf_bytes).decode("utf-8")
        attachments = [
            {
                "filename": f"Receipt_{receipt_number}.pdf",
                "content": b64_content,
            }
        ]

    await send_email_via_resend(to_email, subject, html, attachments=attachments)


# ★ Alias used by payments.py invoice-edit email
async def send_email(to_email: str, subject: str, html_content: str):
    """Simple wrapper for backwards compatibility."""
    await send_email_via_resend(to_email, subject, html_content)