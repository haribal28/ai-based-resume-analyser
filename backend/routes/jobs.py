"""
routes/jobs.py
Endpoints: /api/upload-job, /api/jobs, /api/jobs/<id>

HR can now provide:
  - hr_keywords  : comma-separated keywords used directly for scoring
  - experience_level : "Fresher" / "1-3 years" / "3-5 years" / "5+ years"
  - salary_min / salary_max : INR lakhs per annum
  - location     : city / remote
  - employment_type : Full-time / Part-time / Remote / Contract
"""

from flask import Blueprint, request, jsonify
from bson import ObjectId
from utils.db import get_db
from utils.auth import token_required, admin_required
from models.schemas import job_schema
from ml.resume_matcher import extract_skills, extract_hr_keywords

jobs_bp = Blueprint("jobs", __name__)


@jobs_bp.route("/upload-job", methods=["POST"])
@admin_required
def upload_job():
    data = request.get_json(silent=True) or {}
    title            = data.get("title", "").strip()
    description      = data.get("description", "").strip()
    hr_keywords_raw  = data.get("hr_keywords", "").strip()           # HR keyword input string
    experience_level = data.get("experience_level", "").strip()
    salary_min       = int(data.get("salary_min", 0) or 0)
    salary_max       = int(data.get("salary_max", 0) or 0)
    location         = data.get("location", "").strip()
    employment_type  = data.get("employment_type", "Full-time").strip()

    if not title or not description:
        return jsonify({"error": "title and description are required"}), 400

    required_skills = extract_skills(description)
    hr_keywords     = extract_hr_keywords(hr_keywords_raw) if hr_keywords_raw else []

    doc = job_schema(
        request.user_id, title, description, required_skills,
        hr_keywords=hr_keywords,
        experience_level=experience_level,
        salary_min=salary_min,
        salary_max=salary_max,
        location=location,
        employment_type=employment_type,
    )

    db = get_db()
    result = db.jobs.insert_one(doc)

    return jsonify({
        "message":          "Job posted successfully",
        "job_id":           str(result.inserted_id),
        "title":            title,
        "required_skills":  required_skills,
        "hr_keywords":      hr_keywords,
        "experience_level": experience_level,
        "employment_type":  employment_type,
        "location":         location,
    }), 201


@jobs_bp.route("/jobs", methods=["GET"])
@token_required
def list_jobs():
    db = get_db()
    jobs = list(db.jobs.find({"is_active": True}))
    out = []
    for j in jobs:
        out.append({
            "id":               str(j["_id"]),
            "title":            j.get("title"),
            "description":      j.get("description"),
            "required_skills":  j.get("required_skills", []),
            "hr_keywords":      j.get("hr_keywords", []),
            "experience_level": j.get("experience_level", ""),
            "salary_min":       j.get("salary_min", 0),
            "salary_max":       j.get("salary_max", 0),
            "location":         j.get("location", ""),
            "employment_type":  j.get("employment_type", "Full-time"),
            "created_at":       j.get("created_at", "").isoformat() if j.get("created_at") else None,
        })
    return jsonify(out), 200


@jobs_bp.route("/jobs/<job_id>", methods=["GET"])
@token_required
def get_job(job_id):
    db = get_db()
    try:
        job = db.jobs.find_one({"_id": ObjectId(job_id)})
    except Exception:
        return jsonify({"error": "Invalid job_id"}), 400
    if not job:
        return jsonify({"error": "Job not found"}), 404
    return jsonify({
        "id":               str(job["_id"]),
        "title":            job.get("title"),
        "description":      job.get("description"),
        "required_skills":  job.get("required_skills", []),
        "hr_keywords":      job.get("hr_keywords", []),
        "experience_level": job.get("experience_level", ""),
        "salary_min":       job.get("salary_min", 0),
        "salary_max":       job.get("salary_max", 0),
        "location":         job.get("location", ""),
        "employment_type":  job.get("employment_type", "Full-time"),
        "is_active":        job.get("is_active"),
        "created_at":       job.get("created_at", "").isoformat() if job.get("created_at") else None,
    }), 200


@jobs_bp.route("/jobs/<job_id>", methods=["DELETE"])
@admin_required
def deactivate_job(job_id):
    db = get_db()
    try:
        result = db.jobs.update_one(
            {"_id": ObjectId(job_id)},
            {"$set": {"is_active": False}}
        )
    except Exception:
        return jsonify({"error": "Invalid job_id"}), 400
    if result.matched_count == 0:
        return jsonify({"error": "Job not found"}), 404
    return jsonify({"message": "Job deactivated"}), 200
