"""
routes/email.py
Endpoint: POST /api/send-selection-email
Allows an admin to send a selection/rejection email to a candidate.
"""

from flask import Blueprint, request, jsonify
from flask_mail import Message
from extensions import mail
from utils.auth import admin_required

email_bp = Blueprint("email", __name__)


@email_bp.route("/send-selection-email", methods=["POST"])
@admin_required
def send_selection_email():
    """
    Body (JSON):
      {
        "candidate_email": "jane@example.com",
        "candidate_name":  "Jane Smith",
        "job_title":       "Python Developer",
        "match_score":     85.4,
        "message":         "...",           ← optional custom message
        "status":          "selected" | "rejected"
      }
    """
    data = request.get_json(silent=True) or {}

    candidate_email = data.get("candidate_email", "").strip()
    candidate_name  = data.get("candidate_name", "Candidate").strip()
    job_title       = data.get("job_title", "the position").strip()
    match_score     = data.get("match_score", 0)
    custom_message  = data.get("message", "").strip()
    status          = data.get("status", "selected").lower()

    if not candidate_email:
        return jsonify({"error": "candidate_email is required"}), 400

    # ── Build subject & body ───────────────────────────────────────────────────
    if status == "selected":
        subject = f"Congratulations! You've been selected for {job_title}"
        default_body = (
            f"Dear {candidate_name},\n\n"
            f"We are delighted to inform you that you have been selected for the role of "
            f"{job_title} based on your application.\n\n"
            f"Your AI match score for this role was {match_score}%.\n\n"
            f"Our HR team will be in touch shortly with the next steps.\n\n"
            f"Congratulations once again!\n\n"
            f"Best regards,\nHR Team"
        )
    else:
        subject = f"Update on your application for {job_title}"
        default_body = (
            f"Dear {candidate_name},\n\n"
            f"Thank you for your interest in the role of {job_title} and for taking the "
            f"time to apply.\n\n"
            f"After careful consideration, we regret to inform you that we will not be "
            f"moving forward with your application at this time.\n\n"
            f"We encourage you to apply for future openings that match your profile.\n\n"
            f"Best regards,\nHR Team"
        )

    body = custom_message if custom_message else default_body

    # ── Send email ─────────────────────────────────────────────────────────────
    try:
        msg = Message(
            subject=subject,
            recipients=[candidate_email],
            body=body,
        )
        mail.send(msg)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            "error": "Failed to send email. Please check your SMTP settings in backend/.env.",
            "detail": str(e),
        }), 500

    return jsonify({
        "message": f"Email sent successfully to {candidate_email}",
        "status": status,
    }), 200
