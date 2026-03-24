// src/components/Candidate/MyOffers.js
// Candidate's private Offer inbox — shows offer letters and rejection emails from HR.
// Candidate can Accept or Decline any open offer.

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../context/AuthContext';

// ─── Status config ────────────────────────────────────────────────────────────
const OFFER_TYPE = {
    offer: { icon: '🎉', label: 'Offer Letter', bg: '#f0fdf4', border: '#86efac', color: '#16a34a' },
    rejection: { icon: '📩', label: 'Application Update', bg: '#fef9c3', border: '#fde047', color: '#854d0e' },
};

const RESPONSE_CONFIG = {
    accepted: { label: '✅ Accepted', bg: '#dcfce7', color: '#166534', border: '#86efac' },
    declined: { label: '❌ Declined', bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
};

export default function MyOffers() {
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [responding, setResponding] = useState(null);   // offer id being responded to

    const fetchOffers = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/offers/my');
            setOffers(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch offers:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchOffers(); }, [fetchOffers]);

    const respond = async (offerId, response) => {
        setResponding(offerId);
        try {
            await api.put(`/offers/${offerId}/respond`, { response });
            // Update local state immediately
            setOffers(prev => prev.map(o =>
                o.id === offerId ? { ...o, response, responded_at: new Date().toISOString() } : o
            ));
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to respond. Please try again.');
        } finally {
            setResponding(null);
        }
    };

    if (loading) return (
        <div style={s.center}>⏳ Loading your offers...</div>
    );

    if (offers.length === 0) return (
        <div style={s.empty}>
            <div style={s.emptyIcon}>📭</div>
            <h3 style={s.emptyTitle}>No Offers Yet</h3>
            <p style={s.emptyText}>
                When HR sends you an offer or update, it will appear here.<br />
                Apply to jobs from the <b>Browse Jobs</b> tab to get started!
            </p>
        </div>
    );

    const offerCount = offers.filter(o => o.offer_type === 'offer').length;
    const rejectionCount = offers.filter(o => o.offer_type === 'rejection').length;
    const pendingCount = offers.filter(o => o.offer_type === 'offer' && !o.response).length;

    return (
        <div style={s.wrap}>
            {/* Summary bar */}
            <div style={s.summaryBar}>
                <div style={s.summaryCard}>
                    <span style={{ fontSize: '22px' }}>🎉</span>
                    <div>
                        <div style={s.summaryNum}>{offerCount}</div>
                        <div style={s.summaryLabel}>Offer Letter{offerCount !== 1 ? 's' : ''}</div>
                    </div>
                </div>
                <div style={s.summaryCard}>
                    <span style={{ fontSize: '22px' }}>⏳</span>
                    <div>
                        <div style={{ ...s.summaryNum, color: '#d97706' }}>{pendingCount}</div>
                        <div style={s.summaryLabel}>Awaiting Response</div>
                    </div>
                </div>
                <div style={s.summaryCard}>
                    <span style={{ fontSize: '22px' }}>📩</span>
                    <div>
                        <div style={{ ...s.summaryNum, color: '#64748b' }}>{rejectionCount}</div>
                        <div style={s.summaryLabel}>Other Updates</div>
                    </div>
                </div>
            </div>

            {/* Offer cards */}
            <div style={s.list}>
                {offers.map(offer => {
                    const cfg = OFFER_TYPE[offer.offer_type] || OFFER_TYPE.offer;
                    const resCfg = offer.response ? RESPONSE_CONFIG[offer.response] : null;
                    const isOffer = offer.offer_type === 'offer';
                    const pending = isOffer && !offer.response;

                    return (
                        <div key={offer.id} style={{ ...s.card, borderColor: cfg.border, background: pending ? '#fff' : '#fafafa' }}>
                            {/* Card top strip */}
                            <div style={{ ...s.strip, background: cfg.bg }}>
                                <div style={s.stripLeft}>
                                    <span style={s.cardIcon}>{cfg.icon}</span>
                                    <div>
                                        <div style={{ ...s.cardType, color: cfg.color }}>{cfg.label}</div>
                                        <div style={s.cardJob}>
                                            {offer.job_title ? `For: ${offer.job_title}` : 'General Update'}
                                        </div>
                                    </div>
                                </div>
                                <div style={s.stripRight}>
                                    {offer.match_score > 0 && (
                                        <div style={s.scoreBadge}>
                                            🎯 {offer.match_score}% match
                                        </div>
                                    )}
                                    <div style={s.dateText}>
                                        {offer.sent_at
                                            ? new Date(offer.sent_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                            : 'Recently'}
                                    </div>
                                </div>
                            </div>

                            {/* Message */}
                            {offer.message && (
                                <div style={s.messageBox}>
                                    <div style={s.messageLabel}>📋 Message from HR:</div>
                                    <p style={s.messageText}>"{offer.message}"</p>
                                </div>
                            )}

                            {/* Default message if none */}
                            {!offer.message && isOffer && (
                                <div style={s.messageBox}>
                                    <p style={s.messageText}>
                                        🎊 Congratulations! We are pleased to extend you an offer for the position of <b>{offer.job_title}</b>.
                                        Please respond to confirm your interest.
                                    </p>
                                </div>
                            )}

                            {/* Response section */}
                            <div style={s.footer}>
                                {resCfg ? (
                                    <div style={s.responseFooter}>
                                        <div style={{ ...s.responseBadge, background: resCfg.bg, color: resCfg.color, borderColor: resCfg.border }}>
                                            {resCfg.label}
                                        </div>
                                        {offer.responded_at && (
                                            <span style={s.respondedDate}>
                                                on {new Date(offer.responded_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </span>
                                        )}
                                    </div>
                                ) : isOffer ? (
                                    <div style={s.actionRow}>
                                        <span style={s.actionHint}>Please respond to this offer:</span>
                                        <button
                                            style={{ ...s.acceptBtn, opacity: responding === offer.id ? 0.6 : 1 }}
                                            disabled={responding === offer.id}
                                            onClick={() => respond(offer.id, 'accepted')}
                                        >
                                            {responding === offer.id ? '⏳...' : '✅ Accept Offer'}
                                        </button>
                                        <button
                                            style={{ ...s.declineBtn, opacity: responding === offer.id ? 0.6 : 1 }}
                                            disabled={responding === offer.id}
                                            onClick={() => respond(offer.id, 'declined')}
                                        >
                                            ❌ Decline
                                        </button>
                                    </div>
                                ) : (
                                    <div style={s.thankNote}>
                                        Thank you for applying. We wish you the best in your search.
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = {
    wrap: { display: 'flex', flexDirection: 'column', gap: '20px' },
    center: { textAlign: 'center', padding: '40px', color: '#64748b' },
    // Summary bar
    summaryBar: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' },
    summaryCard: { background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' },
    summaryNum: { fontSize: '22px', fontWeight: '800', color: '#1e293b', lineHeight: 1 },
    summaryLabel: { fontSize: '12px', color: '#64748b', marginTop: '2px' },
    // List
    list: { display: 'flex', flexDirection: 'column', gap: '16px' },
    card: { border: '1.5px solid', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.06)' },
    // Card strip
    strip: { padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' },
    stripLeft: { display: 'flex', alignItems: 'center', gap: '14px' },
    cardIcon: { fontSize: '32px', lineHeight: 1 },
    cardType: { fontSize: '15px', fontWeight: '700', marginBottom: '2px' },
    cardJob: { fontSize: '13px', color: '#475569', fontWeight: '500' },
    stripRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' },
    scoreBadge: { fontSize: '12px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px', background: '#ede9fe', color: '#7c3aed' },
    dateText: { fontSize: '12px', color: '#94a3b8' },
    // Message
    messageBox: { padding: '14px 20px', borderTop: '1px solid #f1f5f9' },
    messageLabel: { fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '6px' },
    messageText: { margin: 0, fontSize: '14px', color: '#475569', lineHeight: '1.7', fontStyle: 'italic' },
    // Footer
    footer: { padding: '14px 20px', borderTop: '1px solid #f1f5f9', background: '#fafafa' },
    responseFooter: { display: 'flex', alignItems: 'center', gap: '10px' },
    responseBadge: { padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '700', border: '1.5px solid' },
    respondedDate: { fontSize: '12px', color: '#94a3b8' },
    actionRow: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' },
    actionHint: { fontSize: '13px', color: '#374151', fontWeight: '500', flex: 1 },
    acceptBtn: { padding: '10px 22px', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', borderRadius: '9px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', transition: 'opacity .2s' },
    declineBtn: { padding: '10px 18px', background: '#fef2f2', border: '1.5px solid #fca5a5', color: '#dc2626', borderRadius: '9px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    thankNote: { fontSize: '13px', color: '#64748b', fontStyle: 'italic' },
    // Empty
    empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', gap: '12px', textAlign: 'center' },
    emptyIcon: { fontSize: '60px' },
    emptyTitle: { margin: 0, fontSize: '20px', fontWeight: '700', color: '#1e293b' },
    emptyText: { margin: 0, fontSize: '14px', color: '#64748b', lineHeight: '1.7' },
};
