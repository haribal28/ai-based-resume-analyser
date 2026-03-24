// src/components/Candidate/JobListings.js
// Naukri/Indeed-style job board for candidates
// Features: search, filter, expand descriptions, apply modal with full form,
//           my applications tracker with status badges

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../context/AuthContext';

// ─── Status badge config ──────────────────────────────────────────────────────
const STATUS_CONFIG = {
    pending: { label: '⏳ Pending Review', bg: '#fef9c3', color: '#854d0e', border: '#fde047' },
    shortlisted: { label: '🌟 Shortlisted', bg: '#dbeafe', color: '#1e40af', border: '#93c5fd' },
    rejected: { label: '❌ Not Selected', bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
    hired: { label: '🎉 Hired!', bg: '#dcfce7', color: '#166534', border: '#86efac' },
};

// ─── Apply Modal ──────────────────────────────────────────────────────────────
function ApplyModal({ job, resumes, onClose, onSuccess }) {
    const [form, setForm] = useState({
        resume_id: '',
        cover_letter: '',
        years_of_experience: '',
        current_ctc: '',
        expected_ctc: '',
        notice_period: '',
        portfolio_url: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true); setError('');
        try {
            const { data } = await api.post('/apply-job', {
                job_id: job.id,
                ...form,
            });
            onSuccess(data);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to submit application.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={m.overlay} onClick={onClose}>
            <div style={m.modal} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div style={m.header}>
                    <div>
                        <h3 style={m.title}>Apply for: {job.title}</h3>
                        <div style={m.jobMeta}>
                            {job.location && <span style={m.chip}>📍 {job.location}</span>}
                            {job.employment_type && <span style={m.chip}>⏱ {job.employment_type}</span>}
                            {job.experience_level && <span style={m.chip}>🎓 {job.experience_level}</span>}
                        </div>
                    </div>
                    <button style={m.closeBtn} onClick={onClose}>✕</button>
                </div>

                <form onSubmit={handleSubmit} style={m.form}>
                    {/* Resume selection */}
                    <div style={m.field}>
                        <label style={m.label}>Select Resume</label>
                        <select style={m.input} value={form.resume_id}
                            onChange={e => set('resume_id', e.target.value)}>
                            <option value="">-- Select a resume (optional) --</option>
                            {resumes.map(r => (
                                <option key={r.id} value={r.id}>{r.original_name}</option>
                            ))}
                        </select>
                        {resumes.length === 0 && (
                            <p style={m.hint}>💡 Upload a resume first from the Upload tab for a stronger application.</p>
                        )}
                    </div>

                    {/* Grid fields */}
                    <div style={m.grid}>
                        <div style={m.field}>
                            <label style={m.label}>Years of Experience</label>
                            <input style={m.input} placeholder="e.g. 3 years"
                                value={form.years_of_experience}
                                onChange={e => set('years_of_experience', e.target.value)} />
                        </div>
                        <div style={m.field}>
                            <label style={m.label}>Notice Period</label>
                            <select style={m.input} value={form.notice_period}
                                onChange={e => set('notice_period', e.target.value)}>
                                <option value="">-- Select --</option>
                                {['Immediately', '15 days', '30 days', '45 days', '60 days', '90 days'].map(x => (
                                    <option key={x}>{x}</option>
                                ))}
                            </select>
                        </div>
                        <div style={m.field}>
                            <label style={m.label}>Current CTC (₹ LPA)</label>
                            <input style={m.input} type="number" placeholder="e.g. 8"
                                value={form.current_ctc}
                                onChange={e => set('current_ctc', e.target.value)} />
                        </div>
                        <div style={m.field}>
                            <label style={m.label}>Expected CTC (₹ LPA)</label>
                            <input style={m.input} type="number" placeholder="e.g. 12"
                                value={form.expected_ctc}
                                onChange={e => set('expected_ctc', e.target.value)} />
                        </div>
                    </div>

                    <div style={m.field}>
                        <label style={m.label}>Portfolio / LinkedIn URL</label>
                        <input style={m.input} type="url" placeholder="https://linkedin.com/in/yourprofile"
                            value={form.portfolio_url}
                            onChange={e => set('portfolio_url', e.target.value)} />
                    </div>

                    <div style={m.field}>
                        <label style={m.label}>Cover Letter <span style={m.opt}>(optional but recommended)</span></label>
                        <textarea style={m.textarea} rows={5}
                            placeholder="Write a brief note about why you're a great fit for this role..."
                            value={form.cover_letter}
                            onChange={e => set('cover_letter', e.target.value)} />
                    </div>

                    {error && <div style={m.error}>{error}</div>}

                    <div style={m.actions}>
                        <button type="button" style={m.cancelBtn} onClick={onClose}>Cancel</button>
                        <button type="submit" style={{ ...m.submitBtn, opacity: submitting ? .65 : 1 }}
                            disabled={submitting}>
                            {submitting ? '⏳ Submitting...' : '🚀 Submit Application'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Single Job Card ──────────────────────────────────────────────────────────
function JobCard({ job, resumes, appliedJobIds, onApplied }) {
    const [expanded, setExpanded] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [success, setSuccess] = useState(null);
    const hasApplied = appliedJobIds.has(job.id);

    return (
        <div style={j.card}>
            {showModal && (
                <ApplyModal
                    job={job}
                    resumes={resumes}
                    onClose={() => setShowModal(false)}
                    onSuccess={(data) => {
                        setSuccess(data);
                        setShowModal(false);
                        onApplied(job.id);
                    }}
                />
            )}

            {/* Success banner */}
            {success && (
                <div style={j.successBanner}>
                    ✅ <b>Application submitted!</b> HR will review your application soon.
                </div>
            )}

            <div style={j.cardHeader}>
                <div style={{ flex: 1 }}>
                    <h4 style={j.jobTitle}>{job.title}</h4>
                    <div style={j.metaRow}>
                        {job.location && <span style={j.metaChip}>📍 {job.location}</span>}
                        {job.employment_type && <span style={j.metaChip}>⏱ {job.employment_type}</span>}
                        {job.experience_level && <span style={j.metaChip}>🎓 {job.experience_level}</span>}
                        {(job.salary_min > 0 || job.salary_max > 0) && (
                            <span style={{ ...j.metaChip, background: '#fef3c7', color: '#92400e' }}>
                                💰 ₹{job.salary_min}–{job.salary_max}L
                            </span>
                        )}
                    </div>
                </div>
                {hasApplied
                    ? <span style={j.appliedBadge}>✅ Applied</span>
                    : <span style={j.activeBadge}>🟢 Open</span>
                }
            </div>

            <p style={j.desc}>
                {expanded ? job.description : job.description.substring(0, 150) + '...'}
            </p>
            <button style={j.expandBtn} onClick={() => setExpanded(x => !x)}>
                {expanded ? '▲ Show Less' : '▼ Read More'}
            </button>

            {/* Skills */}
            {(job.required_skills || []).length > 0 && (
                <div style={j.skillsRow}>
                    {(job.required_skills || []).slice(0, 7).map(s => (
                        <span key={s} style={j.skillChip}>{s}</span>
                    ))}
                    {(job.required_skills || []).length > 7 && (
                        <span style={j.skillChip}>+{job.required_skills.length - 7} more</span>
                    )}
                </div>
            )}

            <div style={j.footer}>
                <span style={j.postedDate}>
                    🕐 Posted: {job.created_at ? new Date(job.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently'}
                </span>
                {hasApplied ? (
                    <button style={j.appliedBtn} disabled>✅ Already Applied</button>
                ) : (
                    <button style={j.applyBtn} onClick={() => setShowModal(true)}>
                        Apply Now →
                    </button>
                )}
            </div>
        </div>
    );
}

// ─── My Applications Tab ──────────────────────────────────────────────────────
function MyApplications({ applications, onWithdraw }) {
    if (applications.length === 0) return (
        <div style={a.empty}>
            <div style={a.emptyIcon}>📂</div>
            <p style={a.emptyText}>You haven't applied to any jobs yet.</p>
            <p style={a.emptyHint}>Browse the <b>Available Jobs</b> tab and apply!</p>
        </div>
    );

    return (
        <div style={a.wrap}>
            {applications.map(app => {
                const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending;
                return (
                    <div key={app.id} style={a.card}>
                        <div style={a.cardTop}>
                            <div>
                                <div style={a.jobTitle}>{app.job_title || 'Unknown Job'}</div>
                                {app.job_location && (
                                    <div style={a.location}>📍 {app.job_location}</div>
                                )}
                                <div style={a.appliedDate}>
                                    Applied: {app.applied_at ? new Date(app.applied_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                                </div>
                            </div>
                            <div style={{ ...a.statusBadge, background: cfg.bg, color: cfg.color, borderColor: cfg.border }}>
                                {cfg.label}
                            </div>
                        </div>

                        <div style={a.details}>
                            {app.years_of_experience && <span style={a.detail}>🕐 {app.years_of_experience} exp</span>}
                            {app.expected_ctc && <span style={a.detail}>💰 Expected ₹{app.expected_ctc}L</span>}
                            {app.notice_period && <span style={a.detail}>📅 {app.notice_period} notice</span>}
                        </div>

                        {app.cover_letter && (
                            <p style={a.coverPreview}>
                                📝 "{app.cover_letter.substring(0, 100)}{app.cover_letter.length > 100 ? '...' : ''}"
                            </p>
                        )}

                        {app.status === 'pending' && (
                            <button style={a.withdrawBtn} onClick={() => onWithdraw(app.id)}>
                                Withdraw Application
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ─── Main JobListings Component ───────────────────────────────────────────────
export default function JobListings({ resumes }) {
    const [jobs, setJobs] = useState([]);
    const [myApps, setMyApps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('browse');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterExp, setFilterExp] = useState('');

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [jobsRes, appsRes] = await Promise.all([
                api.get('/jobs'),
                api.get('/applications/my'),
            ]);
            setJobs(Array.isArray(jobsRes.data) ? jobsRes.data : []);
            setMyApps(Array.isArray(appsRes.data) ? appsRes.data : []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const appliedJobIds = new Set(myApps.map(a => a.job_id));

    const filteredJobs = jobs.filter(j => {
        const q = searchQuery.toLowerCase();
        const matchQ = !q || j.title.toLowerCase().includes(q) ||
            j.description.toLowerCase().includes(q) ||
            (j.required_skills || []).some(s => s.includes(q));
        const matchT = !filterType || j.employment_type === filterType;
        const matchE = !filterExp || j.experience_level === filterExp;
        return matchQ && matchT && matchE;
    });

    const handleWithdraw = async (appId) => {
        if (!window.confirm('Are you sure you want to withdraw this application?')) return;
        try {
            await api.delete(`/applications/${appId}`);
            setMyApps(prev => prev.filter(a => a.id !== appId));
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to withdraw application.');
        }
    };

    if (loading) return (
        <div style={p.center}>⏳ Loading jobs...</div>
    );

    return (
        <div style={p.wrap}>
            {/* Tabs */}
            <div style={p.tabs}>
                <button style={{ ...p.tab, ...(activeTab === 'browse' ? p.activeTab : {}) }}
                    onClick={() => setActiveTab('browse')}>
                    💼 Available Jobs ({jobs.length})
                </button>
                <button style={{ ...p.tab, ...(activeTab === 'myapps' ? p.activeTab : {}) }}
                    onClick={() => setActiveTab('myapps')}>
                    📋 My Applications ({myApps.length})
                </button>
            </div>

            {/* ── Browse Jobs ── */}
            {activeTab === 'browse' && (
                <div style={p.browseWrap}>
                    {/* Search & Filters */}
                    <div style={p.toolbar}>
                        <input style={p.search}
                            placeholder="🔍 Search by title, skill, keyword..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)} />
                        <select style={p.filter} value={filterType} onChange={e => setFilterType(e.target.value)}>
                            <option value="">All Types</option>
                            {['Full-time', 'Part-time', 'Remote', 'Contract', 'Internship'].map(t => (
                                <option key={t}>{t}</option>
                            ))}
                        </select>
                        <select style={p.filter} value={filterExp} onChange={e => setFilterExp(e.target.value)}>
                            <option value="">All Experience</option>
                            {['Fresher (0-1 yr)', '1-3 years', '3-5 years', '5-8 years', '8+ years'].map(e => (
                                <option key={e}>{e}</option>
                            ))}
                        </select>
                        {(searchQuery || filterType || filterExp) && (
                            <button style={p.clearBtn}
                                onClick={() => { setSearchQuery(''); setFilterType(''); setFilterExp(''); }}>
                                ✕ Clear
                            </button>
                        )}
                    </div>

                    <p style={p.resultCount}>
                        Showing <b>{filteredJobs.length}</b> of <b>{jobs.length}</b> jobs
                        {myApps.length > 0 && ` · Applied to ${myApps.length}`}
                    </p>

                    {filteredJobs.length === 0 ? (
                        <div style={p.empty}>
                            <div style={{ fontSize: '48px' }}>🔍</div>
                            <p>{jobs.length === 0 ? 'No jobs are available right now.' : 'No jobs match your filters.'}</p>
                        </div>
                    ) : (
                        <div style={p.jobGrid}>
                            {filteredJobs.map(job => (
                                <JobCard
                                    key={job.id}
                                    job={job}
                                    resumes={resumes}
                                    appliedJobIds={appliedJobIds}
                                    onApplied={(jobId) => fetchAll()}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── My Applications ── */}
            {activeTab === 'myapps' && (
                <MyApplications applications={myApps} onWithdraw={handleWithdraw} />
            )}
        </div>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const p = {
    wrap: { display: 'flex', flexDirection: 'column', gap: '16px' },
    center: { textAlign: 'center', padding: '40px', color: '#64748b' },
    tabs: { display: 'flex', gap: '8px', borderBottom: '2px solid #f1f5f9', paddingBottom: '12px' },
    tab: { padding: '9px 20px', borderRadius: '8px 8px 0 0', border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: '500', fontSize: '14px', color: '#64748b', transition: 'all .2s' },
    activeTab: { background: '#667eea', color: '#fff', borderColor: '#667eea' },
    browseWrap: { display: 'flex', flexDirection: 'column', gap: '16px' },
    toolbar: { display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' },
    search: { flex: '1 1 220px', padding: '10px 14px', borderRadius: '9px', border: '1.5px solid #e5e7eb', fontSize: '14px', outline: 'none' },
    filter: { padding: '10px 14px', borderRadius: '9px', border: '1.5px solid #e5e7eb', fontSize: '13px', background: '#fff', cursor: 'pointer' },
    clearBtn: { padding: '9px 14px', borderRadius: '8px', border: '1.5px solid #fca5a5', background: '#fef2f2', color: '#dc2626', fontSize: '13px', cursor: 'pointer', fontWeight: '500' },
    resultCount: { margin: 0, fontSize: '13px', color: '#64748b' },
    jobGrid: { display: 'flex', flexDirection: 'column', gap: '14px' },
    empty: { textAlign: 'center', padding: '40px', color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' },
};

const j = {
    card: { border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', background: '#fff', transition: 'box-shadow .2s' },
    successBanner: { background: '#f0fdf4', color: '#15803d', padding: '10px 14px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', border: '1px solid #bbf7d0' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' },
    jobTitle: { margin: 0, fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' },
    metaRow: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
    metaChip: { fontSize: '12px', padding: '3px 9px', borderRadius: '20px', background: '#f1f5f9', color: '#475569', fontWeight: '500' },
    activeBadge: { background: '#dcfce7', color: '#16a34a', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap' },
    appliedBadge: { background: '#dbeafe', color: '#1d4ed8', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap' },
    desc: { margin: 0, color: '#64748b', fontSize: '13px', lineHeight: '1.6' },
    expandBtn: { background: 'none', border: 'none', color: '#667eea', cursor: 'pointer', fontSize: '12px', fontWeight: '600', padding: 0, alignSelf: 'flex-start' },
    skillsRow: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
    skillChip: { background: '#f1f5f9', color: '#475569', padding: '3px 9px', borderRadius: '20px', fontSize: '12px' },
    footer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '12px' },
    postedDate: { fontSize: '12px', color: '#94a3b8' },
    applyBtn: { padding: '10px 22px', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },
    appliedBtn: { padding: '10px 22px', background: '#f1f5f9', color: '#94a3b8', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'not-allowed' },
};

const m = {
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
    modal: { background: '#fff', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,.2)', display: 'flex', flexDirection: 'column', gap: '18px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' },
    title: { margin: 0, fontSize: '17px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' },
    jobMeta: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
    chip: { fontSize: '12px', padding: '3px 9px', borderRadius: '20px', background: '#f1f5f9', color: '#475569' },
    closeBtn: { background: '#f1f5f9', border: 'none', borderRadius: '8px', width: '32px', height: '32px', fontSize: '16px', cursor: 'pointer', color: '#64748b', flexShrink: 0 },
    form: { display: 'flex', flexDirection: 'column', gap: '14px' },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
    field: { display: 'flex', flexDirection: 'column', gap: '5px' },
    label: { fontSize: '13px', fontWeight: '600', color: '#374151' },
    opt: { fontWeight: '400', color: '#94a3b8', fontSize: '12px' },
    hint: { margin: '4px 0 0', fontSize: '12px', color: '#f59e0b' },
    input: { padding: '10px 13px', borderRadius: '8px', border: '1.5px solid #e5e7eb', fontSize: '14px', outline: 'none' },
    textarea: { padding: '10px 13px', borderRadius: '8px', border: '1.5px solid #e5e7eb', fontSize: '14px', resize: 'vertical', lineHeight: '1.6', outline: 'none' },
    error: { padding: '11px 14px', background: '#fef2f2', color: '#dc2626', borderRadius: '8px', fontSize: '14px', fontWeight: '500' },
    actions: { display: 'flex', gap: '10px', justifyContent: 'flex-end' },
    cancelBtn: { padding: '11px 20px', background: '#f1f5f9', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', fontWeight: '600', color: '#64748b', cursor: 'pointer' },
    submitBtn: { padding: '11px 24px', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
};

const a = {
    wrap: { display: 'flex', flexDirection: 'column', gap: '12px' },
    card: { border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px', background: '#fff' },
    cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' },
    jobTitle: { fontSize: '15px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' },
    location: { fontSize: '13px', color: '#64748b' },
    appliedDate: { fontSize: '12px', color: '#94a3b8', marginTop: '4px' },
    statusBadge: { padding: '5px 13px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', whiteSpace: 'nowrap', border: '1.5px solid' },
    details: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
    detail: { fontSize: '12px', padding: '3px 9px', borderRadius: '20px', background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' },
    coverPreview: { margin: 0, fontSize: '13px', color: '#64748b', fontStyle: 'italic', borderLeft: '3px solid #e2e8f0', paddingLeft: '12px' },
    withdrawBtn: { alignSelf: 'flex-start', padding: '7px 14px', background: '#fef2f2', border: '1.5px solid #fca5a5', color: '#dc2626', borderRadius: '7px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
    empty: { textAlign: 'center', padding: '48px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' },
    emptyIcon: { fontSize: '48px' },
    emptyText: { margin: 0, fontSize: '16px', fontWeight: '600', color: '#1e293b' },
    emptyHint: { margin: 0, fontSize: '14px', color: '#64748b' },
};
