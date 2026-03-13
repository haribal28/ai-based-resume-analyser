"""
ml/resume_matcher.py
Core ML module for resume text extraction, preprocessing,
TF-IDF vectorization, cosine similarity, and skill gap analysis.
"""

import re
import string
import io
import nltk
import PyPDF2
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Download NLTK data (run once)
try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords', quiet=True)

from nltk.corpus import stopwords

STOP_WORDS = set(stopwords.words('english'))

# Common tech & professional skills for keyword matching
SKILL_KEYWORDS = [
    # Programming Languages
    "python", "java", "javascript", "typescript", "c++", "c#", "ruby", "go",
    "rust", "swift", "kotlin", "scala", "r", "matlab", "php", "perl",
    # Web Frameworks
    "react", "angular", "vue", "node", "express", "django", "flask", "fastapi",
    "spring", "rails", "laravel", "nextjs", "nuxt",
    # Databases
    "sql", "mysql", "postgresql", "mongodb", "redis", "elasticsearch",
    "cassandra", "sqlite", "oracle", "dynamodb",
    # Cloud & DevOps
    "aws", "azure", "gcp", "docker", "kubernetes", "jenkins", "terraform",
    "ansible", "ci/cd", "linux", "git", "github", "gitlab",
    # ML/AI
    "machine learning", "deep learning", "tensorflow", "pytorch", "keras",
    "scikit-learn", "nlp", "computer vision", "pandas", "numpy", "opencv",
    # Soft Skills
    "leadership", "communication", "teamwork", "agile", "scrum", "kanban",
    "problem solving", "project management", "mentoring",
    # General Tech
    "api", "rest", "graphql", "microservices", "blockchain", "security",
    "testing", "unit testing", "data structures", "algorithms",
]


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract raw text content from PDF file bytes."""
    try:
        reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        text = ""
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + " "
        return text.strip()
    except Exception as e:
        raise ValueError(f"Failed to extract text from PDF: {str(e)}")


def preprocess_text(text: str) -> str:
    """
    Preprocess text:
    - Lowercase
    - Remove punctuation
    - Remove stopwords
    - Normalize whitespace
    """
    if not text:
        return ""
    # Lowercase
    text = text.lower()
    # Remove punctuation
    text = text.translate(str.maketrans('', '', string.punctuation))
    # Remove extra whitespace / newlines
    text = re.sub(r'\s+', ' ', text).strip()
    # Remove stopwords
    tokens = text.split()
    tokens = [t for t in tokens if t not in STOP_WORDS and len(t) > 1]
    return " ".join(tokens)


def compute_match_score(resume_text: str, job_description: str) -> float:
    """
    Compute cosine similarity between resume and job description
    using TF-IDF vectors. Returns percentage score (0-100).
    """
    if not resume_text or not job_description:
        return 0.0

    processed_resume = preprocess_text(resume_text)
    processed_job = preprocess_text(job_description)

    if not processed_resume or not processed_job:
        return 0.0

    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        min_df=1,
        max_features=5000
    )

    try:
        tfidf_matrix = vectorizer.fit_transform([processed_resume, processed_job])
        similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])
        score = float(similarity[0][0]) * 100
        return round(score, 2)
    except Exception:
        return 0.0


def extract_skills(text: str) -> list:
    """Extract known skills from text via keyword matching."""
    text_lower = text.lower()
    found = []
    for skill in SKILL_KEYWORDS:
        if skill in text_lower:
            found.append(skill)
    return list(set(found))


def identify_missing_skills(resume_text: str, job_description: str) -> dict:
    """
    Compare skills in resume vs job description.
    Returns dict with resume_skills, required_skills, missing_skills, matching_skills.
    """
    resume_skills = set(extract_skills(resume_text))
    job_skills = set(extract_skills(job_description))

    missing = job_skills - resume_skills
    matching = job_skills & resume_skills

    return {
        "resume_skills": sorted(list(resume_skills)),
        "required_skills": sorted(list(job_skills)),
        "missing_skills": sorted(list(missing)),
        "matching_skills": sorted(list(matching)),
        "match_percentage": round(
            (len(matching) / len(job_skills) * 100) if job_skills else 0, 2
        )
    }


def analyze_resume(resume_bytes: bytes, job_description: str) -> dict:
    """
    Full pipeline: extract text → score → skill gap analysis.
    Returns complete analysis result dict.
    """
    resume_text = extract_text_from_pdf(resume_bytes)

    if not resume_text:
        raise ValueError("No text could be extracted from the PDF.")

    match_score = compute_match_score(resume_text, job_description)
    skills_analysis = identify_missing_skills(resume_text, job_description)

    return {
        "match_score": match_score,
        "resume_text_preview": resume_text[:500] + "..." if len(resume_text) > 500 else resume_text,
        "skills_analysis": skills_analysis
    }
