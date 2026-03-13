"""
routes/chat.py
Real-time style messaging between candidates and HR.

Collections:
  conversations  — one per candidate-hr pair (or per subject)
  chat_messages  — messages embedded by conversation_id

Endpoints:
  POST   /api/chat/conversations              — candidate starts chat with HR
  GET    /api/chat/conversations              — list convos (HR: all, candidate: own)
  GET    /api/chat/conversations/<id>/messages— messages + mark-read
  POST   /api/chat/conversations/<id>/messages— send a message
  GET    /api/chat/unread                     — unread badge count for current user
"""

import datetime
from flask import Blueprint, request, jsonify
from bson import ObjectId
from utils.db import get_db
from utils.auth import token_required

chat_bp = Blueprint("chat", __name__)


def _serialize_convo(c, role):
    return {
        "id":                   str(c["_id"]),
        "candidate_id":         str(c.get("candidate_id", "")),
        "candidate_name":       c.get("candidate_name", "Candidate"),
        "candidate_email":      c.get("candidate_email", ""),
        "admin_name":           c.get("admin_name", "HR Team"),
        "subject":              c.get("subject", "Referral Request"),
        "last_message_at":      c["last_message_at"].isoformat() if c.get("last_message_at") else None,
        "last_message_preview": c.get("last_message_preview", ""),
        "unread":               c.get("unread_admin", 0) if role == "admin" else c.get("unread_candidate", 0),
        "created_at":           c["created_at"].isoformat() if c.get("created_at") else None,
    }


def _serialize_msg(m):
    return {
        "id":          str(m["_id"]),
        "sender_id":   str(m.get("sender_id", "")),
        "sender_name": m.get("sender_name", ""),
        "sender_role": m.get("sender_role", "candidate"),
        "text":        m.get("text", ""),
        "created_at":  m["created_at"].isoformat() if m.get("created_at") else None,
    }


# ── POST /api/chat/conversations ─────────────────────────────────────────────
@chat_bp.route("/chat/conversations", methods=["POST"])
@token_required
def start_conversation():
    """Candidate starts a new conversation thread with HR."""
    db   = get_db()
    data = request.get_json(silent=True) or {}

    subject = data.get("subject", "Referral Request").strip() or "Referral Request"
    if len(subject) > 120:
        subject = subject[:120]

    user = db.users.find_one({"_id": ObjectId(request.user_id)}, {"name": 1, "email": 1, "role": 1})
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Pick any admin as the HR recipient
    admin = db.users.find_one({"role": "admin"}, {"name": 1})

    # Prevent duplicate open conversation for same candidate + subject
    existing = db.conversations.find_one({
        "candidate_id": ObjectId(request.user_id),
        "subject":      subject,
    })
    if existing:
        return jsonify({
            "conversation": _serialize_convo(existing, user.get("role")),
            "message": "Conversation already exists",
        }), 200

    convo = {
        "candidate_id":   ObjectId(request.user_id),
        "candidate_name": user.get("name", "Candidate"),
        "candidate_email": user.get("email", ""),
        "admin_id":        admin["_id"] if admin else None,
        "admin_name":      admin.get("name", "HR Team") if admin else "HR Team",
        "subject":         subject,
        "last_message_at": datetime.datetime.utcnow(),
        "last_message_preview": "",
        "unread_candidate": 0,
        "unread_admin":     0,
        "created_at":      datetime.datetime.utcnow(),
    }
    result = db.conversations.insert_one(convo)
    convo["_id"] = result.inserted_id
    return jsonify({"conversation": _serialize_convo(convo, user.get("role"))}), 201


# ── GET /api/chat/conversations ──────────────────────────────────────────────
@chat_bp.route("/chat/conversations", methods=["GET"])
@token_required
def list_conversations():
    db   = get_db()
    user = db.users.find_one({"_id": ObjectId(request.user_id)}, {"role": 1})
    role = user.get("role") if user else "candidate"

    if role == "admin":
        convos = list(db.conversations.find().sort("last_message_at", -1).limit(50))
    else:
        convos = list(db.conversations.find(
            {"candidate_id": ObjectId(request.user_id)}
        ).sort("last_message_at", -1).limit(50))

    return jsonify({"conversations": [_serialize_convo(c, role) for c in convos]}), 200


# ── GET /api/chat/conversations/<id>/messages ────────────────────────────────
@chat_bp.route("/chat/conversations/<convo_id>/messages", methods=["GET"])
@token_required
def get_messages(convo_id):
    db = get_db()
    try:
        convo = db.conversations.find_one({"_id": ObjectId(convo_id)})
    except Exception:
        return jsonify({"error": "Invalid conversation id"}), 400
    if not convo:
        return jsonify({"error": "Conversation not found"}), 404

    user = db.users.find_one({"_id": ObjectId(request.user_id)}, {"role": 1})
    role = user.get("role") if user else "candidate"

    # Access control: candidate can only read their own conversations
    if role != "admin" and str(convo.get("candidate_id")) != request.user_id:
        return jsonify({"error": "Access denied"}), 403

    messages = list(db.chat_messages.find(
        {"conversation_id": ObjectId(convo_id)}
    ).sort("created_at", 1).limit(200))

    # Mark unread as 0 for this user's side
    if role == "admin":
        db.conversations.update_one({"_id": ObjectId(convo_id)}, {"$set": {"unread_admin": 0}})
    else:
        db.conversations.update_one({"_id": ObjectId(convo_id)}, {"$set": {"unread_candidate": 0}})

    return jsonify({
        "conversation": _serialize_convo(convo, role),
        "messages":     [_serialize_msg(m) for m in messages],
    }), 200


# ── POST /api/chat/conversations/<id>/messages ───────────────────────────────
@chat_bp.route("/chat/conversations/<convo_id>/messages", methods=["POST"])
@token_required
def send_message(convo_id):
    db   = get_db()
    data = request.get_json(silent=True) or {}
    text = data.get("text", "").strip()

    if not text:
        return jsonify({"error": "Message text is required"}), 400
    if len(text) > 2000:
        return jsonify({"error": "Message too long (max 2000 chars)"}), 400

    try:
        convo = db.conversations.find_one({"_id": ObjectId(convo_id)})
    except Exception:
        return jsonify({"error": "Invalid conversation id"}), 400
    if not convo:
        return jsonify({"error": "Conversation not found"}), 404

    user = db.users.find_one({"_id": ObjectId(request.user_id)}, {"name": 1, "role": 1})
    if not user:
        return jsonify({"error": "User not found"}), 404

    role = user.get("role", "candidate")

    # Access control
    if role != "admin" and str(convo.get("candidate_id")) != request.user_id:
        return jsonify({"error": "Access denied"}), 403

    msg = {
        "conversation_id": ObjectId(convo_id),
        "sender_id":       ObjectId(request.user_id),
        "sender_name":     user.get("name", "User"),
        "sender_role":     role,
        "text":            text,
        "created_at":      datetime.datetime.utcnow(),
    }
    result = db.chat_messages.insert_one(msg)
    msg["_id"] = result.inserted_id

    # Update conversation metadata + increment unread for the OTHER side
    update_fields = {
        "last_message_at":      datetime.datetime.utcnow(),
        "last_message_preview": text[:80],
    }
    inc_field = "unread_candidate" if role == "admin" else "unread_admin"

    db.conversations.update_one(
        {"_id": ObjectId(convo_id)},
        {"$set": update_fields, "$inc": {inc_field: 1}}
    )
    return jsonify({"message": _serialize_msg(msg)}), 201


# ── GET /api/chat/unread ─────────────────────────────────────────────────────
@chat_bp.route("/chat/unread", methods=["GET"])
@token_required
def get_unread_count():
    db   = get_db()
    user = db.users.find_one({"_id": ObjectId(request.user_id)}, {"role": 1})
    role = user.get("role") if user else "candidate"

    if role == "admin":
        pipeline = [
            {"$group": {"_id": None, "total": {"$sum": "$unread_admin"}}}
        ]
    else:
        pipeline = [
            {"$match": {"candidate_id": ObjectId(request.user_id)}},
            {"$group": {"_id": None, "total": {"$sum": "$unread_candidate"}}}
        ]

    result = list(db.conversations.aggregate(pipeline))
    total  = result[0]["total"] if result else 0
    return jsonify({"unread": total}), 200
