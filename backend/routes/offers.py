"""
routes/offers.py
HR ↔ Candidate Offer System saved in MongoDB.

Endpoints:
  POST  /api/offers/send          — Admin: send offer/rejection (saves to DB + email)
  GET   /api/offers/my            — Candidate: see own offers (matched by email)
  GET   /api/offers/all           — Admin: all sent offers
  PUT   /api/offers/<id>/respond  — Candidate: accept or decline an offer
"""

import datetime
import json
import urllib.request
import urllib.error
from flask import Blueprint, request, jsonify
from bson import ObjectId
from utils.db import get_db
from utils.auth import token_required, admin_required
from models.schemas import offer_schema

offers_bp = Blueprint("offers", __name__)

EMAIL_SERVICE   = "http://localhost:5001"
VALID_RESPONSES = {"accepted", "declined"}


def _send_email(payload: dict) -> None:
    """Fire-and-forget: send email via nodemailer service (best-effort)."""
    try:
        body = json.dumps(payload).encode("utf-8")
        req  = urllib.request.Request(
            f"{EMAIL_SERVICE}/api/send-email",
            data    = body,
            headers = {"Content-Type": "application/json"},
            method  = "POST",
        )
        urllib.request.urlopen(req, timeout=8)
    except Exception:
        pass   # email failure never blocks the offer save


def _serialize(offer: dict) -> dict:
    return {
        "id":              str(offer["_id"]),
        "candidate_email": offer.get("candidate_email", ""),
        "candidate_name":  offer.get("candidate_name", ""),
        "job_id":          str(offer["job_id"]) if offer.get("job_id") else None,
        "job_title":       offer.get("job_title", ""),
        "match_score":     offer.get("match_score", 0),
        "offer_type":      offer.get("offer_type", "offer"),
        "message":         offer.get("message", ""),
        "response":        offer.get("response"),
        "sent_at":         offer["sent_at"].isoformat() if offer.get("sent_at") else None,
        "responded_at":    offer["responded_at"].isoformat() if offer.get("responded_at") else None,
    }


# ── POST /api/offers/send ────────────────────────────────────────────────────
@offers_bp.route("/offers/send", methods=["POST"])
@admin_required
def send_offer():
    data = request.get_json(silent=True) or {}

    candidate_email = data.get("candidate_email", "").strip()
    candidate_name  = data.get("candidate_name",  "Candidate").strip()
    job_id          = data.get("job_id",          "").strip()
    match_score     = float(data.get("match_score", 0) or 0)
    offer_type      = data.get("status", "offer").strip().lower()   # "selected"→"offer"
    message         = data.get("message",         "").strip()

    if offer_type == "selected":
        offer_type = "offer"
    if offer_type not in {"offer", "rejection"}:
        offer_type = "offer"

    if not candidate_email:
        return jsonify({"error": "candidate_email is required"}), 400

    db = get_db()

    # Resolve job title
    job_title = data.get("job_title", "").strip()
    if job_id and not job_title:
        try:
            job = db.jobs.find_one({"_id": ObjectId(job_id)}, {"title": 1})
            job_title = job.get("title", "") if job else ""
        except Exception:
            pass

    # Save offer to MongoDB
    doc    = offer_schema(
        admin_id        = request.user_id,
        candidate_email = candidate_email,
        candidate_name  = candidate_name,
        job_id          = job_id,
        job_title       = job_title,
        match_score     = match_score,
        offer_type      = offer_type,
        message         = message,
    )
    result = db.offers.insert_one(doc)
    offer_id = str(result.inserted_id)

    # Send email (non-blocking, best-effort)
    _send_email({
        "candidate_email": candidate_email,
        "candidate_name":  candidate_name,
        "job_title":       job_title,
        "match_score":     match_score,
        "status":          "selected" if offer_type == "offer" else "rejected",
        "message":         message,
    })

    return jsonify({
        "message":    f"{'Offer' if offer_type == 'offer' else 'Rejection'} saved and email sent.",
        "offer_id":   offer_id,
        "offer_type": offer_type,
    }), 201


# ── GET /api/offers/my ────────────────────────────────────────────────────────
@offers_bp.route("/offers/my", methods=["GET"])
@token_required
def my_offers():
    """Candidate fetches their own offers using their registered email."""
    db = get_db()
    user = db.users.find_one({"_id": ObjectId(request.user_id)}, {"email": 1})
    if not user:
        return jsonify({"error": "User not found"}), 404

    email = user["email"].lower().strip()
    offers = list(db.offers.find({"candidate_email": email}).sort("sent_at", -1))
    return jsonify([_serialize(o) for o in offers]), 200


# ── GET /api/offers/all ───────────────────────────────────────────────────────
@offers_bp.route("/offers/all", methods=["GET"])
@admin_required
def all_offers():
    db = get_db()
    offers = list(db.offers.find().sort("sent_at", -1))
    return jsonify({
        "total":  len(offers),
        "offers": [_serialize(o) for o in offers],
    }), 200


# ── PUT /api/offers/<id>/respond ─────────────────────────────────────────────
@offers_bp.route("/offers/<offer_id>/respond", methods=["PUT"])
@token_required
def respond_to_offer(offer_id):
    """Candidate accepts or declines an offer."""
    data     = request.get_json(silent=True) or {}
    response = data.get("response", "").strip().lower()

    if response not in VALID_RESPONSES:
        return jsonify({"error": "response must be 'accepted' or 'declined'"}), 400

    db   = get_db()
    user = db.users.find_one({"_id": ObjectId(request.user_id)}, {"email": 1})
    if not user:
        return jsonify({"error": "User not found"}), 404

    email = user["email"].lower().strip()

    try:
        result = db.offers.update_one(
            {"_id": ObjectId(offer_id), "candidate_email": email},
            {"$set": {
                "response":     response,
                "responded_at": datetime.datetime.utcnow(),
            }}
        )
    except Exception:
        return jsonify({"error": "Invalid offer_id"}), 400

    if result.matched_count == 0:
        return jsonify({"error": "Offer not found or does not belong to you"}), 404

    return jsonify({
        "message":  f"Offer {response} successfully.",
        "response": response,
    }), 200
