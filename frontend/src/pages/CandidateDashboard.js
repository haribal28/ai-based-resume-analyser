// src/pages/CandidateDashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, api } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Common/Navbar';
import ResumeUpload from '../components/Candidate/ResumeUpload';
import MatchScore from '../components/Candidate/MatchScore';
import JobListings from '../components/Candidate/JobListings';
import MyOffers from '../components/Candidate/MyOffers';

const EMAIL_SERVICE = 'http://localhost:5001';

// ─────────────────────────────────────────────────────────────
// Offer Email Module  (visible only to admin role)
// ─────────────────────────────────────────────────────────────
function OfferEmailModule({ jobs }) {
    const [step, setStep] = useState(1);           // 1=compose, 2=sent
    const [candidateEmail, setCandidateEmail] = useState('');
    const [candidateName, setCandidateName] = useState('');
    const [selectedJob, setSelectedJob] = useState('');
    const [matchScore, setMatchScore] = useState('');
    const [status, setStatus] = useState('selected');
    const [customMsg, setCustomMsg] = useState('');
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState(null);

    const jobTitle = jobs.find(j => j.id === selectedJob)?.title || '';

    const resetForm = () => {
        setCandidateEmail('');
        setCandidateName('');
        setSelectedJob('');
        setMatchScore('');
        setStatus('selected');
        setCustomMsg('');
        setResult(null);
        setStep(1);
    };

    const handleSend = async () => {
        if (!candidateEmail.trim() || !selectedJob) {
            setResult({ ok: false, text: 'Please fill in candidate email and select a job.' });
            return;
        }
        setSending(true);
        setResult(null);
        try {
            // Try Nodemailer service first (port 5001)
            const res = await fetch(`${EMAIL_SERVICE}/api/send-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    candidate_email: candidateEmail.trim(),
                    candidate_name: candidateName.trim() || 'Candidate',
                    job_title: jobTitle,
                    match_score: parseFloat(matchScore) || 0,
                    status,
                    message: customMsg.trim(),
                }),
            });
            const body = await res.json();
            if (res.ok) {
                setResult({ ok: true, text: `✅ Email sent to ${candidateEmail}` });
                setStep(2);
            } else {
                setResult({ ok: false, text: body.error || 'Failed to send email.' });
            }
        } catch (err) {
            // Fallback to Flask backend
            try {
                await api.post('/send-selection-email', {
                    candidate_email: candidateEmail.trim(),
                    candidate_name: candidateName.trim() || 'Candidate',
                    job_title: jobTitle,
                    match_score: parseFloat(matchScore) || 0,
                    status,
                    message: customMsg.trim(),
                });
                setResult({ ok: true, text: `✅ Email sent to ${candidateEmail}` });
                setStep(2);
            } catch (fallbackErr) {
                setResult({ ok: false, text: fallbackErr.response?.data?.error || 'Email service unavailable.' });
            }
        } finally {
            setSending(false);
        }
    };

    // ── Success screen ───────────────────────────────────────────
    if (step === 2) {
        return (
            <div style={os.successWrap}>
                <div style={os.successIcon}>{status === 'selected' ? '🎉' : '📩'}</div>
                <h3 style={os.successTitle}>
                    {status === 'selected' ? 'Offer Letter Sent!' : 'Rejection Email Sent!'}
                </h3>
                <p style={os.successSub}>
                    A {status === 'selected' ? 'selection' : 'rejection'} email was dispatched to&nbsp;
                    <b>{candidateEmail}</b> for the role of <b>{jobTitle}</b>.
                </p>
                <div style={os.successActions}>
                    <button style={os.newBtn} onClick={resetForm}>✉️ Send Another Email</button>
                </div>
            </div>
        );
    }

    // ── Compose screen ───────────────────────────────────────────
    return (
        <div style={os.wrap}>
            <div style={os.header}>
                <div style={os.headerIcon}>{status === 'selected' ? '🎉' : '❌'}</div>
                <div>
                    <h3 style={os.title}>Send Offer / Rejection Email</h3>
                    <p style={os.subtitle}>Send a professional email to a candidate directly from the dashboard.</p>
                </div>
            </div>

            {/* Status toggle */}
            <div style={os.toggleRow}>
                {[
                    { val: 'selected', label: '🎉 Offer (Selected)', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
                    { val: 'rejected', label: '❌ Rejection', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
                ].map(opt => (
                    <button
                        key={opt.val}
                        style={{
                            ...os.toggleBtn,
                            ...(status === opt.val
                                ? { background: opt.bg, borderColor: opt.color, color: opt.color, fontWeight: '700' }
                                : {}),
                        }}
                        onClick={() => setStatus(opt.val)}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            {/* Form fields */}
            <div style={os.grid}>
                <div style={os.field}>
                    <label style={os.label}>Candidate Email <span style={os.req}>*</span></label>
                    <input
                        style={os.input}
                        type="email"
                        placeholder="jane@example.com"
                        value={candidateEmail}
                        onChange={e => setCandidateEmail(e.target.value)}
                    />
                </div>
                <div style={os.field}>
                    <label style={os.label}>Candidate Name</label>
                    <input
                        style={os.input}
                        type="text"
                        placeholder="Jane Smith"
                        value={candidateName}
                        onChange={e => setCandidateName(e.target.value)}
                    />
                </div>
                <div style={os.field}>
                    <label style={os.label}>Job Position <span style={os.req}>*</span></label>
                    <select style={os.input} value={selectedJob} onChange={e => setSelectedJob(e.target.value)}>
                        <option value="">-- Select a job --</option>
                        {jobs.map(j => (
                            <option key={j.id} value={j.id}>{j.title}</option>
                        ))}
                    </select>
                </div>
                <div style={os.field}>
                    <label style={os.label}>Match Score %</label>
                    <input
                        style={os.input}
                        type="number"
                        placeholder="e.g. 87"
                        min="0"
                        max="100"
                        value={matchScore}
                        onChange={e => setMatchScore(e.target.value)}
                    />
                </div>
            </div>

            <div style={os.field}>
                <label style={os.label}>
                    Custom Message&nbsp;
                    <span style={os.optional}>(optional — leave blank for auto-generated message)</span>
                </label>
                <textarea
                    style={os.textarea}
                    rows={5}
                    placeholder={
                        status === 'selected'
                            ? 'Congratulations! We are delighted to offer you the position of...'
                            : 'Thank you for applying. After careful consideration...'
                    }
                    value={customMsg}
                    onChange={e => setCustomMsg(e.target.value)}
                />
            </div>

            {/* Preview banner */}
            {selectedJob && candidateEmail && (
                <div style={{ ...os.preview, borderColor: status === 'selected' ? '#bbf7d0' : '#fecaca', background: status === 'selected' ? '#f0fdf4' : '#fef2f2' }}>
                    <span style={{ color: status === 'selected' ? '#16a34a' : '#dc2626', fontWeight: '600' }}>
                        📬 Preview:
                    </span>
                    &nbsp;{status === 'selected' ? '🎉 Congratulations!' : 'Update on your application'} email will be sent to&nbsp;
                    <b>{candidateEmail}</b> for <b>{jobTitle}</b>.
                </div>
            )}

            {/* Error/result */}
            {result && !result.ok && (
                <div style={os.error}>{result.text}</div>
            )}

            {/* Actions */}
            <div style={os.actions}>
                <button
                    style={{
                        ...os.sendBtn,
                        background: status === 'selected'
                            ? 'linear-gradient(135deg, #10b981, #059669)'
                            : 'linear-gradient(135deg, #ef4444, #dc2626)',
                        opacity: sending ? 0.65 : 1,
                    }}
                    disabled={sending || !candidateEmail || !selectedJob}
                    onClick={handleSend}
                >
                    {sending
                        ? '⏳ Sending...'
                        : status === 'selected'
                            ? '🎉 Send Offer Letter'
                            : '❌ Send Rejection Email'
                    }
                </button>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Main Candidate Dashboard
// ─────────────────────────────────────────────────────────────
export default function CandidateDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [resumes, setResumes] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [selectedResume, setSelectedResume] = useState('');
    const [selectedJob, setSelectedJob] = useState('');
    const [matchResult, setMatchResult] = useState(null);
    const [matchLoading, setMatchLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('upload');

    const isAdmin = user?.role === 'admin';

    const fetchData = useCallback(async () => {
        try {
            const [resumeRes, jobRes] = await Promise.all([
                api.get('/resumes/my'),
                api.get('/jobs'),
            ]);
            setResumes(Array.isArray(resumeRes.data) ? resumeRes.data : (resumeRes.data.resumes || []));
            setJobs(Array.isArray(jobRes.data) ? jobRes.data : (jobRes.data.jobs || []));
        } catch (err) {
            console.error(err);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleMatch = async () => {
        if (!selectedResume || !selectedJob) return;
        setMatchLoading(true);
        setMatchResult(null);
        try {
            const { data } = await api.get('/match-score', {
                params: { resume_id: selectedResume, job_id: selectedJob },
            });
            setMatchResult(data);
            setActiveTab('score');
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to compute match score');
        } finally {
            setMatchLoading(false);
        }
    };

    // Tabs: candidate sees Jobs + Offers tabs
    const tabs = [
        { key: 'upload', label: '📤 Upload Resume' },
        { key: 'jobs', label: '💼 Browse Jobs' },
        { key: 'offers', label: '🎁 My Offers' },
        { key: 'match', label: '🔍 Find Match' },
        { key: 'score', label: '📊 Score Details' },
        ...(isAdmin ? [{ key: 'offer', label: '🎉 Send Offer' }] : []),
    ];

    return (
        <div style={styles.page}>
            <Navbar />
            <div style={styles.container}>
                <div style={{ ...styles.welcome, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div>
                        <h2 style={styles.greeting}>Welcome back, {user?.name} 👋</h2>
                        <p style={styles.sub}>
                            {isAdmin
                                ? 'Manage candidates, compute match scores, and send offer letters.'
                                : 'Upload your resume and check how well you match job openings.'}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignSelf: 'flex-start', flexWrap: 'wrap' }}>
                        <button style={styles.feedNavBtn} onClick={() => navigate('/feed')}>
                            🌐 Tech Feed
                        </button>
                        <button style={{ ...styles.feedNavBtn, color: '#7c3aed', borderColor: '#7c3aed' }} onClick={() => navigate('/courses')}>
                            🎓 Courses
                        </button>
                    </div>
                </div>

                {/* Stat cards */}
                <div style={styles.stats}>
                    <StatCard icon="📄" label="Resumes Uploaded" value={resumes.length} />
                    <StatCard icon="💼" label="Jobs Available" value={jobs.length} />
                    <StatCard icon="🎯" label="Last Score" value={matchResult ? `${matchResult.match_score}%` : '—'} />
                    {isAdmin && <StatCard icon="✉️" label="Offer Module" value="Active" accent="#10b981" />}
                </div>

                {/* Tabs */}
                <div style={styles.tabs}>
                    {tabs.map(t => (
                        <button
                            key={t.key}
                            style={{
                                ...styles.tab,
                                ...(activeTab === t.key ? styles.activeTab : {}),
                                ...(t.key === 'offer' ? styles.offerTab : {}),
                                ...(t.key === 'offer' && activeTab === 'offer' ? styles.offerTabActive : {}),
                            }}
                            onClick={() => setActiveTab(t.key)}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div style={styles.content}>
                    {activeTab === 'upload' && (
                        <ResumeUpload
                            onUploaded={() => { fetchData(); setActiveTab('jobs'); }}
                            resumes={resumes}
                        />
                    )}

                    {activeTab === 'jobs' && (
                        <JobListings resumes={resumes} />
                    )}

                    {activeTab === 'match' && (
                        <div style={styles.matchPanel}>
                            <h3 style={styles.panelTitle}>Check Your Match Score</h3>
                            <div style={styles.selectRow}>
                                <div style={styles.selectGroup}>
                                    <label style={styles.label}>Select Resume</label>
                                    <select style={styles.select} value={selectedResume} onChange={e => setSelectedResume(e.target.value)}>
                                        <option value="">-- Choose a resume --</option>
                                        {resumes.map(r => (
                                            <option key={r.id} value={r.id}>{r.original_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={styles.selectGroup}>
                                    <label style={styles.label}>Select Job</label>
                                    <select style={styles.select} value={selectedJob} onChange={e => setSelectedJob(e.target.value)}>
                                        <option value="">-- Choose a job --</option>
                                        {jobs.map(j => (
                                            <option key={j.id} value={j.id}>{j.title}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <button
                                style={{ ...styles.btn, opacity: (!selectedResume || !selectedJob || matchLoading) ? 0.6 : 1 }}
                                onClick={handleMatch}
                                disabled={!selectedResume || !selectedJob || matchLoading}
                            >
                                {matchLoading ? '⏳ Computing...' : '🚀 Compute Match Score'}
                            </button>
                            {resumes.length === 0 && (
                                <p style={styles.hint}>💡 Upload a resume first to get started.</p>
                            )}
                        </div>
                    )}

                    {activeTab === 'score' && matchResult && <MatchScore result={matchResult} />}
                    {activeTab === 'score' && !matchResult && (
                        <div style={styles.empty}>
                            <p>🔍 Run a match first to see your score details.</p>
                            <button style={styles.btn} onClick={() => setActiveTab('match')}>Go to Match</button>
                        </div>
                    )}

                    {activeTab === 'offers' && <MyOffers />}

                    {activeTab === 'offer' && isAdmin && (
                        <OfferEmailModule jobs={jobs} />
                    )}
                    {activeTab === 'offer' && !isAdmin && (
                        <div style={styles.empty}>
                            <p>🔒 This section is for admins only.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// StatCard
// ─────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, accent }) {
    return (
        <div style={styles.statCard}>
            <span style={styles.statIcon}>{icon}</span>
            <span style={{ ...styles.statValue, color: accent || '#667eea' }}>{value}</span>
            <span style={styles.statLabel}>{label}</span>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Dashboard Styles
// ─────────────────────────────────────────────────────────────
const styles = {
    page: { minHeight: '100vh', background: '#f8fafc' },
    container: { maxWidth: '960px', margin: '0 auto', padding: '24px 20px' },
    welcome: { marginBottom: '24px', display: 'flex' },
    greeting: { margin: 0, fontSize: '24px', fontWeight: '700', color: '#1e293b' },
    sub: { margin: '4px 0 0', color: '#64748b' },
    feedNavBtn: { padding: '10px 18px', background: '#fff', color: '#667eea', border: '1.5px solid #667eea', borderRadius: '9px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap', alignSelf: 'flex-start' },
    stats: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '24px' },
    statCard: {
        background: '#fff', borderRadius: '12px', padding: '20px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    },
    statIcon: { fontSize: '28px' },
    statValue: { fontSize: '24px', fontWeight: '700', color: '#667eea' },
    statLabel: { fontSize: '13px', color: '#64748b' },
    tabs: { display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' },
    tab: {
        padding: '10px 20px', borderRadius: '8px', border: '1.5px solid #e2e8f0',
        background: '#fff', cursor: 'pointer', fontWeight: '500', fontSize: '14px',
        color: '#64748b', transition: 'all 0.2s',
    },
    activeTab: { background: '#667eea', color: '#fff', borderColor: '#667eea' },
    offerTab: { borderColor: '#10b981', color: '#10b981', background: '#f0fdf4' },
    offerTabActive: { background: '#10b981', color: '#fff', borderColor: '#10b981' },
    content: { background: '#fff', borderRadius: '12px', padding: '28px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
    matchPanel: { display: 'flex', flexDirection: 'column', gap: '20px' },
    panelTitle: { margin: 0, fontSize: '18px', fontWeight: '600', color: '#1e293b' },
    selectRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
    selectGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
    label: { fontSize: '14px', fontWeight: '500', color: '#374151' },
    select: { padding: '11px 14px', borderRadius: '8px', border: '1.5px solid #e5e7eb', fontSize: '14px', background: '#fff', cursor: 'pointer' },
    btn: { padding: '13px 28px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', alignSelf: 'flex-start' },
    hint: { color: '#94a3b8', fontSize: '14px', margin: 0 },
    empty: { textAlign: 'center', padding: '40px', color: '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' },
};

// ─────────────────────────────────────────────────────────────
// Offer Module Styles
// ─────────────────────────────────────────────────────────────
const os = {
    wrap: { display: 'flex', flexDirection: 'column', gap: '20px' },
    header: { display: 'flex', alignItems: 'center', gap: '16px', paddingBottom: '16px', borderBottom: '1.5px solid #f1f5f9' },
    headerIcon: { fontSize: '36px' },
    title: { margin: 0, fontSize: '18px', fontWeight: '700', color: '#1e293b' },
    subtitle: { margin: '4px 0 0', fontSize: '13px', color: '#64748b' },
    toggleRow: { display: 'flex', gap: '12px' },
    toggleBtn: { flex: 1, padding: '12px', border: '1.5px solid #e5e7eb', borderRadius: '10px', background: '#fff', fontSize: '14px', cursor: 'pointer', fontWeight: '500', color: '#64748b', transition: 'all 0.15s' },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
    field: { display: 'flex', flexDirection: 'column', gap: '6px' },
    label: { fontSize: '13px', fontWeight: '600', color: '#374151' },
    req: { color: '#ef4444' },
    optional: { fontWeight: '400', color: '#94a3b8', fontSize: '12px' },
    input: { padding: '11px 14px', borderRadius: '9px', border: '1.5px solid #e5e7eb', fontSize: '14px', outline: 'none', transition: 'border 0.2s' },
    textarea: { padding: '12px 14px', borderRadius: '9px', border: '1.5px solid #e5e7eb', fontSize: '14px', resize: 'vertical', lineHeight: '1.6', outline: 'none' },
    preview: { padding: '12px 16px', borderRadius: '10px', border: '1.5px solid', fontSize: '14px', color: '#374151' },
    error: { padding: '12px 14px', borderRadius: '8px', background: '#fef2f2', color: '#dc2626', fontSize: '14px', fontWeight: '500' },
    actions: { display: 'flex', justifyContent: 'flex-end' },
    sendBtn: { padding: '13px 30px', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', transition: 'opacity 0.2s' },
    // Success screen
    successWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 20px', gap: '16px', textAlign: 'center' },
    successIcon: { fontSize: '64px' },
    successTitle: { margin: 0, fontSize: '22px', fontWeight: '700', color: '#1e293b' },
    successSub: { margin: 0, fontSize: '15px', color: '#64748b', maxWidth: '420px', lineHeight: '1.6' },
    successActions: { display: 'flex', gap: '12px', marginTop: '8px' },
    newBtn: { padding: '12px 24px', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: '9px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
};
