import React, { useState, useRef } from 'react';
import { api } from '../../context/AuthContext';

export default function ResumeUpload({ onUploaded, resumes }) {
    const [dragging, setDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const fileRef = useRef();

    const upload = async (file) => {
        if (!file || file.type !== 'application/pdf') {
            setError('Please select a PDF file.');
            return;
        }
        setUploading(true);
        setError('');
        setResult(null);
        const form = new FormData();
        form.append('resume', file);
        try {
            const { data } = await api.post('/upload-resume', form, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setResult(data);
            if (onUploaded) onUploaded();
        } catch (err) {
            setError(err.response?.data?.error || 'Upload failed.');
        } finally {
            setUploading(false);
        }
    };

    const onDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        upload(file);
    };

    return (
        <div style={s.wrap}>
            <h3 style={s.title}>Upload Your Resume</h3>
            <p style={s.sub}>Upload a PDF resume to get AI-powered match scores against job listings.</p>

            <div
                style={{ ...s.dropzone, ...(dragging ? s.dragging : {}) }}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current.click()}
            >
                <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }}
                    onChange={e => upload(e.target.files[0])} />
                <span style={s.dropIcon}>{uploading ? '⏳' : '📄'}</span>
                <span style={s.dropText}>
                    {uploading ? 'Uploading...' : 'Drag & drop PDF here, or click to browse'}
                </span>
                <span style={s.dropHint}>Only PDF files • Max 16MB</span>
            </div>

            {error && <div style={s.error}>{error}</div>}

            {result && (
                <div style={s.success}>
                    <div style={s.successTitle}>✅ Resume uploaded successfully!</div>
                    <div style={s.successDetail}>
                        <b>File:</b> {result.original_name}<br />
                        <b>Skills detected:</b> {result.extracted_skills?.length > 0
                            ? result.extracted_skills.join(', ')
                            : 'None detected'}
                    </div>
                </div>
            )}

            {resumes && resumes.length > 0 && (
                <div style={s.prevSection}>
                    <h4 style={s.prevTitle}>Your Uploaded Resumes ({resumes.length})</h4>
                    <div style={s.resumeList}>
                        {resumes.map(r => (
                            <div key={r.id} style={s.resumeItem}>
                                <span style={s.resumeIcon}>📄</span>
                                <div>
                                    <div style={s.resumeName}>{r.original_name}</div>
                                    <div style={s.resumeSkills}>{(r.extracted_skills || []).slice(0, 4).join(', ')}{r.extracted_skills?.length > 4 ? '...' : ''}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

const s = {
    wrap: { display: 'flex', flexDirection: 'column', gap: '20px' },
    title: { margin: 0, fontSize: '18px', fontWeight: '600', color: '#1e293b' },
    sub: { margin: 0, color: '#64748b', fontSize: '14px' },
    dropzone: {
        border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '48px 24px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
        cursor: 'pointer', transition: 'all 0.2s', background: '#f8fafc',
    },
    dragging: { borderColor: '#667eea', background: '#f0edff' },
    dropIcon: { fontSize: '40px' },
    dropText: { fontSize: '15px', fontWeight: '500', color: '#475569' },
    dropHint: { fontSize: '13px', color: '#94a3b8' },
    error: { background: '#fef2f2', color: '#dc2626', padding: '12px', borderRadius: '8px', fontSize: '14px' },
    success: { background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '16px' },
    successTitle: { fontWeight: '600', color: '#15803d', marginBottom: '6px' },
    successDetail: { fontSize: '13px', color: '#166534', lineHeight: '1.7' },
    prevSection: { borderTop: '1.5px solid #f1f5f9', paddingTop: '20px' },
    prevTitle: { margin: '0 0 12px', fontSize: '15px', fontWeight: '600', color: '#374151' },
    resumeList: { display: 'flex', flexDirection: 'column', gap: '8px' },
    resumeItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f8fafc', borderRadius: '8px' },
    resumeIcon: { fontSize: '22px' },
    resumeName: { fontSize: '14px', fontWeight: '500', color: '#1e293b' },
    resumeSkills: { fontSize: '12px', color: '#64748b', marginTop: '2px' },
};
