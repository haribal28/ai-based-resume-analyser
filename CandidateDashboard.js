// src/pages/CandidateDashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, api } from '../context/AuthContext';
import ResumeUpload from '../components/Candidate/ResumeUpload';
import MatchScore from '../components/Candidate/MatchScore';
import Navbar from '../components/Common/Navbar';

export default function CandidateDashboard() {
  const { user } = useAuth();
  const [resumes, setResumes] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedResume, setSelectedResume] = useState('');
  const [selectedJob, setSelectedJob] = useState('');
  const [matchResult, setMatchResult] = useState(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');

  const fetchData = useCallback(async () => {
    try {
      const [resumeRes, jobRes] = await Promise.all([
        api.get('/resumes/my'),
        api.get('/jobs')
      ]);
      setResumes(resumeRes.data.resumes || []);
      setJobs(jobRes.data.jobs || []);
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
        params: { resume_id: selectedResume, job_id: selectedJob }
      });
      setMatchResult(data);
      setActiveTab('score');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to compute match score');
    } finally {
      setMatchLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <Navbar />
      <div style={styles.container}>
        {/* Welcome */}
        <div style={styles.welcome}>
          <h2 style={styles.greeting}>Welcome back, {user?.name} 👋</h2>
          <p style={styles.sub}>Upload your resume and check how well you match job openings.</p>
        </div>

        {/* Stats */}
        <div style={styles.stats}>
          <StatCard icon="📄" label="Resumes Uploaded" value={resumes.length} />
          <StatCard icon="💼" label="Jobs Available" value={jobs.length} />
          <StatCard icon="🎯" label="Last Score" value={matchResult ? `${matchResult.match_score}%` : '—'} />
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          {['upload', 'match', 'score'].map(tab => (
            <button
              key={tab}
              style={{ ...styles.tab, ...(activeTab === tab ? styles.activeTab : {}) }}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'upload' ? '📤 Upload Resume' : tab === 'match' ? '🔍 Find Match' : '📊 Score Details'}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={styles.content}>
          {activeTab === 'upload' && (
            <ResumeUpload onUploaded={() => { fetchData(); setActiveTab('match'); }} resumes={resumes} />
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

          {activeTab === 'score' && matchResult && (
            <MatchScore result={matchResult} />
          )}
          {activeTab === 'score' && !matchResult && (
            <div style={styles.empty}>
              <p>🔍 Run a match first to see your score details.</p>
              <button style={styles.btn} onClick={() => setActiveTab('match')}>Go to Match</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div style={styles.statCard}>
      <span style={styles.statIcon}>{icon}</span>
      <span style={styles.statValue}>{value}</span>
      <span style={styles.statLabel}>{label}</span>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#f8fafc' },
  container: { maxWidth: '900px', margin: '0 auto', padding: '24px 20px' },
  welcome: { marginBottom: '24px' },
  greeting: { margin: 0, fontSize: '24px', fontWeight: '700', color: '#1e293b' },
  sub: { margin: '4px 0 0', color: '#64748b' },
  stats: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' },
  statCard: {
    background: '#fff', borderRadius: '12px', padding: '20px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  statIcon: { fontSize: '28px' },
  statValue: { fontSize: '24px', fontWeight: '700', color: '#667eea' },
  statLabel: { fontSize: '13px', color: '#64748b' },
  tabs: { display: 'flex', gap: '8px', marginBottom: '20px' },
  tab: {
    padding: '10px 20px', borderRadius: '8px', border: '1.5px solid #e2e8f0',
    background: '#fff', cursor: 'pointer', fontWeight: '500', fontSize: '14px',
    color: '#64748b', transition: 'all 0.2s',
  },
  activeTab: { background: '#667eea', color: '#fff', borderColor: '#667eea' },
  content: { background: '#fff', borderRadius: '12px', padding: '28px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  matchPanel: { display: 'flex', flexDirection: 'column', gap: '20px' },
  panelTitle: { margin: 0, fontSize: '18px', fontWeight: '600', color: '#1e293b' },
  selectRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  selectGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '14px', fontWeight: '500', color: '#374151' },
  select: {
    padding: '11px 14px', borderRadius: '8px', border: '1.5px solid #e5e7eb',
    fontSize: '14px', background: '#fff', cursor: 'pointer',
  },
  btn: {
    padding: '13px 28px', background: 'linear-gradient(135deg, #667eea, #764ba2)',
    color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px',
    fontWeight: '600', cursor: 'pointer', alignSelf: 'flex-start',
  },
  hint: { color: '#94a3b8', fontSize: '14px', margin: 0 },
  empty: { textAlign: 'center', padding: '40px', color: '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' },
};
