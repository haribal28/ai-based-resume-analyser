"""
app.py
Flask application entry point.
"""

import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

from extensions import mail
from routes.auth import auth_bp
from routes.resumes import resumes_bp
from routes.jobs import jobs_bp
from routes.matching import matching_bp
from routes.email import email_bp
from routes.applications import applications_bp
from routes.offers import offers_bp
from routes.feed import feed_bp
from routes.chat import chat_bp
from routes.courses import courses_bp


def create_app():
    app = Flask(__name__)

    # Configuration
    app.config["MAX_CONTENT_LENGTH"] = int(os.getenv("MAX_CONTENT_LENGTH", 16777216))
    app.config["SECRET_KEY"]         = os.getenv("JWT_SECRET", "change_me")
    app.config["UPLOAD_FOLDER"]      = os.getenv("UPLOAD_FOLDER", "uploads")

    # Flask-Mail configuration
    app.config["MAIL_SERVER"]         = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    app.config["MAIL_PORT"]           = int(os.getenv("MAIL_PORT", 587))
    app.config["MAIL_USE_TLS"]        = os.getenv("MAIL_USE_TLS", "True").lower() == "true"
    app.config["MAIL_USERNAME"]       = os.getenv("MAIL_USERNAME", "")
    app.config["MAIL_PASSWORD"]       = os.getenv("MAIL_PASSWORD", "")
    app.config["MAIL_DEFAULT_SENDER"] = os.getenv("MAIL_DEFAULT_SENDER", "")

    # Ensure upload folder exists
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    # CORS — allow Vercel frontend + localhost dev
    CORS(app, resources={r"/api/*": {"origins": [
        "http://localhost:3000",
        "https://ai-based-resume-analyser-one.vercel.app",
        "https://ai-based-resume-analyser-bhh22tpe7.vercel.app",
        "https://ai-based-resume-analyser-git-main-hariharanbala28-4934s.vercel.app",
    ]}}, supports_credentials=True)

    # Init extensions
    mail.init_app(app)

    # Register blueprints
    app.register_blueprint(auth_bp,          url_prefix="/api/auth")
    app.register_blueprint(resumes_bp,        url_prefix="/api")
    app.register_blueprint(jobs_bp,           url_prefix="/api")
    app.register_blueprint(matching_bp,       url_prefix="/api")
    app.register_blueprint(email_bp,          url_prefix="/api")
    app.register_blueprint(applications_bp,   url_prefix="/api")
    app.register_blueprint(offers_bp,         url_prefix="/api")
    app.register_blueprint(feed_bp,           url_prefix="/api")
    app.register_blueprint(chat_bp,           url_prefix="/api")
    app.register_blueprint(courses_bp,        url_prefix="/api")

    # Health check
    @app.route("/api/health", methods=["GET"])
    def health():
        return jsonify({"status": "ok", "message": "Resume Screener API running"}), 200

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Endpoint not found"}), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({"error": "Method not allowed"}), 405

    @app.errorhandler(413)
    def too_large(e):
        return jsonify({"error": "File too large"}), 413

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"error": "Internal server error"}), 500

    return app


if __name__ == "__main__":
    app = create_app()
    debug = os.getenv("FLASK_DEBUG", "True").lower() == "true"
    app.run(host="0.0.0.0", port=5000, debug=debug)
