// src/pages/CoursesPage.js
// Udemy-inspired course portal for candidates:
//   Browse all courses → Enroll → Track lessons → Complete → Download Certificate

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, api } from '../context/AuthContext';
import Navbar from '../components/Common/Navbar';

const CATEGORIES = ['All', 'Technology', 'AI & ML', 'Cloud', 'Career', 'Leadership', 'Data Science', 'Cybersecurity', 'General'];
const LEVELS = ['All', 'Beginner', 'Intermediate', 'Advanced'];

const LEVEL_COLOR = {
    Beginner: { bg: '#dcfce7', color: '#166534' },
    Intermediate: { bg: '#fef9c3', color: '#854d0e' },
    Advanced: { bg: '#fee2e2', color: '#991b1b' },
};

const CAT_EMOJI = {
    Technology: '💻', 'AI & ML': '🤖', Cloud: '☁️', Career: '🚀',
    Leadership: '👑', 'Data Science': '📊', Cybersecurity: '🔒', General: '📚',
};

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ pct, color = '#667eea' }) {
    return (
        <div style={{ background: '#e2e8f0', borderRadius: '99px', height: '8px', overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '99px', transition: 'width .4s ease' }} />
        </div>
    );
}

// ─── Course Detail / Learning View ───────────────────────────────────────────
function CourseDetail({ course: initialCourse, onBack, onEnrolled }) {
    const [course, setCourse] = useState(initialCourse);
    const [enrolling, setEnrolling] = useState(false);
    const [completing, setCompleting] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [lessonLoading, setLessonLoading] = useState('');
    const [msg, setMsg] = useState('');
    const [activeLesson, setActiveLesson] = useState(null);

    const enrolled = !!course.enrollment;
    const enrData = course.enrollment || {};
    const completedLessons = enrData.completed_lessons || [];
    const lessons = course.lessons || [];
    const totalLessons = lessons.length;
    const doneLessons = completedLessons.length;
    const progressPct = totalLessons > 0 ? Math.round((doneLessons / totalLessons) * 100) : 0;
    const allDone = totalLessons > 0 && doneLessons >= totalLessons;

    const refetch = useCallback(async () => {
        try {
            const { data } = await api.get(`/courses/${course.id}`);
            setCourse(data);
        } catch { }
    }, [course.id]);

    const handleEnroll = async () => {
        setEnrolling(true); setMsg('');
        try {
            await api.post(`/courses/${course.id}/enroll`);
            await refetch();
            onEnrolled();
            setMsg('✅ Successfully enrolled! Start learning now.');
        } catch (e) {
            setMsg('❌ ' + (e.response?.data?.error || 'Enrollment failed.'));
        } finally { setEnrolling(false); }
    };

    const handleCompleteLesson = async (lessonId) => {
        setLessonLoading(lessonId);
        try {
            await api.post(`/courses/${course.id}/complete-lesson`, { lesson_id: lessonId });
            await refetch();
        } catch { }
        finally { setLessonLoading(''); }
    };

    const handleCompleteCourse = async () => {
        setCompleting(true); setMsg('');
        try {
            await api.post(`/courses/${course.id}/complete`);
            await refetch();
            setMsg('🎉 Course completed! Your certificate is ready to download.');
        } catch (e) {
            setMsg('❌ ' + (e.response?.data?.error || 'Failed.'));
        } finally { setCompleting(false); }
    };

    const handleDownloadCert = async () => {
        setDownloading(true); setMsg('');
        try {
            const token = localStorage.getItem('token');
            const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
            const resp = await fetch(`${API}/courses/${course.id}/certificate`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!resp.ok) {
                // Try to read the JSON error body from the backend
                let errMsg = 'Certificate download failed.';
                try {
                    const contentType = resp.headers.get('content-type') || '';
                    if (contentType.includes('application/json')) {
                        const json = await resp.json();
                        errMsg = json.error || errMsg;
                    }
                } catch (_) { }
                setMsg('❌ ' + errMsg);
                setDownloading(false);
                return;
            }

            // Stream blob and trigger download
            const blob = await resp.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Certificate_${course.title.replace(/[^a-z0-9]/gi, '_')}.pdf`;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 200);
            setMsg('✅ Certificate downloaded successfully!');
        } catch (err) {
            setMsg('❌ Download failed: ' + (err.message || 'Network error'));
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div style={cd.wrap}>
            {/* Back */}
            <button style={cd.backBtn} onClick={onBack}>
                ← Back to Courses
            </button>

            <div style={cd.layout}>
                {/* Main */}
                <div style={cd.main}>
                    {/* Hero Banner */}
                    <div style={{
                        ...cd.hero,
                        background: course.thumbnail_url
                            ? `linear-gradient(135deg,rgba(30,41,59,0.85),rgba(30,41,59,0.7)), url(${course.thumbnail_url}) center/cover`
                            : 'linear-gradient(135deg,#1e293b,#334155)',
                    }}>
                        <div style={cd.heroBadge}>
                            <span>{CAT_EMOJI[course.category] || '📚'}</span>
                            <span>{course.category}</span>
                        </div>
                        <h1 style={cd.heroTitle}>{course.title}</h1>
                        <p style={cd.heroSub}>{course.description}</p>
                        <div style={cd.heroBadges}>
                            {course.level && (
                                <span style={{ ...cd.badge, ...(LEVEL_COLOR[course.level] || {}) }}>{course.level}</span>
                            )}
                            <span style={cd.badge2}>⏱ {course.duration_hours}h</span>
                            <span style={cd.badge2}>🎬 {lessons.length} lessons</span>
                            <span style={cd.badge2}>👥 {course.enrolled_count || 0} enrolled</span>
                        </div>
                    </div>

                    {/* Msg */}
                    {msg && (
                        <div style={{ ...cd.msgBox, background: msg.startsWith('✅') || msg.startsWith('🎉') ? '#f0fdf4' : '#fef2f2', color: msg.startsWith('✅') || msg.startsWith('🎉') ? '#166534' : '#991b1b', border: `1.5px solid ${msg.startsWith('✅') || msg.startsWith('🎉') ? '#86efac' : '#fca5a5'}` }}>
                            {msg}
                        </div>
                    )}

                    {/* Instructor */}
                    {course.instructor && (
                        <div style={cd.instructorCard}>
                            <div style={cd.instructorAvatar}>
                                {course.instructor.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div style={cd.instructorName}>{course.instructor}</div>
                                {course.instructor_title && (
                                    <div style={cd.instructorRole}>{course.instructor_title}</div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Lessons */}
                    {lessons.length > 0 && (
                        <div style={cd.section}>
                            <h3 style={cd.secTitle}>📋 Course Curriculum</h3>
                            {lessons.map((lesson, i) => {
                                const lessonId = String(lesson.id || lesson._id || i);
                                const isDone = completedLessons.includes(lessonId);
                                const isActive = activeLesson === lessonId;
                                return (
                                    <div key={lessonId} style={{ ...cd.lessonCard, border: isActive ? '1.5px solid #667eea' : '1.5px solid #e2e8f0' }}>
                                        <div style={cd.lessonHeader} onClick={() => setActiveLesson(isActive ? null : lessonId)}>
                                            <div style={cd.lessonLeft}>
                                                <div style={{ ...cd.lessonNum, background: isDone ? '#10b981' : '#667eea' }}>
                                                    {isDone ? '✓' : i + 1}
                                                </div>
                                                <div>
                                                    <div style={cd.lessonTitle}>{lesson.title}</div>
                                                    {lesson.duration_min && (
                                                        <div style={cd.lessonMeta}>⏱ {lesson.duration_min} min</div>
                                                    )}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                {isDone && (
                                                    <span style={cd.doneBadge}>✅ Done</span>
                                                )}
                                                {enrolled && !isDone && (
                                                    <button
                                                        style={{ ...cd.markBtn, opacity: lessonLoading === lessonId ? 0.6 : 1 }}
                                                        onClick={e => { e.stopPropagation(); handleCompleteLesson(lessonId); }}
                                                        disabled={lessonLoading === lessonId}
                                                    >
                                                        {lessonLoading === lessonId ? '...' : 'Mark Done'}
                                                    </button>
                                                )}
                                                <span style={{ color: '#94a3b8', fontSize: '16px' }}>{isActive ? '▲' : '▼'}</span>
                                            </div>
                                        </div>
                                        {isActive && (lesson.description || lesson.video_url) && (
                                            <div style={cd.lessonBody}>
                                                {lesson.description && (
                                                    <p style={{ margin: '0 0 10px', fontSize: '14px', color: '#475569', lineHeight: '1.6' }}>
                                                        {lesson.description}
                                                    </p>
                                                )}
                                                {lesson.video_url && (
                                                    <a href={lesson.video_url} target="_blank" rel="noreferrer" style={cd.videoLink}>
                                                        ▶️ Watch Video
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Tags */}
                    {(course.tags || []).length > 0 && (
                        <div style={cd.section}>
                            <h3 style={cd.secTitle}>🏷️ Skills You'll Gain</h3>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {course.tags.map(tag => (
                                    <span key={tag} style={cd.tag}>{tag}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div style={cd.sidebar}>
                    <div style={cd.sideCard}>
                        {/* Certificate Preview */}
                        <div style={cd.certPreview}>
                            <div style={cd.certIcon}>🏅</div>
                            <div style={cd.certText}>
                                <div style={{ fontWeight: '700', fontSize: '14px', color: '#1e293b' }}>
                                    {course.certificate_title || `Certificate of Completion`}
                                </div>
                                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                                    Complete all lessons to earn this certificate
                                </div>
                            </div>
                        </div>

                        {/* Progress */}
                        {enrolled && (
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#374151', marginBottom: '8px' }}>
                                    <span>Your Progress</span>
                                    <b style={{ color: '#667eea' }}>{progressPct}%</b>
                                </div>
                                <ProgressBar pct={progressPct} color={enrData.completed ? '#10b981' : '#667eea'} />
                                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                                    {doneLessons} / {totalLessons} lessons completed
                                </div>
                            </div>
                        )}

                        {/* CTA Buttons */}
                        {!enrolled ? (
                            <button
                                style={{ ...cd.ctaBtn, opacity: enrolling ? 0.65 : 1 }}
                                onClick={handleEnroll} disabled={enrolling}
                            >
                                {enrolling ? '⏳ Enrolling...' : '🚀 Enroll Now — Free'}
                            </button>
                        ) : enrData.certificate_issued ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={cd.completedBadge}>🎉 Course Completed!</div>
                                <button
                                    style={{ ...cd.certBtn, opacity: downloading ? 0.65 : 1 }}
                                    onClick={handleDownloadCert} disabled={downloading}
                                >
                                    {downloading ? '⏳ Downloading...' : '📄 Download Certificate (PDF)'}
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={cd.enrolledBadge}>✅ Enrolled</div>
                                {(allDone || lessons.length === 0) && !enrData.completed && (
                                    <button
                                        style={{ ...cd.certBtn, opacity: completing ? 0.65 : 1 }}
                                        onClick={handleCompleteCourse} disabled={completing}
                                    >
                                        {completing ? '⏳ Processing...' : '🏆 Get Certificate'}
                                    </button>
                                )}
                                {!allDone && lessons.length > 0 && (
                                    <div style={{ fontSize: '12px', color: '#64748b', textAlign: 'center' }}>
                                        Complete all {lessons.length} lessons to unlock your certificate
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Course Info */}
                        <div style={cd.infoList}>
                            {[
                                { label: 'Category', val: `${CAT_EMOJI[course.category] || '📚'} ${course.category}` },
                                { label: 'Level', val: course.level },
                                { label: 'Duration', val: `${course.duration_hours} hours` },
                                { label: 'Lessons', val: `${lessons.length} lessons` },
                                { label: 'Certification', val: '✅ Yes' },
                            ].map(item => (
                                <div key={item.label} style={cd.infoRow}>
                                    <span style={cd.infoLabel}>{item.label}</span>
                                    <span style={cd.infoVal}>{item.val}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Course Card (Browse) ─────────────────────────────────────────────────────
function CourseCard({ course, onOpen }) {
    const enr = course.enrollment;
    const lessons = course.lessons || [];
    const done = enr?.completed_lessons?.length || 0;
    const pct = lessons.length > 0 ? Math.round((done / lessons.length) * 100) : 0;
    const lvl = LEVEL_COLOR[course.level] || {};

    return (
        <div style={cc.card} onClick={() => onOpen(course)}>
            {/* Thumbnail */}
            <div style={cc.thumb}>
                {course.thumbnail_url
                    ? <img src={course.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={cc.thumbFallback}>
                        <span style={{ fontSize: '40px' }}>{CAT_EMOJI[course.category] || '📚'}</span>
                    </div>}
                {enr?.certificate_issued && (
                    <div style={cc.certOverlay}>🏅 Certified</div>
                )}
            </div>

            {/* Body */}
            <div style={cc.body}>
                <div style={cc.meta}>
                    <span style={{ ...cc.chip, background: '#ede9fe', color: '#7c3aed' }}>{course.category}</span>
                    <span style={{ ...cc.chip, ...lvl }}>{course.level}</span>
                </div>

                <h4 style={cc.title}>{course.title}</h4>
                <p style={cc.desc}>{course.description.substring(0, 90)}...</p>

                <div style={cc.stats}>
                    {course.instructor && <span>👤 {course.instructor}</span>}
                    <span>⏱ {course.duration_hours}h</span>
                    <span>🎬 {lessons.length} lessons</span>
                </div>

                {enr ? (
                    <div style={{ marginTop: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#374151', marginBottom: '4px' }}>
                            <span>{enr.completed ? '🎉 Completed' : `${done}/${lessons.length} done`}</span>
                            <b style={{ color: '#667eea' }}>{pct}%</b>
                        </div>
                        <ProgressBar pct={pct} color={enr.completed ? '#10b981' : '#667eea'} />
                    </div>
                ) : (
                    <div style={cc.enrollCta}>🚀 Enroll Now — Free</div>
                )}
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CoursesPage() {
    useAuth();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [detail, setDetail] = useState(null);
    const [tab, setTab] = useState('browse'); // browse | my
    const [myCourses, setMyCourses] = useState([]);
    const [catFilter, setCatFilter] = useState('All');
    const [levelFilter, setLevelFilter] = useState('All');
    const [search, setSearch] = useState('');

    const fetchCourses = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/courses');
            setCourses(Array.isArray(data) ? data : []);
        } catch { setCourses([]); }
        finally { setLoading(false); }
    }, []);

    const fetchMyCourses = useCallback(async () => {
        try {
            const { data } = await api.get('/courses/my-enrollments');
            setMyCourses(Array.isArray(data) ? data : []);
        } catch { setMyCourses([]); }
    }, []);

    useEffect(() => { fetchCourses(); fetchMyCourses(); }, [fetchCourses, fetchMyCourses]);

    const filtered = courses.filter(c => {
        const q = search.toLowerCase();
        const matchQ = !q || c.title.toLowerCase().includes(q) || (c.tags || []).some(t => t.toLowerCase().includes(q)) || (c.instructor || '').toLowerCase().includes(q);
        const matchCat = catFilter === 'All' || c.category === catFilter;
        const matchLvl = levelFilter === 'All' || c.level === levelFilter;
        return matchQ && matchCat && matchLvl;
    });

    if (detail) return (
        <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
            <Navbar />
            <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 20px' }}>
                <CourseDetail
                    course={detail}
                    onBack={() => { setDetail(null); fetchCourses(); fetchMyCourses(); }}
                    onEnrolled={() => { fetchCourses(); fetchMyCourses(); }}
                />
            </div>
        </div>
    );

    const completedCount = myCourses.filter(c => c.enrollment?.completed).length;

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
            <Navbar />

            {/* Hero Banner */}
            <div style={pg.hero}>
                <div style={pg.heroInner}>
                    <div style={pg.heroLeft}>
                        <h1 style={pg.heroTitle}>
                            🎓 Online Learning Hub
                        </h1>
                        <p style={pg.heroSub}>
                            Upskill with company-curated courses. Complete them and earn
                            <b> verified digital certificates</b> to boost your career.
                        </p>
                        <div style={pg.heroStats}>
                            <div style={pg.hStat}><b>{courses.length}</b><span>Courses</span></div>
                            <div style={pg.hStat}><b>{myCourses.length}</b><span>Enrolled</span></div>
                            <div style={pg.hStat}><b>{completedCount}</b><span>Completed</span></div>
                        </div>
                    </div>
                    <div style={pg.heroEmoji}>🎓</div>
                </div>
            </div>

            <div style={pg.container}>
                {/* Tabs */}
                <div style={pg.tabs}>
                    {[
                        { key: 'browse', label: `🌐 Browse Courses (${courses.length})` },
                        { key: 'my', label: `📖 My Learning (${myCourses.length})` },
                    ].map(t => (
                        <button key={t.key} style={{ ...pg.tab, ...(tab === t.key ? pg.tabActive : {}) }}
                            onClick={() => setTab(t.key)}>
                            {t.label}
                        </button>
                    ))}
                </div>

                {tab === 'browse' && (
                    <>
                        {/* Filters */}
                        <div style={pg.filterBar}>
                            <input style={pg.search} placeholder="🔍 Search by title, skill, or instructor..."
                                value={search} onChange={e => setSearch(e.target.value)} />
                            <select style={pg.sel} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
                                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                            </select>
                            <select style={pg.sel} value={levelFilter} onChange={e => setLevelFilter(e.target.value)}>
                                {LEVELS.map(l => <option key={l}>{l}</option>)}
                            </select>
                        </div>

                        {/* Category pills */}
                        <div style={pg.catPills}>
                            {CATEGORIES.map(cat => (
                                <button key={cat} style={{
                                    ...pg.pill,
                                    ...(catFilter === cat ? pg.pillActive : {}),
                                }} onClick={() => setCatFilter(cat)}>
                                    {cat !== 'All' ? CAT_EMOJI[cat] + ' ' : ''}{cat}
                                </button>
                            ))}
                        </div>

                        {loading ? (
                            <div style={pg.loading}>
                                <div style={pg.spinner} />
                                <p>Loading courses...</p>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div style={pg.empty}>
                                <div style={{ fontSize: '56px' }}>🎓</div>
                                <h3>No courses found</h3>
                                <p>{courses.length === 0 ? 'No courses have been posted yet. Check back soon!' : 'Try adjusting your search or filters.'}</p>
                            </div>
                        ) : (
                            <div style={pg.grid}>
                                {filtered.map(c => (
                                    <CourseCard key={c.id} course={c} onOpen={setDetail} />
                                ))}
                            </div>
                        )}
                    </>
                )}

                {tab === 'my' && (
                    <div>
                        {myCourses.length === 0 ? (
                            <div style={pg.empty}>
                                <div style={{ fontSize: '56px' }}>📖</div>
                                <h3>Not enrolled in any course yet</h3>
                                <p>Browse our course catalog and start your learning journey today!</p>
                                <button style={pg.ctaBtn} onClick={() => setTab('browse')}>
                                    Browse Courses
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* My Stats */}
                                {completedCount > 0 && (
                                    <div style={pg.certBanner}>
                                        <span style={{ fontSize: '32px' }}>🏅</span>
                                        <div>
                                            <div style={{ fontWeight: '700', fontSize: '16px', color: '#1e293b' }}>
                                                You've earned {completedCount} certificate{completedCount > 1 ? 's' : ''}!
                                            </div>
                                            <div style={{ fontSize: '13px', color: '#64748b' }}>
                                                Click on a completed course to download your PDF certificate.
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div style={pg.grid}>
                                    {myCourses.map(c => (
                                        <CourseCard key={c.id} course={c} onOpen={setDetail} />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Page Styles ──────────────────────────────────────────────────────────────
const pg = {
    hero: { background: 'linear-gradient(135deg,#1e293b 0%,#334155 50%,#1e293b 100%)', padding: '48px 20px' },
    heroInner: { maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '32px', flexWrap: 'wrap' },
    heroLeft: { flex: 1 },
    heroTitle: { margin: '0 0 12px', fontSize: '32px', fontWeight: '800', color: '#fff' },
    heroSub: { margin: '0 0 24px', fontSize: '16px', color: '#94a3b8', lineHeight: '1.6' },
    heroStats: { display: 'flex', gap: '32px' },
    hStat: { display: 'flex', flexDirection: 'column', gap: '2px', color: '#fff', '& b': { fontSize: '24px', fontWeight: '800' } },
    heroEmoji: { fontSize: '80px', lineHeight: 1 },
    container: { maxWidth: '1100px', margin: '0 auto', padding: '32px 20px' },
    tabs: { display: 'flex', gap: '10px', marginBottom: '24px' },
    tab: { padding: '11px 22px', borderRadius: '9px', border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    tabActive: { background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', borderColor: '#667eea' },
    filterBar: { display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' },
    search: { flex: 1, minWidth: '220px', padding: '11px 16px', borderRadius: '9px', border: '1.5px solid #e5e7eb', fontSize: '14px' },
    sel: { padding: '11px 14px', borderRadius: '9px', border: '1.5px solid #e5e7eb', fontSize: '14px', background: '#fff', cursor: 'pointer' },
    catPills: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' },
    pill: { padding: '7px 16px', borderRadius: '99px', border: '1.5px solid #e2e8f0', background: '#fff', fontSize: '13px', fontWeight: '500', color: '#64748b', cursor: 'pointer' },
    pillActive: { background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', borderColor: '#667eea' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '20px' },
    loading: { textAlign: 'center', padding: '60px', color: '#94a3b8' },
    spinner: { width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTopColor: '#667eea', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' },
    empty: { textAlign: 'center', padding: '60px 20px', color: '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' },
    ctaBtn: { padding: '12px 28px', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', border: 'none', borderRadius: '9px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' },
    certBanner: { display: 'flex', alignItems: 'center', gap: '16px', background: 'linear-gradient(135deg,#fef9c3,#fef3c7)', border: '1.5px solid #fde68a', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px' },
};

// ─── Course Card Styles ───────────────────────────────────────────────────────
const cc = {
    card: { background: '#fff', borderRadius: '14px', border: '1.5px solid #e2e8f0', overflow: 'hidden', cursor: 'pointer', transition: 'transform .2s, box-shadow .2s', display: 'flex', flexDirection: 'column', ':hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 24px rgba(102,126,234,0.15)' } },
    thumb: { height: '160px', background: 'linear-gradient(135deg,#667eea22,#764ba222)', position: 'relative', overflow: 'hidden' },
    thumbFallback: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#f1f5f9,#e2e8f0)' },
    certOverlay: { position: 'absolute', top: '10px', right: '10px', background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#fff', padding: '5px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: '700' },
    body: { padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 },
    meta: { display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' },
    chip: { fontSize: '11px', padding: '3px 9px', borderRadius: '20px', fontWeight: '600' },
    title: { margin: '0 0 8px', fontSize: '15px', fontWeight: '700', color: '#1e293b', lineHeight: '1.4' },
    desc: { margin: '0 0 10px', fontSize: '13px', color: '#64748b', lineHeight: '1.5', flex: 1 },
    stats: { display: 'flex', gap: '12px', fontSize: '12px', color: '#94a3b8', flexWrap: 'wrap', marginBottom: '6px' },
    enrollCta: { marginTop: '12px', padding: '8px 0', textAlign: 'center', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', borderRadius: '8px', fontSize: '13px', fontWeight: '700' },
};

// ─── Detail Styles ────────────────────────────────────────────────────────────
const cd = {
    wrap: { display: 'flex', flexDirection: 'column', gap: '0' },
    backBtn: { background: 'none', border: 'none', color: '#667eea', cursor: 'pointer', fontSize: '15px', fontWeight: '600', padding: '0 0 20px', display: 'flex', alignItems: 'center', gap: '6px' },
    layout: { display: 'grid', gridTemplateColumns: '1fr 340px', gap: '28px', alignItems: 'start' },
    main: { display: 'flex', flexDirection: 'column', gap: '20px' },
    hero: { borderRadius: '16px', padding: '40px 36px', color: '#fff' },
    heroBadge: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#94a3b8', marginBottom: '12px' },
    heroTitle: { margin: '0 0 12px', fontSize: '28px', fontWeight: '800', lineHeight: '1.3' },
    heroSub: { margin: '0 0 20px', fontSize: '15px', color: '#cbd5e1', lineHeight: '1.6', maxWidth: '560px' },
    heroBadges: { display: 'flex', flexWrap: 'wrap', gap: '10px' },
    badge: { padding: '5px 14px', borderRadius: '99px', fontSize: '13px', fontWeight: '700' },
    badge2: { padding: '5px 14px', borderRadius: '99px', fontSize: '13px', fontWeight: '600', background: 'rgba(255,255,255,0.15)', color: '#fff' },
    msgBox: { padding: '14px 18px', borderRadius: '10px', fontSize: '14px', fontWeight: '500' },
    instructorCard: { display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 20px', background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '12px' },
    instructorAvatar: { width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '700', flexShrink: 0 },
    instructorName: { fontWeight: '700', fontSize: '16px', color: '#1e293b' },
    instructorRole: { fontSize: '13px', color: '#64748b', marginTop: '2px' },
    section: { background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '14px', padding: '24px' },
    secTitle: { margin: '0 0 16px', fontSize: '17px', fontWeight: '700', color: '#1e293b' },
    lessonCard: { borderRadius: '10px', marginBottom: '8px', overflow: 'hidden', transition: 'border-color .2s' },
    lessonHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', cursor: 'pointer', background: '#fff' },
    lessonLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
    lessonNum: { width: '28px', height: '28px', borderRadius: '50%', color: '#fff', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    lessonTitle: { fontSize: '14px', fontWeight: '600', color: '#1e293b' },
    lessonMeta: { fontSize: '12px', color: '#94a3b8', marginTop: '2px' },
    doneBadge: { fontSize: '12px', color: '#166534', background: '#dcfce7', padding: '3px 10px', borderRadius: '99px', fontWeight: '600' },
    markBtn: { padding: '6px 14px', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', border: 'none', borderRadius: '7px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
    lessonBody: { padding: '0 16px 16px', background: '#f8fafc', borderTop: '1px solid #f1f5f9' },
    videoLink: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#ede9fe', color: '#7c3aed', borderRadius: '8px', fontSize: '13px', fontWeight: '600', textDecoration: 'none' },
    tag: { padding: '5px 14px', borderRadius: '99px', background: 'linear-gradient(135deg,#ede9fe,#ddd6fe)', color: '#7c3aed', fontSize: '13px', fontWeight: '500' },
    sidebar: { position: 'sticky', top: '20px' },
    sideCard: { background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.07)' },
    certPreview: { display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '14px', background: 'linear-gradient(135deg,#fef9c3,#fef3c7)', borderRadius: '10px', marginBottom: '20px', border: '1.5px solid #fde68a' },
    certIcon: { fontSize: '28px' },
    certText: {},
    ctaBtn: { width: '100%', padding: '14px', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', marginBottom: '16px' },
    enrolledBadge: { width: '100%', padding: '12px', textAlign: 'center', background: '#dcfce7', color: '#166534', borderRadius: '10px', fontSize: '14px', fontWeight: '700', marginBottom: '8px' },
    completedBadge: { padding: '12px', textAlign: 'center', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', borderRadius: '10px', fontSize: '15px', fontWeight: '800' },
    certBtn: { width: '100%', padding: '12px', background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
    infoList: { marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1.5px solid #f1f5f9', paddingTop: '16px' },
    infoRow: { display: 'flex', justifyContent: 'space-between', fontSize: '13px' },
    infoLabel: { color: '#64748b' },
    infoVal: { fontWeight: '600', color: '#1e293b' },
};
