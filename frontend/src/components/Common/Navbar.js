import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const isFeed = location.pathname === '/feed';
    const isHome = location.pathname === '/';
    const isCourses = location.pathname === '/courses';

    return (
        <nav style={s.nav}>
            <div style={s.inner}>
                {/* Brand */}
                <div style={s.brand} onClick={() => navigate('/')} role="button">
                    <span style={s.icon}>🎯</span>
                    <span style={s.title}>ResumeMatch<span style={s.purple}>AI</span></span>
                </div>

                {/* Nav links */}
                <div style={s.navLinks}>
                    <button
                        style={{ ...s.navLink, ...(isHome ? s.navLinkActive : {}) }}
                        onClick={() => navigate('/')}
                    >
                        {user?.role === 'admin' ? '🏢 Dashboard' : '🏠 Dashboard'}
                    </button>
                    <button
                        style={{ ...s.navLink, ...(isFeed ? s.navLinkActive : {}) }}
                        onClick={() => navigate('/feed')}
                    >
                        🌐 Tech Feed
                    </button>
                    <button
                        style={{ ...s.navLink, ...(isCourses ? s.navLinkActive : {}) }}
                        onClick={() => navigate('/courses')}
                    >
                        🎓 Courses
                    </button>
                </div>

                {/* Right side */}
                <div style={s.right}>
                    <span style={s.role}>{user?.role === 'admin' ? '🏢 HR Admin' : '👤 Candidate'}</span>
                    <span style={s.name}>{user?.name}</span>
                    <button style={s.logoutBtn} onClick={logout}>Sign Out</button>
                </div>
            </div>
        </nav>
    );
}

const s = {
    nav: { background: '#fff', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
    inner: { maxWidth: '1200px', margin: '0 auto', padding: '0 24px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' },
    brand: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flexShrink: 0 },
    icon: { fontSize: '22px' },
    title: { fontSize: '18px', fontWeight: '800', color: '#1e293b' },
    purple: { color: '#667eea' },
    navLinks: { display: 'flex', alignItems: 'center', gap: '4px' },
    navLink: {
        padding: '7px 16px', borderRadius: '8px', border: 'none',
        background: 'transparent', cursor: 'pointer', fontSize: '13px',
        fontWeight: '600', color: '#475569', transition: 'all .2s',
    },
    navLinkActive: { background: '#f0edff', color: '#667eea' },
    right: { display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 },
    role: { fontSize: '12px', background: '#f0edff', color: '#667eea', padding: '4px 10px', borderRadius: '20px', fontWeight: '600' },
    name: { fontSize: '14px', fontWeight: '500', color: '#475569' },
    logoutBtn: {
        padding: '7px 16px', background: 'transparent', border: '1.5px solid #e2e8f0',
        borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: '#64748b',
        cursor: 'pointer', transition: 'all .2s',
    },
};
