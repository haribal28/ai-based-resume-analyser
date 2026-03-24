// src/components/Candidate/MatchScore.js
// Enhanced score display with breakdown bars (Naukri/Indeed style)
import React from 'react';

export default function MatchScore({ result }) {
    const score = result?.match_score ?? 0;
    const color = score >= 70 ? '#16a34a' : score >= 40 ? '#d97706' : '#dc2626';
    const bg = score >= 70 ? '#f0fdf4' : score >= 40 ? '#fffbeb' : '#fef2f2';
    const label = score >= 70 ? '🟢 Strong Match' : score >= 40 ? '🟡 Moderate Match' : '🔴 Weak Match';

    const sa = result?.skills_analysis || {};
    const breakdown = sa.score_breakdown || null;

    return (
        <div style={s.wrap}>
            <h3 style={s.title}>Match Score Results</h3>
            {result.job_title && (
                <p style={s.jobTitle}>Job: <b>{result.job_title}</b></p>
            )}

            {/* ── Score Circle ── */}
            <div style={{ ...s.scoreBadge, background: bg }}>
                <span style={{ ...s.scoreNum, color }}>{score}%</span>
                <span style={{ ...s.scoreLabel, color }}>{label}</span>

                {/* Progress bar */}
                <div style={s.barTrack}>
                    <div style={{ ...s.barFill, width: `${score}%`, background: color }} />
                </div>
            </div>

            {/* ── Score Breakdown (if available) ── */}
            {breakdown && (
                <div style={s.breakdownBox}>
                    <div style={s.breakdownTitle}>📊 Score Breakdown</div>
                    <div style={s.breakdownGrid}>
                        <BreakdownRow label="🎯 Keyword Match (50%)" value={breakdown.keyword_match} max={50} color="#7c3aed" />
                        <BreakdownRow label="🔍 Skill Coverage (25%)" value={breakdown.skill_coverage} max={25} color="#2563eb" />
                        <BreakdownRow label="🧠 Semantic Match (15%)" value={breakdown.semantic_score} max={15} color="#0891b2" />
                        <BreakdownRow label="🎓 Experience Bonus (10%)" value={breakdown.experience_bonus} max={10} color="#d97706" />
                    </div>

                    {/* HR Keywords badge */}
                    {sa.hr_keywords_used && (
                        <div style={s.hrBadge}>
                            ✅ Scored using <b>HR-provided keywords</b> — highest accuracy
                        </div>
                    )}
                    {!sa.hr_keywords_used && (
                        <div style={s.hintBadge}>
                            💡 <b>Tip:</b> Ask HR to add keywords to this job for more accurate scoring.
                        </div>
                    )}
                </div>
            )}

            {/* ── Skills Grid ── */}
            <div style={s.grid}>
                <SkillSection
                    title="✅ Matching Skills"
                    skills={sa.matching_skills}
                    color="#16a34a"
                    bg="#f0fdf4"
                />
                <SkillSection
                    title="❌ Missing Skills"
                    skills={sa.missing_skills}
                    color="#dc2626"
                    bg="#fef2f2"
                />
            </div>

            {/* ── All Resume Skills ── */}
            {(sa.resume_skills || []).length > 0 && (
                <SkillSection
                    title={`📄 All Resume Skills (${sa.resume_skills.length} detected)`}
                    skills={sa.resume_skills}
                    color="#475569"
                    bg="#f1f5f9"
                />
            )}

            {/* ── Improvement Tips ── */}
            {(sa.missing_skills || []).length > 0 && (
                <div style={s.tipBox}>
                    <div style={s.tipTitle}>💡 Improve Your Score</div>
                    <p style={s.tipText}>
                        Add these <b>{sa.missing_skills.length}</b> missing skill(s) to your resume to increase your match score:
                    </p>
                    <div style={s.tipSkills}>
                        {(sa.missing_skills || []).slice(0, 10).map(sk => (
                            <span key={sk} style={s.tipChip}>{sk}</span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Breakdown row with animated bar ──────────────────────────────────────────
function BreakdownRow({ label, value, max, color }) {
    const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
    return (
        <div style={bd.row}>
            <div style={bd.label}>{label}</div>
            <div style={bd.right}>
                <div style={bd.track}>
                    <div style={{ ...bd.fill, width: `${pct}%`, background: color }} />
                </div>
                <span style={{ ...bd.val, color }}>{value.toFixed(1)}</span>
            </div>
        </div>
    );
}

// ── Skill section ─────────────────────────────────────────────────────────────
function SkillSection({ title, skills, color, bg }) {
    if (!skills || skills.length === 0) return (
        <div style={{ ...s.section, background: bg }}>
            <div style={{ ...s.sectionTitle, color }}>{title}</div>
            <p style={s.none}>None detected</p>
        </div>
    );
    return (
        <div style={{ ...s.section, background: bg }}>
            <div style={{ ...s.sectionTitle, color }}>{title} ({skills.length})</div>
            <div style={s.tags}>
                {skills.map(sk => (
                    <span key={sk} style={{ ...s.tag, color, borderColor: color + '44' }}>{sk}</span>
                ))}
            </div>
        </div>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = {
    wrap: { display: 'flex', flexDirection: 'column', gap: '20px' },
    title: { margin: 0, fontSize: '18px', fontWeight: '700', color: '#1e293b' },
    jobTitle: { margin: 0, color: '#64748b', fontSize: '14px' },
    scoreBadge: {
        borderRadius: '14px', padding: '28px 20px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
    },
    scoreNum: { fontSize: '64px', fontWeight: '800', lineHeight: 1 },
    scoreLabel: { fontSize: '16px', fontWeight: '600' },
    barTrack: { width: '100%', maxWidth: '320px', height: '8px', background: '#e5e7eb', borderRadius: '99px', overflow: 'hidden', marginTop: '8px' },
    barFill: { height: '100%', borderRadius: '99px', transition: 'width 0.6s ease' },
    // Score breakdown
    breakdownBox: { border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' },
    breakdownTitle: { fontSize: '15px', fontWeight: '700', color: '#1e293b' },
    breakdownGrid: { display: 'flex', flexDirection: 'column', gap: '10px' },
    hrBadge: { padding: '10px 14px', background: '#f0fdf4', borderRadius: '8px', fontSize: '13px', color: '#15803d', border: '1px solid #bbf7d0' },
    hintBadge: { padding: '10px 14px', background: '#fffbeb', borderRadius: '8px', fontSize: '13px', color: '#92400e', border: '1px solid #fde68a' },
    // Skills
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
    section: { borderRadius: '10px', padding: '16px' },
    sectionTitle: { fontWeight: '700', fontSize: '14px', marginBottom: '10px' },
    tags: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
    tag: { fontSize: '12px', padding: '4px 10px', borderRadius: '20px', border: '1px solid', background: '#fff', fontWeight: '500' },
    none: { color: '#94a3b8', fontSize: '13px', margin: 0 },
    // Tips
    tipBox: { background: '#faf5ff', border: '1.5px solid #a78bfa', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' },
    tipTitle: { fontSize: '14px', fontWeight: '700', color: '#7c3aed' },
    tipText: { margin: 0, fontSize: '13px', color: '#4c1d95', lineHeight: '1.5' },
    tipSkills: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
    tipChip: { fontSize: '12px', padding: '4px 10px', borderRadius: '20px', background: '#ede9fe', color: '#7c3aed', fontWeight: '600', border: '1px solid #c4b5fd' },
};

const bd = {
    row: { display: 'flex', flexDirection: 'column', gap: '4px' },
    label: { fontSize: '13px', color: '#374151', fontWeight: '500' },
    right: { display: 'flex', alignItems: 'center', gap: '10px' },
    track: { flex: 1, height: '8px', background: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' },
    fill: { height: '100%', borderRadius: '99px', transition: 'width 0.5s ease' },
    val: { fontSize: '13px', fontWeight: '700', minWidth: '32px', textAlign: 'right' },
};
