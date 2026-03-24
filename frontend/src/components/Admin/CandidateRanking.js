import React, { useState, useEffect } from 'react';
import { api } from '../../context/AuthContext';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// ─────────────────────────────────────────────────────────────
// Email Modal
// ─────────────────────────────────────────────────────────────
function EmailModal({ candidate, jobTitle, onClose }) {
    const [status, setStatus] = useState('selected');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState(null); // {ok, text}

    const handleSend = async () => {
        setSending(true);
        setResult(null);
        try {
            await api.post('/send-selection-email', {
                candidate_email: candidate.candidate_email,
                candidate_name: candidate.candidate_name,
                job_title: jobTitle,
                match_score: candidate.match_score,
                message: message,
                status: status,
            });
            setResult({ ok: true, text: `✅ Email sent to ${candidate.candidate_email}` });
        } catch (err) {
            setResult({ ok: false, text: err.response?.data?.error || 'Failed to send email.' });
        } finally {
            setSending(false);
        }
    };

    return (
        <div style={ms.overlay} onClick={onClose}>
            <div style={ms.modal} onClick={e => e.stopPropagation()}>
                <div style={ms.modalHeader}>
                    <h3 style={ms.modalTitle}>✉️ Send Email to Candidate</h3>
                    <button style={ms.closeBtn} onClick={onClose}>✕</button>
                </div>

                <div style={ms.info}>
                    <div style={ms.infoRow}><b>To:</b> {candidate.candidate_name} &lt;{candidate.candidate_email}&gt;</div>
                    <div style={ms.infoRow}><b>Job:</b> {jobTitle}</div>
                    <div style={ms.infoRow}><b>Match Score:</b> {candidate.match_score}%</div>
                </div>

                <div style={ms.field}>
                    <label style={ms.label}>Email Type</label>
                    <div style={ms.statusRow}>
                        {[
                            { val: 'selected', label: '🎉 Selection', color: '#16a34a', bg: '#f0fdf4' },
                            { val: 'rejected', label: '❌ Rejection', color: '#dc2626', bg: '#fef2f2' },
                        ].map(opt => (
                            <button
                                key={opt.val}
                                style={{
                                    ...ms.statusBtn,
                                    ...(status === opt.val
                                        ? { background: opt.bg, borderColor: opt.color, color: opt.color, fontWeight: '700' }
                                        : {}),
                                }}
                                onClick={() => setStatus(opt.val)}
                            >{opt.label}</button>
                        ))}
                    </div>
                </div>

                <div style={ms.field}>
                    <label style={ms.label}>
                        Custom Message <span style={ms.optional}>(optional — leave blank to use auto-generated message)</span>
                    </label>
                    <textarea
                        style={ms.textarea}
                        rows={6}
                        placeholder={
                            status === 'selected'
                                ? 'Congratulations! We are pleased to offer you...'
                                : 'Thank you for applying. Unfortunately...'
                        }
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                    />
                </div>

                {result && (
                    <div style={{ ...ms.result, background: result.ok ? '#f0fdf4' : '#fef2f2', color: result.ok ? '#15803d' : '#dc2626' }}>
                        {result.text}
                    </div>
                )}

                <div style={ms.actions}>
                    <button style={ms.cancelBtn} onClick={onClose}>Cancel</button>
                    <button
                        style={{ ...ms.sendBtn, opacity: sending ? 0.65 : 1 }}
                        disabled={sending}
                        onClick={handleSend}
                    >
                        {sending ? '⏳ Sending...' : `✉️ Send ${status === 'selected' ? 'Selection' : 'Rejection'} Email`}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Candidate Ranking Main Component
// ─────────────────────────────────────────────────────────────
export default function CandidateRanking({ jobId, minScore }) {
    const [candidates, setCandidates] = useState([]);
    const [jobTitle, setJobTitle] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [downloading, setDownloading] = useState(null);
    const [emailTarget, setEmailTarget] = useState(null); // candidate object for modal

    useEffect(() => {
        if (!jobId) return;
        setLoading(true);
        setError('');
        api.get('/rank-candidates', { params: { job_id: jobId, min_score: minScore } })
            .then(({ data }) => {
                setCandidates(data.candidates || []);
                setJobTitle(data.job_title || '');
            })
            .catch(err => setError(err.response?.data?.error || 'Failed to rank candidates.'))
            .finally(() => setLoading(false));
    }, [jobId, minScore]);

    // Download full CSV report
    const downloadReport = () => {
        const token = localStorage.getItem('token');
        fetch(`${API_BASE}/download-report?job_id=${jobId}`, {
            headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.blob()).then(blob => {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `candidates_${jobId}.csv`;
            a.click();
        });
    };

    // Download individual candidate CV
    const downloadCV = async (resumeId, candidateName, originalName) => {
        setDownloading(resumeId);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/resumes/${resumeId}/download`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) {
                const err = await response.json();
                alert(err.error || 'Download failed');
                return;
            }
            const blob = await response.blob();
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = originalName || `${candidateName}_CV.pdf`;
            a.click();
            URL.revokeObjectURL(a.href);
        } catch {
            alert('Download failed. Please try again.');
        } finally {
            setDownloading(null);
        }
    };

    if (loading) return <div style={s.center}>⏳ Ranking candidates...</div>;
    if (error) return <div style={s.errBox}>{error}</div>;

    return (
        <div style={s.wrap}>
            {/* Email modal */}
            {emailTarget && (
                <EmailModal
                    candidate={emailTarget}
                    jobTitle={jobTitle}
                    onClose={() => setEmailTarget(null)}
                />
            )}

            <div style={s.header}>
                <div>
                    <h3 style={s.title}>Ranked Candidates</h3>
                    {jobTitle && <p style={s.sub}>For: <b>{jobTitle}</b> — Min score: {minScore}%</p>}
                </div>
                <button style={s.dlBtn} onClick={downloadReport}>⬇️ Download CSV Report</button>
            </div>

            {candidates.length === 0 ? (
                <div style={s.empty}>No candidates meet the criteria.</div>
            ) : (
                <div style={s.list}>
                    {candidates.map((c, i) => {
                        const score = c.match_score;
                        const color = score >= 70 ? '#16a34a' : score >= 40 ? '#d97706' : '#dc2626';
                        const bg = score >= 70 ? '#f0fdf4' : score >= 40 ? '#fffbeb' : '#fef2f2';
                        const isDl = downloading === c.resume_id;

                        return (
                            <div key={c.resume_id} style={s.card}>
                                <div style={s.rank}>#{i + 1}</div>

                                <div style={s.info}>
                                    <div style={s.name}>{c.candidate_name}</div>
                                    <div style={s.email}>{c.candidate_email}</div>
                                    <div style={s.detail}>📄 {c.original_name}</div>
                                    <div style={s.skills}>
                                        {(c.matching_skills || []).slice(0, 5).map(sk => (
                                            <span key={sk} style={s.skillMatch}>{sk}</span>
                                        ))}
                                        {(c.missing_skills || []).slice(0, 3).map(sk => (
                                            <span key={sk} style={s.skillMiss}>{sk}</span>
                                        ))}
                                    </div>
                                </div>

                                <div style={s.actions}>
                                    {/* Score */}
                                    <div style={{ ...s.scorePill, background: bg, color }}>{score}%</div>

                                    {/* Download CV */}
                                    <button
                                        style={{ ...s.cvBtn, opacity: isDl ? 0.65 : 1 }}
                                        disabled={isDl}
                                        onClick={() => downloadCV(c.resume_id, c.candidate_name, c.original_name)}
                                    >
                                        {isDl ? '⏳ Downloading…' : '⬇️ Download CV'}
                                    </button>

                                    {/* Send Email */}
                                    <button
                                        style={s.emailBtn}
                                        onClick={() => setEmailTarget(c)}
                                    >
                                        ✉️ Send Email
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const s = {
    wrap: { display: 'flex', flexDirection: 'column', gap: '16px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
    title: { margin: 0, fontSize: '18px', fontWeight: '600', color: '#1e293b' },
    sub: { margin: '4px 0 0', fontSize: '13px', color: '#64748b' },
    dlBtn: {
        padding: '9px 18px', background: '#f1f5f9', border: '1.5px solid #e2e8f0',
        borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: '#475569', cursor: 'pointer',
    },
    center: { textAlign: 'center', padding: '40px', color: '#64748b' },
    errBox: { background: '#fef2f2', color: '#dc2626', padding: '14px', borderRadius: '8px', fontSize: '14px' },
    empty: { textAlign: 'center', padding: '40px', color: '#94a3b8' },
    list: { display: 'flex', flexDirection: 'column', gap: '10px' },
    card: {
        display: 'flex', alignItems: 'center', gap: '14px',
        padding: '16px', border: '1.5px solid #e2e8f0', borderRadius: '10px', background: '#fff',
    },
    rank: { fontSize: '18px', fontWeight: '800', color: '#94a3b8', minWidth: '30px', textAlign: 'center' },
    info: { flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' },
    name: { fontSize: '15px', fontWeight: '600', color: '#1e293b' },
    email: { fontSize: '13px', color: '#64748b' },
    detail: { fontSize: '12px', color: '#94a3b8' },
    skills: { display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' },
    skillMatch: { fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: '#dcfce7', color: '#16a34a', fontWeight: '500' },
    skillMiss: { fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: '#fee2e2', color: '#dc2626', fontWeight: '500' },
    actions: { display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '7px', minWidth: '130px' },
    scorePill: { fontSize: '20px', fontWeight: '800', padding: '8px 14px', borderRadius: '10px', textAlign: 'center' },
    cvBtn: {
        padding: '8px 10px', background: 'linear-gradient(135deg, #667eea, #764ba2)',
        color: '#fff', border: 'none', borderRadius: '8px',
        fontSize: '12px', fontWeight: '600', cursor: 'pointer', textAlign: 'center',
    },
    emailBtn: {
        padding: '8px 10px', background: 'linear-gradient(135deg, #10b981, #059669)',
        color: '#fff', border: 'none', borderRadius: '8px',
        fontSize: '12px', fontWeight: '600', cursor: 'pointer', textAlign: 'center',
    },
};

// ─── Modal Styles ───────────────────────────────────────────────────────────
const ms = {
    overlay: {
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '20px',
    },
    modal: {
        background: '#fff', borderRadius: '16px', padding: '32px',
        width: '100%', maxWidth: '520px',
        boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
        display: 'flex', flexDirection: 'column', gap: '20px',
    },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    modalTitle: { margin: 0, fontSize: '18px', fontWeight: '700', color: '#1e293b' },
    closeBtn: {
        background: '#f1f5f9', border: 'none', borderRadius: '8px',
        width: '32px', height: '32px', fontSize: '16px', cursor: 'pointer', color: '#64748b',
    },
    info: { background: '#f8fafc', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '6px' },
    infoRow: { fontSize: '14px', color: '#374151' },
    field: { display: 'flex', flexDirection: 'column', gap: '8px' },
    label: { fontSize: '13px', fontWeight: '600', color: '#374151' },
    optional: { fontWeight: '400', color: '#94a3b8' },
    statusRow: { display: 'flex', gap: '10px' },
    statusBtn: {
        flex: 1, padding: '10px', border: '1.5px solid #e5e7eb', borderRadius: '10px',
        background: '#fff', fontSize: '14px', cursor: 'pointer', fontWeight: '500', color: '#64748b',
        transition: 'all 0.15s',
    },
    textarea: {
        padding: '12px', borderRadius: '10px', border: '1.5px solid #e5e7eb',
        fontSize: '14px', resize: 'vertical', lineHeight: '1.6',
    },
    result: { padding: '12px 14px', borderRadius: '8px', fontSize: '14px', fontWeight: '500' },
    actions: { display: 'flex', gap: '10px', justifyContent: 'flex-end' },
    cancelBtn: {
        padding: '11px 20px', background: '#f1f5f9', border: '1.5px solid #e2e8f0',
        borderRadius: '8px', fontSize: '14px', fontWeight: '600', color: '#64748b', cursor: 'pointer',
    },
    sendBtn: {
        padding: '11px 24px', background: 'linear-gradient(135deg, #10b981, #059669)',
        color: '#fff', border: 'none', borderRadius: '8px',
        fontSize: '14px', fontWeight: '700', cursor: 'pointer',
    },
};
