"""
seed_feed.py  —  Populate MongoDB with sample Tech Feed posts (diverse HR authors).
Run from: d:\resume-screening-system\backend\
Usage:  python seed_feed.py
"""
import sys, os, datetime
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env'))

from bson import ObjectId
from utils.db import get_db

db  = get_db()
now = datetime.datetime.utcnow()

# ─── Diverse HR personas (will use the real admin _id but varied display names) ─
# We store author_name separately so we can use any name we like
admin = db.users.find_one({"role": "admin"})
admin_id = admin["_id"] if admin else ObjectId()

def ts(days=0, hours=0):
    return now - datetime.timedelta(days=days, hours=hours)

def doc(author_name, author_title, category, tags, content, days=0, hours=0, likes=None):
    """Build a post document with a realistic author display name."""
    created = ts(days=days, hours=hours)
    return {
        "author_id":   admin_id,
        "author_name": f"{author_name}",
        "author_role": "admin",
        "content":     content.strip(),
        "tags":        tags,
        "category":    category,
        "image_url":   "",
        "likes":       likes or [],
        "comments":    [],
        "created_at":  created,
        "updated_at":  created,
    }

POSTS = [

    # ════════════════════════════════════════════════════════
    #  TECHNOLOGY
    # ════════════════════════════════════════════════════════
    doc(
        author_name="Priya Sharma", author_title="Senior Tech Recruiter",
        category="Technology", tags=["React", "Frontend", "JavaScript"],
        hours=1,
        content="""🚀 React 19 is here — and it changes EVERYTHING for frontend developers!

Here's what the React team just shipped:

✅ React Compiler — no more manually writing useMemo/useCallback
✅ Server Actions — call async server functions directly in components
✅ use() hook — read Promises and Context right inside render
✅ Document Metadata support — manage <title> and <meta> natively
✅ Dramatically improved error messages for hydration issues

This is the biggest React release since Hooks in React 16.8.

💼 Interview tip: If you're applying for frontend roles this quarter, understanding Server Components + the new Compiler will set you apart from 90% of candidates.

Start exploring today — the ecosystem is evolving fast! 🔥

#React #Frontend #JavaScript #WebDevelopment #ReactJS"""
    ),

    doc(
        author_name="Arjun Menon", author_title="Engineering Manager",
        category="Technology", tags=["Python", "FastAPI", "Backend"],
        hours=20,
        content="""🐍 Python just topped the TIOBE Index for the 4th year in a row.

But here's what's actually driving it in 2025:

1️⃣ AI/ML dominance — PyTorch, TensorFlow, Hugging Face are all Python-first
2️⃣ FastAPI replaced Flask in most new projects (async, type-safe, blazing fast)
3️⃣ Python 3.12 is 25% faster than 3.10 in benchmarks
4️⃣ uv package manager — pip replacement that's 10-100x faster
5️⃣ Pydantic v2 — data validation now with Rust under the hood

📊 Python skills appear in 68% of data-related job postings we see right now.

If you're on the fence about learning Python — stop hesitating. The ROI is real.

Best resources to get started:
→ FastAPI official docs (fastapi.tiangolo.com)
→ Real Python (realpython.com)
→ Fluent Python (book by Luciano Ramalho)

#Python #Programming #BackendDevelopment #Tech2025"""
    ),

    doc(
        author_name="Sneha Iyer", author_title="Full Stack Developer & HR Tech",
        category="Technology", tags=["TypeScript", "JavaScript", "WebDev"],
        days=1,
        content="""⚡ TypeScript is now used in 80% of large JavaScript projects — here's why it matters for your career.

State of JS 2024 survey key findings:

📊 TypeScript satisfaction rate: 94% (highest ever)
📊 Salary premium for TypeScript devs: +18% vs plain JS
📊 Top requested skill in frontend job postings: TypeScript + React

TypeScript features you MUST know right now:
• Satisfies operator — the underrated gem of TS 4.9+
• Template Literal Types — string manipulation at type level
• Generic Constraints — writing reusable, safe abstractions
• Discriminated Unions — exhaustive type checking patterns
• Type Guards & Assertion Functions

🎯 For job seekers: if your GitHub shows TypeScript projects, you immediately pass the first screening filter at most product companies.

Drop a 🙋 if you've already made the switch!

#TypeScript #JavaScript #WebDevelopment #FrontendDev"""
    ),

    # ════════════════════════════════════════════════════════
    #  AI & ML
    # ════════════════════════════════════════════════════════
    doc(
        author_name="Dr. Kavya Nair", author_title="AI/ML Lead & Recruiter",
        category="AI & ML", tags=["AI", "LLM", "Agents", "Gemini"],
        hours=4,
        content="""🤖 2025 is officially the Year of AI Agents — here's what that means for developers.

What's happened in the last 3 months:
🔹 OpenAI launched "Operator" — AI that autonomously browses the web
🔹 Google's Gemini 2.0 has native real-time tool use and multimodal output
🔹 Anthropic's Claude now has computer-use capabilities (it can use your laptop!)
🔹 LangGraph & CrewAI went from niche to mainstream for multi-agent systems
🔹 Microsoft Copilot is embedded in Windows, Office, GitHub, and Teams

What this means for developers:
→ RAG (Retrieval-Augmented Generation) is now a must-have skill
→ Prompt Engineering is evolving into "Agentic System Design"
→ Vector Databases (Pinecone, Weaviate, ChromaDB) are production requirements

💼 Candidates with LLM + RAG experience are commanding 30-40% salary premiums in our recent placements.

Are you already building AI-powered apps? Tell us below! 👇

#AI #LLM #GenerativeAI #MachineLearning #AIAgents"""
    ),

    doc(
        author_name="Rohit Verma", author_title="Data Science Hiring Lead",
        category="AI & ML", tags=["MachineLearning", "Python", "DeepLearning", "Roadmap"],
        days=2,
        content="""📊 The definitive Machine Learning Roadmap for 2025 (save this!)

Getting into ML feels overwhelming. Here's the structured path:

━━ STAGE 1 — Foundations (2 months) ━━
├─ Python: NumPy, Pandas, Matplotlib, Seaborn
├─ Statistics: distributions, hypothesis testing, probability
└─ Linear Algebra: matrices, eigenvalues, PCA intuition

━━ STAGE 2 — Core ML (3 months) ━━
├─ scikit-learn: classification, regression, clustering
├─ Cross-validation, Grid Search, Feature Engineering
└─ Model Evaluation: precision, recall, F1, ROC-AUC

━━ STAGE 3 — Deep Learning (3 months) ━━
├─ Neural Networks from scratch (then PyTorch)
├─ CNNs for vision, RNNs/LSTMs for sequences
└─ Attention mechanism → Transformers

━━ STAGE 4 — Specialization ━━
├─ NLP → Hugging Face, fine-tuning LLMs
├─ CV → YOLOv8, SAM, Stable Diffusion
└─ MLOps → MLflow, Docker, Airflow, Weights & Biases

Pro tip: Kaggle competitions after Stage 2 give you REAL experience that stands out on resumes.

Save 📌 and share with someone starting their ML journey!

#MachineLearning #DeepLearning #AI #DataScience"""
    ),

    doc(
        author_name="Dr. Kavya Nair", author_title="AI/ML Lead & Recruiter",
        category="AI & ML", tags=["LLM", "HuggingFace", "OpenSource", "Ollama"],
        days=3, hours=6,
        content="""🦾 Fine-tuning your own LLM is now accessible to EVERYONE — here's how.

Just 2 years ago this required Google-scale infrastructure. Today:

✅ QLoRA — fine-tune a 7B parameter model on a single NVIDIA RTX 3090
✅ Hugging Face PEFT library — 10 lines of code to start fine-tuning
✅ Ollama — run Llama 3, Mistral, Phi-3 locally on your laptop (yes, really)
✅ LM Studio — ChatGPT-like UI for running local models
✅ Google Colab T4 GPU — still free, still awesome for experiments

Best open-source models to try right now:
→ 🦙 Llama 3.1 70B (Meta) — best overall quality
→ 🌟 Mistral 7B — incredible for its size
→ 🤖 Phi-3.5 Mini (Microsoft) — shockingly capable at 3.8B params
→ 💎 Gemma 2 9B (Google) — great for fine-tuning
→ 🐉 Qwen 2.5 Coder — best for code generation tasks

The democratization of AI is REAL. You can build your own AI assistant this weekend.

What local LLM are you running? Drop it below! 🔥

#LLM #OpenSource #HuggingFace #LocalAI #MachineLearning"""
    ),

    # ════════════════════════════════════════════════════════
    #  CLOUD
    # ════════════════════════════════════════════════════════
    doc(
        author_name="Vikram Singh", author_title="Cloud Architect & Technical Recruiter",
        category="Cloud", tags=["AWS", "Azure", "GCP", "CloudComputing"],
        hours=7,
        content="""☁️ AWS vs Azure vs GCP in 2025 — The honest guide for developers choosing a cloud to learn.

I've screened 300+ cloud engineers this year. Here's the real breakdown:

🟠 AWS (Amazon Web Services)
• Market leader — 32% share, most job listings
• 200+ services — whatever you need, AWS has it
• Best for: startups, general-purpose cloud, SaaS
• Must-know: EC2, S3, Lambda, RDS, EKS, CloudFormation
• Top certs: AWS SAA-C03, AWS DevOps Pro

🔵 Microsoft Azure
• #2 in market, 23% share — HUGE in enterprise India
• Best Microsoft ecosystem integration (Active Directory, Office 365)
• Best for: corporate enterprise, .NET shops, hybrid cloud
• Must-know: Azure AD, App Service, AKS, Azure DevOps
• Top certs: AZ-900 (start here), AZ-104, AZ-305

🟡 Google Cloud Platform (GCP)
• Strongest AI/ML portfolio (Vertex AI, BigQuery ML, TPUs)
• Invented Kubernetes — best managed K8s experience
• Best for: data engineering, ML pipelines, analytics
• Must-know: BigQuery, Dataflow, GKE, Vertex AI
• Top certs: Associate Cloud Engineer, Professional DE

💡 My recommendation: Learn AWS first (most job opportunities), add GCP if you're ML-focused.

Which cloud are you certified on? 👇

#AWS #Azure #GCP #CloudComputing #DevOps #CloudCertification"""
    ),

    doc(
        author_name="Meera Pillai", author_title="DevOps Lead & Infrastructure Recruiter",
        category="Cloud", tags=["Docker", "Kubernetes", "DevOps", "Containers"],
        days=1, hours=3,
        content="""🐳 Docker + Kubernetes — explained simply for developers who always found it confusing.

DOCKER in plain English:
Think of Docker as a shipping container 📦
→ You pack your app + ALL its dependencies inside
→ It runs EXACTLY the same on any machine (dev, staging, prod)
→ Goodbye "works on my machine" problem forever 😅

KUBERNETES (K8s) in plain English:
Think of K8s as a smart fleet manager for your containers 🚢
→ Automatically starts containers when you deploy
→ Restarts them instantly if they crash (self-healing)
→ Load balances traffic across multiple container instances
→ Scales from 1 → 1000 containers based on traffic

The production workflow:
Code → Docker Image → Push to Registry → K8s pulls & deploys → Auto-scales

Essential commands to memorise:
```
# Docker
docker build -t myapp:latest .
docker run -p 3000:3000 myapp:latest
docker push registry/myapp:latest

# Kubernetes
kubectl apply -f deployment.yaml
kubectl get pods -n production
kubectl logs -f pod-name
kubectl scale deployment myapp --replicas=5
kubectl rollout undo deployment/myapp
```

Save this! You'll thank me in your next DevOps interview 🎯

#Docker #Kubernetes #DevOps #CloudNative #Containers #K8s"""
    ),

    # ════════════════════════════════════════════════════════
    #  CAREER TIPS
    # ════════════════════════════════════════════════════════
    doc(
        author_name="Nandini Rao", author_title="Senior HR Manager",
        category="Career Tips", tags=["Resume", "Jobs", "Interview", "CareerTips"],
        hours=10,
        content="""📝 I review 50+ resumes a week. Here are the 7 mistakes costing you interviews.

After reviewing 500+ resumes this year, these patterns keep hurting candidates:

❌ 1. Vague objective statement
✅ Replace with: "Full-stack developer with 4 years building React + Node.js SaaS products, led team of 5"

❌ 2. Listing job duties instead of achievements
✅ Instead of "worked on APIs" write "Built 12 REST APIs serving 80K daily requests, with 99.9% uptime"

❌ 3. Zero metrics or numbers
✅ Quantify everything: reduced build time, improved performance %, users served, cost saved

❌ 4. 3-page resumes for entry/mid-level roles
✅ 1 page for 0-5 years, 2 pages maximum for 6+ years experience

❌ 5. Generic skill list ("HTML, CSS, MS Office")
✅ Show proficiency: "React 18 + TypeScript, Next.js 14, Node.js, PostgreSQL, Redis"

❌ 6. No GitHub link / portfolio
✅ Your deployed projects are your strongest argument, especially early career

❌ 7. Fancy templates with tables, columns, images
✅ ATS (our software) cannot parse complex layouts. Simple single-column = 100% parsed

Want me to review your resume? Comment below!

#Resume #JobSearch #CareerTips #HiringTips #TechJobs"""
    ),

    doc(
        author_name="Nandini Rao", author_title="Senior HR Manager",
        category="Career Tips", tags=["Interview", "DSA", "SystemDesign", "CodingInterview"],
        days=2, hours=2,
        content="""🧠 How to crack tech interviews in 2025 — the honest, no-fluff guide.

The landscape has changed. Here's what's actually working for candidates I've placed:

━━ PHASE 1: Data Structures & Algorithms (6-8 weeks) ━━
Focus on PATTERNS, not memorizing 500 problems:
• Two Pointers / Sliding Window → 30+ problems solved
• HashMap patterns → frequency counting, grouping
• Binary Search variations → rotated arrays, answer search
• Tree traversals (BFS/DFS) → 90% of tree questions
• Dynamic Programming → start 1D, then 2D grids

Best resource: NeetCode.io (free, structured, video explanations)

━━ PHASE 2: System Design (3-4 weeks, for 3+ YoE) ━━
Practice designing:
→ URL Shortener (tinyurl clone) — classic starter
→ Instagram/Twitter Feed — follow/unfollow, timeline
→ WhatsApp — messaging, delivery status, groups
→ Uber — geolocation, matching, real-time updates

Key concepts: CAP theorem, Load balancers, Caching (Redis), DB sharding, Message queues

Best resource: "Designing Data-Intensive Applications" by Martin Kleppmann

━━ PHASE 3: Behavioral (1 week) ━━
Prepare 5-7 STAR-format stories covering:
• Technical leadership, handling conflict, biggest failure, cross-team collaboration

Total realistic timeline: 10-12 weeks part-time

Save this 📌 — you'll need it!

#CodingInterview #DSA #SystemDesign #TechInterview #CareerGrowth"""
    ),

    doc(
        author_name="Rahul Gupta", author_title="Compensation & Benefits Specialist",
        category="Career Tips", tags=["Salary", "Negotiation", "TechSalary"],
        days=4,
        content="""💰 Most developers leave ₹2-5 Lakhs on the table by not negotiating. Here's how to fix that.

Real data: 73% of employers expect candidates to negotiate. They budget for it. If you don't ask, they keep the difference.

THE GOLDEN RULES:
1️⃣ Never give the first number — always let them anchor first
2️⃣ Research the market BEFORE any salary conversation (Glassdoor, Levels.fyi, LinkedIn Salary, AmbitionBox)
3️⃣ Negotiate the TOTAL package, not just base salary

Beyond base salary — what to negotiate:
→ Joining bonus (often one-time, easier to get approved)
→ Performance bonus target %
→ ESOPs / RSUs (especially at startups/late-stage)
→ Remote work days (has real monetary value!)
→ Learning & development budget (₹50K-2L/year at good companies)
→ Extra leave days

SCRIPTS THAT ACTUALLY WORK:

❌ "Can you increase the salary?"
✅ "Based on my 4 years of experience with React and AWS, and market comps I've researched showing ₹22-28L for this role, I was expecting closer to ₹26L. Is there flexibility?"

After they respond:
✅ "I'm genuinely excited about this role. If we can get to ₹25L with a ₹1L joining bonus, I'm ready to sign today."

Always get the FINAL offer in writing before resigning.

React with 💰 if you've successfully negotiated your salary up!

#SalaryNegotiation #TechSalary #CareerAdvice #TechJobs #IndiaIT"""
    ),

    # ════════════════════════════════════════════════════════
    #  INDUSTRY NEWS
    # ════════════════════════════════════════════════════════
    doc(
        author_name="Vikram Singh", author_title="Cloud Architect & Technical Recruiter",
        category="Industry News", tags=["TechJobs", "Hiring", "India", "2025"],
        hours=2,
        content="""📰 Tech Hiring in India — Q1 2025 Reality Check

After interviewing 200+ candidates and placing 40+ this quarter, here's what's really happening:

✅ HIRING IS BACK — but much more selective than pre-2023

🔥 HOT ROLES with strong demand:
• AI/ML Engineers — +52% YoY demand, limited supply
• Full-Stack (TypeScript + React + Node) — steady high demand
• DevOps / SRE / Platform Engineers — cloud migration driving this
• Data Engineers (dbt, Spark, Airflow, Kafka)
• Cybersecurity — CISO-level awareness is finally reaching SMEs

⚠️ SLOWING DOWN:
• Junior roles in pure frontend (AI tools are automating this)
• Manual QA (being replaced by AI testing tools rapidly)
• Pure WordPress/PHP development

📊 SALARY RANGES (India, March 2025):
→ Fresher (0-1yr): ₹4-10 LPA (product) / ₹3-6 LPA (service)
→ Junior (2-3yr): ₹12-22 LPA
→ Mid-level (4-6yr): ₹20-40 LPA
→ Senior (7-10yr): ₹35-70 LPA
→ Staff/Principal: ₹70L - 1.5Cr

Key insight: Adding AI/LLM skills to any role profile = 25-40% salary premium.

What's your experience with the market right now? 👇

#TechJobs #Hiring2025 #IndiaIT #TechSalary #SoftwareEngineering"""
    ),

    doc(
        author_name="Dr. Kavya Nair", author_title="AI/ML Lead & Recruiter",
        category="Industry News", tags=["OpenAI", "Google", "Anthropic", "AI", "TechNews"],
        days=1, hours=5,
        content="""🌍 The AI Arms Race — Scorecard for March 2025

Who's winning? Here's a quick, honest breakdown:

🟢 OpenAI
• GPT-4o dominates in code generation and multimodal tasks
• Sora (video generation) rolling out to more users
• Apple partnership — Siri now powered by ChatGPT for complex queries
• Valuation: $157B (still private but IPO rumored in 2025)

🔵 Google DeepMind
• Gemini 2.0 Flash — shockingly fast & cheap per token
• NotebookLM went viral: turn any PDF/video into a podcast
• AlphaFold 3 is revolutionizing drug discovery
• Leads all companies in research paper citations

🟠 Anthropic
• Claude 3.5 Sonnet = best model for coding tasks (per benchmarks)
• Constitutional AI approach is winning enterprise trust
• Partnership with AWS Bedrock driving enterprise adoption

🟣 Meta AI
• Llama 3.1 is the best open-source LLM — period
• Running inference at 600 billion tokens/day globally
• AI deeply integrated in WhatsApp, Instagram, Threads, Facebook

🔴 Microsoft
• Copilot embedded across entire Microsoft stack
• $13B invested in OpenAI creating conflicts of interest debates
• Azure OpenAI — enterprise AI service of choice

Winner for developers? Arguably US — we've never had better, cheaper, more accessible AI tools.

Which AI product do you use daily? 👇

#AI #OpenAI #Google #Microsoft #TechNews #GenerativeAI"""
    ),

    # ════════════════════════════════════════════════════════
    #  GENERAL
    # ════════════════════════════════════════════════════════
    doc(
        author_name="Arjun Menon", author_title="Engineering Manager",
        category="General", tags=["DevTools", "Productivity", "Developer"],
        hours=5,
        content="""⚙️ 10 developer tools I can't work without in 2025

After testing dozens of tools this year, these made the cut:

1️⃣ Cursor IDE — AI-native editor; accepts/rejects suggestions better than Copilot
2️⃣ GitHub Copilot — now with Claude & GPT-4o integration; pairs with Cursor
3️⃣ Warp Terminal — AI-powered terminal, command autocomplete and explanation
4️⃣ Bruno — Open-source Postman alternative. No account, no cloud sync, just works
5️⃣ TablePlus — Beautiful GUI for PostgreSQL, MongoDB, Redis. Worth every rupee
6️⃣ Excalidraw — Whiteboard for system design & architecture diagrams
7️⃣ Linear — Project management that developers actually enjoy using
8️⃣ Raycast (macOS) — Replaces Spotlight with AI and developer superpowers
9️⃣ Notion AI — Docs + notes + AI assistant in one place
🔟 Loom — Async video walkthroughs; perfect for remote code reviews

All have free tiers. Try even 3 of these and your workflow improves immediately.

Which tool changed your developer experience the most? 💬

#DevTools #Productivity #SoftwareDevelopment #Developer #Coding"""
    ),

    doc(
        author_name="Sneha Iyer", author_title="Full Stack Developer & HR Tech",
        category="General", tags=["OpenSource", "GitHub", "Career", "Community"],
        days=3,
        content="""⭐ Open source contributions completely changed my career trajectory — here's how to start.

2.5 years ago I was an average developer. Then I started contributing to open source. What happened:

📈 My code quality improved dramatically — reading production-grade codebases is the best education
📈 I was noticed by a company that found me through my GitHub PRs (that's how I got hired)
📈 My GitHub profile replaced my resume as the first thing interviewers reviewed
📈 I built genuine relationships with world-class engineers globally

HOW TO START (even as a complete beginner):

Step 1: Find "good first issue" labeled issues
→ Go to github.com/explore
→ Filter by language and "good first issue" label
→ Look for issues with clear descriptions and no PR open

Step 2: Start SMALL — fix typos in docs, improve error messages, add test cases
Step 3: Always read CONTRIBUTING.md before your first PR
Step 4: Be patient — maintainers are volunteers. Follow up politely after 2 weeks.

Repositories perfect for first contributions:
→ freeCodeCamp (largest open source codebase, ultra-welcoming)
→ Exercism (coding exercises, great community)
→ Any tool/library YOU use regularly

Your first merged PR feeling: UNMATCHABLE 🎉

Drop a ⭐ if open source has positively impacted your career!

#OpenSource #GitHub #Career #Developer #OpenSourceContributions"""
    ),

    doc(
        author_name="Rahul Gupta", author_title="Compensation & Benefits Specialist",
        category="General", tags=["WorkLifeBalance", "Remote", "WellBeing", "Developer"],
        days=5,
        content="""🧘 Developer burnout is real — here's what the data says and how to protect yourself.

New study from Stack Overflow + GitHub (2024): 65% of developers report experiencing burnout in the past year.

Common causes I see in candidates I interview:
• Always-on culture with Slack/Teams notifications 24/7
• Unrealistic sprint velocity expectations
• Zero boundaries between remote work and personal life
• Fear of missing out on the "AI revolution" → constant learning pressure
• No recognition for quality work, only blame for failures

🔴 Early warning signs:
• You dread opening your laptop on Monday mornings
• You feel disconnected from your team's purpose
• Small bugs frustrate you disproportionately
• Your side projects feel like obligations

🟢 What actually helps (from developers who recovered):
1. Hard stop time for work — treat it like a meeting you can't cancel
2. Phone in another room during meals and 1 hour before sleep
3. Regular exercise — even 20-min walks change your cognitive state
4. Quarterly "what am I working toward?" reflection
5. Being honest with your manager before you hit the wall, not after

💼 From a hiring perspective: developers who know their limits and communicate proactively are far more valuable than "heroes" who burn out in 18 months.

Has burnout affected you? What helped? Share below 👇

#DeveloperWellbeing #WorkLifeBalance #MentalHealth #SoftwareDevelopment #TechCulture"""
    ),
]

# ─── Insert all posts ─────────────────────────────────────────────────────────
inserted = 0
for post_doc in POSTS:
    db.posts.insert_one(post_doc)
    inserted += 1
    author = post_doc['author_name']
    cat    = post_doc['category']
    title  = post_doc['content'][:55].replace('\n', ' ').strip()
    print(f"  ✅ [{cat:15s}] by {author:20s}  {title}...")

print(f"\n🎉 Done! {inserted}/{len(POSTS)} posts seeded into MongoDB.")
print(f"\nAuthors used:")
authors = sorted(set(p['author_name'] for p in POSTS))
for a in authors:
    count = sum(1 for p in POSTS if p['author_name'] == a)
    print(f"  • {a} ({count} post{'s' if count > 1 else ''})")
