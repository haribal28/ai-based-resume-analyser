// src/pages/AdminDashboard.js
// Naukri / Indeed-inspired HR Admin Dashboard
// Features: Job posting with HR keywords, salary, location, exp level;
//           Candidate ranking with smart scoring; Offer/Rejection email module;
//           Pipeline tracking; Quick filters; Download CSV report.

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, api } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Common/Navbar';
import JobUpload from '../components/Admin/JobUpload';
import CandidateRanking from '../components/Admin/CandidateRanking';
import CourseManagement from '../components/Admin/CourseManagement';



// ─── Offer / Rejection Email Panel ───────────────────────────────────────────
function OfferEmailPanel({ jobs }) {
    const [candidateEmail, setCandidateEmail] = useState('');
    const [candidateName, setCandidateName] = useState('');
    const [selectedJob, setSelectedJob] = useState('');
    const [matchScore, setMatchScore] = useState('');
    const [status, setStatus] = useState('selected');
    const [customMsg, setCustomMsg] = useState('');
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState(null);
    const [done, setDone] = useState(false);

    const jobTitle = jobs.find(j => j.id === selectedJob)?.title || '';

    const reset = () => {
        setCandidateEmail(''); setCandidateName(''); setSelectedJob('');
        setMatchScore(''); setStatus('selected'); setCustomMsg('');
        setResult(null); setDone(false);
    };

    const handleSend = async () => {
        if (!candidateEmail.trim() || !selectedJob) {
            setResult({ ok: false, text: 'Candidate email and job are required.' });
            return;
        }
        setSending(true); setResult(null);
        try {
            // Save to DB + email via backend (candidates can see it in their Offers tab)
            await api.post('/offers/send', {
                candidate_email: candidateEmail.trim(),
                candidate_name: candidateName.trim() || 'Candidate',
                job_id: selectedJob,
                job_title: jobTitle,
                match_score: parseFloat(matchScore) || 0,
                status,
                message: customMsg.trim(),
            });
            setDone(true);
        } catch (err) {
            setResult({ ok: false, text: err.response?.data?.error || 'Failed to send. Check your connection.' });
        } finally { setSending(false); }
    };

    if (done) return (
        <div style={es.successWrap}>
            <div style={es.successIcon}>{status === 'selected' ? '🎉' : '📩'}</div>
            <h3 style={es.successTitle}>{status === 'selected' ? 'Offer Letter Sent!' : 'Rejection Email Sent!'}</h3>
            <p style={es.successSub}>
                A <b>{status}</b> email was sent to <b>{candidateEmail}</b> for <b>{jobTitle}</b>.
            </p>
            <button style={es.newBtn} onClick={reset}>✉️ Send Another</button>
        </div>
    );

    return (
        <div style={es.wrap}>
            {/* Header */}
            <div style={es.header}>
                <div style={es.headerIcon}>✉️</div>
                <div>
                    <h3 style={es.title}>Send Offer / Rejection Letter</h3>
                    <p style={es.subtitle}>Send a professional HTML email to a candidate instantly.</p>
                </div>
            </div>

            {/* Status toggle */}
            <div style={es.toggleRow}>
                {[
                    { val: 'selected', label: '🎉 Offer / Selected', col: '#16a34a', bg: '#f0fdf4', border: '#86efac' },
                    { val: 'rejected', label: '❌ Rejection', col: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
                ].map(o => (
                    <button key={o.val} style={{
                        ...es.toggleBtn,
                        ...(status === o.val ? { background: o.bg, borderColor: o.col, color: o.col, fontWeight: '700' } : {})
                    }} onClick={() => setStatus(o.val)}>{o.label}</button>
                ))}
            </div>

            {/* Form */}
            <div style={es.grid}>
                <div style={es.field}>
                    <label style={es.label}>Candidate Email <span style={es.req}>*</span></label>
                    <input style={es.input} type="email" placeholder="jane@example.com"
                        value={candidateEmail} onChange={e => setCandidateEmail(e.target.value)} />
                </div>
                <div style={es.field}>
                    <label style={es.label}>Candidate Name</label>
                    <input style={es.input} type="text" placeholder="Jane Smith"
                        value={candidateName} onChange={e => setCandidateName(e.target.value)} />
                </div>
                <div style={es.field}>
                    <label style={es.label}>Job Position <span style={es.req}>*</span></label>
                    <select style={es.input} value={selectedJob} onChange={e => setSelectedJob(e.target.value)}>
                        <option value="">-- Select a job --</option>
                        {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                    </select>
                </div>
                <div style={es.field}>
                    <label style={es.label}>AI Match Score %</label>
                    <input style={es.input} type="number" placeholder="e.g. 87" min="0" max="100"
                        value={matchScore} onChange={e => setMatchScore(e.target.value)} />
                </div>
            </div>

            <div style={es.field}>
                <label style={es.label}>Custom Message <span style={es.opt}>(blank = auto-generate)</span></label>
                <textarea style={es.textarea} rows={5}
                    placeholder={status === 'selected'
                        ? 'Congratulations! We are pleased to offer you...'
                        : 'Thank you for applying. After careful consideration...'}
                    value={customMsg} onChange={e => setCustomMsg(e.target.value)} />
            </div>

            {selectedJob && candidateEmail && (
                <div style={{ ...es.preview, borderColor: status === 'selected' ? '#86efac' : '#fca5a5', background: status === 'selected' ? '#f0fdf4' : '#fef2f2' }}>
                    <b style={{ color: status === 'selected' ? '#16a34a' : '#dc2626' }}>📬 Preview:</b>
                    &nbsp;{status === 'selected' ? '🎉 Offer letter' : '❌ Rejection email'} →&nbsp;
                    <b>{candidateEmail}</b> for <b>{jobTitle}</b>
                </div>
            )}

            {result && <div style={es.error}>{result.text}</div>}

            <div style={es.actions}>
                <button style={{
                    ...es.sendBtn,
                    background: status === 'selected'
                        ? 'linear-gradient(135deg,#10b981,#059669)'
                        : 'linear-gradient(135deg,#ef4444,#dc2626)',
                    opacity: sending ? .65 : 1,
                }} disabled={sending || !candidateEmail || !selectedJob} onClick={handleSend}>
                    {sending ? '⏳ Sending...' : status === 'selected' ? '🎉 Send Offer Letter' : '❌ Send Rejection Email'}
                </button>
            </div>
        </div>
    );
}

// ─── Jobs Overview Card ───────────────────────────────────────────────────────
function JobCard({ job, onViewCandidates }) {
    const [expanded, setExpanded] = useState(false);
    return (
        <div style={st.jobCard}>
            <div style={st.jobCardHeader}>
                <div style={{ flex: 1 }}>
                    <div style={st.jobCardTitle}>{job.title}</div>
                    <div style={st.jobMeta}>
                        {job.location && <span style={st.metaChip}>📍 {job.location}</span>}
                        {job.employment_type && <span style={st.metaChip}>⏱ {job.employment_type}</span>}
                        {job.experience_level && <span style={st.metaChip}>🎓 {job.experience_level}</span>}
                        {(job.salary_min > 0 || job.salary_max > 0) && (
                            <span style={{ ...st.metaChip, background: '#fef3c7', color: '#92400e' }}>
                                💰 ₹{job.salary_min}–{job.salary_max}L
                            </span>
                        )}
                    </div>
                </div>
                <span style={st.badge}>Active</span>
            </div>

            <p style={st.jobDesc}>{expanded ? job.description : job.description.substring(0, 110) + '...'}</p>
            <button style={st.expandBtn} onClick={() => setExpanded(x => !x)}>
                {expanded ? '▲ Less' : '▼ More'}
            </button>

            {/* HR Keywords */}
            {(job.hr_keywords || []).length > 0 && (
                <div style={{ marginBottom: '10px' }}>
                    <div style={st.sectionLabel}>🎯 HR Keywords (used for scoring):</div>
                    <div style={st.skillTags}>
                        {job.hr_keywords.map(k => (
                            <span key={k} style={{ ...st.skillTag, background: '#ede9fe', color: '#7c3aed' }}>{k}</span>
                        ))}
                    </div>
                </div>
            )}

            {/* Auto-extracted skills */}
            <div style={st.skillTags}>
                {(job.required_skills || []).slice(0, 6).map(s => (
                    <span key={s} style={st.skillTag}>{s}</span>
                ))}
                {(job.required_skills || []).length > 6 && (
                    <span style={st.skillTag}>+{job.required_skills.length - 6} more</span>
                )}
            </div>

            <button style={st.btnSmall} onClick={() => onViewCandidates(job.id)}>
                View Candidates →
            </button>
        </div>
    );
}

// ─── Main Admin Dashboard ─────────────────────────────────────────────────────
export default function AdminDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [apps, setApps] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedJob, setSelectedJob] = useState('');
    const [minScore, setMinScore] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('');
    const [appStatusFilter, setAppStatusFilter] = useState('');

    const fetchJobs = useCallback(async () => {
        try {
            const { data } = await api.get('/jobs');
            setJobs(Array.isArray(data) ? data : (data.jobs || []));
        } catch (err) { console.error(err); }
    }, []);

    const fetchApps = useCallback(async () => {
        try {
            const { data } = await api.get('/applications/all');
            setApps(Array.isArray(data) ? data : (data.applications || []));
        } catch (err) { console.error(err); }
    }, []);

    useEffect(() => { fetchJobs(); fetchApps(); }, [fetchJobs, fetchApps]);

    const filteredJobs = jobs.filter(j => {
        const matchQ = j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            j.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchT = filterType ? j.employment_type === filterType : true;
        return matchQ && matchT;
    });

    const tabs = [
        { key: 'overview', label: '📋 Jobs Overview' },
        { key: 'post', label: '➕ Post Job' },
        { key: 'rank', label: '🏆 Rank Candidates' },
        { key: 'applications', label: `📩 Applications (${apps.length})` },
        { key: 'offer', label: '✉️ Send Offer' },
        { key: 'courses', label: '🎓 Online Courses' },
    ];

    return (
        <div style={st.page}>
            <Navbar />
            <div style={st.container}>

                {/* Header */}
                <div style={st.pageHeader}>
                    <div>
                        <h2 style={st.greeting}>HR Admin Dashboard</h2>
                        <p style={st.sub}>Welcome, {user?.name} — manage jobs, rank candidates, and send offers.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button style={st.feedBtn} onClick={() => navigate('/feed')}>🌐 Tech Feed</button>
                        <button style={st.postBtn} onClick={() => setActiveTab('post')}>➕ Post New Job</button>
                    </div>
                </div>

                {/* Stats */}
                <div style={st.stats}>
                    <StatCard icon="💼" label="Active Jobs" value={jobs.length} color="#667eea" />
                    <StatCard icon="📍" label="Locations" value={[...new Set(jobs.map(j => j.location).filter(Boolean))].length || '—'} color="#10b981" />
                    <StatCard icon="🎯" label="Jobs with HR Keywords" value={jobs.filter(j => j.hr_keywords?.length).length} color="#f59e0b" />
                    <StatCard icon="✉️" label="Offer Module" value="Ready" color="#8b5cf6" />
                </div>

                {/* Tabs */}
                <div style={st.tabs}>
                    {tabs.map(t => (
                        <button key={t.key} style={{
                            ...st.tab,
                            ...(activeTab === t.key ? st.activeTab : {}),
                            ...(t.key === 'offer' ? st.offerTab : {}),
                            ...(t.key === 'offer' && activeTab === 'offer' ? st.offerTabActive : {}),
                        }} onClick={() => setActiveTab(t.key)}>{t.label}</button>
                    ))}
                </div>

                {/* Content */}
                <div style={st.content}>

                    {/* ── OVERVIEW ── */}
                    {activeTab === 'overview' && (
                        <div>
                            <div style={st.overviewToolbar}>
                                <h3 style={st.sectionTitle}>Active Job Postings ({filteredJobs.length})</h3>
                                <div style={st.toolbarRight}>
                                    <input style={st.searchBox} placeholder="🔍 Search jobs..." value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)} />
                                    <select style={st.filterSelect} value={filterType} onChange={e => setFilterType(e.target.value)}>
                                        <option value="">All Types</option>
                                        {['Full-time', 'Part-time', 'Remote', 'Contract', 'Internship'].map(t => (
                                            <option key={t}>{t}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {filteredJobs.length === 0 ? (
                                <div style={st.empty}>
                                    <p>{jobs.length === 0 ? 'No jobs posted yet.' : 'No jobs match your search.'}</p>
                                    {jobs.length === 0 && (
                                        <button style={st.btn} onClick={() => setActiveTab('post')}>Post First Job</button>
                                    )}
                                </div>
                            ) : (
                                <div style={st.jobGrid}>
                                    {filteredJobs.map(job => (
                                        <JobCard key={job.id} job={job}
                                            onViewCandidates={id => { setSelectedJob(id); setActiveTab('rank'); }} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── POST JOB ── */}
                    {activeTab === 'post' && (
                        <JobUpload onPosted={() => { fetchJobs(); setActiveTab('overview'); }} />
                    )}

                    {/* ── RANK CANDIDATES ── */}
                    {activeTab === 'rank' && (
                        <div>
                            <div style={st.filterRow}>
                                <div style={st.filterGroup}>
                                    <label style={st.label}>Select Job</label>
                                    <select style={st.select} value={selectedJob} onChange={e => setSelectedJob(e.target.value)}>
                                        <option value="">-- Choose a job --</option>
                                        {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                                    </select>
                                </div>
                                <div style={st.filterGroup}>
                                    <label style={st.label}>Min Score: <b>{minScore}%</b></label>
                                    <input type="range" min="0" max="100" value={minScore}
                                        onChange={e => setMinScore(Number(e.target.value))}
                                        style={{ width: '100%', marginTop: '8px', accentColor: '#667eea' }} />
                                </div>
                            </div>

                            {selectedJob ? (
                                <CandidateRanking jobId={selectedJob} minScore={minScore} />
                            ) : (
                                <div style={{ ...st.empty, padding: '40px' }}>
                                    <p>Select a job above to see ranked candidates.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── OFFER / REJECTION ── */}
                    {activeTab === 'offer' && <OfferEmailPanel jobs={jobs} />}

                    {/* ── ONLINE COURSES ── */}
                    {activeTab === 'courses' && <CourseManagement />}

                    {/* ── APPLICATIONS ── */}
                    {activeTab === 'applications' && (
                        <ApplicationsPanel
                            apps={apps}
                            jobs={jobs}
                            statusFilter={appStatusFilter}
                            onStatusFilter={setAppStatusFilter}
                            onStatusChange={async (id, status) => {
                                try {
                                    await api.put(`/applications/${id}/status`, { status });
                                    fetchApps();
                                } catch (e) {
                                    alert(e.response?.data?.error || 'Update failed.');
                                }
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Applications Panel (Admin) ───────────────────────────────────────────────
const APP_STATUS = {
    pending: { label: '⏳ Pending', bg: '#fef9c3', color: '#854d0e', border: '#fde047' },
    shortlisted: { label: '🌟 Shortlisted', bg: '#dbeafe', color: '#1e40af', border: '#93c5fd' },
    rejected: { label: '❌ Rejected', bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
    hired: { label: '🎉 Hired', bg: '#dcfce7', color: '#166534', border: '#86efac' },
};

function ApplicationsPanel({ apps, jobs, statusFilter, onStatusFilter, onStatusChange }) {
    const [expandedId, setExpandedId] = useState(null);

    const filtered = statusFilter ? apps.filter(a => a.status === statusFilter) : apps;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#1e293b' }}>
                    Candidate Applications ({filtered.length})
                </h3>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {['', 'pending', 'shortlisted', 'rejected', 'hired'].map(s => (
                        <button key={s} style={{
                            padding: '7px 14px', borderRadius: '20px', border: '1.5px solid',
                            fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                            ...(statusFilter === s
                                ? { background: '#667eea', color: '#fff', borderColor: '#667eea' }
                                : { background: '#fff', color: '#64748b', borderColor: '#e2e8f0' })
                        }} onClick={() => onStatusFilter(s)}>
                            {s === '' ? `All (${apps.length})` : APP_STATUS[s]?.label}
                        </button>
                    ))}
                </div>
            </div>

            {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    <div style={{ fontSize: '40px', marginBottom: '10px' }}>📭</div>
                    <p>{apps.length === 0 ? 'No applications received yet.' : 'No applications match this filter.'}</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filtered.map(app => {
                        const cfg = APP_STATUS[app.status] || APP_STATUS.pending;
                        const isExpanded = expandedId === app.id;
                        return (
                            <div key={app.id} style={{ border: '1.5px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', background: '#fff' }}>
                                {/* Card header */}
                                <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                                            👤 {app.candidate_name || 'Unknown'}
                                            <span style={{ fontWeight: '400', color: '#64748b', fontSize: '13px', marginLeft: '8px' }}>
                                                {app.candidate_email}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '13px', color: '#475569', marginBottom: '6px' }}>
                                            💼 Applied for: <b>{app.job_title}</b>
                                            {app.job_location && <span style={{ color: '#64748b' }}> · 📍 {app.job_location}</span>}
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                            {app.years_of_experience && <span style={ap.detail}>🕐 {app.years_of_experience}</span>}
                                            {app.expected_ctc && <span style={ap.detail}>💰 Expected ₹{app.expected_ctc}L</span>}
                                            {app.notice_period && <span style={ap.detail}>📅 {app.notice_period}</span>}
                                            {app.portfolio_url && (
                                                <a href={app.portfolio_url} target="_blank" rel="noreferrer" style={{ ...ap.detail, color: '#667eea', textDecoration: 'none' }}>
                                                    🔗 Portfolio
                                                </a>
                                            )}
                                            <span style={ap.detail}>
                                                🗓 {app.applied_at ? new Date(app.applied_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                                            </span>
                                        </div>
                                    </div>
                                    {/* Status badge */}
                                    <div style={{ ...ap.statusBadge, background: cfg.bg, color: cfg.color, borderColor: cfg.border }}>
                                        {cfg.label}
                                    </div>
                                </div>

                                {/* Cover letter toggle */}
                                {app.cover_letter && (
                                    <div style={{ borderTop: '1px solid #f1f5f9', padding: '0 20px' }}>
                                        <button style={ap.expandBtn} onClick={() => setExpandedId(isExpanded ? null : app.id)}>
                                            📝 Cover Letter {isExpanded ? '▲' : '▼'}
                                        </button>
                                        {isExpanded && (
                                            <p style={{ margin: '0 0 14px', fontSize: '13px', color: '#475569', lineHeight: '1.6', fontStyle: 'italic', borderLeft: '3px solid #e2e8f0', paddingLeft: '12px' }}>
                                                "{app.cover_letter}"
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Actions */}
                                <div style={{ borderTop: '1px solid #f1f5f9', padding: '12px 20px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', background: '#fafafa' }}>
                                    <span style={{ fontSize: '13px', color: '#64748b', marginRight: '4px' }}>Update status:</span>
                                    {Object.entries(APP_STATUS).map(([key, val]) => (
                                        <button key={key}
                                            style={{
                                                padding: '6px 14px', borderRadius: '20px', fontSize: '12px',
                                                fontWeight: '600', cursor: 'pointer', border: '1.5px solid',
                                                ...(app.status === key
                                                    ? { background: val.bg, color: val.color, borderColor: val.border }
                                                    : { background: '#fff', color: '#64748b', borderColor: '#e2e8f0' })
                                            }}
                                            onClick={() => onStatusChange(app.id, key)}
                                        >
                                            {val.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

const ap = {
    detail: { fontSize: '12px', padding: '3px 9px', borderRadius: '20px', background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' },
    statusBadge: { padding: '5px 13px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', whiteSpace: 'nowrap', border: '1.5px solid' },
    expandBtn: { background: 'none', border: 'none', color: '#667eea', cursor: 'pointer', fontSize: '13px', fontWeight: '600', padding: '10px 0', display: 'block' },
};

// ─── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color }) {
    return (
        <div style={st.statCard}>
            <span style={st.statIcon}>{icon}</span>
            <span style={{ ...st.statValue, color }}>{value}</span>
            <span style={st.statLabel}>{label}</span>
        </div>
    );
}


// ─── Dashboard Styles ─────────────────────────────────────────────────────────
const st = {
    page: { minHeight: '100vh', background: '#f8fafc' },
    container: { maxWidth: '1080px', margin: '0 auto', padding: '24px 20px' },
    pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
    greeting: { margin: 0, fontSize: '24px', fontWeight: '700', color: '#1e293b' },
    sub: { margin: '4px 0 0', color: '#64748b' },
    postBtn: { padding: '11px 22px', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', border: 'none', borderRadius: '9px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    feedBtn: { padding: '11px 18px', background: '#fff', color: '#667eea', border: '1.5px solid #667eea', borderRadius: '9px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    stats: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '16px', marginBottom: '24px' },
    statCard: { background: '#fff', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', boxShadow: '0 1px 3px rgba(0,0,0,.08)' },
    statIcon: { fontSize: '26px' },
    statValue: { fontSize: '22px', fontWeight: '700' },
    statLabel: { fontSize: '12px', color: '#64748b', textAlign: 'center' },
    tabs: { display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' },
    tab: { padding: '10px 20px', borderRadius: '8px', border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: '500', fontSize: '14px', color: '#64748b', transition: 'all .2s' },
    activeTab: { background: '#667eea', color: '#fff', borderColor: '#667eea' },
    offerTab: { borderColor: '#10b981', color: '#10b981', background: '#f0fdf4' },
    offerTabActive: { background: '#10b981', color: '#fff', borderColor: '#10b981' },
    content: { background: '#fff', borderRadius: '12px', padding: '28px', boxShadow: '0 1px 3px rgba(0,0,0,.08)' },
    sectionTitle: { margin: 0, fontSize: '18px', fontWeight: '600', color: '#1e293b' },
    overviewToolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' },
    toolbarRight: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
    searchBox: { padding: '9px 14px', borderRadius: '8px', border: '1.5px solid #e5e7eb', fontSize: '14px', minWidth: '200px' },
    filterSelect: { padding: '9px 14px', borderRadius: '8px', border: '1.5px solid #e5e7eb', fontSize: '14px', background: '#fff', cursor: 'pointer' },
    jobGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: '16px' },
    jobCard: { border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', background: '#fff', transition: 'box-shadow .2s' },
    jobCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' },
    jobCardTitle: { fontSize: '15px', fontWeight: '700', color: '#1e293b', marginBottom: '6px' },
    jobMeta: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
    metaChip: { fontSize: '12px', padding: '3px 9px', borderRadius: '20px', background: '#f1f5f9', color: '#475569', fontWeight: '500' },
    badge: { background: '#dcfce7', color: '#16a34a', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap' },
    jobDesc: { color: '#64748b', fontSize: '13px', lineHeight: '1.5', margin: 0 },
    expandBtn: { background: 'none', border: 'none', color: '#667eea', cursor: 'pointer', fontSize: '12px', fontWeight: '600', padding: 0, textAlign: 'left' },
    sectionLabel: { fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px' },
    skillTags: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
    skillTag: { background: '#f1f5f9', color: '#475569', padding: '3px 10px', borderRadius: '20px', fontSize: '12px' },
    btnSmall: { padding: '9px 18px', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', border: 'none', borderRadius: '7px', fontSize: '13px', cursor: 'pointer', fontWeight: '600', marginTop: '4px', alignSelf: 'flex-start' },
    filterRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' },
    filterGroup: { display: 'flex', flexDirection: 'column', gap: '4px' },
    label: { fontSize: '14px', fontWeight: '500', color: '#374151' },
    select: { padding: '11px 14px', borderRadius: '8px', border: '1.5px solid #e5e7eb', fontSize: '14px', background: '#fff' },
    btn: { padding: '12px 24px', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', fontWeight: '600' },
    empty: { textAlign: 'center', padding: '40px', color: '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' },
};

// ─── Offer Email Panel Styles ─────────────────────────────────────────────────
const es = {
    wrap: { display: 'flex', flexDirection: 'column', gap: '20px' },
    header: { display: 'flex', alignItems: 'center', gap: '16px', paddingBottom: '16px', borderBottom: '1.5px solid #f1f5f9' },
    headerIcon: { fontSize: '36px' },
    title: { margin: 0, fontSize: '18px', fontWeight: '700', color: '#1e293b' },
    subtitle: { margin: '4px 0 0', fontSize: '13px', color: '#64748b' },
    toggleRow: { display: 'flex', gap: '12px' },
    toggleBtn: { flex: 1, padding: '12px', border: '1.5px solid #e5e7eb', borderRadius: '10px', background: '#fff', fontSize: '14px', cursor: 'pointer', fontWeight: '500', color: '#64748b', transition: 'all .15s' },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
    field: { display: 'flex', flexDirection: 'column', gap: '6px' },
    label: { fontSize: '13px', fontWeight: '600', color: '#374151' },
    req: { color: '#ef4444' },
    opt: { fontWeight: '400', color: '#94a3b8', fontSize: '12px' },
    input: { padding: '11px 14px', borderRadius: '9px', border: '1.5px solid #e5e7eb', fontSize: '14px', outline: 'none' },
    textarea: { padding: '12px 14px', borderRadius: '9px', border: '1.5px solid #e5e7eb', fontSize: '14px', resize: 'vertical', lineHeight: '1.6', outline: 'none' },
    preview: { padding: '12px 16px', borderRadius: '10px', border: '1.5px solid', fontSize: '14px', color: '#374151' },
    error: { padding: '12px 14px', borderRadius: '8px', background: '#fef2f2', color: '#dc2626', fontSize: '14px', fontWeight: '500' },
    actions: { display: 'flex', justifyContent: 'flex-end' },
    sendBtn: { padding: '13px 30px', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', transition: 'opacity .2s' },
    successWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 20px', gap: '16px', textAlign: 'center' },
    successIcon: { fontSize: '64px' },
    successTitle: { margin: 0, fontSize: '22px', fontWeight: '700', color: '#1e293b' },
    successSub: { margin: 0, fontSize: '15px', color: '#64748b', maxWidth: '420px', lineHeight: '1.6' },
    newBtn: { padding: '12px 24px', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', borderRadius: '9px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
};
