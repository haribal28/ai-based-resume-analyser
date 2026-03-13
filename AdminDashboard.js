// src/pages/AdminDashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, api } from '../context/AuthContext';
import Navbar from '../components/Common/Navbar';
import JobUpload from '../components/Admin/JobUpload';
import CandidateRanking from '../components/Admin/CandidateRanking';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedJob, setSelectedJob] = useState('');
  const [minScore, setMinScore] = useState(0);

  const fetchJobs = useCallback(async () => {
    try {
      const { data } = await api.get('/jobs');
      setJobs(data.jobs || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  return (
    <div style={styles.page}>
      <Navbar />
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h2 style={styles.greeting}>HR Admin Dashboard</h2>
            <p style={styles.sub}>Welcome, {user?.name} — Manage jobs and rank candidates.</p>
          </div>
        </div>

        {/* Stats */}
        <div style={styles.stats}>
          <StatCard icon="💼" label="Active Jobs" value={jobs.length} color="#667eea" />
          <StatCard icon="👥" label="Total Candidates" value="—" color="#10b981" />
          <StatCard icon="📊" label="Avg Match Score" value="—" color="#f59e0b" />
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          {[
            { key: 'overview', label: '📋 Jobs Overview' },
            { key: 'post', label: '➕ Post Job' },
            { key: 'rank', label: '🏆 Rank Candidates' },
          ].map(t => (
            <button
              key={t.key}
              style={{ ...styles.tab, ...(activeTab === t.key ? styles.activeTab : {}) }}
              onClick={() => setActiveTab(t.key)}
            >{t.label}</button>
          ))}
        </div>

        <div style={styles.content}>
          {activeTab === 'overview' && (
            <div>
              <h3 style={styles.sectionTitle}>Active Job Postings ({jobs.length})</h3>
              {jobs.length === 0 ? (
                <div style={styles.empty}>
                  <p>No jobs posted yet.</p>
                  <button style={styles.btn} onClick={() => setActiveTab('post')}>Post First Job</button>
                </div>
              ) : (
                <div style={styles.jobGrid}>
                  {jobs.map(job => (
                    <div key={job.id} style={styles.jobCard}>
                      <div style={styles.jobHeader}>
                        <h4 style={styles.jobTitle}>{job.title}</h4>
                        <span style={styles.badge}>Active</span>
                      </div>
                      <p style={styles.jobDesc}>{job.description.substring(0, 120)}...</p>
                      <div style={styles.skillTags}>
                        {job.required_skills.slice(0, 5).map(s => (
                          <span key={s} style={styles.skillTag}>{s}</span>
                        ))}
                        {job.required_skills.length > 5 && (
                          <span style={styles.skillTag}>+{job.required_skills.length - 5}</span>
                        )}
                      </div>
                      <button
                        style={styles.btnSmall}
                        onClick={() => { setSelectedJob(job.id); setActiveTab('rank'); }}
                      >View Candidates →</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'post' && (
            <JobUpload onPosted={() => { fetchJobs(); setActiveTab('overview'); }} />
          )}

          {activeTab === 'rank' && (
            <div>
              <div style={styles.filterRow}>
                <div style={styles.filterGroup}>
                  <label style={styles.label}>Select Job</label>
                  <select style={styles.select} value={selectedJob} onChange={e => setSelectedJob(e.target.value)}>
                    <option value="">-- Choose a job --</option>
                    {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                  </select>
                </div>
                <div style={styles.filterGroup}>
                  <label style={styles.label}>Min Score: {minScore}%</label>
                  <input
                    type="range" min="0" max="100" value={minScore}
                    onChange={e => setMinScore(Number(e.target.value))}
                    style={{ width: '100%', marginTop: '8px' }}
                  />
                </div>
              </div>
              {selectedJob ? (
                <CandidateRanking jobId={selectedJob} minScore={minScore} />
              ) : (
                <div style={styles.empty}><p>Select a job to see ranked candidates.</p></div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div style={styles.statCard}>
      <span style={styles.statIcon}>{icon}</span>
      <span style={{ ...styles.statValue, color }}>{value}</span>
      <span style={styles.statLabel}>{label}</span>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#f8fafc' },
  container: { maxWidth: '1000px', margin: '0 auto', padding: '24px 20px' },
  header: { marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { margin: 0, fontSize: '24px', fontWeight: '700', color: '#1e293b' },
  sub: { margin: '4px 0 0', color: '#64748b' },
  stats: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' },
  statCard: {
    background: '#fff', borderRadius: '12px', padding: '20px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  statIcon: { fontSize: '28px' },
  statValue: { fontSize: '24px', fontWeight: '700' },
  statLabel: { fontSize: '13px', color: '#64748b' },
  tabs: { display: 'flex', gap: '8px', marginBottom: '20px' },
  tab: {
    padding: '10px 20px', borderRadius: '8px', border: '1.5px solid #e2e8f0',
    background: '#fff', cursor: 'pointer', fontWeight: '500', fontSize: '14px',
    color: '#64748b', transition: 'all 0.2s',
  },
  activeTab: { background: '#667eea', color: '#fff', borderColor: '#667eea' },
  content: { background: '#fff', borderRadius: '12px', padding: '28px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  sectionTitle: { margin: '0 0 20px', fontSize: '18px', fontWeight: '600', color: '#1e293b' },
  jobGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' },
  jobCard: { border: '1.5px solid #e2e8f0', borderRadius: '10px', padding: '18px' },
  jobHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  jobTitle: { margin: 0, fontSize: '15px', fontWeight: '600', color: '#1e293b' },
  badge: { background: '#dcfce7', color: '#16a34a', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
  jobDesc: { color: '#64748b', fontSize: '13px', marginBottom: '12px' },
  skillTags: { display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' },
  skillTag: { background: '#f1f5f9', color: '#475569', padding: '3px 10px', borderRadius: '20px', fontSize: '12px' },
  btnSmall: {
    padding: '8px 16px', background: '#667eea', color: '#fff',
    border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', fontWeight: '500',
  },
  filterRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: '4px' },
  label: { fontSize: '14px', fontWeight: '500', color: '#374151' },
  select: { padding: '11px 14px', borderRadius: '8px', border: '1.5px solid #e5e7eb', fontSize: '14px' },
  btn: {
    padding: '12px 24px', background: 'linear-gradient(135deg, #667eea, #764ba2)',
    color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', fontWeight: '600',
  },
  empty: { textAlign: 'center', padding: '40px', color: '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' },
};
