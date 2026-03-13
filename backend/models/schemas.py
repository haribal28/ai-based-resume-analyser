"""
models/schemas.py
MongoDB document schema helpers (factory functions).
"""

import datetime
from bson import ObjectId


def post_schema(
    author_id: str,
    author_name: str,
    author_role: str,
    content: str,
    tags: list = None,
    category: str = "Technology",
    image_url: str = "",
) -> dict:
    return {
        "author_id":   ObjectId(author_id),
        "author_name": author_name,
        "author_role": author_role,
        "content":     content,
        "tags":        tags or [],
        "category":    category,   # Technology | AI | Cloud | Career | General
        "image_url":   image_url,
        "likes":       [],          # list of user_id strings who liked
        "comments":    [],          # embedded comment docs
        "created_at":  datetime.datetime.utcnow(),
        "updated_at":  datetime.datetime.utcnow(),
    }


def user_schema(name: str, email: str, hashed_password: str, role: str = "candidate") -> dict:

    now = datetime.datetime.utcnow()
    return {
        "name": name,
        "email": email.lower().strip(),
        "password": hashed_password,
        "role": role,          # "candidate" | "admin"
        "created_at": now,
        "updated_at": now,
    }


def resume_schema(
    user_id: str,
    filename: str,
    original_name: str,
    text_content: str,
    extracted_skills: list,
) -> dict:
    return {
        "user_id": ObjectId(user_id),
        "filename": filename,
        "original_name": original_name,
        "text_content": text_content,
        "extracted_skills": extracted_skills,
        "uploaded_at": datetime.datetime.utcnow(),
    }


def job_schema(
    admin_id: str,
    title: str,
    description: str,
    required_skills: list,
    hr_keywords: list = None,
    experience_level: str = "",
    salary_min: int = 0,
    salary_max: int = 0,
    location: str = "",
    employment_type: str = "Full-time",
) -> dict:
    return {
        "admin_id": ObjectId(admin_id),
        "title": title,
        "description": description,
        "required_skills": required_skills,
        "hr_keywords": hr_keywords or [],
        "experience_level": experience_level,       # e.g. "Fresher", "1-3 years", "5+ years"
        "salary_min": salary_min,
        "salary_max": salary_max,
        "location": location,
        "employment_type": employment_type,         # Full-time / Part-time / Remote / Contract
        "is_active": True,
        "created_at": datetime.datetime.utcnow(),
    }


def application_schema(
    user_id: str,
    job_id: str,
    resume_id: str,
    cover_letter: str = "",
    years_of_experience: str = "",
    current_ctc: str = "",
    expected_ctc: str = "",
    notice_period: str = "",
    portfolio_url: str = "",
) -> dict:
    return {
        "user_id":             ObjectId(user_id),
        "job_id":              ObjectId(job_id),
        "resume_id":           ObjectId(resume_id) if resume_id else None,
        "cover_letter":        cover_letter,
        "years_of_experience": years_of_experience,
        "current_ctc":         current_ctc,
        "expected_ctc":        expected_ctc,
        "notice_period":       notice_period,
        "portfolio_url":       portfolio_url,
        "status":              "pending",   # pending | shortlisted | rejected | hired
        "applied_at":          datetime.datetime.utcnow(),
        "updated_at":          datetime.datetime.utcnow(),
    }


def offer_schema(
    admin_id: str,
    candidate_email: str,
    candidate_name: str,
    job_id: str,
    job_title: str,
    match_score: float,
    offer_type: str,          # "offer" | "rejection"
    message: str = "",
) -> dict:
    return {
        "admin_id":        ObjectId(admin_id),
        "candidate_email": candidate_email.lower().strip(),
        "candidate_name":  candidate_name,
        "job_id":          ObjectId(job_id) if job_id else None,
        "job_title":       job_title,
        "match_score":     match_score,
        "offer_type":      offer_type,            # "offer" | "rejection"
        "message":         message,
        "response":        None,                  # None | "accepted" | "declined"
        "sent_at":         datetime.datetime.utcnow(),
        "responded_at":    None,
    }


def result_schema(
    user_id: str,
    resume_id: str,
    job_id: str,
    match_score: float,
    skills_analysis: dict,
) -> dict:
    return {
        "user_id": ObjectId(user_id),
        "resume_id": ObjectId(resume_id),
        "job_id": ObjectId(job_id),
        "match_score": match_score,
        "skills_analysis": skills_analysis,
        "computed_at": datetime.datetime.utcnow(),
    }


def course_schema(
    admin_id: str,
    admin_name: str,
    title: str,
    description: str,
    category: str = "General",
    level: str = "Beginner",
    duration_hours: float = 0,
    instructor: str = "",
    instructor_title: str = "",
    thumbnail_url: str = "",
    tags: list = None,
    lessons: list = None,
    certificate_title: str = "",
) -> dict:
    now = datetime.datetime.utcnow()
    return {
        "admin_id":         ObjectId(admin_id),
        "posted_by_name":   admin_name,
        "title":            title,
        "description":      description,
        "category":         category,       # Technology | AI | Cloud | Career | General | Leadership
        "level":            level,          # Beginner | Intermediate | Advanced
        "duration_hours":   duration_hours,
        "instructor":       instructor,
        "instructor_title": instructor_title,
        "thumbnail_url":    thumbnail_url,
        "tags":             tags or [],
        "lessons":          lessons or [],  # [{id, title, duration_min, video_url, description}]
        "certificate_title": certificate_title,
        "is_active":        True,
        "enrolled_count":   0,
        "created_at":       now,
        "updated_at":       now,
    }


def enrollment_schema(
    user_id: str,
    course_id: str,
    user_name: str = "",
    user_email: str = "",
) -> dict:
    now = datetime.datetime.utcnow()
    return {
        "user_id":           ObjectId(user_id),
        "course_id":         ObjectId(course_id),
        "user_name":         user_name,
        "user_email":        user_email,
        "enrolled_at":       now,
        "completed_lessons": [],           # list of lesson id strings
        "completed":         False,
        "completed_at":      None,
        "certificate_issued": False,
        "updated_at":        now,
    }
