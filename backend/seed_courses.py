"""
seed_courses.py
Run once to insert sample online courses into MongoDB.
Usage:  python seed_courses.py
"""

import datetime
from utils.db import get_db

COURSES = [
    {
        "title": "Python for Data Science & AI",
        "description": (
            "Master Python from scratch and learn how to analyse data, build machine-learning "
            "models, and deploy AI solutions. Covers NumPy, pandas, Matplotlib, scikit-learn, "
            "and a hands-on capstone project."
        ),
        "category": "Data Science",
        "level": "Beginner",
        "duration_hours": 18,
        "instructor": "Dr. Priya Sharma",
        "instructor_title": "Senior Data Scientist, Google DeepMind",
        "thumbnail_url": "",
        "tags": ["Python", "pandas", "NumPy", "ML", "scikit-learn", "Data Analysis"],
        "certificate_title": "Certificate of Completion – Python for Data Science & AI",
        "lessons": [
            {"id": "py-1", "title": "Python Basics & Environment Setup",       "duration_min": 45,  "video_url": "", "description": "Install Python, virtual environments, and Jupyter Notebook."},
            {"id": "py-2", "title": "Data Types, Loops & Functions",            "duration_min": 60,  "video_url": "", "description": "Core Python programming concepts with hands-on exercises."},
            {"id": "py-3", "title": "NumPy & Array Operations",                 "duration_min": 50,  "video_url": "", "description": "Vectorised computation and matrix operations with NumPy."},
            {"id": "py-4", "title": "Data Wrangling with pandas",               "duration_min": 75,  "video_url": "", "description": "DataFrames, groupby, merge, and cleaning messy datasets."},
            {"id": "py-5", "title": "Data Visualisation with Matplotlib & Seaborn", "duration_min": 50, "video_url": "", "description": "Create stunning charts and dashboards."},
            {"id": "py-6", "title": "Introduction to Machine Learning",         "duration_min": 90,  "video_url": "", "description": "Linear regression, classification, and model evaluation."},
            {"id": "py-7", "title": "Capstone Project: Predictive Analytics",   "duration_min": 120, "video_url": "", "description": "Build a real-world prediction model end-to-end."},
        ],
    },
    {
        "title": "Full-Stack Web Development with React & Node.js",
        "description": (
            "Build modern, production-ready web apps using React on the frontend and Node.js/Express "
            "on the backend. Learn REST APIs, MongoDB, JWT authentication, and deploy to the cloud."
        ),
        "category": "Technology",
        "level": "Intermediate",
        "duration_hours": 24,
        "instructor": "Arjun Mehta",
        "instructor_title": "Lead Engineer, Flipkart",
        "thumbnail_url": "",
        "tags": ["React", "Node.js", "Express", "MongoDB", "REST API", "JWT", "JavaScript"],
        "certificate_title": "Full-Stack Developer Certificate",
        "lessons": [
            {"id": "fs-1", "title": "HTML, CSS & Modern JavaScript (ES6+)",    "duration_min": 60,  "video_url": "", "description": "Refresh your frontend fundamentals with ES6 features."},
            {"id": "fs-2", "title": "React Fundamentals & Hooks",              "duration_min": 90,  "video_url": "", "description": "useState, useEffect, custom hooks, and component patterns."},
            {"id": "fs-3", "title": "React Router & State Management",         "duration_min": 60,  "video_url": "", "description": "Client-side routing and managing global state."},
            {"id": "fs-4", "title": "Node.js & Express REST API",              "duration_min": 75,  "video_url": "", "description": "Build a RESTful API with authentication middleware."},
            {"id": "fs-5", "title": "MongoDB & Mongoose ODM",                  "duration_min": 60,  "video_url": "", "description": "Schema design, CRUD operations, and aggregation."},
            {"id": "fs-6", "title": "JWT Authentication & Security",           "duration_min": 50,  "video_url": "", "description": "Secure your API with tokens, bcrypt, and CORS."},
            {"id": "fs-7", "title": "Deployment: Vercel + Railway + MongoDB Atlas", "duration_min": 45, "video_url": "", "description": "Deploy your full-stack app to the cloud for free."},
        ],
    },
    {
        "title": "AWS Cloud Practitioner: Zero to Certified",
        "description": (
            "Prepare for the AWS Certified Cloud Practitioner exam. Understand core AWS services — "
            "EC2, S3, RDS, Lambda, IAM, CloudFront — and cloud architecture best practices. "
            "Includes 3 full-length practice exams."
        ),
        "category": "Cloud",
        "level": "Beginner",
        "duration_hours": 14,
        "instructor": "Neha Verma",
        "instructor_title": "AWS Solutions Architect, TCS",
        "thumbnail_url": "",
        "tags": ["AWS", "Cloud", "EC2", "S3", "Lambda", "IAM", "DevOps", "Certification"],
        "certificate_title": "AWS Cloud Practitioner Readiness Certificate",
        "lessons": [
            {"id": "aws-1", "title": "Cloud Computing Fundamentals",           "duration_min": 40,  "video_url": "", "description": "IaaS, PaaS, SaaS, and the AWS global infrastructure."},
            {"id": "aws-2", "title": "IAM – Users, Roles & Policies",         "duration_min": 50,  "video_url": "", "description": "Secure your AWS account with least-privilege access."},
            {"id": "aws-3", "title": "Compute: EC2 & Lambda",                 "duration_min": 60,  "video_url": "", "description": "Launch EC2 instances and build serverless functions."},
            {"id": "aws-4", "title": "Storage: S3, EBS & Glacier",            "duration_min": 45,  "video_url": "", "description": "Object storage, lifecycle policies, and backups."},
            {"id": "aws-5", "title": "Databases: RDS, DynamoDB & ElastiCache","duration_min": 55,  "video_url": "", "description": "Managed databases and caching strategies on AWS."},
            {"id": "aws-6", "title": "Networking: VPC, CloudFront & Route 53","duration_min": 50,  "video_url": "", "description": "Build secure, scalable network architectures."},
            {"id": "aws-7", "title": "Billing, Pricing & Practice Exam",      "duration_min": 60,  "video_url": "", "description": "Cost optimisation and 3 mock exams with answers."},
        ],
    },
    {
        "title": "Machine Learning & Deep Learning Masterclass",
        "description": (
            "Go deep into ML/DL algorithms. Master supervised and unsupervised learning, neural "
            "networks, CNNs, RNNs, and transformers. Build projects in TensorFlow and PyTorch."
        ),
        "category": "AI & ML",
        "level": "Advanced",
        "duration_hours": 30,
        "instructor": "Prof. Rajan Iyer",
        "instructor_title": "AI Research Lead, IIT Bombay",
        "thumbnail_url": "",
        "tags": ["ML", "Deep Learning", "TensorFlow", "PyTorch", "CNN", "NLP", "Transformers"],
        "certificate_title": "Advanced AI & Machine Learning Certificate",
        "lessons": [
            {"id": "ml-1", "title": "Math for ML: Linear Algebra & Statistics","duration_min": 75, "video_url": "", "description": "Vectors, matrices, probability, and gradient descent."},
            {"id": "ml-2", "title": "Supervised Learning Algorithms",          "duration_min": 90, "video_url": "", "description": "Regression, SVM, decision trees, and ensemble methods."},
            {"id": "ml-3", "title": "Unsupervised Learning & Clustering",      "duration_min": 60, "video_url": "", "description": "K-means, DBSCAN, PCA, and anomaly detection."},
            {"id": "ml-4", "title": "Neural Networks from Scratch",            "duration_min": 90, "video_url": "", "description": "Backpropagation, activation functions, and optimisers."},
            {"id": "ml-5", "title": "CNNs for Computer Vision",               "duration_min": 80, "video_url": "", "description": "Build image classifiers with ResNet and EfficientNet."},
            {"id": "ml-6", "title": "NLP & Transformer Architectures",        "duration_min": 90, "video_url": "", "description": "BERT, GPT, attention mechanism, and fine-tuning LLMs."},
            {"id": "ml-7", "title": "MLOps: Deploy Models to Production",     "duration_min": 75, "video_url": "", "description": "Docker, FastAPI, model monitoring, and CI/CD for ML."},
        ],
    },
    {
        "title": "Cybersecurity Fundamentals & Ethical Hacking",
        "description": (
            "Learn how attackers think and how to defend against them. Covers network security, "
            "penetration testing, OWASP Top 10, cryptography, and hands-on CTF challenges. "
            "Prepares you for CompTIA Security+ and CEH exams."
        ),
        "category": "Cybersecurity",
        "level": "Intermediate",
        "duration_hours": 20,
        "instructor": "Kiran Das",
        "instructor_title": "Ethical Hacker & CISO, Infosys",
        "thumbnail_url": "",
        "tags": ["Cybersecurity", "Ethical Hacking", "Penetration Testing", "OWASP", "Network Security", "Cryptography"],
        "certificate_title": "Cybersecurity Foundations Certificate",
        "lessons": [
            {"id": "cs-1", "title": "Cybersecurity Landscape & Threat Actors", "duration_min": 45, "video_url": "", "description": "Types of attacks, threat actors, and the CIA triad."},
            {"id": "cs-2", "title": "Network Security & Firewalls",            "duration_min": 60, "video_url": "", "description": "TCP/IP, VPNs, IDS/IPS, and firewall configuration."},
            {"id": "cs-3", "title": "Web Application Security (OWASP Top 10)","duration_min": 75, "video_url": "", "description": "SQL injection, XSS, CSRF, and how to prevent them."},
            {"id": "cs-4", "title": "Penetration Testing with Kali Linux",    "duration_min": 90, "video_url": "", "description": "Nmap, Metasploit, Burp Suite, and exploit frameworks."},
            {"id": "cs-5", "title": "Cryptography & PKI",                     "duration_min": 50, "video_url": "", "description": "Symmetric/asymmetric encryption, TLS, and certificates."},
            {"id": "cs-6", "title": "Digital Forensics & Incident Response",  "duration_min": 60, "video_url": "", "description": "Investigate breaches and build incident response plans."},
        ],
    },
    {
        "title": "Leadership & Management for Tech Professionals",
        "description": (
            "Transition from individual contributor to impactful leader. Learn how to manage "
            "engineering teams, run effective sprint meetings, handle conflict, give feedback, "
            "and align technical work with business goals."
        ),
        "category": "Leadership",
        "level": "Intermediate",
        "duration_hours": 10,
        "instructor": "Sunita Kapoor",
        "instructor_title": "VP Engineering, Razorpay",
        "thumbnail_url": "",
        "tags": ["Leadership", "Management", "Agile", "Team Building", "Communication", "Career Growth"],
        "certificate_title": "Tech Leadership & Management Certificate",
        "lessons": [
            {"id": "lead-1", "title": "From Engineer to Manager: The Mindset Shift", "duration_min": 45, "video_url": "", "description": "Understanding your new role and common first-time manager mistakes."},
            {"id": "lead-2", "title": "Running Effective 1-on-1s & Team Meetings",   "duration_min": 40, "video_url": "", "description": "Frameworks for productive meetings and psychological safety."},
            {"id": "lead-3", "title": "Agile Sprint Planning & OKR Alignment",       "duration_min": 50, "video_url": "", "description": "Translate business goals into engineering roadmaps."},
            {"id": "lead-4", "title": "Giving & Receiving Feedback",                 "duration_min": 35, "video_url": "", "description": "The SBI model and creating a feedback culture."},
            {"id": "lead-5", "title": "Conflict Resolution & Difficult Conversations","duration_min": 40, "video_url": "", "description": "Tools for handling disagreement professionally."},
            {"id": "lead-6", "title": "Hiring, Onboarding & Growing Your Team",      "duration_min": 45, "video_url": "", "description": "Interview design and retaining top engineers."},
        ],
    },
    {
        "title": "Resume Writing & Interview Mastery",
        "description": (
            "Get hired faster! This career accelerator course teaches you how to write an ATS-beating "
            "resume, craft a compelling LinkedIn profile, ace behavioural and technical interviews, "
            "and negotiate your salary confidently."
        ),
        "category": "Career",
        "level": "Beginner",
        "duration_hours": 8,
        "instructor": "Meera Pillai",
        "instructor_title": "Senior HR Business Partner, Microsoft India",
        "thumbnail_url": "",
        "tags": ["Resume", "Interview Prep", "LinkedIn", "Salary Negotiation", "Soft Skills", "Job Search"],
        "certificate_title": "Career Accelerator Certificate",
        "lessons": [
            {"id": "cv-1", "title": "Understanding What Recruiters Look For",  "duration_min": 30, "video_url": "", "description": "The 6-second resume scan and ATS algorithms explained."},
            {"id": "cv-2", "title": "Resume Writing Masterclass",              "duration_min": 60, "video_url": "", "description": "Structure, action verbs, quantifying impact, and templates."},
            {"id": "cv-3", "title": "Optimising Your LinkedIn Profile",        "duration_min": 40, "video_url": "", "description": "Headline, summary, skills, and getting recruiter DMs."},
            {"id": "cv-4", "title": "Behavioural Interviews: The STAR Method", "duration_min": 50, "video_url": "", "description": "Craft compelling stories for common HR questions."},
            {"id": "cv-5", "title": "Technical Interview Preparation",         "duration_min": 60, "video_url": "", "description": "DSA, system design, and live coding tips."},
            {"id": "cv-6", "title": "Salary Negotiation Playbook",             "duration_min": 35, "video_url": "", "description": "Scripts and strategies to get 20-30% more."},
        ],
    },
    {
        "title": "Docker, Kubernetes & DevOps Engineering",
        "description": (
            "Master the modern DevOps toolchain. Containerise applications with Docker, orchestrate "
            "them with Kubernetes, set up CI/CD pipelines with GitHub Actions, and monitor with "
            "Prometheus & Grafana."
        ),
        "category": "Cloud",
        "level": "Advanced",
        "duration_hours": 22,
        "instructor": "Vikram Nair",
        "instructor_title": "DevOps Architect, Swiggy",
        "thumbnail_url": "",
        "tags": ["Docker", "Kubernetes", "DevOps", "CI/CD", "GitHub Actions", "Helm", "Prometheus", "Grafana"],
        "certificate_title": "DevOps & Cloud-Native Engineering Certificate",
        "lessons": [
            {"id": "do-1", "title": "Docker Fundamentals: Images & Containers",      "duration_min": 60, "video_url": "", "description": "Dockerfile, layers, volumes, networks, and docker-compose."},
            {"id": "do-2", "title": "Docker Compose & Multi-container Apps",         "duration_min": 50, "video_url": "", "description": "Orchestrate databases, caches, and services locally."},
            {"id": "do-3", "title": "Kubernetes Architecture & Core Objects",        "duration_min": 75, "video_url": "", "description": "Pods, Deployments, Services, ConfigMaps, and Secrets."},
            {"id": "do-4", "title": "Kubernetes Networking & Ingress",               "duration_min": 60, "video_url": "", "description": "ClusterIP, NodePort, Ingress controllers, and cert-manager."},
            {"id": "do-5", "title": "Helm Charts & Package Management",              "duration_min": 50, "video_url": "", "description": "Templating K8s manifests and managing releases."},
            {"id": "do-6", "title": "CI/CD Pipelines with GitHub Actions",          "duration_min": 70, "video_url": "", "description": "Build, test, and deploy on every push automatically."},
            {"id": "do-7", "title": "Monitoring with Prometheus & Grafana",          "duration_min": 55, "video_url": "", "description": "Metrics, alerts, and beautiful dashboards for your apps."},
        ],
    },
]


def seed():
    db = get_db()

    # Use a fake admin id (insert a system user if needed)
    from bson import ObjectId
    import bcrypt

    system_user = db.users.find_one({"email": "courses@system.internal"})
    if not system_user:
        hashed = bcrypt.hashpw(b"system_pass_internal_only", bcrypt.gensalt()).decode()
        result = db.users.insert_one({
            "name": "HireAI Platform",
            "email": "courses@system.internal",
            "password": hashed,
            "role": "admin",
            "created_at": datetime.datetime.utcnow(),
            "updated_at": datetime.datetime.utcnow(),
        })
        admin_id = result.inserted_id
        print("  Created system admin user.")
    else:
        admin_id = system_user["_id"]

    inserted = 0
    skipped = 0
    for course in COURSES:
        existing = db.courses.find_one({"title": course["title"]})
        if existing:
            print(f"  ⚠  Skipping (already exists): {course['title']}")
            skipped += 1
            continue

        now = datetime.datetime.utcnow()
        doc = {
            "admin_id":         admin_id,
            "posted_by_name":   "HireAI Platform",
            "title":            course["title"],
            "description":      course["description"],
            "category":         course["category"],
            "level":            course["level"],
            "duration_hours":   course["duration_hours"],
            "instructor":       course["instructor"],
            "instructor_title": course["instructor_title"],
            "thumbnail_url":    course.get("thumbnail_url", ""),
            "tags":             course.get("tags", []),
            "lessons":          course.get("lessons", []),
            "certificate_title": course["certificate_title"],
            "is_active":        True,
            "enrolled_count":   0,
            "created_at":       now,
            "updated_at":       now,
        }
        db.courses.insert_one(doc)
        print(f"  ✅ Inserted: {course['title']}")
        inserted += 1

    print(f"\nDone! {inserted} courses inserted, {skipped} skipped.")


if __name__ == "__main__":
    print("🎓 Seeding sample online courses...\n")
    seed()
