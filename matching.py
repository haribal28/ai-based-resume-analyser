"""
routes/matching.py
Endpoints for computing match scores, ranking candidates,
filtering, and downloading reports.
"""

import csv
import io
from flask import Blueprint, request, jsonify, make_response
from bson import ObjectId
from utils.db import get_db
from utils.auth import token_required, admin_required
from models.schemas import result_schema
from ml.resume_matcher import compute_match_score, identify_missing_skills

matching_bp = Blueprint("matching", __name__)


def serialize_result(r: dict, include_user: bool = False) -> dict:
    data = {
        "id": str(r["_id"]),
        "user_id": str(r["user_id"]),
        "resume_id": str(r["resume_id"]),
        "job_id": str(r["job_id"]),
        "match_score": r.get("match_score", 0),
        "skills_analysis": r.get("skills_analysis", {}),
        "computed_at": r.get("computed_at", "").isoformat() if r.get("computed_at") else None
    }
    if include_user:
        data["candidate_name"] = r.get("candidate_name", "")
        data["candidate_email"] = r.get("candidate_email", "")
        data["resume_name"] = r.get("resume_name", "")
        data["job_title"] = r.get("job_title", "")
    return data


@matching_bp.route("/match-score", methods=["GET"])
@token_required
def get_match_score():
    resume_id = request.args.get("resume_id")
    job_id = request.args.get("job_id")

    if not resume_id or not job_id:
        return jsonify({"error": "resume_id and job_id query params are required"}), 400

    db = get_db()

    try:
        resume = db.resumes.find_one({"_id": ObjectId(resume_id)})
        job = db.jobs.find_one({"_id": ObjectId(job_id)})
    except Exception:
        return jsonify({"error": "Invalid resume_id or job_id"}), 400

    if not resume:
        return jsonify({"error": "Resume not found"}), 404
    if not job:
        return jsonify({"error": "Job not found"}), 404

    # Enforce ownership for candidates
    if request.user_role == "candidate" and str(resume["user_id"]) != request.user_id:
        return jsonify({"error": "Access denied"}), 403

    resume_text = resume.get("text_content", "")
    job_desc = job.get("description", "")

    match_score = compute_match_score(resume_text, job_desc)
    skills_analysis = identify_missing_skills(resume_text, job_desc)

    # Upsert result in DB
    result_doc = result_schema(
        str(resume["user_id"]), resume_id, job_id, match_score, skills_analysis
    )
    db.results.update_one(
        {"user_id": ObjectId(str(resume["user_id"])), "resume_id": ObjectId(resume_id), "job_id": ObjectId(job_id)},
        {"$set": result_doc},
        upsert=True
    )
    saved = db.results.find_one({
        "user_id": ObjectId(str(resume["user_id"])),
        "resume_id": ObjectId(resume_id),
        "job_id": ObjectId(job_id)
    })

    return jsonify({
        "match_score": match_score,
        "job_title": job.get("title"),
        "skills_analysis": skills_analysis,
        "result_id": str(saved["_id"]) if saved else None
    }), 200


@matching_bp.route("/rank-candidates", methods=["GET"])
@admin_required
def rank_candidates():
    job_id = request.args.get("job_id")
    min_score = float(request.args.get("min_score", 0))
    max_score = float(request.args.get("max_score", 100))

    if not job_id:
        return jsonify({"error": "job_id query param is required"}), 400

    db = get_db()

    try:
        job = db.jobs.find_one({"_id": ObjectId(job_id)})
    except Exception:
        return jsonify({"error": "Invalid job_id"}), 400

    if not job:
        return jsonify({"error": "Job not found"}), 404

    # Get all resumes and compute scores
    resumes = list(db.resumes.find())
    job_desc = job.get("description", "")

    ranked = []
    for resume in resumes:
        resume_text = resume.get("text_content", "")
        match_score = compute_match_score(resume_text, job_desc)
        skills_analysis = identify_missing_skills(resume_text, job_desc)

        # Upsert to results collection
        result_doc = result_schema(
            str(resume["user_id"]), str(resume["_id"]), job_id, match_score, skills_analysis
        )
        db.results.update_one(
            {"user_id": resume["user_id"], "resume_id": resume["_id"], "job_id": ObjectId(job_id)},
            {"$set": result_doc},
            upsert=True
        )

        if min_score <= match_score <= max_score:
            user = db.users.find_one({"_id": resume["user_id"]}, {"name": 1, "email": 1})
            ranked.append({
                "resume_id": str(resume["_id"]),
                "user_id": str(resume["user_id"]),
                "candidate_name": user.get("name") if user else "Unknown",
                "candidate_email": user.get("email") if user else "Unknown",
                "original_name": resume.get("original_name"),
                "match_score": match_score,
                "matching_skills": skills_analysis.get("matching_skills", []),
                "missing_skills": skills_analysis.get("missing_skills", []),
                "uploaded_at": resume.get("uploaded_at", "").isoformat() if resume.get("uploaded_at") else None
            })

    ranked.sort(key=lambda x: x["match_score"], reverse=True)

    return jsonify({
        "job_title": job.get("title"),
        "job_id": job_id,
        "total_candidates": len(ranked),
        "candidates": ranked
    }), 200


@matching_bp.route("/download-report", methods=["GET"])
@admin_required
def download_report():
    job_id = request.args.get("job_id")
    if not job_id:
        return jsonify({"error": "job_id query param is required"}), 400

    db = get_db()
    try:
        job = db.jobs.find_one({"_id": ObjectId(job_id)})
    except Exception:
        return jsonify({"error": "Invalid job_id"}), 400

    if not job:
        return jsonify({"error": "Job not found"}), 404

    resumes = list(db.resumes.find())
    job_desc = job.get("description", "")

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Rank", "Candidate Name", "Email", "Resume File",
        "Match Score (%)", "Matching Skills", "Missing Skills", "Uploaded At"
    ])

    rows = []
    for resume in resumes:
        resume_text = resume.get("text_content", "")
        match_score = compute_match_score(resume_text, job_desc)
        skills_analysis = identify_missing_skills(resume_text, job_desc)
        user = db.users.find_one({"_id": resume["user_id"]}, {"name": 1, "email": 1})
        rows.append({
            "name": user.get("name") if user else "Unknown",
            "email": user.get("email") if user else "Unknown",
            "filename": resume.get("original_name", ""),
            "score": match_score,
            "matching": ", ".join(skills_analysis.get("matching_skills", [])),
            "missing": ", ".join(skills_analysis.get("missing_skills", [])),
            "uploaded": resume.get("uploaded_at", "").isoformat() if resume.get("uploaded_at") else ""
        })

    rows.sort(key=lambda x: x["score"], reverse=True)
    for i, row in enumerate(rows, 1):
        writer.writerow([
            i, row["name"], row["email"], row["filename"],
            row["score"], row["matching"], row["missing"], row["uploaded"]
        ])

    output.seek(0)
    response = make_response(output.getvalue())
    response.headers["Content-Disposition"] = f"attachment; filename=candidates_{job_id}.csv"
    response.headers["Content-Type"] = "text/csv"
    return response
