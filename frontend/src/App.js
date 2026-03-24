import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import CandidateDashboard from './pages/CandidateDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Feed from './pages/Feed';
import CoursesPage from './pages/CoursesPage';
import Navbar from './components/Common/Navbar';
import ChatWidget from './components/Chat/ChatWidget';

// ─── Route guard ──────────────────────────────────────────────────────────────
function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      height: '100vh', fontSize: '18px', color: '#667eea',
    }}>
      Loading...
    </div>
  );
  if (!user) return <Navigate to="/auth" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

// ─── Feed page (Navbar + Feed) ────────────────────────────────────────────────
function FeedPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>
      <Navbar />
      <Feed />
    </div>
  );
}

// ─── App routes ───────────────────────────────────────────────────────────────
function AppRoutes() {
  const { user } = useAuth();
  return (
    <>
      <Routes>
        {/* Auth */}
        <Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthPage />} />

        {/* Dashboard (role-aware) */}
        <Route path="/" element={
          <ProtectedRoute>
            {user?.role === 'admin' ? <AdminDashboard /> : <CandidateDashboard />}
          </ProtectedRoute>
        } />

        {/* LinkedIn-style Tech Feed — all logged-in users */}
        <Route path="/feed" element={
          <ProtectedRoute>
            <FeedPage />
          </ProtectedRoute>
        } />

        {/* 🎓 Online Courses — all logged-in users */}
        <Route path="/courses" element={
          <ProtectedRoute>
            <CoursesPage />
          </ProtectedRoute>
        } />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Global floating chat widget — visible on all pages when logged in */}
      {user && <ChatWidget />}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
