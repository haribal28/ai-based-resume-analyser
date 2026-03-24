// src/components/Chat/ChatWidget.js
// LinkedIn-style floating chat widget — bottom LEFT corner
// Candidates can message HR for referrals; HR can reply from same widget

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api, useAuth } from '../../context/AuthContext';

function timeAgo(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const s = Math.floor((Date.now() - d) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function initials(name = '') {
    return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || '?';
}

const REFERRAL_SUBJECTS = [
    'Referral Request',
    'Job Application Query',
    'Interview Feedback',
    'Resume Review Request',
    'Salary Enquiry',
    'General Query',
];

// ─── New Conversation Form ────────────────────────────────────────────────────
function NewConvoForm({ onCreated, onCancel }) {
    const [subject, setSubject] = useState('Referral Request');
    const [firstMsg, setFirstMsg] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleStart = async (e) => {
        e.preventDefault();
        if (!firstMsg.trim()) return;
        setLoading(true); setError('');
        try {
            const { data: cd } = await api.post('/chat/conversations', { subject });
            const convoId = cd.conversation.id;
            // Send the opening message
            const { data: md } = await api.post(`/chat/conversations/${convoId}/messages`, { text: firstMsg.trim() });
            onCreated(cd.conversation, md.message);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to start conversation.');
        } finally { setLoading(false); }
    };

    return (
        <div style={s.newConvoForm}>
            <div style={s.newConvoTitle}>💬 Message HR</div>
            <p style={s.newConvoSub}>Send a message to HR for referrals, queries or feedback.</p>

            <div style={s.field}>
                <label style={s.label}>Topic</label>
                <select style={s.select} value={subject} onChange={e => setSubject(e.target.value)}>
                    {REFERRAL_SUBJECTS.map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                    ))}
                </select>
            </div>

            <div style={s.field}>
                <label style={s.label}>Your message</label>
                <textarea
                    style={s.textarea}
                    rows={4}
                    placeholder="Hi! I'd like to request a referral for the Frontend Engineer role. I have 3 years of React experience..."
                    value={firstMsg}
                    onChange={e => setFirstMsg(e.target.value)}
                    maxLength={2000}
                    autoFocus
                />
            </div>

            {error && <div style={s.errorBox}>{error}</div>}

            <div style={s.formActions}>
                <button style={s.cancelBtn} type="button" onClick={onCancel}>Cancel</button>
                <button
                    style={{ ...s.sendInitBtn, opacity: (!firstMsg.trim() || loading) ? 0.6 : 1 }}
                    onClick={handleStart}
                    disabled={!firstMsg.trim() || loading}
                >
                    {loading ? 'Sending...' : '🚀 Send Message'}
                </button>
            </div>
        </div>
    );
}

// ─── Message Thread ───────────────────────────────────────────────────────────
function MessageThread({ conversation, onBack, currentUser }) {
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const bottomRef = useRef(null);
    const pollRef = useRef(null);

    const loadMessages = useCallback(async () => {
        try {
            const { data } = await api.get(`/chat/conversations/${conversation.id}/messages`);
            setMessages(data.messages || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, [conversation.id]);

    useEffect(() => {
        loadMessages();
        // Poll every 4 seconds for new messages
        pollRef.current = setInterval(loadMessages, 4000);
        return () => clearInterval(pollRef.current);
    }, [loadMessages]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!text.trim() || sending) return;
        setSending(true);
        try {
            const { data } = await api.post(`/chat/conversations/${conversation.id}/messages`, { text: text.trim() });
            setMessages(prev => [...prev, data.message]);
            setText('');
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to send.');
        } finally { setSending(false); }
    };

    return (
        <div style={s.thread}>
            {/* Thread header */}
            <div style={s.threadHeader}>
                <button style={s.backBtn} onClick={onBack}>←</button>
                <div style={s.threadInfo}>
                    <div style={s.threadName}>
                        {currentUser?.role === 'admin' ? conversation.candidate_name : conversation.admin_name}
                    </div>
                    <div style={s.threadSubject}>{conversation.subject}</div>
                </div>
                <span style={s.onlineDot} title="Active" />
            </div>

            {/* Messages */}
            <div style={s.messageList}>
                {loading ? (
                    <div style={s.loadingMsg}>Loading messages...</div>
                ) : messages.length === 0 ? (
                    <div style={s.emptyMsg}>No messages yet. Say hello! 👋</div>
                ) : (
                    messages.map(m => {
                        const mine = m.sender_role === currentUser?.role;
                        return (
                            <div key={m.id} style={{ ...s.msgRow, justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                                {!mine && (
                                    <div style={s.msgAvatar}>{initials(m.sender_name)}</div>
                                )}
                                <div style={{ maxWidth: '72%' }}>
                                    {!mine && <div style={s.msgSenderName}>{m.sender_name}</div>}
                                    <div style={{ ...s.msgBubble, ...(mine ? s.myBubble : s.theirBubble) }}>
                                        {m.text}
                                    </div>
                                    <div style={{ ...s.msgTime, textAlign: mine ? 'right' : 'left' }}>
                                        {timeAgo(m.created_at)}
                                    </div>
                                </div>
                                {mine && (
                                    <div style={{ ...s.msgAvatar, background: 'linear-gradient(135deg,#667eea,#764ba2)' }}>
                                        {initials(m.sender_name)}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} style={s.inputRow}>
                <input
                    style={s.msgInput}
                    placeholder="Type a message..."
                    value={text}
                    onChange={e => setText(e.target.value)}
                    maxLength={2000}
                    autoFocus
                />
                <button
                    type="submit"
                    style={{ ...s.sendBtn, opacity: (!text.trim() || sending) ? 0.5 : 1 }}
                    disabled={!text.trim() || sending}
                >
                    {sending ? '...' : '➤'}
                </button>
            </form>
        </div>
    );
}

// ─── Conversation List ────────────────────────────────────────────────────────
function ConvoList({ conversations, onSelect, currentUser }) {
    if (conversations.length === 0) {
        return (
            <div style={s.emptyConvoList}>
                <div style={{ fontSize: '40px' }}>💬</div>
                <p style={{ color: '#64748b', fontSize: '13px', textAlign: 'center', margin: '8px 0 0' }}>
                    {currentUser?.role === 'admin'
                        ? 'No messages from candidates yet.'
                        : 'No conversations yet. Start one to message HR!'}
                </p>
            </div>
        );
    }
    return (
        <div style={s.convoList}>
            {conversations.map(c => (
                <button key={c.id} style={s.convoItem} onClick={() => onSelect(c)}>
                    <div style={s.convoAvatar}>
                        {initials(currentUser?.role === 'admin' ? c.candidate_name : c.admin_name)}
                    </div>
                    <div style={s.convoMeta}>
                        <div style={s.convoName}>
                            {currentUser?.role === 'admin' ? c.candidate_name : c.admin_name}
                        </div>
                        <div style={s.convoSubject}>{c.subject}</div>
                        <div style={s.convoPreview}>{c.last_message_preview || 'No messages yet'}</div>
                    </div>
                    <div style={s.convoRight}>
                        <div style={s.convoTime}>{timeAgo(c.last_message_at)}</div>
                        {c.unread > 0 && <span style={s.unreadBadge}>{c.unread}</span>}
                    </div>
                </button>
            ))}
        </div>
    );
}

// ─── Main ChatWidget ──────────────────────────────────────────────────────────
export default function ChatWidget() {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [view, setView] = useState('list');   // 'list' | 'thread' | 'new'
    const [convos, setConvos] = useState([]);
    const [activeConvo, setActiveConvo] = useState(null);
    const [unread, setUnread] = useState(0);
    const pollRef = useRef(null);

    const fetchConvos = useCallback(async () => {
        try {
            const { data } = await api.get('/chat/conversations');
            setConvos(data.conversations || []);
        } catch (err) { /* silent */ }
    }, []);

    const fetchUnread = useCallback(async () => {
        try {
            const { data } = await api.get('/chat/unread');
            setUnread(data.unread || 0);
        } catch (err) { /* silent */ }
    }, []);

    useEffect(() => {
        if (!user) return;
        fetchConvos();
        fetchUnread();
        pollRef.current = setInterval(() => {
            fetchConvos();
            fetchUnread();
        }, 8000);
        return () => clearInterval(pollRef.current);
    }, [user, fetchConvos, fetchUnread]);

    const handleOpenConvo = (c) => {
        setActiveConvo(c);
        setView('thread');
        // Optimistically clear unread for this conversation
        setConvos(prev => prev.map(x => x.id === c.id ? { ...x, unread: 0 } : x));
    };

    const handleNewConvoCreated = (convo, firstMsg) => {
        setConvos(prev => [{ ...convo, last_message_preview: firstMsg.text }, ...prev]);
        setActiveConvo({ ...convo, last_message_preview: firstMsg.text });
        setView('thread');
    };

    if (!user) return null;

    return (
        <>
            {/* Floating bubble */}
            <button style={s.bubble} onClick={() => setOpen(o => !o)} title="Messages">
                💬
                {unread > 0 && (
                    <span style={s.bubbleBadge}>{unread > 9 ? '9+' : unread}</span>
                )}
            </button>

            {/* Chat panel */}
            {open && (
                <div style={s.panel}>
                    {/* Panel header */}
                    <div style={s.panelHeader}>
                        <div style={s.panelTitle}>
                            💬 Messages
                            {unread > 0 && <span style={s.headerBadge}>{unread}</span>}
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            {view === 'list' && user?.role !== 'admin' && (
                                <button style={s.newBtn} onClick={() => setView('new')} title="New message">✏️</button>
                            )}
                            {view !== 'list' && (
                                <button style={s.newBtn} onClick={() => setView('list')}>☰</button>
                            )}
                            <button style={s.closeBtn} onClick={() => setOpen(false)}>✕</button>
                        </div>
                    </div>

                    {/* Content */}
                    {view === 'list' && (
                        <ConvoList
                            conversations={convos}
                            onSelect={handleOpenConvo}
                            currentUser={user}
                        />
                    )}

                    {view === 'new' && (
                        <NewConvoForm
                            onCreated={handleNewConvoCreated}
                            onCancel={() => setView('list')}
                        />
                    )}

                    {view === 'thread' && activeConvo && (
                        <MessageThread
                            conversation={activeConvo}
                            onBack={() => { setView('list'); fetchConvos(); }}
                            currentUser={user}
                        />
                    )}
                </div>
            )}
        </>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = {
    // Bubble
    bubble: { position: 'fixed', bottom: '28px', right: '28px', zIndex: 9999, width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', border: 'none', cursor: 'pointer', fontSize: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(102,126,234,.5)', transition: 'transform .2s', },
    bubbleBadge: { position: 'absolute', top: '-4px', right: '-4px', background: '#ef4444', color: '#fff', borderRadius: '50%', width: '20px', height: '20px', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff' },

    // Panel
    panel: { position: 'fixed', bottom: '96px', right: '28px', zIndex: 9998, width: '360px', height: '520px', background: '#fff', borderRadius: '16px', boxShadow: '0 8px 40px rgba(0,0,0,.18)', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid #e2e8f0' },
    panelHeader: { background: 'linear-gradient(135deg,#667eea,#764ba2)', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 },
    panelTitle: { color: '#fff', fontWeight: '700', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' },
    headerBadge: { background: '#ef4444', color: '#fff', borderRadius: '20px', padding: '1px 7px', fontSize: '11px', fontWeight: '700' },
    newBtn: { background: 'rgba(255,255,255,.2)', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', padding: '5px 8px', fontSize: '16px' },
    closeBtn: { background: 'rgba(255,255,255,.2)', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', padding: '5px 9px', fontSize: '14px', fontWeight: '700' },

    // Convo list
    convoList: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' },
    emptyConvoList: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' },
    convoItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 16px', border: 'none', borderBottom: '1px solid #f1f5f9', background: '#fff', cursor: 'pointer', textAlign: 'left', transition: 'background .15s', },
    convoAvatar: { width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '13px', flexShrink: 0 },
    convoMeta: { flex: 1, minWidth: 0 },
    convoName: { fontSize: '14px', fontWeight: '700', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    convoSubject: { fontSize: '11px', color: '#667eea', fontWeight: '600', marginBottom: '2px' },
    convoPreview: { fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    convoRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 },
    convoTime: { fontSize: '11px', color: '#94a3b8' },
    unreadBadge: { background: '#667eea', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center' },

    // New convo form
    newConvoForm: { flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' },
    newConvoTitle: { fontSize: '15px', fontWeight: '700', color: '#1e293b' },
    newConvoSub: { fontSize: '12px', color: '#64748b', margin: 0 },
    field: { display: 'flex', flexDirection: 'column', gap: '5px' },
    label: { fontSize: '12px', fontWeight: '600', color: '#374151' },
    select: { padding: '9px 12px', borderRadius: '9px', border: '1.5px solid #e2e8f0', fontSize: '13px', background: '#fff', cursor: 'pointer', outline: 'none' },
    textarea: { padding: '10px 12px', borderRadius: '9px', border: '1.5px solid #e2e8f0', fontSize: '13px', resize: 'vertical', outline: 'none', fontFamily: 'inherit', lineHeight: '1.5' },
    errorBox: { padding: '8px 12px', background: '#fef2f2', color: '#dc2626', borderRadius: '8px', fontSize: '12px' },
    formActions: { display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: 'auto' },
    cancelBtn: { padding: '9px 14px', border: '1.5px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc', color: '#64748b', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
    sendInitBtn: { padding: '9px 16px', background: 'linear-gradient(135deg,#667eea,#764ba2)', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: '700' },

    // Thread
    thread: { display: 'flex', flexDirection: 'column', height: '100%' },
    threadHeader: { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderBottom: '1px solid #f1f5f9', flexShrink: 0, background: '#fafafa' },
    backBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#667eea', fontWeight: '700', padding: '2px 6px' },
    threadInfo: { flex: 1, minWidth: 0 },
    threadName: { fontSize: '14px', fontWeight: '700', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    threadSubject: { fontSize: '11px', color: '#667eea', fontWeight: '600' },
    onlineDot: { width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', flexShrink: 0 },
    messageList: { flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px' },
    loadingMsg: { textAlign: 'center', color: '#94a3b8', fontSize: '13px', padding: '20px' },
    emptyMsg: { textAlign: 'center', color: '#94a3b8', fontSize: '13px', padding: '20px' },
    msgRow: { display: 'flex', alignItems: 'flex-end', gap: '8px' },
    msgAvatar: { width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '10px', flexShrink: 0 },
    msgSenderName: { fontSize: '11px', color: '#64748b', marginBottom: '3px', fontWeight: '600' },
    msgBubble: { padding: '9px 13px', borderRadius: '14px', fontSize: '13px', lineHeight: '1.5', wordBreak: 'break-word' },
    myBubble: { background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', borderBottomRightRadius: '4px' },
    theirBubble: { background: '#f1f5f9', color: '#1e293b', borderBottomLeftRadius: '4px' },
    msgTime: { fontSize: '10px', color: '#94a3b8', marginTop: '3px' },
    inputRow: { display: 'flex', gap: '8px', padding: '10px 12px', borderTop: '1px solid #f1f5f9', flexShrink: 0 },
    msgInput: { flex: 1, padding: '10px 14px', borderRadius: '20px', border: '1.5px solid #e2e8f0', fontSize: '13px', outline: 'none' },
    sendBtn: { width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
};
