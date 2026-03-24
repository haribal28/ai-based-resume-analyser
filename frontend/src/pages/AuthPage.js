import React, { useState } from 'react';
import { useAuth, api } from '../context/AuthContext';

export default function AuthPage() {
    const { login } = useAuth();
    const [mode, setMode] = useState('login'); // 'login' | 'register'
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'candidate' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
            const payload = mode === 'login'
                ? { email: form.email, password: form.password }
                : { name: form.name, email: form.email, password: form.password, role: form.role };
            const { data } = await api.post(endpoint, payload);
            login(data.token, data.user);
        } catch (err) {
            setError(err.response?.data?.error || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={s.page}>
            <div style={s.card}>
                {/* Logo */}
                <div style={s.logo}>
                    <span style={s.logoIcon}>🎯</span>
                    <h1 style={s.logoText}>ResumeMatch<span style={s.logoPurple}>AI</span></h1>
                </div>
                <p style={s.tagline}>AI-powered resume screening & skill matching</p>

                {/* Toggle */}
                <div style={s.toggle}>
                    <button style={{ ...s.toggleBtn, ...(mode === 'login' ? s.toggleActive : {}) }} onClick={() => { setMode('login'); setError(''); }}>
                        Sign In
                    </button>
                    <button style={{ ...s.toggleBtn, ...(mode === 'register' ? s.toggleActive : {}) }} onClick={() => { setMode('register'); setError(''); }}>
                        Sign Up
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={s.form}>
                    {mode === 'register' && (
                        <div style={s.field}>
                            <label style={s.label}>Full Name</label>
                            <input style={s.input} name="name" placeholder="Jane Smith" value={form.name} onChange={handleChange} required />
                        </div>
                    )}
                    <div style={s.field}>
                        <label style={s.label}>Email</label>
                        <input style={s.input} name="email" type="email" placeholder="you@company.com" value={form.email} onChange={handleChange} required />
                    </div>
                    <div style={s.field}>
                        <label style={s.label}>Password</label>
                        <input style={s.input} name="password" type="password" placeholder="••••••••" value={form.password} onChange={handleChange} required />
                    </div>
                    {mode === 'register' && (
                        <div style={s.field}>
                            <label style={s.label}>I am a...</label>
                            <div style={s.roleRow}>
                                {['candidate', 'admin'].map(r => (
                                    <button
                                        key={r}
                                        type="button"
                                        style={{ ...s.roleBtn, ...(form.role === r ? s.roleBtnActive : {}) }}
                                        onClick={() => setForm({ ...form, role: r })}
                                    >
                                        {r === 'candidate' ? '👤 Candidate' : '🏢 HR Admin'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {error && <div style={s.error}>{error}</div>}

                    <button type="submit" style={s.btn} disabled={loading}>
                        {loading ? '⏳ Please wait...' : mode === 'login' ? '🔓 Sign In' : '🚀 Create Account'}
                    </button>
                </form>
            </div>
        </div>
    );
}

const s = {
    page: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
    },
    card: {
        background: '#fff', borderRadius: '20px', padding: '44px 40px',
        width: '100%', maxWidth: '420px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
    },
    logo: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' },
    logoIcon: { fontSize: '32px' },
    logoText: { fontSize: '24px', fontWeight: '800', color: '#1e293b' },
    logoPurple: { color: '#667eea' },
    tagline: { color: '#94a3b8', fontSize: '14px', marginBottom: '28px' },
    toggle: {
        display: 'flex', background: '#f1f5f9', borderRadius: '10px',
        padding: '4px', marginBottom: '28px', gap: '4px',
    },
    toggleBtn: {
        flex: 1, padding: '10px', border: 'none', background: 'transparent',
        borderRadius: '8px', fontWeight: '600', fontSize: '14px',
        color: '#64748b', cursor: 'pointer', transition: 'all 0.2s',
    },
    toggleActive: { background: '#fff', color: '#667eea', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' },
    form: { display: 'flex', flexDirection: 'column', gap: '18px' },
    field: { display: 'flex', flexDirection: 'column', gap: '6px' },
    label: { fontSize: '13px', fontWeight: '600', color: '#374151' },
    input: {
        padding: '12px 14px', borderRadius: '10px',
        border: '1.5px solid #e5e7eb', fontSize: '15px',
        outline: 'none', transition: 'border-color 0.2s',
    },
    roleRow: { display: 'flex', gap: '10px' },
    roleBtn: {
        flex: 1, padding: '12px', border: '1.5px solid #e5e7eb',
        borderRadius: '10px', background: '#fff', fontWeight: '500',
        fontSize: '14px', color: '#64748b', transition: 'all 0.2s',
    },
    roleBtnActive: { borderColor: '#667eea', background: '#f0edff', color: '#667eea', fontWeight: '600' },
    error: {
        background: '#fef2f2', color: '#dc2626', padding: '12px 14px',
        borderRadius: '8px', fontSize: '14px', border: '1px solid #fecaca',
    },
    btn: {
        padding: '14px', background: 'linear-gradient(135deg, #667eea, #764ba2)',
        color: '#fff', border: 'none', borderRadius: '10px',
        fontSize: '15px', fontWeight: '700', cursor: 'pointer',
        marginTop: '4px', transition: 'opacity 0.2s',
    },
};
