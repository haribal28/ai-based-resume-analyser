// src/components/Admin/CourseManagement.js
// Admin panel: Post, edit, delete courses + view enrollments

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../context/AuthContext';

const CATEGORIES = ['Technology', 'AI & ML', 'Cloud', 'Career', 'Leadership', 'Data Science', 'Cybersecurity', 'General'];
const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

// ─── Lesson Builder Row ───────────────────────────────────────────────────────
function LessonRow({ lesson, index, onChange, onRemove }) {
    return (
        <div style={s.lessonRow}>
            <div style={s.lessonNum}>{index + 1}</div>
            <div style={s.lessonFields}>
                <input style={s.li} placeholder="Lesson title *"
                    value={lesson.title} onChange={e => onChange(index, 'title', e.target.value)} />
                <input style={{ ...s.li, width: '90px' }} placeholder="Min" type="number" min="1"
                    value={lesson.duration_min} onChange={e => onChange(index, 'duration_min', e.target.value)} />
                <input style={s.li} placeholder="Video URL (optional)"
                    value={lesson.video_url} onChange={e => onChange(index, 'video_url', e.target.value)} />
                <input style={{ ...s.li, flex: 2 }} placeholder="Description (optional)"
                    value={lesson.description} onChange={e => onChange(index, 'description', e.target.value)} />
            </div>
            <button style={s.lessonRemove} onClick={() => onRemove(index)}>✕</button>
        </div>
    );
}

// ─── Course Form (Create / Edit) ──────────────────────────────────────────────
function CourseForm({ initial, onSave, onCancel }) {
    const blank = {
        title: '', description: '', category: 'Technology', level: 'Beginner',
        duration_hours: '', instructor: '', instructor_title: '',
        thumbnail_url: '', tags: '', certificate_title: '', lessons: [],
    };
    const [form, setForm] = useState(initial || blank);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const addLesson = () => setForm(f => ({
        ...f,
        lessons: [...f.lessons, { id: String(Date.now()), title: '', duration_min: '', video_url: '', description: '' }],
    }));

    const updateLesson = (i, k, v) => setForm(f => {
        const ls = [...f.lessons];
        ls[i] = { ...ls[i], [k]: v };
        return { ...f, lessons: ls };
    });

    const removeLesson = (i) => setForm(f => {
        const ls = f.lessons.filter((_, idx) => idx !== i);
        return { ...f, lessons: ls };
    });

    const handleSave = async () => {
        if (!form.title.trim() || !form.description.trim()) {
            setError('Title and description are required.'); return;
        }
        setSaving(true); setError('');
        try {
            const payload = {
                ...form,
                duration_hours: parseFloat(form.duration_hours) || 0,
                tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
                certificate_title: form.certificate_title.trim() ||
                    `Certificate of Completion – ${form.title.trim()}`,
            };
            if (initial?.id) {
                await api.put(`/courses/${initial.id}`, payload);
            } else {
                await api.post('/courses', payload);
            }
            onSave();
        } catch (e) {
            setError(e.response?.data?.error || 'Save failed.');
        } finally { setSaving(false); }
    };

    return (
        <div style={s.formWrap}>
            <div style={s.formHeader}>
                <div style={s.formIcon}>📚</div>
                <div>
                    <h3 style={s.formTitle}>{initial?.id ? 'Edit Course' : 'Post New Online Course'}</h3>
                    <p style={s.formSub}>Fill in the details below. Candidates can enroll and earn a certificate.</p>
                </div>
            </div>

            {/* Basic Info */}
            <div style={s.section}>
                <div style={s.sectionLabel}>📋 Course Details</div>
                <div style={s.grid2}>
                    <div style={s.field}>
                        <label style={s.label}>Course Title <span style={s.req}>*</span></label>
                        <input style={s.input} placeholder="e.g. Python for Data Science"
                            value={form.title} onChange={e => set('title', e.target.value)} />
                    </div>
                    <div style={s.field}>
                        <label style={s.label}>Instructor Name</label>
                        <input style={s.input} placeholder="e.g. Dr. Priya Sharma"
                            value={form.instructor} onChange={e => set('instructor', e.target.value)} />
                    </div>
                    <div style={s.field}>
                        <label style={s.label}>Instructor Title</label>
                        <input style={s.input} placeholder="e.g. Senior Data Scientist"
                            value={form.instructor_title} onChange={e => set('instructor_title', e.target.value)} />
                    </div>
                    <div style={s.field}>
                        <label style={s.label}>Duration (hours)</label>
                        <input style={s.input} type="number" min="0" step="0.5" placeholder="e.g. 12"
                            value={form.duration_hours} onChange={e => set('duration_hours', e.target.value)} />
                    </div>
                    <div style={s.field}>
                        <label style={s.label}>Category</label>
                        <select style={s.input} value={form.category} onChange={e => set('category', e.target.value)}>
                            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                        </select>
                    </div>
                    <div style={s.field}>
                        <label style={s.label}>Difficulty Level</label>
                        <select style={s.input} value={form.level} onChange={e => set('level', e.target.value)}>
                            {LEVELS.map(l => <option key={l}>{l}</option>)}
                        </select>
                    </div>
                </div>

                <div style={s.field}>
                    <label style={s.label}>Description <span style={s.req}>*</span></label>
                    <textarea style={s.textarea} rows={4}
                        placeholder="What will candidates learn? What are the prerequisites?"
                        value={form.description} onChange={e => set('description', e.target.value)} />
                </div>

                <div style={s.grid2}>
                    <div style={s.field}>
                        <label style={s.label}>Tags <span style={s.opt}>(comma-separated)</span></label>
                        <input style={s.input} placeholder="Python, pandas, NumPy, ML"
                            value={form.tags} onChange={e => set('tags', e.target.value)} />
                    </div>
                    <div style={s.field}>
                        <label style={s.label}>Thumbnail URL <span style={s.opt}>(optional)</span></label>
                        <input style={s.input} placeholder="https://..."
                            value={form.thumbnail_url} onChange={e => set('thumbnail_url', e.target.value)} />
                    </div>
                </div>

                <div style={s.field}>
                    <label style={s.label}>Certificate Title <span style={s.opt}>(auto-generated if blank)</span></label>
                    <input style={s.input} placeholder={`Certificate of Completion – ${form.title || 'Course'}`}
                        value={form.certificate_title} onChange={e => set('certificate_title', e.target.value)} />
                </div>
            </div>

            {/* Lessons */}
            <div style={s.section}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={s.sectionLabel}>🎬 Course Lessons ({form.lessons.length})</div>
                    <button style={s.addLessonBtn} onClick={addLesson}>+ Add Lesson</button>
                </div>
                {form.lessons.length === 0 && (
                    <div style={s.emptyLessons}>
                        No lessons added yet. Click "+ Add Lesson" to start building your course content.
                    </div>
                )}
                {form.lessons.map((l, i) => (
                    <LessonRow key={l.id || i} lesson={l} index={i}
                        onChange={updateLesson} onRemove={removeLesson} />
                ))}
            </div>

            {error && <div style={s.error}>{error}</div>}

            <div style={s.actions}>
                <button style={s.cancelBtn} onClick={onCancel} disabled={saving}>Cancel</button>
                <button style={{ ...s.saveBtn, opacity: saving ? 0.65 : 1 }} onClick={handleSave} disabled={saving}>
                    {saving ? '⏳ Saving...' : initial?.id ? '💾 Update Course' : '🚀 Publish Course'}
                </button>
            </div>
        </div>
    );
}

// ─── Enrollment List Modal ────────────────────────────────────────────────────
function EnrollmentModal({ course, onClose }) {
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get(`/courses/${course.id}/enrollments`)
            .then(({ data }) => setEnrollments(data))
            .catch(() => setEnrollments([]))
            .finally(() => setLoading(false));
    }, [course.id]);

    return (
        <div style={s.modalOverlay} onClick={onClose}>
            <div style={s.modal} onClick={e => e.stopPropagation()}>
                <div style={s.modalHeader}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#1e293b' }}>
                            👥 Enrollments — {course.title}
                        </h3>
                        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
                            {enrollments.length} enrolled
                        </p>
                    </div>
                    <button style={s.closeBtn} onClick={onClose}>✕</button>
                </div>

                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading...</div>
                ) : enrollments.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                        <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
                        No enrollments yet.
                    </div>
                ) : (
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        <table style={s.table}>
                            <thead>
                                <tr>
                                    {['Candidate', 'Email', 'Enrolled', 'Progress', 'Certificate'].map(h => (
                                        <th key={h} style={s.th}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {enrollments.map(e => (
                                    <tr key={e.id} style={s.tr}>
                                        <td style={s.td}>{e.user_name || '—'}</td>
                                        <td style={s.td}>{e.user_email}</td>
                                        <td style={s.td}>{e.enrolled_at ? new Date(e.enrolled_at).toLocaleDateString('en-IN') : '—'}</td>
                                        <td style={s.td}>
                                            <span style={{
                                                padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                                                background: e.completed ? '#dcfce7' : '#fef9c3',
                                                color: e.completed ? '#166534' : '#854d0e',
                                            }}>
                                                {e.completed ? '✅ Completed' : `📖 ${e.completed_lessons?.length || 0} lessons`}
                                            </span>
                                        </td>
                                        <td style={s.td}>
                                            {e.certificate_issued
                                                ? <span style={{ color: '#10b981', fontWeight: '600', fontSize: '13px' }}>🏅 Issued</span>
                                                : <span style={{ color: '#94a3b8', fontSize: '13px' }}>—</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Course Card (Admin View) ─────────────────────────────────────────────────
function AdminCourseCard({ course, onEdit, onDelete, onViewEnrollments }) {
    const levelColor = { Beginner: '#10b981', Intermediate: '#f59e0b', Advanced: '#ef4444' };

    return (
        <div style={s.card}>
            <div style={s.cardTop}>
                <div style={s.cardThumb}>
                    {course.thumbnail_url
                        ? <img src={course.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ fontSize: '40px' }}>📚</span>}
                </div>
                <div style={s.cardMeta}>
                    <span style={{ ...s.chip, background: '#ede9fe', color: '#7c3aed' }}>{course.category}</span>
                    <span style={{ ...s.chip, background: '#fef9c3', color: '#854d0e' }}>
                        {course.duration_hours}h
                    </span>
                    <span style={{ ...s.chip, color: '#fff', background: levelColor[course.level] || '#64748b' }}>
                        {course.level}
                    </span>
                    <span style={{ ...s.chip, background: course.is_active ? '#dcfce7' : '#fee2e2', color: course.is_active ? '#166534' : '#991b1b' }}>
                        {course.is_active ? 'Active' : 'Inactive'}
                    </span>
                </div>
            </div>

            <h4 style={s.cardTitle}>{course.title}</h4>
            <p style={s.cardDesc}>{course.description.substring(0, 100)}...</p>

            <div style={s.cardFooter}>
                <div style={s.cardStats}>
                    <span>👤 {course.instructor || '—'}</span>
                    <span>·</span>
                    <span>🎬 {course.lessons?.length || 0} lessons</span>
                    <span>·</span>
                    <span style={{ color: '#667eea', fontWeight: '600' }}>
                        👥 {course.enrolled_count || 0} enrolled
                    </span>
                </div>
                <div style={s.cardActions}>
                    <button style={s.cardBtnGhost} onClick={() => onViewEnrollments(course)}>👥 Enrolled</button>
                    <button style={s.cardBtnEdit} onClick={() => onEdit(course)}>✏️ Edit</button>
                    <button style={s.cardBtnDel} onClick={() => onDelete(course)}>🗑</button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CourseManagement() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('list'); // list | form
    const [editing, setEditing] = useState(null);
    const [enrollmentTarget, setEnrollmentTarget] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [search, setSearch] = useState('');
    const [catFilter, setCatFilter] = useState('');

    const fetchCourses = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/courses/admin/all');
            setCourses(Array.isArray(data) ? data : []);
        } catch { setCourses([]); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchCourses(); }, [fetchCourses]);

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await api.delete(`/courses/${deleteTarget.id}`);
            fetchCourses();
        } catch (e) { alert(e.response?.data?.error || 'Delete failed.'); }
        finally { setDeleting(false); setDeleteTarget(null); }
    };

    const filtered = courses.filter(c => {
        const q = search.toLowerCase();
        const matchQ = !q || c.title.toLowerCase().includes(q) || c.instructor?.toLowerCase().includes(q);
        const matchCat = !catFilter || c.category === catFilter;
        return matchQ && matchCat;
    });

    if (view === 'form') return (
        <CourseForm
            initial={editing}
            onSave={() => { setView('list'); setEditing(null); fetchCourses(); }}
            onCancel={() => { setView('list'); setEditing(null); }}
        />
    );

    return (
        <div>
            {/* Header */}
            <div style={s.listHeader}>
                <div>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>
                        🎓 Online Courses ({filtered.length})
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
                        Post courses with certifications. Candidates can enroll and earn verified certificates.
                    </p>
                </div>
                <button style={s.postBtn} onClick={() => { setEditing(null); setView('form'); }}>
                    ➕ Post New Course
                </button>
            </div>

            {/* Filters */}
            <div style={s.filterBar}>
                <input style={s.search} placeholder="🔍 Search courses or instructor..."
                    value={search} onChange={e => setSearch(e.target.value)} />
                <select style={s.catSel} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
                    <option value="">All Categories</option>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
            </div>

            {/* Stats row */}
            <div style={s.statsRow}>
                {[
                    { icon: '📚', label: 'Total Courses', val: courses.length, color: '#667eea' },
                    { icon: '✅', label: 'Active', val: courses.filter(c => c.is_active).length, color: '#10b981' },
                    { icon: '👥', label: 'Total Enrolled', val: courses.reduce((a, c) => a + (c.enrolled_count || 0), 0), color: '#f59e0b' },
                    { icon: '🎬', label: 'Total Lessons', val: courses.reduce((a, c) => a + (c.lessons?.length || 0), 0), color: '#8b5cf6' },
                ].map(st => (
                    <div key={st.label} style={s.statCard}>
                        <span style={{ fontSize: '22px' }}>{st.icon}</span>
                        <span style={{ fontSize: '20px', fontWeight: '700', color: st.color }}>{st.val}</span>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>{st.label}</span>
                    </div>
                ))}
            </div>

            {/* Course Grid */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading courses...</div>
            ) : filtered.length === 0 ? (
                <div style={s.empty}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎓</div>
                    <p>{courses.length === 0 ? 'No courses posted yet.' : 'No courses match your search.'}</p>
                    {courses.length === 0 && (
                        <button style={s.postBtn} onClick={() => setView('form')}>Post First Course</button>
                    )}
                </div>
            ) : (
                <div style={s.grid}>
                    {filtered.map(c => (
                        <AdminCourseCard key={c.id} course={c}
                            onEdit={course => { setEditing({ ...course, tags: (course.tags || []).join(', ') }); setView('form'); }}
                            onDelete={setDeleteTarget}
                            onViewEnrollments={setEnrollmentTarget}
                        />
                    ))}
                </div>
            )}

            {/* Delete Confirm Modal */}
            {deleteTarget && (
                <div style={s.modalOverlay} onClick={() => setDeleteTarget(null)}>
                    <div style={{ ...s.modal, maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
                        <div style={{ textAlign: 'center', padding: '32px 24px' }}>
                            <div style={{ fontSize: '48px', marginBottom: '12px' }}>⚠️</div>
                            <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>
                                Delete Course?
                            </h3>
                            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>
                                "<b>{deleteTarget.title}</b>" and all enrollments will be permanently deleted.
                            </p>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                                <button style={s.cancelBtn} onClick={() => setDeleteTarget(null)} disabled={deleting}>
                                    Cancel
                                </button>
                                <button style={{ ...s.saveBtn, background: 'linear-gradient(135deg,#ef4444,#dc2626)', opacity: deleting ? 0.65 : 1 }}
                                    onClick={handleDelete} disabled={deleting}>
                                    {deleting ? 'Deleting...' : '🗑 Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Enrollments Modal */}
            {enrollmentTarget && (
                <EnrollmentModal course={enrollmentTarget} onClose={() => setEnrollmentTarget(null)} />
            )}
        </div>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = {
    listHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' },
    postBtn: { padding: '11px 22px', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', border: 'none', borderRadius: '9px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    filterBar: { display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' },
    search: { flex: 1, minWidth: '200px', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #e5e7eb', fontSize: '14px' },
    catSel: { padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #e5e7eb', fontSize: '14px', background: '#fff', cursor: 'pointer' },
    statsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px,1fr))', gap: '12px', marginBottom: '20px' },
    statCard: { background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: '16px' },
    card: { border: '1.5px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden', background: '#fff', display: 'flex', flexDirection: 'column', transition: 'box-shadow .2s' },
    cardTop: { display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 16px 0' },
    cardThumb: { width: '56px', height: '56px', borderRadius: '10px', background: 'linear-gradient(135deg,#667eea22,#764ba222)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
    cardMeta: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
    chip: { fontSize: '11px', padding: '3px 9px', borderRadius: '20px', fontWeight: '600' },
    cardTitle: { margin: '12px 16px 6px', fontSize: '15px', fontWeight: '700', color: '#1e293b' },
    cardDesc: { margin: '0 16px', fontSize: '13px', color: '#64748b', lineHeight: '1.5', flex: 1 },
    cardFooter: { padding: '14px 16px', borderTop: '1px solid #f1f5f9', marginTop: '12px' },
    cardStats: { fontSize: '12px', color: '#64748b', display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' },
    cardActions: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
    cardBtnGhost: { padding: '7px 14px', border: '1.5px solid #667eea', color: '#667eea', background: '#fff', borderRadius: '7px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
    cardBtnEdit: { padding: '7px 14px', border: '1.5px solid #10b981', color: '#10b981', background: '#fff', borderRadius: '7px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
    cardBtnDel: { padding: '7px 12px', border: '1.5px solid #ef4444', color: '#ef4444', background: '#fff', borderRadius: '7px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
    empty: { textAlign: 'center', padding: '60px 20px', color: '#94a3b8' },
    // Form
    formWrap: { display: 'flex', flexDirection: 'column', gap: '24px' },
    formHeader: { display: 'flex', alignItems: 'center', gap: '16px', paddingBottom: '20px', borderBottom: '1.5px solid #f1f5f9' },
    formIcon: { fontSize: '40px' },
    formTitle: { margin: 0, fontSize: '20px', fontWeight: '700', color: '#1e293b' },
    formSub: { margin: '4px 0 0', fontSize: '13px', color: '#64748b' },
    section: { background: '#f8fafc', borderRadius: '12px', padding: '20px', border: '1.5px solid #e2e8f0' },
    sectionLabel: { fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.04em' },
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' },
    field: { display: 'flex', flexDirection: 'column', gap: '6px' },
    label: { fontSize: '13px', fontWeight: '600', color: '#374151' },
    req: { color: '#ef4444' },
    opt: { color: '#94a3b8', fontWeight: '400', fontSize: '12px' },
    input: { padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #e5e7eb', fontSize: '14px', background: '#fff', outline: 'none' },
    textarea: { padding: '12px 14px', borderRadius: '8px', border: '1.5px solid #e5e7eb', fontSize: '14px', resize: 'vertical', lineHeight: '1.6', outline: 'none' },
    // Lessons
    lessonRow: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', background: '#fff', borderRadius: '8px', padding: '10px 12px', border: '1.5px solid #e2e8f0' },
    lessonNum: { width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    lessonFields: { display: 'flex', gap: '8px', flex: 1, flexWrap: 'wrap' },
    li: { flex: 1, minWidth: '120px', padding: '7px 10px', borderRadius: '6px', border: '1.5px solid #e5e7eb', fontSize: '13px' },
    lessonRemove: { background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px', padding: '4px 8px' },
    emptyLessons: { textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '13px', fontStyle: 'italic' },
    addLessonBtn: { padding: '7px 16px', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', borderRadius: '7px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
    error: { padding: '12px 16px', borderRadius: '8px', background: '#fef2f2', color: '#dc2626', fontSize: '14px' },
    actions: { display: 'flex', gap: '12px', justifyContent: 'flex-end' },
    cancelBtn: { padding: '11px 24px', border: '1.5px solid #e5e7eb', background: '#fff', color: '#64748b', borderRadius: '9px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    saveBtn: { padding: '11px 28px', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', border: 'none', borderRadius: '9px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
    // Modal
    modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
    modal: { background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '700px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px 24px', borderBottom: '1.5px solid #f1f5f9' },
    closeBtn: { background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b', padding: '4px 8px' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' },
    tr: { borderBottom: '1px solid #f1f5f9' },
    td: { padding: '12px 16px', fontSize: '13px', color: '#374151' },
};
