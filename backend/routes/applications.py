"""
routes/applications.py
Full candidate job application lifecycle.

Endpoints:
  POST   /api/apply-job                    — candidate applies for a job
  GET    /api/applications/my              — candidate: see own applications
  GET    /api/applications/all             — admin: all applications + candidate details
  PUT    /api/applications/<id>/status     — admin: update status (shortlist/reject/hire)
  DELETE /api/applications/<id>            — candidate: withdraw application
"""

import datetime
from flask import Blueprint, request, jsonify
from bson import ObjectId
from utils.db import get_db
from utils.auth import token_required, admin_required
from models.schemas import application_schema

applications_bp = Blueprint("applications", __name__)

STATUS_OPTIONS = {"pending", "shortlisted", "rejected", "hired"}


# ── Helper ──────────────────────────────────────────────────────────────────
def _serialize(app: dict, include_candidate: bool = False, include_job: bool = False) -> dict:
    out = {
        "id":                  str(app["_id"]),
        "user_id":             str(app["user_id"]),
        "job_id":              str(app["job_id"]),
        "resume_id":           str(app["resume_id"]) if app.get("resume_id") else None,
        "cover_letter":        app.get("cover_letter", ""),
        "years_of_experience": app.get("years_of_experience", ""),
        "current_ctc":         app.get("current_ctc", ""),
        "expected_ctc":        app.get("expected_ctc", ""),
        "notice_period":       app.get("notice_period", ""),
        "portfolio_url":       app.get("portfolio_url", ""),
        "status":              app.get("status", "pending"),
        "applied_at":          app.get("applied_at", "").isoformat() if app.get("applied_at") else None,
        "updated_at":          app.get("updated_at", "").isoformat() if app.get("updated_at") else None,
    }
    if include_candidate:
        out["candidate_name"]  = app.get("candidate_name", "")
        out["candidate_email"] = app.get("candidate_email", "")
    if include_job:
        out["job_title"] = app.get("job_title", "")
    return out


# ── POST /api/apply-job ──────────────────────────────────────────────────────
@applications_bp.route("/apply-job", methods=["POST"])
@token_required
def apply_job():
    data = request.get_json(silent=True) or {}

    job_id               = data.get("job_id", "").strip()
    resume_id            = data.get("resume_id", "").strip()
    cover_letter         = data.get("cover_letter", "").strip()
    years_of_experience  = data.get("years_of_experience", "").strip()
    current_ctc          = data.get("current_ctc", "").strip()
    expected_ctc         = data.get("expected_ctc", "").strip()
    notice_period        = data.get("notice_period", "").strip()
    portfolio_url        = data.get("portfolio_url", "").strip()

    if not job_id:
        return jsonify({"error": "job_id is required"}), 400

    db = get_db()

    # Validate job exists and is active
    try:
        job = db.jobs.find_one({"_id": ObjectId(job_id), "is_active": True})
    except Exception:
        return jsonify({"error": "Invalid job_id"}), 400

    if not job:
        return jsonify({"error": "Job not found or is no longer active"}), 404

    # Prevent duplicate applications
    existing = db.applications.find_one({
        "user_id": ObjectId(request.user_id),
        "job_id":  ObjectId(job_id),
    })
    if existing:
        return jsonify({"error": "You have already applied for this job"}), 409

    # Validate resume belongs to user (if provided)
    if resume_id:
        try:
            resume = db.resumes.find_one({
                "_id":     ObjectId(resume_id),
                "user_id": ObjectId(request.user_id),
            })
            if not resume:
                return jsonify({"error": "Resume not found or does not belong to you"}), 404
        except Exception:
            return jsonify({"error": "Invalid resume_id"}), 400
    else:
        resume_id = None

    doc = application_schema(
        user_id              = request.user_id,
        job_id               = job_id,
        resume_id            = resume_id or "",
        cover_letter         = cover_letter,
        years_of_experience  = years_of_experience,
        current_ctc          = current_ctc,
        expected_ctc         = expected_ctc,
        notice_period        = notice_period,
        portfolio_url        = portfolio_url,
    )
    # Fix: if resume_id is empty string, store None
    if not resume_id:
        doc["resume_id"] = None

    result = db.applications.insert_one(doc)
    return jsonify({
        "message":        "Application submitted successfully! HR will review your application.",
        "application_id": str(result.inserted_id),
        "job_title":      job.get("title", ""),
        "status":         "pending",
    }), 201


# ── GET /api/applications/my ─────────────────────────────────────────────────
@applications_bp.route("/applications/my", methods=["GET"])
@token_required
def my_applications():
    db   = get_db()
    apps = list(db.applications.find(
        {"user_id": ObjectId(request.user_id)}
    ).sort("applied_at", -1))

    out = []
    for app in apps:
        # Fetch job details
        try:
            job = db.jobs.find_one({"_id": app["job_id"]}, {"title": 1, "location": 1, "employment_type": 1})
        except Exception:
            job = None

        serialized = _serialize(app)
        serialized["job_title"]        = job.get("title", "Unknown") if job else "Unknown"
        serialized["job_location"]     = job.get("location", "") if job else ""
        serialized["employment_type"]  = job.get("employment_type", "") if job else ""
        out.append(serialized)

    return jsonify(out), 200


# ── GET /api/applications/all ────────────────────────────────────────────────
@applications_bp.route("/applications/all", methods=["GET"])
@admin_required
def all_applications():
    db  = get_db()
    job_id     = request.args.get("job_id")
    status_filter = request.args.get("status")

    query = {}
    if job_id:
        try:
            query["job_id"] = ObjectId(job_id)
        except Exception:
            return jsonify({"error": "Invalid job_id"}), 400
    if status_filter and status_filter in STATUS_OPTIONS:
        query["status"] = status_filter

    apps = list(db.applications.find(query).sort("applied_at", -1))
    out  = []
    for app in apps:
        # Fetch candidate
        try:
            user = db.users.find_one({"_id": app["user_id"]}, {"name": 1, "email": 1})
        except Exception:
            user = None
        # Fetch job
        try:
            job = db.jobs.find_one({"_id": app["job_id"]}, {"title": 1, "location": 1})
        except Exception:
            job = None

        serialized = _serialize(app, include_candidate=True, include_job=True)
        serialized["candidate_name"]  = user.get("name", "Unknown") if user else "Unknown"
        serialized["candidate_email"] = user.get("email", "")       if user else ""
        serialized["job_title"]       = job.get("title", "Unknown") if job else "Unknown"
        serialized["job_location"]    = job.get("location", "")     if job else ""
        out.append(serialized)

    return jsonify({
        "total":        len(out),
        "applications": out,
    }), 200


# ── PUT /api/applications/<id>/status ────────────────────────────────────────
@applications_bp.route("/applications/<app_id>/status", methods=["PUT"])
@admin_required
def update_status(app_id):
    data   = request.get_json(silent=True) or {}
    status = data.get("status", "").lower()

    if status not in STATUS_OPTIONS:
        return jsonify({"error": f"Invalid status. Choose from: {', '.join(STATUS_OPTIONS)}"}), 400

    db = get_db()
    try:
        result = db.applications.update_one(
            {"_id": ObjectId(app_id)},
            {"$set": {"status": status, "updated_at": datetime.datetime.utcnow()}}
        )
    except Exception:
        return jsonify({"error": "Invalid application_id"}), 400

    if result.matched_count == 0:
        return jsonify({"error": "Application not found"}), 404

    return jsonify({"message": f"Application status updated to '{status}'", "status": status}), 200


# ── DELETE /api/applications/<id> ─────────────────────────────────────────────
@applications_bp.route("/applications/<app_id>", methods=["DELETE"])
@token_required
def withdraw_application(app_id):
    db = get_db()
    try:
        result = db.applications.delete_one({
            "_id":     ObjectId(app_id),
            "user_id": ObjectId(request.user_id),
            "status":  "pending",   # can only withdraw pending applications
        })
    except Exception:
        return jsonify({"error": "Invalid application_id"}), 400

    if result.deleted_count == 0:
        return jsonify({"error": "Application not found or cannot be withdrawn (not pending)"}), 404

    return jsonify({"message": "Application withdrawn successfully"}), 200
