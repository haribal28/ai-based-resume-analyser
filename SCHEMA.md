# MongoDB Schema Documentation

## Database: `resume_screener`

---

### Collection: `users`
```json
{
  "_id": ObjectId,
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "$2b$12$hashedpassword...",
  "role": "candidate",        // "candidate" | "admin"
  "created_at": ISODate,
  "updated_at": ISODate
}
```
**Indexes:** `email` (unique)

---

### Collection: `resumes`
```json
{
  "_id": ObjectId,
  "user_id": ObjectId,          // ref: users._id
  "filename": "abc123.pdf",     // stored filename on disk
  "original_name": "JaneSmith_CV.pdf",
  "text_content": "Extracted raw text from PDF...",
  "extracted_skills": ["python", "django", "docker", "aws"],
  "uploaded_at": ISODate
}
```

---

### Collection: `jobs`
```json
{
  "_id": ObjectId,
  "admin_id": ObjectId,         // ref: users._id (admin)
  "title": "Senior Python Developer",
  "description": "We are looking for a Python developer...",
  "required_skills": ["python", "django", "docker", "postgresql"],
  "is_active": true,
  "created_at": ISODate
}
```

---

### Collection: `results`
```json
{
  "_id": ObjectId,
  "user_id": ObjectId,          // ref: users._id
  "resume_id": ObjectId,        // ref: resumes._id
  "job_id": ObjectId,           // ref: jobs._id
  "match_score": 72.45,         // 0-100 cosine similarity %
  "skills_analysis": {
    "resume_skills": ["python", "django", "docker"],
    "required_skills": ["python", "django", "docker", "postgresql"],
    "matching_skills": ["python", "django", "docker"],
    "missing_skills": ["postgresql"],
    "match_percentage": 75.0
  },
  "computed_at": ISODate
}
```
**Indexes:** `(user_id, resume_id, job_id)` composite (upsert key)

---

## Sample MongoDB Queries

```js
// Get top 10 candidates for a job, sorted by score
db.results.find({ job_id: ObjectId("...") })
  .sort({ match_score: -1 })
  .limit(10)

// Get all resumes with score >= 70%
db.results.find({ job_id: ObjectId("..."), match_score: { $gte: 70 } })

// Get a candidate's best match
db.results.find({ user_id: ObjectId("...") })
  .sort({ match_score: -1 })
  .limit(1)
```
