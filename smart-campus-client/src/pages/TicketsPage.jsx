/**
 * TicketsPage.jsx
 * Module C – Maintenance & Incident Ticketing
 * Member 3
 *
 * Innovations:
 * 1. Ticket Statistics Dashboard
 * 2. Search Tickets by Keyword
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import ticketApi from '../services/ticketApi';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  OPEN:        { bg: '#fef3c7', text: '#92400e' },
  IN_PROGRESS: { bg: '#dbeafe', text: '#1e40af' },
  RESOLVED:    { bg: '#d1fae5', text: '#065f46' },
  CLOSED:      { bg: '#f3f4f6', text: '#374151' },
  REJECTED:    { bg: '#fee2e2', text: '#991b1b' },
};

const PRIORITY_COLORS = {
  LOW:      '#10b981',
  MEDIUM:   '#f59e0b',
  HIGH:     '#ef4444',
  CRITICAL: '#7c3aed',
};

export default function TicketsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ROLE_ADMIN' || user?.role === 'ADMIN';

  const [view, setView]                     = useState('list');
  const [tickets, setTickets]               = useState([]);
  const [loading, setLoading]               = useState(false);
  const [expandedId, setExpandedId]         = useState(null);
  const [comments, setComments]             = useState([]);
  const [newComment, setNewComment]         = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const [filterStatus, setFilterStatus]     = useState('ALL');

  // INNOVATION 1 - stats state
  const [stats, setStats]         = useState(null);
  const [showStats, setShowStats] = useState(false);

  // INNOVATION 2 - search state
  const [searchKeyword, setSearchKeyword]   = useState('');
  const [searchResults, setSearchResults]   = useState([]);
  const [isSearching, setIsSearching]       = useState(false);
  const [searchMode, setSearchMode]         = useState(false);

  // Form state
  const [form, setForm] = useState({
    location: '', resourceId: '', category: 'EQUIPMENT',
    description: '', priority: 'MEDIUM', preferredContact: ''
  });
  const [images, setImages]         = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = isAdmin
        ? await ticketApi.getAllTickets()
        : await ticketApi.getMyTickets(user?.id);
      setTickets(res.data);
    } catch {
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  // INNOVATION 1 - fetch stats
  const fetchStats = async () => {
    try {
      const res = await ticketApi.getStats();
      setStats(res.data);
      setShowStats(true);
    } catch {
      toast.error('Failed to load statistics');
    }
  };

  // INNOVATION 2 - search tickets
  const handleSearch = async () => {
    if (!searchKeyword.trim()) {
      setSearchMode(false);
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await ticketApi.searchTickets(searchKeyword.trim());
      setSearchResults(res.data);
      setSearchMode(true);
    } catch {
      toast.error('Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchKeyword('');
    setSearchMode(false);
    setSearchResults([]);
  };

  useEffect(() => {
    if (view === 'list') fetchTickets();
  }, [view, isAdmin]);

  const fetchComments = async (ticketId) => {
    try {
      const res = await ticketApi.getComments(ticketId);
      setComments(res.data);
    } catch {
      toast.error('Failed to load comments');
    }
  };

  const handleExpand = async (ticket) => {
    if (expandedId === ticket.id) {
      setExpandedId(null);
      setComments([]);
    } else {
      setExpandedId(ticket.id);
      setComments([]);
      await fetchComments(ticket.id);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const ticketData = { ...form, reportedByUserId: user?.id };
      await ticketApi.createTicket(ticketData, images);
      toast.success('Ticket submitted successfully!');
      setForm({
        location: '', resourceId: '', category: 'EQUIPMENT',
        description: '', priority: 'MEDIUM', preferredContact: ''
      });
      setImages([]);
      setView('list');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (ticketId, newStatus) => {
    const notes  = newStatus === 'RESOLVED' ? prompt('Enter resolution notes:') : null;
    const reason = newStatus === 'REJECTED' ? prompt('Enter rejection reason:') : null;
    try {
      await ticketApi.updateTicketStatus(ticketId, newStatus, notes, reason);
      toast.success(`Ticket marked as ${newStatus}`);
      fetchTickets();
      setExpandedId(null);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Update failed');
    }
  };

  const handleAssign = async (ticketId) => {
    const techId = prompt('Enter technician ID to assign:');
    if (!techId) return;
    try {
      await ticketApi.assignTechnician(ticketId, techId);
      toast.success('Technician assigned!');
      fetchTickets();
    } catch {
      toast.error('Failed to assign technician');
    }
  };

  const handleDelete = async (ticketId) => {
    if (!window.confirm('Delete this ticket permanently?')) return;
    try {
      await ticketApi.deleteTicket(ticketId);
      toast.success('Ticket deleted');
      fetchTickets();
      setExpandedId(null);
    } catch {
      toast.error('Failed to delete ticket');
    }
  };

  const handleAddComment = async (ticketId) => {
    if (!newComment.trim()) return;
    try {
      await ticketApi.addComment(ticketId, user?.id, user?.name || user?.email, newComment);
      setNewComment('');
      fetchComments(ticketId);
    } catch {
      toast.error('Failed to add comment');
    }
  };

  const handleEditComment = async (commentId, ticketId) => {
    try {
      await ticketApi.updateComment(commentId, user?.id, editingComment.content);
      setEditingComment(null);
      fetchComments(ticketId);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to update comment');
    }
  };

  const handleDeleteComment = async (commentId, ticketId) => {
    if (!window.confirm('Delete comment?')) return;
    try {
      await ticketApi.deleteComment(commentId, user?.id);
      fetchComments(ticketId);
    } catch {
      toast.error('Failed to delete comment');
    }
  };

  const filteredTickets = filterStatus === 'ALL'
    ? tickets
    : tickets.filter(t => t.status === filterStatus);

  const displayTickets = searchMode ? searchResults : filteredTickets;

  return (
    <div style={{ padding: '24px', maxWidth: 900, margin: '0 auto' }}>

      {/* ── Page Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>🔧 Maintenance</h1>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>
            {isAdmin ? '👑 Admin View — Managing all campus tickets' : 'Report and track campus maintenance issues'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={() => setView('list')} style={tabBtn(view === 'list')}>
            📋 {isAdmin ? 'All Tickets' : 'My Tickets'}
          </button>
          <button onClick={() => setView('create')} style={tabBtn(view === 'create')}>
            + Report Issue
          </button>
          {/* INNOVATION 1 - Stats button */}
          {isAdmin && (
            <button onClick={() => { fetchStats(); }} style={tabBtn(false, '#059669')}>
              📊 Statistics
            </button>
          )}
        </div>
      </div>

      {/* ── INNOVATION 1: Statistics Dashboard ── */}
      {showStats && stats && isAdmin && (
        <div style={{ ...card, marginBottom: 24, background: '#1e3a5f' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ margin: 0, color: 'white', fontSize: 18 }}>📊 Ticket Statistics</h2>
            <button
              onClick={() => setShowStats(false)}
              style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: 18 }}
            >✕</button>
          </div>

          {/* Status Stats */}
          <p style={{ color: '#93c5fd', margin: '0 0 10px', fontSize: 13, fontWeight: 600 }}>BY STATUS</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 20 }}>
            {[
              { label: 'Total',       value: stats.total,      color: '#6366f1' },
              { label: 'Open',        value: stats.open,       color: '#f59e0b' },
              { label: 'In Progress', value: stats.inProgress, color: '#3b82f6' },
              { label: 'Resolved',    value: stats.resolved,   color: '#10b981' },
              { label: 'Closed',      value: stats.closed,     color: '#6b7280' },
            ].map(s => (
              <div key={s.label} style={{
                background: 'rgba(255,255,255,0.1)',
                borderRadius: 10, padding: '14px 10px',
                textAlign: 'center',
                borderTop: `3px solid ${s.color}`
              }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: 'white' }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#93c5fd', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Priority Stats */}
          <p style={{ color: '#93c5fd', margin: '0 0 10px', fontSize: 13, fontWeight: 600 }}>BY PRIORITY</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {[
              { label: 'Low',      value: stats.low,      color: '#10b981' },
              { label: 'Medium',   value: stats.medium,   color: '#f59e0b' },
              { label: 'High',     value: stats.high,     color: '#ef4444' },
              { label: 'Critical', value: stats.critical, color: '#7c3aed' },
            ].map(s => (
              <div key={s.label} style={{
                background: 'rgba(255,255,255,0.1)',
                borderRadius: 10, padding: '14px 10px',
                textAlign: 'center',
                borderTop: `3px solid ${s.color}`
              }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: 'white' }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#93c5fd', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Rejected */}
          <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(239,68,68,0.2)', borderRadius: 8 }}>
            <span style={{ color: '#fca5a5', fontSize: 13 }}>
              ❌ Rejected Tickets: <strong style={{ color: 'white' }}>{stats.rejected}</strong>
            </span>
          </div>
        </div>
      )}

      {/* ── INNOVATION 2: Search Bar ── */}
      {view === 'list' && (
        <div style={{ ...card, marginBottom: 20, padding: '16px 20px' }}>
          <p style={{ margin: '0 0 10px', fontWeight: 600, fontSize: 14 }}>🔍 Search Tickets</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              value={searchKeyword}
              onChange={e => setSearchKeyword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Search by location, description or category..."
              style={{ ...inputStyle, flex: 1 }}
            />
            <button onClick={handleSearch} disabled={isSearching} style={primaryBtn}>
              {isSearching ? 'Searching...' : '🔍 Search'}
            </button>
            {searchMode && (
              <button onClick={clearSearch} style={secondaryBtn}>
                ✕ Clear
              </button>
            )}
          </div>
          {searchMode && (
            <p style={{ margin: '8px 0 0', fontSize: 13, color: '#6b7280' }}>
              Found <strong>{searchResults.length}</strong> result(s) for "<strong>{searchKeyword}</strong>"
            </p>
          )}
        </div>
      )}

      {/* ── Admin Banner ── */}
      {isAdmin && view === 'list' && !searchMode && (
        <div style={{
          background: '#eff6ff', border: '1px solid #bfdbfe',
          borderRadius: 10, padding: '12px 18px', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 10
        }}>
          <span style={{ fontSize: 20 }}>👑</span>
          <div>
            <strong style={{ color: '#1e40af' }}>Admin Controls Active</strong>
            <p style={{ margin: 0, fontSize: 13, color: '#3b82f6' }}>
              You can assign technicians, reject, resolve, close and delete tickets.
            </p>
          </div>
        </div>
      )}

      {/* ── CREATE FORM ── */}
      {view === 'create' && (
        <div style={card}>
          <h2 style={{ marginTop: 0 }}>Report an Incident</h2>
          <form onSubmit={handleSubmit}>
            <div style={grid2}>
              <Field label="Location *">
                <input
                  name="location" value={form.location} required
                  onChange={e => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g., Lab A - Room 201" style={inputStyle}
                />
              </Field>
              <Field label="Resource ID (optional)">
                <input
                  name="resourceId" value={form.resourceId}
                  onChange={e => setForm({ ...form, resourceId: e.target.value })}
                  placeholder="e.g., PROJ-001" style={inputStyle}
                />
              </Field>
              <Field label="Category *">
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  style={inputStyle}
                >
                  {['EQUIPMENT','ELECTRICAL','PLUMBING','HVAC','NETWORK','SAFETY','OTHER']
                    .map(o => <option key={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="Priority *">
                <select
                  value={form.priority}
                  onChange={e => setForm({ ...form, priority: e.target.value })}
                  style={inputStyle}
                >
                  {['LOW','MEDIUM','HIGH','CRITICAL'].map(o => <option key={o}>{o}</option>)}
                </select>
              </Field>
            </div>

            <Field label="Description *">
              <textarea
                value={form.description} required rows={4}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Describe the issue in detail..."
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </Field>

            <Field label="Preferred Contact">
              <input
                value={form.preferredContact}
                onChange={e => setForm({ ...form, preferredContact: e.target.value })}
                placeholder="email or phone number" style={inputStyle}
              />
            </Field>

            <Field label="Attach Images (max 3)">
              <input
                type="file" accept="image/*" multiple
                onChange={e => {
                  const files = Array.from(e.target.files);
                  if (files.length > 3) { toast.error('Max 3 images allowed'); return; }
                  setImages(files);
                }}
              />
              <small style={{ color: '#6b7280' }}>Upload up to 3 photos as evidence</small>
            </Field>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button type="submit" disabled={submitting} style={primaryBtn}>
                {submitting ? 'Submitting...' : '🚀 Submit Ticket'}
              </button>
              <button type="button" onClick={() => setView('list')} style={secondaryBtn}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── TICKET LIST ── */}
      {view === 'list' && (
        <div>
          {/* Status Filter — hidden during search */}
          {!searchMode && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {['ALL','OPEN','IN_PROGRESS','RESOLVED','CLOSED','REJECTED'].map(s => (
                <button key={s} onClick={() => setFilterStatus(s)}
                  style={{
                    padding: '5px 14px', borderRadius: 20, border: 'none',
                    cursor: 'pointer', fontSize: 13, fontWeight: 500,
                    background: filterStatus === s ? '#2563eb' : '#e5e7eb',
                    color: filterStatus === s ? 'white' : '#374151'
                  }}>
                  {s}
                  <span style={{ marginLeft: 6, fontSize: 11 }}>
                    ({s === 'ALL' ? tickets.length : tickets.filter(t => t.status === s).length})
                  </span>
                </button>
              ))}
            </div>
          )}

          {loading && (
            <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
              Loading tickets...
            </div>
          )}

          {!loading && displayTickets.length === 0 && (
            <div style={{ ...card, textAlign: 'center', color: '#6b7280', padding: 40 }}>
              <p style={{ fontSize: 40, margin: 0 }}>
                {searchMode ? '🔍' : '🎉'}
              </p>
              <p>
                {searchMode
                  ? `No tickets found for "${searchKeyword}"`
                  : `No tickets found${filterStatus !== 'ALL' ? ` with status "${filterStatus}"` : ''}.`}
              </p>
            </div>
          )}

          {displayTickets.map(ticket => {
            const sc = STATUS_COLORS[ticket.status] || STATUS_COLORS.OPEN;
            const isExpanded = expandedId === ticket.id;

            return (
              <div key={ticket.id} style={{ ...card, marginBottom: 16 }}>

                {/* Ticket Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: 16 }}>{ticket.category}</strong>
                      <span style={{
                        padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                        background: sc.bg, color: sc.text
                      }}>● {ticket.status}</span>
                      <span style={{
                        padding: '2px 10px', borderRadius: 12, fontSize: 12,
                        background: '#f3f4f6',
                        color: PRIORITY_COLORS[ticket.priority] || '#374151',
                        fontWeight: 600
                      }}>{ticket.priority}</span>
                    </div>
                    <p style={{ margin: '4px 0', color: '#6b7280', fontSize: 13 }}>
                      📍 {ticket.location}
                      {ticket.resourceId && ` · Resource: ${ticket.resourceId}`}
                    </p>
                    {isAdmin && ticket.reportedByEmail && (
                      <p style={{ margin: '2px 0', color: '#9ca3af', fontSize: 12 }}>
                        👤 Reported by: {ticket.reportedByEmail}
                      </p>
                    )}
                  </div>
                  <span style={{ fontSize: 12, color: '#9ca3af', whiteSpace: 'nowrap' }}>
                    {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : ''}
                  </span>
                </div>

                <p style={{ margin: '10px 0', color: '#374151' }}>{ticket.description}</p>

                {ticket.preferredContact && (
                  <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0' }}>
                    📞 Contact: {ticket.preferredContact}
                  </p>
                )}

                {ticket.resolutionNotes && (
                  <div style={{
                    background: '#d1fae5', borderRadius: 6,
                    padding: '8px 12px', marginBottom: 8, marginTop: 8
                  }}>
                    <strong style={{ color: '#065f46', fontSize: 13 }}>✅ Resolution: </strong>
                    <span style={{ color: '#065f46', fontSize: 13 }}>{ticket.resolutionNotes}</span>
                  </div>
                )}

                {ticket.rejectionReason && (
                  <div style={{
                    background: '#fee2e2', borderRadius: 6,
                    padding: '8px 12px', marginBottom: 8, marginTop: 8
                  }}>
                    <strong style={{ color: '#991b1b', fontSize: 13 }}>❌ Rejected: </strong>
                    <span style={{ color: '#991b1b', fontSize: 13 }}>{ticket.rejectionReason}</span>
                  </div>
                )}

                {ticket.assignedTechnicianId && (
                  <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0' }}>
                    👷 Assigned Technician: {ticket.assignedTechnicianId}
                  </p>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                  {isAdmin && ticket.status === 'OPEN' && (
                    <>
                      <button onClick={() => handleAssign(ticket.id)} style={actionBtn('#7c3aed')}>
                        👷 Assign Technician
                      </button>
                      <button onClick={() => handleStatusUpdate(ticket.id, 'IN_PROGRESS')} style={actionBtn('#3b82f6')}>
                        ▶ Start Progress
                      </button>
                      <button onClick={() => handleStatusUpdate(ticket.id, 'REJECTED')} style={actionBtn('#ef4444')}>
                        ✕ Reject
                      </button>
                    </>
                  )}
                  {ticket.status === 'IN_PROGRESS' && (isAdmin || ticket.assignedTechnicianId === user?.id) && (
                    <button onClick={() => handleStatusUpdate(ticket.id, 'RESOLVED')} style={actionBtn('#10b981')}>
                      ✅ Mark Resolved
                    </button>
                  )}
                  {isAdmin && ticket.status === 'RESOLVED' && (
                    <button onClick={() => handleStatusUpdate(ticket.id, 'CLOSED')} style={actionBtn('#6b7280')}>
                      🔒 Close Ticket
                    </button>
                  )}
                  {isAdmin && (
                    <button onClick={() => handleDelete(ticket.id)} style={actionBtn('#ef4444')}>
                      🗑 Delete
                    </button>
                  )}
                  <button onClick={() => handleExpand(ticket)} style={actionBtn('#2563eb')}>
                    💬 {isExpanded ? 'Hide Comments' : 'Comments'}
                  </button>
                </div>

                {/* Comments */}
                {isExpanded && (
                  <div style={{ marginTop: 16, borderTop: '1px solid #e5e7eb', paddingTop: 14 }}>
                    <strong style={{ fontSize: 14 }}>💬 Comments</strong>

                    {comments.length === 0 && (
                      <p style={{ color: '#9ca3af', fontSize: 13, marginTop: 8 }}>
                        No comments yet. Be the first!
                      </p>
                    )}

                    {comments.map(c => (
                      <div key={c.id} style={{
                        background: '#f9fafb', borderRadius: 8,
                        padding: '10px 14px', marginTop: 10
                      }}>
                        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                          <strong>{c.username}</strong> ·{' '}
                          {c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}
                        </div>
                        {editingComment?.id === c.id ? (
                          <div>
                            <textarea
                              value={editingComment.content} rows={2}
                              onChange={e => setEditingComment({ ...editingComment, content: e.target.value })}
                              style={{ ...inputStyle, marginBottom: 8 }}
                            />
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button onClick={() => handleEditComment(c.id, ticket.id)} style={actionBtn('#2563eb')}>Save</button>
                              <button onClick={() => setEditingComment(null)} style={actionBtn('#6b7280')}>Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p style={{ margin: '0 0 6px' }}>{c.content}</p>
                            {c.userId === user?.id && (
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button
                                  onClick={() => setEditingComment({ id: c.id, content: c.content })}
                                  style={actionBtn('#7c3aed')}
                                >Edit</button>
                                <button
                                  onClick={() => handleDeleteComment(c.id, ticket.id)}
                                  style={actionBtn('#ef4444')}
                                >Delete</button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}

                    <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                      <input
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddComment(ticket.id)}
                        placeholder="Write a comment and press Enter..."
                        style={{ ...inputStyle, flex: 1 }}
                      />
                      <button onClick={() => handleAddComment(ticket.id)} style={primaryBtn}>
                        Post
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const card        = { background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' };
const grid2       = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 };
const inputStyle  = { width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box' };
const primaryBtn  = { padding: '9px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 };
const secondaryBtn = { padding: '9px 20px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 };
const tabBtn      = (active, bg) => ({ padding: '8px 18px', background: active ? '#2563eb' : bg || '#f3f4f6', color: active ? 'white' : bg ? 'white' : '#374151', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: active ? 600 : 400 });
const actionBtn   = (bg) => ({ padding: '5px 12px', background: bg, color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 500 });