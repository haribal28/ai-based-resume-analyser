// src/components/Admin/JobUpload.js
// Naukri/Indeed-style job posting form with:
//  - HR Keywords (directly used for AI scoring)
//  - Experience level, employment type, location, salary range

import React, { useState } from 'react';
import { api } from '../../context/AuthContext';

const EMPTY_FORM = {
    title: '',
    description: '',
    hr_keywords: '',   // comma-separated — used directly for matching score
    experience_level: '',
    employment_type: 'Full-time',
    location: '',
    salary_min: '',
    salary_max: '',
};

export default function JobUpload({ onPosted }) {
    const [form, setForm] = useState(EMPTY_FORM);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(null);

    const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim() || !form.description.trim()) {
            setError('Job title and description are required.');
            return;
        }
        setLoading(true); setError(''); setSuccess(null);
        try {
            const { data } = await api.post('/upload-job', {
                ...form,
                salary_min: parseInt(form.salary_min) || 0,
                salary_max: parseInt(form.salary_max) || 0,
            });
            setSuccess(data);
            setForm(EMPTY_FORM);
            if (onPosted) setTimeout(onPosted, 2000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to post job.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={s.wrap}>
            <div style={s.header}>
                <div>
                    <h3 style={s.title}>Post a New Job</h3>
                    <p style={s.sub}>
                        Provide HR keywords to dramatically improve AI match scoring accuracy.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} style={s.form}>

                {/* ── Basic Info ─────────────────────────────── */}
                <div style={s.sectionLabel}>📋 Basic Information</div>

                <div style={s.field}>
                    <label style={s.label}>Job Title <span style={s.req}>*</span></label>
                    <input style={s.input} placeholder="e.g. Senior Python Developer"
                        value={form.title} onChange={e => set('title', e.target.value)} />
                </div>

                <div style={s.field}>
                    <label style={s.label}>Job Description <span style={s.req}>*</span></label>
                    <textarea style={s.textarea} rows={6}
                        placeholder="Describe responsibilities, qualifications, tech stack..."
                        value={form.description} onChange={e => set('description', e.target.value)} />
                </div>

                {/* ── HR Keywords (KEY FEATURE) ─────────────── */}
                <div style={s.keywordBox}>
                    <div style={s.keywordHeader}>
                        <span style={s.keywordIcon}>🎯</span>
                        <div>
                            <div style={s.keywordTitle}>HR Keywords  <span style={s.keywordBadge}>Improves Accuracy</span></div>
                            <div style={s.keywordHint}>
                                Enter exactly the skills/keywords you're looking for, comma-separated.
                                These are used <b>directly</b> (60% weight) in AI scoring — far more accurate than relying on JD alone.
                            </div>
                        </div>
                    </div>
                    <textarea style={{ ...s.textarea, borderColor: '#a78bfa', minHeight: '70px' }} rows={3}
                        placeholder="e.g. python, django, postgresql, docker, REST API, agile, AWS"
                        value={form.hr_keywords} onChange={e => set('hr_keywords', e.target.value)} />
                    {form.hr_keywords && (
                        <div style={s.kwPreview}>
                            {form.hr_keywords.split(',').filter(k => k.trim()).map((kw, i) => (
                                <span key={i} style={s.kwChip}>{kw.trim()}</span>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Job Details (Naukri/Indeed style) ──────── */}
                <div style={s.sectionLabel}>📍 Job Details</div>
                <div style={s.grid2}>
                    <div style={s.field}>
                        <label style={s.label}>Experience Level</label>
                        <select style={s.input} value={form.experience_level} onChange={e => set('experience_level', e.target.value)}>
                            <option value="">-- Select --</option>
                            {['Fresher (0-1 yr)', '1-3 years', '3-5 years', '5-8 years', '8+ years', 'Any'].map(x => (
                                <option key={x}>{x}</option>
                            ))}
                        </select>
                    </div>
                    <div style={s.field}>
                        <label style={s.label}>Employment Type</label>
                        <select style={s.input} value={form.employment_type} onChange={e => set('employment_type', e.target.value)}>
                            {['Full-time', 'Part-time', 'Remote', 'Contract', 'Internship'].map(x => (
                                <option key={x}>{x}</option>
                            ))}
                        </select>
                    </div>
                    <div style={s.field}>
                        <label style={s.label}>Location</label>
                        <input style={s.input} placeholder="e.g. Bangalore / Remote"
                            value={form.location} onChange={e => set('location', e.target.value)} />
                    </div>
                    <div style={s.field}>
                        <label style={s.label}>Salary Range (₹ LPA)</label>
                        <div style={s.salaryRow}>
                            <input style={{ ...s.input, flex: 1 }} type="number" placeholder="Min (e.g. 8)"
                                value={form.salary_min} onChange={e => set('salary_min', e.target.value)} />
                            <span style={s.salaryDash}>–</span>
                            <input style={{ ...s.input, flex: 1 }} type="number" placeholder="Max (e.g. 15)"
                                value={form.salary_max} onChange={e => set('salary_max', e.target.value)} />
                        </div>
                    </div>
                </div>

                {/* ── Status ─────────────────────────────────── */}
                {error && <div style={s.error}>{error}</div>}
                {success && (
                    <div style={s.success}>
                        <div><b>✅ Job posted successfully!</b></div>
                        {success.hr_keywords?.length > 0 && (
                            <div style={{ marginTop: '8px' }}>
                                🎯 HR Keywords saved: <b>{success.hr_keywords.join(', ')}</b>
                            </div>
                        )}
                        {success.required_skills?.length > 0 && (
                            <div style={{ marginTop: '4px' }}>
                                🤖 Auto-detected skills: <b>{success.required_skills.join(', ')}</b>
                            </div>
                        )}
                    </div>
                )}

                <button type="submit" style={{ ...s.btn, opacity: loading ? .65 : 1 }} disabled={loading}>
                    {loading ? '⏳ Posting...' : '📢 Post Job'}
                </button>
            </form>
        </div>
    );
}

const s = {
    wrap: { display: 'flex', flexDirection: 'column', gap: '20px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
    title: { margin: 0, fontSize: '18px', fontWeight: '700', color: '#1e293b' },
    sub: { margin: '4px 0 0', color: '#64748b', fontSize: '13px' },
    form: { display: 'flex', flexDirection: 'column', gap: '18px' },
    sectionLabel: { fontSize: '13px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '.05em', paddingTop: '4px', borderTop: '1px solid #f1f5f9', marginTop: '4px' },
    field: { display: 'flex', flexDirection: 'column', gap: '6px' },
    label: { fontSize: '13px', fontWeight: '600', color: '#374151' },
    req: { color: '#ef4444' },
    input: { padding: '11px 14px', borderRadius: '9px', border: '1.5px solid #e5e7eb', fontSize: '14px', background: '#fff', outline: 'none' },
    textarea: { padding: '11px 14px', borderRadius: '9px', border: '1.5px solid #e5e7eb', fontSize: '14px', resize: 'vertical', lineHeight: '1.6', outline: 'none' },
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
    salaryRow: { display: 'flex', alignItems: 'center', gap: '8px' },
    salaryDash: { color: '#94a3b8', fontWeight: '600' },
    // Keyword Box
    keywordBox: { display: 'flex', flexDirection: 'column', gap: '10px', background: '#faf5ff', border: '1.5px solid #a78bfa', borderRadius: '12px', padding: '16px' },
    keywordHeader: { display: 'flex', gap: '12px', alignItems: 'flex-start' },
    keywordIcon: { fontSize: '24px' },
    keywordTitle: { fontSize: '14px', fontWeight: '700', color: '#7c3aed', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' },
    keywordBadge: { background: '#7c3aed', color: '#fff', fontSize: '10px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px' },
    keywordHint: { fontSize: '12px', color: '#6b7280', lineHeight: '1.5' },
    kwPreview: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
    kwChip: { background: '#ede9fe', color: '#7c3aed', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
    // Feedback
    error: { background: '#fef2f2', color: '#dc2626', padding: '12px 14px', borderRadius: '9px', fontSize: '14px', fontWeight: '500' },
    success: { background: '#f0fdf4', color: '#15803d', padding: '14px 16px', borderRadius: '9px', fontSize: '14px', lineHeight: '1.6' },
    btn: { alignSelf: 'flex-start', padding: '13px 28px', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', border: 'none', borderRadius: '9px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', transition: 'opacity .2s' },
};
