"""
routes/auth.py
Endpoints: /api/auth/register, /api/auth/login, /api/auth/me
"""

import bcrypt
from flask import Blueprint, request, jsonify
from utils.db import get_db
from utils.auth import generate_token, token_required
from models.schemas import user_schema

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    role = data.get("role", "candidate")

    if not name or not email or not password:
        return jsonify({"error": "name, email, and password are required"}), 400
    if role not in ("candidate", "admin"):
        return jsonify({"error": "role must be 'candidate' or 'admin'"}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    db = get_db()
    if db.users.find_one({"email": email}):
        return jsonify({"error": "Email already registered"}), 409

    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    doc = user_schema(name, email, hashed, role)
    result = db.users.insert_one(doc)
    user_id = str(result.inserted_id)
    token = generate_token(user_id, role)

    return jsonify({
        "message": "Registered successfully",
        "token": token,
        "user": {"id": user_id, "name": name, "email": email, "role": role}
    }), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "email and password are required"}), 400

    db = get_db()
    user = db.users.find_one({"email": email})
    if not user or not bcrypt.checkpw(password.encode(), user["password"].encode()):
        return jsonify({"error": "Invalid email or password"}), 401

    user_id = str(user["_id"])
    token = generate_token(user_id, user["role"])

    return jsonify({
        "message": "Login successful",
        "token": token,
        "user": {
            "id": user_id,
            "name": user["name"],
            "email": user["email"],
            "role": user["role"]
        }
    }), 200


@auth_bp.route("/me", methods=["GET"])
@token_required
def me():
    from bson import ObjectId
    db = get_db()
    user = db.users.find_one({"_id": ObjectId(request.user_id)}, {"password": 0})
    if not user:
        return jsonify({"error": "User not found"}), 404
    user["id"] = str(user.pop("_id"))
    user["created_at"] = user.get("created_at", "").isoformat() if user.get("created_at") else None
    user["updated_at"] = user.get("updated_at", "").isoformat() if user.get("updated_at") else None
    return jsonify(user), 200
