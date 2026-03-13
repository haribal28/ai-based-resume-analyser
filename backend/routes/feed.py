"""
routes/feed.py
LinkedIn-style Technology Feed.

Endpoints:
  POST   /api/feed/posts              — Admin: create post
  GET    /api/feed/posts              — Everyone: paginated feed
  GET    /api/feed/posts/<id>         — Everyone: single post
  PUT    /api/feed/posts/<id>         — Admin: edit own post
  DELETE /api/feed/posts/<id>         — Admin: delete own post
  POST   /api/feed/posts/<id>/like    — Toggle like (auth required)
  POST   /api/feed/posts/<id>/comment — Add comment (auth required)
  DELETE /api/feed/posts/<post_id>/comments/<comment_id> — Delete own comment
"""

import datetime
from flask import Blueprint, request, jsonify
from bson import ObjectId
from utils.db import get_db
from utils.auth import token_required, admin_required
from models.schemas import post_schema

feed_bp = Blueprint("feed", __name__)

CATEGORIES = {"Technology", "AI & ML", "Cloud", "Career Tips", "Industry News", "General"}


def _serialize_post(post: dict, user_id: str = None) -> dict:
    likes = post.get("likes", [])
    return {
        "id":           str(post["_id"]),
        "author_id":    str(post["author_id"]),
        "author_name":  post.get("author_name", "HR"),
        "author_role":  post.get("author_role", "admin"),
        "content":      post.get("content", ""),
        "tags":         post.get("tags", []),
        "category":     post.get("category", "Technology"),
        "image_url":    post.get("image_url", ""),
        "like_count":   len(likes),
        "liked_by_me":  (user_id in likes) if user_id else False,
        "comments":     [_serialize_comment(c) for c in post.get("comments", [])],
        "comment_count": len(post.get("comments", [])),
        "created_at":   post["created_at"].isoformat() if post.get("created_at") else None,
        "updated_at":   post.get("updated_at", post.get("created_at")).isoformat() if post.get("updated_at") else None,
    }


def _serialize_comment(c: dict) -> dict:
    return {
        "id":          str(c.get("_id", "")),
        "author_id":   str(c.get("author_id", "")),
        "author_name": c.get("author_name", ""),
        "author_role": c.get("author_role", "candidate"),
        "text":        c.get("text", ""),
        "created_at":  c["created_at"].isoformat() if c.get("created_at") else None,
    }


# ── POST /api/feed/posts ─────────────────────────────────────────────────────
@feed_bp.route("/feed/posts", methods=["POST"])
@admin_required
def create_post():
    data = request.get_json(silent=True) or {}

    content  = data.get("content", "").strip()
    tags     = [t.strip() for t in (data.get("tags") or []) if t.strip()]
    category = data.get("category", "Technology").strip()
    image_url = data.get("image_url", "").strip()

    if not content:
        return jsonify({"error": "Post content cannot be empty"}), 400
    if len(content) > 3000:
        return jsonify({"error": "Post too long (max 3000 chars)"}), 400
    if category not in CATEGORIES:
        category = "Technology"

    db   = get_db()
    user = db.users.find_one({"_id": ObjectId(request.user_id)}, {"name": 1, "role": 1})
    if not user:
        return jsonify({"error": "User not found"}), 404

    doc    = post_schema(
        author_id   = request.user_id,
        author_name = user.get("name", "HR"),
        author_role = user.get("role", "admin"),
        content     = content,
        tags        = tags,
        category    = category,
        image_url   = image_url,
    )
    result = db.posts.insert_one(doc)
    doc["_id"] = result.inserted_id
    return jsonify({
        "message": "Post published successfully!",
        "post":    _serialize_post(doc, request.user_id),
    }), 201


# ── GET /api/feed/posts ──────────────────────────────────────────────────────
@feed_bp.route("/feed/posts", methods=["GET"])
@feed_bp.route("/feed/posts/list", methods=["GET"])   # alias
@token_required
def get_posts():
    db       = get_db()
    try:
        page  = max(1, int(request.args.get("page", 1)))
        limit = min(20, int(request.args.get("limit", 10)))
    except (ValueError, TypeError):
        page, limit = 1, 10

    category = request.args.get("category", "").strip()
    tag      = request.args.get("tag", "").strip()

    query = {}
    if category and category in CATEGORIES:
        query["category"] = category
    if tag:
        query["tags"] = tag

    skip  = (page - 1) * limit
    total = db.posts.count_documents(query)
    posts = list(db.posts.find(query).sort("created_at", -1).skip(skip).limit(limit))

    return jsonify({
        "total": total,
        "page":  page,
        "pages": max(1, (total + limit - 1) // limit),
        "posts": [_serialize_post(p, request.user_id) for p in posts],
    }), 200


# ── GET /api/feed/posts/<id> ─────────────────────────────────────────────────
@feed_bp.route("/feed/posts/<post_id>", methods=["GET"])
@token_required
def get_post(post_id):
    db = get_db()
    try:
        post = db.posts.find_one({"_id": ObjectId(post_id)})
    except Exception:
        return jsonify({"error": "Invalid post id"}), 400
    if not post:
        return jsonify({"error": "Post not found"}), 404
    return jsonify(_serialize_post(post, request.user_id)), 200


# ── PUT /api/feed/posts/<id> ─────────────────────────────────────────────────
@feed_bp.route("/feed/posts/<post_id>", methods=["PUT"])
@admin_required
def update_post(post_id):
    data = request.get_json(silent=True) or {}
    db   = get_db()

    updates = {"updated_at": datetime.datetime.utcnow()}
    if "content" in data and data["content"].strip():
        updates["content"] = data["content"].strip()
    if "tags" in data:
        updates["tags"] = [t.strip() for t in data["tags"] if t.strip()]
    if "category" in data and data["category"] in CATEGORIES:
        updates["category"] = data["category"]

    try:
        result = db.posts.update_one(
            {"_id": ObjectId(post_id), "author_id": ObjectId(request.user_id)},
            {"$set": updates}
        )
    except Exception:
        return jsonify({"error": "Invalid post id"}), 400
    if result.matched_count == 0:
        return jsonify({"error": "Post not found or you are not the author"}), 404

    post = db.posts.find_one({"_id": ObjectId(post_id)})
    return jsonify({"message": "Post updated", "post": _serialize_post(post, request.user_id)}), 200


# ── DELETE /api/feed/posts/<id> ──────────────────────────────────────────────
@feed_bp.route("/feed/posts/<post_id>", methods=["DELETE"])
@admin_required
def delete_post(post_id):
    db = get_db()
    try:
        result = db.posts.delete_one({
            "_id":       ObjectId(post_id),
            "author_id": ObjectId(request.user_id),
        })
    except Exception:
        return jsonify({"error": "Invalid post id"}), 400
    if result.deleted_count == 0:
        return jsonify({"error": "Post not found or you are not the author"}), 404
    return jsonify({"message": "Post deleted"}), 200


# ── POST /api/feed/posts/<id>/like ───────────────────────────────────────────
@feed_bp.route("/feed/posts/<post_id>/like", methods=["POST"])
@token_required
def toggle_like(post_id):
    db = get_db()
    try:
        post = db.posts.find_one({"_id": ObjectId(post_id)}, {"likes": 1})
    except Exception:
        return jsonify({"error": "Invalid post id"}), 400
    if not post:
        return jsonify({"error": "Post not found"}), 404

    uid   = request.user_id
    likes = post.get("likes", [])

    if uid in likes:
        db.posts.update_one({"_id": ObjectId(post_id)}, {"$pull": {"likes": uid}})
        liked = False
    else:
        db.posts.update_one({"_id": ObjectId(post_id)}, {"$addToSet": {"likes": uid}})
        liked = True

    updated = db.posts.find_one({"_id": ObjectId(post_id)}, {"likes": 1})
    return jsonify({
        "liked":      liked,
        "like_count": len(updated.get("likes", [])),
    }), 200


# ── POST /api/feed/posts/<id>/comment ────────────────────────────────────────
@feed_bp.route("/feed/posts/<post_id>/comment", methods=["POST"])
@token_required
def add_comment(post_id):
    db   = get_db()
    data = request.get_json(silent=True) or {}
    text = data.get("text", "").strip()

    if not text:
        return jsonify({"error": "Comment text is required"}), 400
    if len(text) > 500:
        return jsonify({"error": "Comment too long (max 500 chars)"}), 400

    user = db.users.find_one({"_id": ObjectId(request.user_id)}, {"name": 1, "role": 1})
    if not user:
        return jsonify({"error": "User not found"}), 404

    comment = {
        "_id":         ObjectId(),
        "author_id":   ObjectId(request.user_id),
        "author_name": user.get("name", "User"),
        "author_role": user.get("role", "candidate"),
        "text":        text,
        "created_at":  datetime.datetime.utcnow(),
    }

    try:
        db.posts.update_one(
            {"_id": ObjectId(post_id)},
            {"$push": {"comments": comment}}
        )
    except Exception:
        return jsonify({"error": "Invalid post id"}), 400

    return jsonify({
        "message": "Comment added",
        "comment": _serialize_comment(comment),
    }), 201


# ── DELETE /api/feed/posts/<post_id>/comments/<comment_id> ───────────────────
@feed_bp.route("/feed/posts/<post_id>/comments/<comment_id>", methods=["DELETE"])
@token_required
def delete_comment(post_id, comment_id):
    db = get_db()
    try:
        result = db.posts.update_one(
            {"_id": ObjectId(post_id)},
            {"$pull": {"comments": {
                "_id":       ObjectId(comment_id),
                "author_id": ObjectId(request.user_id),
            }}}
        )
    except Exception:
        return jsonify({"error": "Invalid id"}), 400
    if result.modified_count == 0:
        return jsonify({"error": "Comment not found or you are not the author"}), 404
    return jsonify({"message": "Comment deleted"}), 200
