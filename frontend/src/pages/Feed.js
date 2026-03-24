// src/pages/Feed.js
// LinkedIn-style Technology Feed
// HR posts tech updates, AI news, career tips — candidates like and comment

import React, { useState, useEffect, useCallback } from 'react';
import { api, useAuth } from '../context/AuthContext';

// ─── Category config ──────────────────────────────────────────────────────────
const CATEGORIES = [
    { key: '', label: '🌐 All', color: '#667eea', bg: '#ede9fe' },
    { key: 'Technology', label: '💻 Technology', color: '#2563eb', bg: '#dbeafe' },
    { key: 'AI & ML', label: '🤖 AI & ML', color: '#7c3aed', bg: '#ede9fe' },
    { key: 'Cloud', label: '☁️ Cloud', color: '#0891b2', bg: '#cffafe' },
    { key: 'Career Tips', label: '🚀 Career Tips', color: '#059669', bg: '#dcfce7' },
    { key: 'Industry News', label: '📰 Industry News', color: '#d97706', bg: '#fef3c7' },
    { key: 'General', label: '💡 General', color: '#475569', bg: '#f1f5f9' },
];

const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.key, c]));

function timeAgo(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const s = Math.floor((Date.now() - d) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function initials(name = '') {
    return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
}

// ─── Create / Edit Post Form ──────────────────────────────────────────────────
function CreatePostForm({ onPosted, editPost, onCancelEdit }) {
    const [content, setContent] = useState(editPost?.content || '');
    const [category, setCategory] = useState(editPost?.category || 'Technology');
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState(editPost?.tags || []);
    const [posting, setPosting] = useState(false);
    const [error, setError] = useState('');
    const isEdit = !!editPost;

    const addTag = () => {
        const t = tagInput.trim().replace(/^#/, '');
        if (t && !tags.includes(t) && tags.length < 8) {
            setTags(prev => [...prev, t]);
        }
        setTagInput('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim()) return;
        setPosting(true); setError('');
        try {
            if (isEdit) {
                const { data } = await api.put(`/feed/posts/${editPost.id}`, { content, category, tags });
                onPosted(data.post, true);
            } else {
                const { data } = await api.post('/feed/posts', { content, category, tags });
                onPosted(data.post, false);
            }
            if (!isEdit) { setContent(''); setTags([]); }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to post.');
        } finally { setPosting(false); }
    };

    return (
        <div style={f.createBox}>
            <div style={f.createHeader}>
                <div style={f.createAvatar}>HR</div>
                <p style={f.createPlaceholderLabel}>
                    {isEdit ? '✏️ Edit your post' : '📢 Share a tech update with candidates...'}
                </p>
            </div>

            <form onSubmit={handleSubmit} style={f.createForm}>
                <textarea
                    style={f.createTextarea}
                    rows={4}
                    placeholder="Share something valuable — new technology, AI trends, career tips, industry news..."
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    maxLength={3000}
                />
                <div style={f.charCount}>{content.length} / 3000</div>

                <div style={f.createMeta}>
                    {/* Category */}
                    <select style={f.catSelect} value={category} onChange={e => setCategory(e.target.value)}>
                        {CATEGORIES.filter(c => c.key).map(c => (
                            <option key={c.key} value={c.key}>{c.label}</option>
                        ))}
                    </select>

                    {/* Tag input */}
                    <div style={f.tagInputWrap}>
                        <input style={f.tagInput}
                            placeholder="Add tag (e.g. React)"
                            value={tagInput}
                            onChange={e => setTagInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                        />
                        <button type="button" style={f.tagAddBtn} onClick={addTag}>+ Add</button>
                    </div>
                </div>

                {/* Tags preview */}
                {tags.length > 0 && (
                    <div style={f.tagRow}>
                        {tags.map(t => (
                            <span key={t} style={f.tagChip}>
                                #{t}
                                <button style={f.tagX} onClick={() => setTags(prev => prev.filter(x => x !== t))}>×</button>
                            </span>
                        ))}
                    </div>
                )}

                {error && <div style={f.error}>{error}</div>}

                <div style={f.createActions}>
                    {isEdit && (
                        <button type="button" style={f.cancelEdit} onClick={onCancelEdit}>Cancel</button>
                    )}
                    <button type="submit" style={{ ...f.postBtn, opacity: (!content.trim() || posting) ? 0.6 : 1 }}
                        disabled={!content.trim() || posting}>
                        {posting ? '⏳ Posting...' : isEdit ? '💾 Save Changes' : '🚀 Publish Post'}
                    </button>
                </div>
            </form>
        </div>
    );
}

// ─── Comment Box ──────────────────────────────────────────────────────────────
function CommentBox({ postId, userName, onCommentAdded }) {
    const [text, setText] = useState('');
    const [posting, setPosting] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        if (!text.trim()) return;
        setPosting(true);
        try {
            const { data } = await api.post(`/feed/posts/${postId}/comment`, { text: text.trim() });
            onCommentAdded(data.comment);
            setText('');
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to comment.');
        } finally { setPosting(false); }
    };

    return (
        <form onSubmit={submit} style={f.commentForm}>
            <div style={f.commentAvatar}>{initials(userName)}</div>
            <input style={f.commentInput}
                placeholder="Write a comment..."
                value={text}
                onChange={e => setText(e.target.value)}
                maxLength={500}
            />
            <button type="submit" style={{ ...f.commentBtn, opacity: (!text.trim() || posting) ? 0.5 : 1 }}
                disabled={!text.trim() || posting}>
                {posting ? '...' : '↑'}
            </button>
        </form>
    );
}

// ─── Single Post Card ─────────────────────────────────────────────────────────
function PostCard({ post, user, onLike, onComment, onDelete, onEdit }) {
    const [showComments, setShowComments] = useState(false);
    const [showAll, setShowAll] = useState(false);
    const MAX_LEN = 300;

    const cat = CAT_MAP[post.category] || CAT_MAP[''];
    const isShort = post.content.length <= MAX_LEN;
    const displayContent = isShort || showAll ? post.content : post.content.substring(0, MAX_LEN) + '...';

    return (
        <div style={f.postCard}>
            {/* Author row */}
            <div style={f.authorRow}>
                <div style={f.authorAvatar}>{initials(post.author_name)}</div>
                <div style={{ flex: 1 }}>
                    <div style={f.authorName}>{post.author_name}</div>
                    <div style={f.authorMeta}>
                        <span style={f.roleBadge}>
                            {post.author_role === 'admin' ? '🏢 HR' : '👤 Member'}
                        </span>
                        <span style={f.authorDot}>·</span>
                        <span style={f.timeAgo}>{timeAgo(post.created_at)}</span>
                    </div>
                </div>
                {/* Category pill */}
                <span style={{ ...f.catPill, background: cat.bg, color: cat.color }}>
                    {cat.label || post.category}
                </span>
                {/* Admin actions */}
                {user?.role === 'admin' && user?.name === post.author_name && (
                    <div style={f.postActions}>
                        <button style={f.iconBtn} title="Edit" onClick={() => onEdit(post)}>✏️</button>
                        <button style={f.iconBtn} title="Delete" onClick={() => onDelete(post.id)}>🗑️</button>
                    </div>
                )}
            </div>

            {/* Content */}
            <p style={f.content}>{displayContent}</p>
            {!isShort && (
                <button style={f.seeMore} onClick={() => setShowAll(x => !x)}>
                    {showAll ? 'See less ▲' : 'See more ▼'}
                </button>
            )}

            {/* Tags */}
            {(post.tags || []).length > 0 && (
                <div style={f.tagRow}>
                    {post.tags.map(t => (
                        <span key={t} style={f.tag}>#{t}</span>
                    ))}
                </div>
            )}

            {/* Stats row */}
            <div style={f.statsRow}>
                {post.like_count > 0 && (
                    <span style={f.statText}>
                        👍 {post.like_count} like{post.like_count !== 1 ? 's' : ''}
                    </span>
                )}
                {post.comment_count > 0 && (
                    <span style={{ ...f.statText, marginLeft: 'auto' }}>
                        💬 {post.comment_count} comment{post.comment_count !== 1 ? 's' : ''}
                    </span>
                )}
            </div>

            {/* Action buttons */}
            <div style={f.actionBar}>
                <button
                    style={{ ...f.actionBtn, ...(post.liked_by_me ? f.likedBtn : {}) }}
                    onClick={() => onLike(post.id)}
                >
                    {post.liked_by_me ? '👍 Liked' : '👍 Like'}
                </button>
                <button style={f.actionBtn} onClick={() => setShowComments(x => !x)}>
                    💬 Comment
                </button>
                <button style={f.actionBtn} onClick={() => {
                    const url = window.location.href;
                    navigator.clipboard?.writeText(url);
                    alert('Link copied!');
                }}>
                    🔗 Share
                </button>
            </div>

            {/* Comments section */}
            {showComments && (
                <div style={f.commentsSection}>
                    <CommentBox
                        postId={post.id}
                        userName={user?.name || 'You'}
                        onCommentAdded={(c) => onComment(post.id, c)}
                    />
                    {(post.comments || []).length > 0 && (
                        <div style={f.commentList}>
                            {[...post.comments].reverse().map(c => (
                                <div key={c.id} style={f.commentItem}>
                                    <div style={f.commentAvatar}>{initials(c.author_name)}</div>
                                    <div style={f.commentBody}>
                                        <div style={f.commentAuthor}>
                                            {c.author_name}
                                            <span style={f.commentRole}>
                                                {c.author_role === 'admin' ? ' · HR' : ''}
                                            </span>
                                        </div>
                                        <div style={f.commentText}>{c.text}</div>
                                        <div style={f.commentTime}>{timeAgo(c.created_at)}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Main Feed Page ───────────────────────────────────────────────────────────
export default function Feed() {
    const { user } = useAuth();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [catFilter, setCatFilter] = useState('');
    const [editPost, setEditPost] = useState(null);
    const isAdmin = user?.role === 'admin';

    const fetchPosts = useCallback(async (p = 1, cat = '') => {
        setLoading(true);
        try {
            const { data } = await api.get('/feed/posts', {
                params: { page: p, limit: 10, ...(cat ? { category: cat } : {}) }
            });
            const incoming = Array.isArray(data.posts) ? data.posts : [];
            if (p === 1) {
                setPosts(incoming);
            } else {
                setPosts(prev => [...prev, ...incoming]);
            }
            setTotalPages(data.pages || 1);
        } catch (err) {
            console.error('Feed fetch error:', err.response?.data || err.message);
        } finally { setLoading(false); }
    }, []);

    useEffect(() => {
        setPage(1);
        fetchPosts(1, catFilter);
    }, [catFilter, fetchPosts]);

    const handlePosted = (post, isEdit) => {
        if (isEdit) {
            setPosts(prev => prev.map(p => p.id === post.id ? post : p));
            setEditPost(null);
        } else {
            setPosts(prev => [post, ...prev]);
        }
    };

    const handleLike = async (postId) => {
        try {
            const { data } = await api.post(`/feed/posts/${postId}/like`);
            setPosts(prev => prev.map(p =>
                p.id === postId ? { ...p, like_count: data.like_count, liked_by_me: data.liked } : p
            ));
        } catch (err) { console.error(err); }
    };

    const handleComment = (postId, comment) => {
        setPosts(prev => prev.map(p =>
            p.id === postId
                ? { ...p, comments: [...p.comments, comment], comment_count: p.comment_count + 1 }
                : p
        ));
    };

    const handleDelete = async (postId) => {
        if (!window.confirm('Delete this post?')) return;
        try {
            await api.delete(`/feed/posts/${postId}`);
            setPosts(prev => prev.filter(p => p.id !== postId));
        } catch (err) { alert(err.response?.data?.error || 'Failed to delete.'); }
    };

    const loadMore = () => {
        const next = page + 1;
        setPage(next);
        fetchPosts(next, catFilter);
    };

    return (
        <div style={f.page}>
            {/* Header */}
            <div style={f.header}>
                <div>
                    <h2 style={f.title}>🌐 Tech Feed</h2>
                    <p style={f.subtitle}>Stay updated with the latest in technology, AI, cloud & careers</p>
                </div>
            </div>

            {/* Category filters */}
            <div style={f.catBar}>
                {CATEGORIES.map(c => (
                    <button key={c.key} style={{
                        ...f.catBtn,
                        ...(catFilter === c.key ? { background: c.color || '#667eea', color: '#fff', borderColor: c.color || '#667eea' } : {})
                    }} onClick={() => setCatFilter(c.key)}>
                        {c.label}
                    </button>
                ))}
            </div>

            <div style={f.layout}>
                {/* Main feed column */}
                <div style={f.feedCol}>
                    {/* Create post (admin only) */}
                    {isAdmin && (
                        <CreatePostForm
                            onPosted={handlePosted}
                            editPost={editPost}
                            onCancelEdit={() => setEditPost(null)}
                        />
                    )}

                    {/* Posts */}
                    {loading && posts.length === 0 ? (
                        <div style={f.loadingBox}>
                            <div style={f.spinner} />
                            <p>Loading feed...</p>
                        </div>
                    ) : posts.length === 0 ? (
                        <div style={f.emptyBox}>
                            <div style={{ fontSize: '56px' }}>📭</div>
                            <h3 style={{ margin: '10px 0 4px', color: '#1e293b' }}>No posts yet</h3>
                            <p style={{ color: '#64748b', margin: 0 }}>
                                {isAdmin
                                    ? 'Be the first to share a tech update with candidates!'
                                    : 'HR will share updates here soon. Check back later!'}
                            </p>
                        </div>
                    ) : (
                        <>
                            {posts.map(post => (
                                <PostCard
                                    key={post.id}
                                    post={post}
                                    user={user}
                                    onLike={handleLike}
                                    onComment={handleComment}
                                    onDelete={handleDelete}
                                    onEdit={setEditPost}
                                />
                            ))}
                            {page < totalPages && (
                                <button style={f.loadMoreBtn} onClick={loadMore} disabled={loading}>
                                    {loading ? '⏳ Loading...' : '⬇ Load More Posts'}
                                </button>
                            )}
                        </>
                    )}
                </div>

                {/* Sidebar */}
                <div style={f.sidebar}>
                    <div style={f.sideCard}>
                        <h4 style={f.sideTitle}>📂 Browse by Category</h4>
                        {CATEGORIES.filter(c => c.key).map(c => (
                            <button key={c.key} style={{
                                ...f.sideCatBtn,
                                borderLeft: catFilter === c.key ? `3px solid ${c.color}` : '3px solid transparent',
                                color: catFilter === c.key ? c.color : '#374151',
                                background: catFilter === c.key ? c.bg : 'transparent',
                            }} onClick={() => setCatFilter(catFilter === c.key ? '' : c.key)}>
                                {c.label}
                            </button>
                        ))}
                    </div>

                    <div style={f.sideCard}>
                        <h4 style={f.sideTitle}>💡 Popular Tags</h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {['React', 'Python', 'AI', 'AWS', 'Docker', 'ML', 'TypeScript', 'NodeJS', 'Kubernetes', 'LLM'].map(t => (
                                <span key={t} style={f.sideTag}>#{t}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const f = {
    // Page
    page: { display: 'flex', flexDirection: 'column', gap: '0', minHeight: '100vh', background: '#f1f5f9' },
    header: { background: 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)', padding: '28px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    title: { margin: 0, fontSize: '24px', fontWeight: '800', color: '#fff' },
    subtitle: { margin: '4px 0 0', color: 'rgba(255,255,255,.8)', fontSize: '14px' },
    catBar: { background: '#fff', padding: '12px 24px', display: 'flex', gap: '8px', overflowX: 'auto', borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap' },
    catBtn: { padding: '7px 14px', borderRadius: '20px', border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: '500', color: '#374151', whiteSpace: 'nowrap', transition: 'all .2s' },
    layout: { display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', maxWidth: '1120px', margin: '24px auto', padding: '0 20px', alignItems: 'flex-start' },
    feedCol: { display: 'flex', flexDirection: 'column', gap: '16px' },

    // Create post
    createBox: { background: '#fff', borderRadius: '14px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,.08)' },
    createHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' },
    createAvatar: { width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '14px', flexShrink: 0 },
    createPlaceholderLabel: { margin: 0, color: '#94a3b8', fontSize: '14px' },
    createForm: { display: 'flex', flexDirection: 'column', gap: '12px' },
    createTextarea: { padding: '14px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '14px', lineHeight: '1.6', resize: 'vertical', outline: 'none', fontFamily: 'inherit', transition: 'border-color .2s' },
    charCount: { fontSize: '11px', color: '#94a3b8', textAlign: 'right', marginTop: '-8px' },
    createMeta: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
    catSelect: { padding: '9px 12px', borderRadius: '9px', border: '1.5px solid #e2e8f0', fontSize: '13px', background: '#fff', cursor: 'pointer', outline: 'none' },
    tagInputWrap: { display: 'flex', gap: '6px', flex: 1 },
    tagInput: { flex: 1, padding: '9px 12px', borderRadius: '9px', border: '1.5px solid #e2e8f0', fontSize: '13px', outline: 'none' },
    tagAddBtn: { padding: '9px 14px', borderRadius: '9px', border: '1.5px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#374151' },
    tagRow: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
    tagChip: { fontSize: '12px', padding: '4px 10px', borderRadius: '20px', background: '#ede9fe', color: '#7c3aed', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' },
    tagX: { background: 'none', border: 'none', cursor: 'pointer', color: '#7c3aed', fontWeight: '700', fontSize: '14px', lineHeight: 1, padding: 0 },
    createActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px' },
    cancelEdit: { padding: '10px 18px', borderRadius: '9px', border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#64748b', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
    postBtn: { padding: '11px 24px', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', border: 'none', borderRadius: '9px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
    error: { padding: '10px 14px', background: '#fef2f2', color: '#dc2626', borderRadius: '8px', fontSize: '13px' },

    // Post card
    postCard: { background: '#fff', borderRadius: '14px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,.08)', display: 'flex', flexDirection: 'column', gap: '14px' },
    authorRow: { display: 'flex', alignItems: 'center', gap: '12px' },
    authorAvatar: { width: '46px', height: '46px', borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '14px', flexShrink: 0 },
    authorName: { fontSize: '15px', fontWeight: '700', color: '#1e293b', marginBottom: '2px' },
    authorMeta: { display: 'flex', alignItems: 'center', gap: '6px' },
    roleBadge: { fontSize: '11px', background: '#dbeafe', color: '#1d4ed8', padding: '2px 7px', borderRadius: '20px', fontWeight: '600' },
    authorDot: { color: '#94a3b8' },
    timeAgo: { fontSize: '12px', color: '#94a3b8' },
    catPill: { fontSize: '11px', padding: '3px 9px', borderRadius: '20px', fontWeight: '600', marginLeft: 'auto', whiteSpace: 'nowrap' },
    postActions: { display: 'flex', gap: '6px', marginLeft: '8px' },
    iconBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', padding: '4px', borderRadius: '6px' },
    content: { margin: 0, fontSize: '14px', lineHeight: '1.75', color: '#374151', whiteSpace: 'pre-wrap' },
    seeMore: { background: 'none', border: 'none', color: '#667eea', cursor: 'pointer', fontSize: '13px', fontWeight: '600', padding: 0, alignSelf: 'flex-start' },
    tag: { fontSize: '12px', color: '#667eea', fontWeight: '600' },
    statsRow: { display: 'flex', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', padding: '8px 0' },
    statText: { fontSize: '12px', color: '#64748b' },
    actionBar: { display: 'flex', gap: '4px' },
    actionBtn: { flex: 1, padding: '9px 6px', background: 'none', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#475569', transition: 'background .15s', textAlign: 'center' },
    likedBtn: { color: '#2563eb', background: '#dbeafe' },

    // Comments
    commentsSection: { borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '12px' },
    commentForm: { display: 'flex', alignItems: 'center', gap: '10px' },
    commentAvatar: { width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '12px', flexShrink: 0 },
    commentInput: { flex: 1, padding: '9px 14px', borderRadius: '20px', border: '1.5px solid #e2e8f0', fontSize: '13px', outline: 'none' },
    commentBtn: { width: '36px', height: '36px', borderRadius: '50%', background: '#667eea', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '16px', flexShrink: 0 },
    commentList: { display: 'flex', flexDirection: 'column', gap: '10px' },
    commentItem: { display: 'flex', gap: '10px', alignItems: 'flex-start' },
    commentBody: { background: '#f8fafc', borderRadius: '12px', padding: '10px 14px', flex: 1 },
    commentAuthor: { fontSize: '13px', fontWeight: '700', color: '#1e293b', marginBottom: '3px' },
    commentRole: { fontWeight: '400', color: '#64748b' },
    commentText: { fontSize: '13px', color: '#374151', lineHeight: '1.5' },
    commentTime: { fontSize: '11px', color: '#94a3b8', marginTop: '4px' },

    // Loading / empty
    loadingBox: { background: '#fff', borderRadius: '14px', padding: '48px 20px', textAlign: 'center', color: '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' },
    spinner: { width: '36px', height: '36px', border: '3px solid #e2e8f0', borderTop: '3px solid #667eea', borderRadius: '50%', animation: 'spin 1s linear infinite' },
    emptyBox: { background: '#fff', borderRadius: '14px', padding: '60px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' },
    loadMoreBtn: { padding: '13px', background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#667eea', transition: 'all .2s' },

    // Sidebar
    sidebar: { display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '20px' },
    sideCard: { background: '#fff', borderRadius: '14px', padding: '18px', boxShadow: '0 1px 4px rgba(0,0,0,.08)' },
    sideTitle: { margin: '0 0 12px', fontSize: '14px', fontWeight: '700', color: '#1e293b' },
    sideCatBtn: { display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', background: 'transparent', border: 'none', borderLeft: '3px solid transparent', cursor: 'pointer', fontSize: '13px', fontWeight: '500', borderRadius: '0 8px 8px 0', marginBottom: '2px', transition: 'all .15s' },
    sideTag: { fontSize: '12px', padding: '4px 9px', borderRadius: '20px', background: '#f1f5f9', color: '#475569', fontWeight: '500', cursor: 'pointer' },
};
