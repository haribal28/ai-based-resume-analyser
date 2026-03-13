"""
utils/db.py
MongoDB connection helper.
"""

import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

_client = None
_db = None


def get_db():
    global _client, _db
    if _db is None:
        mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/resume_screener")
        _client = MongoClient(mongo_uri)
        db_name = mongo_uri.rsplit("/", 1)[-1].split("?")[0]
        _db = _client[db_name]
        # Create indexes
        _db.users.create_index("email", unique=True)
        _db.results.create_index(
            [("user_id", 1), ("resume_id", 1), ("job_id", 1)], unique=True
        )
    return _db
