# 🎯 ResumeMatch AI — Full-Stack Resume Screening Platform

AI-powered resume screening with NLP, TF-IDF cosine similarity, and skill gap analysis.

---

## 📁 Folder Structure

```
resume-screener/
├── backend/
│   ├── app.py                  # Flask entry point
│   ├── requirements.txt
│   ├── .env.example
│   ├── uploads/                # PDF storage (auto-created)
│   ├── ml/
│   │   ├── __init__.py
│   │   └── resume_matcher.py   # TF-IDF, cosine similarity, skill extraction
│   ├── models/
│   │   └── schemas.py          # MongoDB document schemas
│   ├── routes/
│   │   ├── auth.py             # /api/auth/*
│   │   ├── resumes.py          # /api/upload-resume, /api/resumes/*
│   │   ├── jobs.py             # /api/upload-job, /api/jobs/*
│   │   └── matching.py         # /api/match-score, /api/rank-candidates
│   └── utils/
│       ├── db.py               # MongoDB connection
│       └── auth.py             # JWT helpers + decorators
├── frontend/
│   ├── package.json
│   ├── public/index.html
│   └── src/
│       ├── App.js
│       ├── index.js
│       ├── context/AuthContext.js
│       ├── pages/
│       │   ├── AuthPage.js
│       │   ├── CandidateDashboard.js
│       │   └── AdminDashboard.js
│       └── components/
│           ├── Candidate/
│           │   ├── ResumeUpload.js
│           │   └── MatchScore.js
│           ├── Admin/
│           │   ├── JobUpload.js
│           │   └── CandidateRanking.js
│           └── Common/
│               ├── Navbar.js
│               └── ProtectedRoute.js
├── SCHEMA.md                   # MongoDB schema docs
└── README.md
```

---

## 🚀 Local Setup

### Prerequisites
- Python 3.9+
- Node.js 18+
- MongoDB (local or Atlas)

---

### Backend Setup

```bash
cd backend

# 1. Create virtual environment
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Download NLTK data (one-time)
python -c "import nltk; nltk.download('stopwords')"

# 4. Configure environment
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret

# 5. Run the server
python app.py
# → Backend running at http://localhost:5000
```

---

### Frontend Setup

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. (Optional) Set API URL for production
# Create .env file: REACT_APP_API_URL=http://localhost:5000/api

# 3. Start development server
npm start
# → Frontend running at http://localhost:3000
```

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register user | — |
| POST | `/api/auth/login` | Login | — |
| GET | `/api/auth/me` | Get current user | Bearer |

### Resumes
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/upload-resume` | Upload PDF resume | Bearer (candidate) |
| GET | `/api/resumes/my` | My resumes | Bearer |
| GET | `/api/resumes/all` | All resumes | Admin |

### Jobs
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/upload-job` | Post job | Admin |
| GET | `/api/jobs` | List active jobs | Bearer |
| GET | `/api/jobs/<id>` | Get job detail | Bearer |
| DELETE | `/api/jobs/<id>` | Deactivate job | Admin |

### Matching
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/match-score?resume_id=&job_id=` | Compute match score | Bearer |
| GET | `/api/rank-candidates?job_id=&min_score=` | Rank all candidates | Admin |
| GET | `/api/download-report?job_id=` | Download CSV report | Admin |

---

## 🧠 ML Pipeline

```
PDF Upload → PyPDF2 Text Extraction
         → Text Preprocessing (lowercase, remove punctuation, remove stopwords)
         → TF-IDF Vectorization (unigrams + bigrams, max 5000 features)
         → Cosine Similarity Score (0-100%)
         → Skill Gap Analysis (keyword matching against 80+ known skills)
         → Results stored in MongoDB
```

---

## 🧪 Quick API Test (cURL)

```bash
# Register admin
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"HR Admin","email":"admin@co.com","password":"admin123","role":"admin"}'

# Post a job (use token from above)
curl -X POST http://localhost:5000/api/upload-job \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Python Dev","description":"We need a Python developer with Django, REST APIs, PostgreSQL, Docker, and AWS experience for building scalable microservices."}'

# Upload resume
curl -X POST http://localhost:5000/api/upload-resume \
  -H "Authorization: Bearer CANDIDATE_TOKEN" \
  -F "resume=@/path/to/resume.pdf"

# Get match score
curl "http://localhost:5000/api/match-score?resume_id=RESUME_ID&job_id=JOB_ID" \
  -H "Authorization: Bearer TOKEN"

# Rank candidates
curl "http://localhost:5000/api/rank-candidates?job_id=JOB_ID&min_score=0" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## 🏗️ Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MONGO_URI` | `mongodb://localhost:27017/resume_screener` | MongoDB connection string |
| `JWT_SECRET` | `change_me` | JWT signing key (change in production!) |
| `FLASK_DEBUG` | `True` | Enable debug mode |
| `UPLOAD_FOLDER` | `uploads` | PDF storage directory |
| `MAX_CONTENT_LENGTH` | `16777216` | Max upload size (16MB) |

---

## 🔒 Security Notes

- Change `JWT_SECRET` in production
- Add rate limiting (Flask-Limiter) for production
- Store PDFs in S3/GCS instead of local disk for production
- Add HTTPS (nginx reverse proxy)
- Validate file contents server-side (not just extension)
