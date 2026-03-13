"""
routes/resumes.py
Endpoints: /api/upload-resume, /api/resumes/my, /api/resumes/all
"""

import os
import uuid
from flask import Blueprint, request, jsonify, current_app
from bson import ObjectId
from utils.db import get_db
from utils.auth import token_required, admin_required
from models.schemas import resume_schema
from ml.resume_matcher import extract_text_from_pdf, extract_skills

resumes_bp = Blueprint("resumes", __name__)

ALLOWED_EXTENSIONS = {"pdf"}


def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@resumes_bp.route("/upload-resume", methods=["POST"])
@token_required
def upload_resume():
    if "resume" not in request.files:
        return jsonify({"error": "No file part named 'resume'"}), 400

    file = request.files["resume"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400
    if not allowed_file(file.filename):
        return jsonify({"error": "Only PDF files are allowed"}), 400

    file_bytes = file.read()
    try:
        text_content = extract_text_from_pdf(file_bytes)
    except ValueError as e:
        return jsonify({"error": str(e)}), 422

    skills = extract_skills(text_content)

    # Save file to disk
    unique_name = f"{uuid.uuid4().hex}.pdf"
    upload_folder = current_app.config["UPLOAD_FOLDER"]
    save_path = os.path.join(upload_folder, unique_name)
    with open(save_path, "wb") as f:
        f.write(file_bytes)

    db = get_db()
    doc = resume_schema(
        request.user_id,
        unique_name,
        file.filename,
        text_content,
        skills,
    )
    result = db.resumes.insert_one(doc)

    return jsonify({
        "message": "Resume uploaded successfully",
        "resume_id": str(result.inserted_id),
        "original_name": file.filename,
        "extracted_skills": skills,
        "text_preview": text_content[:300] + "..." if len(text_content) > 300 else text_content,
    }), 201


@resumes_bp.route("/resumes/my", methods=["GET"])
@token_required
def my_resumes():
    db = get_db()
    resumes = list(db.resumes.find({"user_id": ObjectId(request.user_id)}))
    out = []
    for r in resumes:
        out.append({
            "id": str(r["_id"]),
            "original_name": r.get("original_name"),
            "extracted_skills": r.get("extracted_skills", []),
            "uploaded_at": r.get("uploaded_at", "").isoformat() if r.get("uploaded_at") else None,
        })
    return jsonify(out), 200


@resumes_bp.route("/resumes/all", methods=["GET"])
@admin_required
def all_resumes():
    db = get_db()
    resumes = list(db.resumes.find())
    out = []
    for r in resumes:
        user = db.users.find_one({"_id": r["user_id"]}, {"name": 1, "email": 1})
        out.append({
            "id": str(r["_id"]),
            "user_id": str(r["user_id"]),
            "candidate_name": user.get("name") if user else "Unknown",
            "candidate_email": user.get("email") if user else "Unknown",
            "original_name": r.get("original_name"),
            "extracted_skills": r.get("extracted_skills", []),
            "uploaded_at": r.get("uploaded_at", "").isoformat() if r.get("uploaded_at") else None,
        })
    return jsonify(out), 200


@resumes_bp.route("/resumes/<resume_id>/download", methods=["GET"])
@admin_required
def download_resume(resume_id):
    """Admin-only: download a candidate's original PDF resume."""
    from flask import send_file
    db = get_db()
    try:
        resume = db.resumes.find_one({"_id": ObjectId(resume_id)})
    except Exception:
        return jsonify({"error": "Invalid resume_id"}), 400

    if not resume:
        return jsonify({"error": "Resume not found"}), 404

    upload_folder = current_app.config["UPLOAD_FOLDER"]
    file_path = os.path.join(upload_folder, resume["filename"])

    if not os.path.exists(file_path):
        return jsonify({"error": "File not found on server"}), 404

    return send_file(
        file_path,
        mimetype="application/pdf",
        as_attachment=True,
        download_name=resume.get("original_name", resume["filename"]),
    )
