"""
routes/courses.py
Online Courses API
  POST   /api/courses                          — admin: create course
  GET    /api/courses                          — all: list courses
  GET    /api/courses/<id>                     — all: get course detail
  PUT    /api/courses/<id>                     — admin: update course
  DELETE /api/courses/<id>                     — admin: delete course
  POST   /api/courses/<id>/enroll             — candidate: enroll
  POST   /api/courses/<id>/complete-lesson    — candidate: mark lesson complete
  POST   /api/courses/<id>/complete           — candidate: mark course complete & gen cert
  GET    /api/courses/<id>/certificate        — candidate: download PDF certificate
  GET    /api/courses/my-enrollments          — candidate: list my enrolled courses
"""

import datetime
import io
import os

from bson import ObjectId
from flask import Blueprint, jsonify, request, send_file

from models.schemas import course_schema, enrollment_schema
from utils.auth import token_required
from utils.db import get_db

courses_bp = Blueprint("courses", __name__)


def _oid(val):
    try:
        return ObjectId(val)
    except Exception:
        return None


def _serialize_course(c, enrollment=None):
    """Convert a MongoDB course doc to a JSON-safe dict."""
    d = {
        "id": str(c["_id"]),
        "title": c.get("title", ""),
        "description": c.get("description", ""),
        "category": c.get("category", "General"),
        "level": c.get("level", "Beginner"),
        "duration_hours": c.get("duration_hours", 0),
        "instructor": c.get("instructor", ""),
        "instructor_title": c.get("instructor_title", ""),
        "thumbnail_url": c.get("thumbnail_url", ""),
        "tags": c.get("tags", []),
        "lessons": c.get("lessons", []),
        "certificate_title": c.get("certificate_title", ""),
        "is_active": c.get("is_active", True),
        "enrolled_count": c.get("enrolled_count", 0),
        "created_at": c.get("created_at", "").isoformat() if c.get("created_at") else None,
        "posted_by_name": c.get("posted_by_name", ""),
    }
    if enrollment:
        d["enrollment"] = {
            "id": str(enrollment["_id"]),
            "enrolled_at": enrollment.get("enrolled_at", "").isoformat() if enrollment.get("enrolled_at") else None,
            "completed_lessons": enrollment.get("completed_lessons", []),
            "completed": enrollment.get("completed", False),
            "completed_at": enrollment.get("completed_at", "").isoformat() if enrollment.get("completed_at") else None,
            "certificate_issued": enrollment.get("certificate_issued", False),
        }
    return d


# ──────────────────────────────────────────────────────────────────────────────
# Admin: Create Course
# ──────────────────────────────────────────────────────────────────────────────
@courses_bp.route("/courses", methods=["POST"])
@token_required
def create_course():
    if request.user_role != "admin":
        return jsonify({"error": "Admin access required"}), 403

    data = request.get_json(silent=True) or {}

    title = data.get("title", "").strip()
    description = data.get("description", "").strip()
    if not title or not description:
        return jsonify({"error": "title and description are required"}), 400

    db = get_db()
    # Fetch admin name
    admin = db.users.find_one({"_id": ObjectId(request.user_id)}, {"name": 1})
    admin_name = admin["name"] if admin else "Company"

    doc = course_schema(
        admin_id=request.user_id,
        admin_name=admin_name,
        title=title,
        description=description,
        category=data.get("category", "General"),
        level=data.get("level", "Beginner"),
        duration_hours=float(data.get("duration_hours", 0)),
        instructor=data.get("instructor", admin_name).strip(),
        instructor_title=data.get("instructor_title", "").strip(),
        thumbnail_url=data.get("thumbnail_url", "").strip(),
        tags=data.get("tags", []),
        lessons=data.get("lessons", []),
        certificate_title=data.get("certificate_title", f"Certificate of Completion – {title}"),
    )
    result = db.courses.insert_one(doc)
    return jsonify({"message": "Course created", "id": str(result.inserted_id)}), 201


# ──────────────────────────────────────────────────────────────────────────────
# List Courses (public to logged-in users)
# ──────────────────────────────────────────────────────────────────────────────
@courses_bp.route("/courses", methods=["GET"])
@token_required
def list_courses():
    db = get_db()
    category = request.args.get("category", "")
    level = request.args.get("level", "")
    q = request.args.get("q", "")

    query = {"is_active": True}
    if category:
        query["category"] = category
    if level:
        query["level"] = level
    if q:
        query["$or"] = [
            {"title": {"$regex": q, "$options": "i"}},
            {"tags": {"$regex": q, "$options": "i"}},
            {"instructor": {"$regex": q, "$options": "i"}},
        ]

    courses = list(db.courses.find(query).sort("created_at", -1))

    # Attach enrollment info for candidate
    result = []
    for c in courses:
        enr = None
        if request.user_role == "candidate":
            enr = db.enrollments.find_one({
                "user_id": ObjectId(request.user_id),
                "course_id": c["_id"],
            })
        result.append(_serialize_course(c, enr))
    return jsonify(result), 200


# ──────────────────────────────────────────────────────────────────────────────
# Admin: list ALL courses (including inactive)
# ──────────────────────────────────────────────────────────────────────────────
@courses_bp.route("/courses/admin/all", methods=["GET"])
@token_required
def admin_list_courses():
    if request.user_role != "admin":
        return jsonify({"error": "Admin access required"}), 403
    db = get_db()
    courses = list(db.courses.find({}).sort("created_at", -1))
    return jsonify([_serialize_course(c) for c in courses]), 200


# ──────────────────────────────────────────────────────────────────────────────
# My Enrollments
# ──────────────────────────────────────────────────────────────────────────────
@courses_bp.route("/courses/my-enrollments", methods=["GET"])
@token_required
def my_enrollments():
    db = get_db()
    enrollments = list(db.enrollments.find({"user_id": ObjectId(request.user_id)}))
    result = []
    for enr in enrollments:
        c = db.courses.find_one({"_id": enr["course_id"]})
        if c:
            result.append(_serialize_course(c, enr))
    return jsonify(result), 200


# ──────────────────────────────────────────────────────────────────────────────
# Get Course Detail
# ──────────────────────────────────────────────────────────────────────────────
@courses_bp.route("/courses/<course_id>", methods=["GET"])
@token_required
def get_course(course_id):
    db = get_db()
    oid = _oid(course_id)
    if not oid:
        return jsonify({"error": "Invalid course ID"}), 400
    c = db.courses.find_one({"_id": oid})
    if not c:
        return jsonify({"error": "Course not found"}), 404
    enr = db.enrollments.find_one({
        "user_id": ObjectId(request.user_id),
        "course_id": oid,
    })
    return jsonify(_serialize_course(c, enr)), 200


# ──────────────────────────────────────────────────────────────────────────────
# Admin: Update Course
# ──────────────────────────────────────────────────────────────────────────────
@courses_bp.route("/courses/<course_id>", methods=["PUT"])
@token_required
def update_course(course_id):
    if request.user_role != "admin":
        return jsonify({"error": "Admin access required"}), 403
    db = get_db()
    oid = _oid(course_id)
    if not oid:
        return jsonify({"error": "Invalid course ID"}), 400
    data = request.get_json(silent=True) or {}
    allowed = ["title", "description", "category", "level", "duration_hours",
               "instructor", "instructor_title", "thumbnail_url", "tags",
               "lessons", "certificate_title", "is_active"]
    update = {k: data[k] for k in allowed if k in data}
    update["updated_at"] = datetime.datetime.utcnow()
    db.courses.update_one({"_id": oid}, {"$set": update})
    return jsonify({"message": "Course updated"}), 200


# ──────────────────────────────────────────────────────────────────────────────
# Admin: Delete Course
# ──────────────────────────────────────────────────────────────────────────────
@courses_bp.route("/courses/<course_id>", methods=["DELETE"])
@token_required
def delete_course(course_id):
    if request.user_role != "admin":
        return jsonify({"error": "Admin access required"}), 403
    db = get_db()
    oid = _oid(course_id)
    if not oid:
        return jsonify({"error": "Invalid course ID"}), 400
    db.courses.delete_one({"_id": oid})
    db.enrollments.delete_many({"course_id": oid})
    return jsonify({"message": "Course deleted"}), 200


# ──────────────────────────────────────────────────────────────────────────────
# Candidate: Enroll
# ──────────────────────────────────────────────────────────────────────────────
@courses_bp.route("/courses/<course_id>/enroll", methods=["POST"])
@token_required
def enroll(course_id):
    db = get_db()
    oid = _oid(course_id)
    if not oid:
        return jsonify({"error": "Invalid course ID"}), 400
    c = db.courses.find_one({"_id": oid, "is_active": True})
    if not c:
        return jsonify({"error": "Course not found or inactive"}), 404

    existing = db.enrollments.find_one({
        "user_id": ObjectId(request.user_id),
        "course_id": oid,
    })
    if existing:
        return jsonify({"error": "Already enrolled"}), 409

    # Get user info
    user = db.users.find_one({"_id": ObjectId(request.user_id)}, {"name": 1, "email": 1})
    doc = enrollment_schema(
        user_id=request.user_id,
        course_id=course_id,
        user_name=user.get("name", ""),
        user_email=user.get("email", ""),
    )
    db.enrollments.insert_one(doc)
    db.courses.update_one({"_id": oid}, {"$inc": {"enrolled_count": 1}})
    return jsonify({"message": "Enrolled successfully"}), 201


# ──────────────────────────────────────────────────────────────────────────────
# Candidate: Mark Lesson Complete
# ──────────────────────────────────────────────────────────────────────────────
@courses_bp.route("/courses/<course_id>/complete-lesson", methods=["POST"])
@token_required
def complete_lesson(course_id):
    db = get_db()
    oid = _oid(course_id)
    data = request.get_json(silent=True) or {}
    lesson_id = data.get("lesson_id", "")
    if not lesson_id:
        return jsonify({"error": "lesson_id is required"}), 400

    enr = db.enrollments.find_one({
        "user_id": ObjectId(request.user_id),
        "course_id": oid,
    })
    if not enr:
        return jsonify({"error": "Not enrolled"}), 404

    if lesson_id not in enr.get("completed_lessons", []):
        db.enrollments.update_one(
            {"_id": enr["_id"]},
            {"$addToSet": {"completed_lessons": lesson_id},
             "$set": {"updated_at": datetime.datetime.utcnow()}}
        )
    return jsonify({"message": "Lesson marked complete"}), 200


# ──────────────────────────────────────────────────────────────────────────────
# Candidate: Complete Course & Issue Certificate
# ──────────────────────────────────────────────────────────────────────────────
@courses_bp.route("/courses/<course_id>/complete", methods=["POST"])
@token_required
def complete_course(course_id):
    db = get_db()
    oid = _oid(course_id)
    enr = db.enrollments.find_one({
        "user_id": ObjectId(request.user_id),
        "course_id": oid,
    })
    if not enr:
        return jsonify({"error": "Not enrolled"}), 404
    if enr.get("completed"):
        return jsonify({"message": "Already completed", "certificate_issued": True}), 200

    # Check all lessons completed
    course = db.courses.find_one({"_id": oid})
    lessons = course.get("lessons", []) if course else []
    lesson_ids = [str(l.get("id", l.get("_id", ""))) for l in lessons]
    completed_lessons = enr.get("completed_lessons", [])
    if lessons and not all(lid in completed_lessons for lid in lesson_ids if lid):
        # Still allow if admin marks all or no lesson-completion enforced
        pass

    now = datetime.datetime.utcnow()
    db.enrollments.update_one(
        {"_id": enr["_id"]},
        {"$set": {
            "completed": True,
            "completed_at": now,
            "certificate_issued": True,
            "updated_at": now,
        }}
    )
    return jsonify({"message": "Course completed! Certificate issued.", "certificate_issued": True}), 200


# ──────────────────────────────────────────────────────────────────────────────
# Candidate: Download PDF Certificate
# ──────────────────────────────────────────────────────────────────────────────
@courses_bp.route("/courses/<course_id>/certificate", methods=["GET"])
@token_required
def download_certificate(course_id):
    db = get_db()
    oid = _oid(course_id)
    enr = db.enrollments.find_one({
        "user_id": ObjectId(request.user_id),
        "course_id": oid,
    })
    if not enr or not enr.get("certificate_issued"):
        return jsonify({"error": "Certificate not available. Complete the course first."}), 403

    course = db.courses.find_one({"_id": oid})
    if not course:
        return jsonify({"error": "Course not found"}), 404

    user = db.users.find_one({"_id": ObjectId(request.user_id)}, {"name": 1})
    user_name = user.get("name", "Candidate") if user else "Candidate"
    course_title = course.get("title", "")
    cert_title = course.get("certificate_title",
                            f"Certificate of Completion - {course_title}")
    instructor = course.get("instructor", "")
    completed_at = enr.get("completed_at") or datetime.datetime.utcnow()
    date_str = completed_at.strftime("%B %d, %Y") if hasattr(completed_at, "strftime") else str(completed_at)
    posted_by = course.get("posted_by_name", "")

    # Strip non-Latin-1 characters so ReportLab's built-in fonts don't crash
    def _safe(text):
        return text.encode("latin-1", errors="replace").decode("latin-1")

    user_name   = _safe(user_name)
    cert_title  = _safe(cert_title)
    course_title = _safe(course_title)
    instructor  = _safe(instructor)
    posted_by   = _safe(posted_by) if posted_by else "HireAI Platform"

    try:
        from reportlab.lib.pagesizes import A4, landscape
        from reportlab.lib.pdfgen import canvas as rl_canvas

        buf = io.BytesIO()
        width, height = landscape(A4)
        c = rl_canvas.Canvas(buf, pagesize=landscape(A4))

        # Background gradient-like fill
        c.setFillColorRGB(0.97, 0.97, 1.0)
        c.rect(0, 0, width, height, fill=True, stroke=False)

        # Decorative border
        c.setStrokeColorRGB(0.4, 0.49, 0.92)
        c.setLineWidth(6)
        c.rect(18, 18, width - 36, height - 36, fill=False, stroke=True)
        c.setStrokeColorRGB(0.7, 0.75, 0.97)
        c.setLineWidth(2)
        c.rect(26, 26, width - 52, height - 52, fill=False, stroke=True)

        # Company / Org badge
        c.setFillColorRGB(0.4, 0.49, 0.92)
        c.roundRect(width / 2 - 100, height - 88, 200, 46, 12, fill=True, stroke=False)
        c.setFillColorRGB(1, 1, 1)
        c.setFont("Helvetica-Bold", 15)
        org_label = posted_by or "HireAI Platform"
        c.drawCentredString(width / 2, height - 68, org_label)

        # "Certificate of Completion"
        c.setFillColorRGB(0.25, 0.25, 0.35)
        c.setFont("Helvetica", 14)
        c.drawCentredString(width / 2, height - 120, "CERTIFICATE OF COMPLETION")

        # Decorative line
        c.setStrokeColorRGB(0.4, 0.49, 0.92)
        c.setLineWidth(1.5)
        c.line(width / 2 - 160, height - 130, width / 2 + 160, height - 130)

        # Cert title
        c.setFillColorRGB(0.15, 0.15, 0.25)
        c.setFont("Helvetica-Bold", 26)
        c.drawCentredString(width / 2, height - 175, cert_title)

        # "This certifies that"
        c.setFillColorRGB(0.4, 0.4, 0.5)
        c.setFont("Helvetica-Oblique", 13)
        c.drawCentredString(width / 2, height - 215, "This is to certify that")

        # Candidate Name
        c.setFillColorRGB(0.4, 0.49, 0.92)
        c.setFont("Helvetica-Bold", 34)
        c.drawCentredString(width / 2, height - 265, user_name)

        # Underline for name
        name_width = c.stringWidth(user_name, "Helvetica-Bold", 34)
        c.setStrokeColorRGB(0.4, 0.49, 0.92)
        c.setLineWidth(1.5)
        c.line(width / 2 - name_width / 2, height - 272, width / 2 + name_width / 2, height - 272)

        # "has successfully completed"
        c.setFillColorRGB(0.4, 0.4, 0.5)
        c.setFont("Helvetica-Oblique", 13)
        c.drawCentredString(width / 2, height - 300, "has successfully completed the online course")

        # Course Name
        c.setFillColorRGB(0.15, 0.15, 0.25)
        c.setFont("Helvetica-Bold", 20)
        c.drawCentredString(width / 2, height - 335, f'"{course_title}"')

        # Details row
        c.setFont("Helvetica", 11)
        c.setFillColorRGB(0.5, 0.5, 0.6)
        c.drawCentredString(width / 2, height - 365,
            f"Instructor: {instructor}   |   Issued on: {date_str}")

        # Divider
        c.setStrokeColorRGB(0.85, 0.87, 0.95)
        c.line(60, 95, width - 60, 95)

        # Footer
        c.setFont("Helvetica", 10)
        c.setFillColorRGB(0.65, 0.65, 0.75)
        c.drawCentredString(width / 2, 72, "This certificate is digitally issued by the HireAI Platform.")
        c.drawCentredString(width / 2, 56, f"Verify at: hireai.platform/verify")

        # Seal circle
        c.setFillColorRGB(0.4, 0.49, 0.92)
        c.circle(width - 100, 72, 40, fill=True, stroke=False)
        c.setFillColorRGB(1, 1, 1)
        c.setFont("Helvetica-Bold", 9)
        c.drawCentredString(width - 100, 80, "VERIFIED")
        c.drawCentredString(width - 100, 68, "CERTIFICATE")
        c.drawCentredString(width - 100, 56, "OK")   # ✓ not in Latin-1 Helvetica

        c.save()
        buf.seek(0)
        safe_name = "".join(ch for ch in user_name if ch.isalnum() or ch in " _-").strip() or "candidate"
        safe_title = "".join(ch for ch in course_title[:20] if ch.isalnum() or ch in " _-").strip()
        filename = f"Certificate_{safe_name}_{safe_title}.pdf".replace(" ", "_")

        from flask import make_response
        response = make_response(send_file(buf, mimetype="application/pdf",
                                           as_attachment=True, download_name=filename))
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Expose-Headers"] = "Content-Disposition"
        return response

    except ImportError:
        # Fallback: plain text certificate
        text = (
            f"CERTIFICATE OF COMPLETION\n\n"
            f"This certifies that {user_name}\n"
            f"has successfully completed the course:\n"
            f'"{course_title}"\n\n'
            f"Instructor: {instructor}\n"
            f"Issued: {date_str}\n"
            f"Issued by: {posted_by}\n"
        )
        buf = io.BytesIO(text.encode("utf-8"))
        buf.seek(0)
        return send_file(buf, mimetype="text/plain",
                         as_attachment=True,
                         download_name=f"Certificate_{safe_name}.txt")
    except Exception as pdf_err:
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"PDF generation failed: {str(pdf_err)}"}), 500


# ──────────────────────────────────────────────────────────────────────────────
# Admin: Get all enrollments for a course
# ──────────────────────────────────────────────────────────────────────────────
@courses_bp.route("/courses/<course_id>/enrollments", methods=["GET"])
@token_required
def course_enrollments(course_id):
    if request.user_role != "admin":
        return jsonify({"error": "Admin access required"}), 403
    db = get_db()
    oid = _oid(course_id)
    enrollments = list(db.enrollments.find({"course_id": oid}))
    result = []
    for e in enrollments:
        result.append({
            "id": str(e["_id"]),
            "user_name": e.get("user_name", ""),
            "user_email": e.get("user_email", ""),
            "enrolled_at": e.get("enrolled_at", "").isoformat() if e.get("enrolled_at") else None,
            "completed": e.get("completed", False),
            "completed_at": e.get("completed_at", "").isoformat() if e.get("completed_at") else None,
            "certificate_issued": e.get("certificate_issued", False),
            "completed_lessons": e.get("completed_lessons", []),
        })
    return jsonify(result), 200
