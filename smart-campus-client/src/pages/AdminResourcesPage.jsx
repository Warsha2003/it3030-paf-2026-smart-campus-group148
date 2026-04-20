/**
 * AdminResourcesPage.jsx
 * Admin page for managing the Facilities & Assets Catalogue.
 *
 * Features:
 *   - CRUD table for resources (add, edit, delete)
 *   - Status toggle (ACTIVE / OUT_OF_SERVICE)
 *   - Search and filter by type, status
 *   - Modal form for create / edit
 *   - Loading skeletons & empty state
 *
 * Member 1 – Facilities & Assets Catalogue
 */

import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import {
  getResources,
  createResource,
  updateResource,
  deleteResource,
  updateResourceStatus,
} from '../services/resourceApi';
import { formatDate } from '../utils/dateUtils';
import toast from 'react-hot-toast';

/* ── constants ─────────────────────────────────────────── */
const RESOURCE_TYPES = [
  'LECTURE_HALL',
  'LAB',
  'MEETING_ROOM',
  'PROJECTOR',
  'CAMERA',
  'OTHER',
];

const TYPE_LABELS = {
  LECTURE_HALL: 'Lecture Hall',
  LAB: 'Lab',
  MEETING_ROOM: 'Meeting Room',
  PROJECTOR: 'Projector',
  CAMERA: 'Camera',
  OTHER: 'Other',
};

const STATUS_STYLES = {
  ACTIVE:         { bg: '#d1fae5', text: '#059669' },
  OUT_OF_SERVICE: { bg: '#fee2e2', text: '#dc2626' },
};

const EMPTY_FORM = {
  name: '',
  type: 'LECTURE_HALL',
  capacity: '',
  location: '',
  description: '',
  status: 'ACTIVE',
  availabilityWindows: '',
};

/* ── component ─────────────────────────────────────────── */
export default function AdminResourcesPage() {
  const [resources,  setResources]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal state
  const [showModal,  setShowModal]  = useState(false);
  const [editing,    setEditing]    = useState(null);   // null = create, object = edit
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [saving,     setSaving]     = useState(false);

  useEffect(() => { fetchResources(); }, []);

  /* ── data fetching ─────────────────────────────────── */
  const fetchResources = async () => {
    setLoading(true);
    try {
      const params = {};
      if (typeFilter) params.type = typeFilter;
      if (statusFilter) params.status = statusFilter;
      if (search.trim()) params.search = search.trim();

      const res = await getResources(params);
      if (res.success) setResources(res.data);
    } catch {
      toast.error('Failed to load resources.');
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch when filters change
  useEffect(() => { fetchResources(); }, [typeFilter, statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchResources();
  };

  /* ── modal helpers ─────────────────────────────────── */
  const openCreateModal = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEditModal = (r) => {
    setEditing(r);
    setForm({
      name: r.name || '',
      type: r.type || 'LECTURE_HALL',
      capacity: r.capacity ?? '',
      location: r.location || '',
      description: r.description || '',
      status: r.status || 'ACTIVE',
      availabilityWindows: (r.availabilityWindows || []).join(', '),
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  };

  const handleFormChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  /* ── save (create / update) ────────────────────────── */
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      name: form.name,
      type: form.type,
      capacity: form.capacity ? Number(form.capacity) : null,
      location: form.location,
      description: form.description,
      status: form.status,
      availabilityWindows: form.availabilityWindows
        ? form.availabilityWindows.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
    };

    try {
      if (editing) {
        const res = await updateResource(editing.id, payload);
        if (res.success) {
          setResources((prev) =>
            prev.map((r) => (r.id === editing.id ? res.data : r))
          );
          toast.success('Resource updated successfully.');
        }
      } else {
        const res = await createResource(payload);
        if (res.success) {
          setResources((prev) => [res.data, ...prev]);
          toast.success('Resource created successfully.');
        }
      }
      closeModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save resource.');
    } finally {
      setSaving(false);
    }
  };

  /* ── delete ────────────────────────────────────────── */
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      const res = await deleteResource(id);
      if (res.success) {
        setResources((prev) => prev.filter((r) => r.id !== id));
        toast.success('Resource deleted.');
      }
    } catch {
      toast.error('Failed to delete resource.');
    }
  };

  /* ── status toggle ─────────────────────────────────── */
  const handleToggleStatus = async (r) => {
    const newStatus = r.status === 'ACTIVE' ? 'OUT_OF_SERVICE' : 'ACTIVE';
    try {
      const res = await updateResourceStatus(r.id, newStatus);
      if (res.success) {
        setResources((prev) =>
          prev.map((item) => (item.id === r.id ? res.data : item))
        );
        toast.success(`Status changed to ${newStatus.replace('_', ' ')}.`);
      }
    } catch {
      toast.error('Failed to update status.');
    }
  };

  /* ── local search filter (client-side for quick UX) ─ */
  const filtered = resources.filter(
    (r) =>
      r.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.location?.toLowerCase().includes(search.toLowerCase())
  );

  /* ── render ────────────────────────────────────────── */
  return (
    <div className="adm-layout">
      <Sidebar />

      <main className="adm-content">
        {/* ── Header ─────────────────────── */}
        <header className="adm-page-header">
          <div>
            <h1 className="adm-page-header__title">🏢 Facilities &amp; Assets</h1>
            <p className="adm-page-header__sub">
              {resources.length} resource{resources.length !== 1 ? 's' : ''} in the catalogue
            </p>
          </div>
          <div className="adm-page-header__actions">
            <button className="btn btn--primary" onClick={openCreateModal}>
              ＋ Add Resource
            </button>
            <button className="btn btn--ghost" onClick={fetchResources} title="Refresh">
              🔄 Refresh
            </button>
          </div>
        </header>

        {/* ── Search & Filters ───────────── */}
        <form className="adm-search-bar" onSubmit={handleSearch}>
          <span className="adm-search-bar__icon">🔍</span>
          <input
            type="text"
            placeholder="Search by name or location…"
            className="adm-search-bar__input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="adm-search-bar__clear"
              onClick={() => { setSearch(''); }}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </form>

        <div className="adm-filters">
          <select
            className="adm-filter-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All Types</option>
            {RESOURCE_TYPES.map((t) => (
              <option key={t} value={t}>{TYPE_LABELS[t]}</option>
            ))}
          </select>

          <select
            className="adm-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="OUT_OF_SERVICE">Out of Service</option>
          </select>
        </div>

        {!loading && (
          <p className="adm-results-count">
            Showing <strong>{filtered.length}</strong> of {resources.length} resources
          </p>
        )}

        {/* ── Table / Loading / Empty ────── */}
        {loading ? (
          <div className="skeleton-list">
            {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton-item" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state__icon">🏢</span>
            <h3>No resources found</h3>
            <p>Try a different search or add a new resource.</p>
          </div>
        ) : (
          <div className="adm-table-wrapper">
            <table className="adm-table" aria-label="Resources table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Capacity</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const st = STATUS_STYLES[r.status] || STATUS_STYLES.ACTIVE;
                  return (
                    <tr key={r.id} className="adm-table__row">
                      <td>
                        <strong>{r.name}</strong>
                        {r.description && (
                          <p style={{ color: 'var(--gray-500)', fontSize: '0.8rem', margin: '2px 0 0' }}>
                            {r.description.length > 60
                              ? r.description.slice(0, 60) + '…'
                              : r.description}
                          </p>
                        )}
                      </td>
                      <td>
                        <span className="role-badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                          {TYPE_LABELS[r.type] || r.type}
                        </span>
                      </td>
                      <td>{r.capacity ?? '—'}</td>
                      <td>{r.location}</td>
                      <td>
                        <span
                          className="status-badge"
                          style={{ background: st.bg, color: st.text, cursor: 'pointer' }}
                          title="Click to toggle status"
                          onClick={() => handleToggleStatus(r)}
                        >
                          {r.status === 'ACTIVE' ? '● Active' : '○ Out of Service'}
                        </span>
                      </td>
                      <td className="adm-table__cell-time">{formatDate(r.createdAt)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className="btn btn--sm btn--ghost"
                            onClick={() => openEditModal(r)}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            className="btn btn--sm btn--danger-ghost"
                            onClick={() => handleDelete(r.id, r.name)}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <footer className="adm-footer">
          Smart Campus Admin Panel &nbsp;·&nbsp; Facilities &amp; Assets Catalogue
        </footer>
      </main>

      {/* ── Modal (Create / Edit) ────────── */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Edit Resource' : 'Add New Resource'}</h2>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>

            <form className="modal-form" onSubmit={handleSave}>
              <label className="form-label">
                Name *
                <input
                  className="form-input"
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  required
                />
              </label>

              <label className="form-label">
                Type *
                <select
                  className="form-input"
                  name="type"
                  value={form.type}
                  onChange={handleFormChange}
                  required
                >
                  {RESOURCE_TYPES.map((t) => (
                    <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                  ))}
                </select>
              </label>

              <label className="form-label">
                Capacity
                <input
                  className="form-input"
                  name="capacity"
                  type="number"
                  min="0"
                  value={form.capacity}
                  onChange={handleFormChange}
                />
              </label>

              <label className="form-label">
                Location *
                <input
                  className="form-input"
                  name="location"
                  value={form.location}
                  onChange={handleFormChange}
                  required
                />
              </label>

              <label className="form-label">
                Description
                <textarea
                  className="form-input"
                  name="description"
                  rows={3}
                  value={form.description}
                  onChange={handleFormChange}
                />
              </label>

              <label className="form-label">
                Status
                <select
                  className="form-input"
                  name="status"
                  value={form.status}
                  onChange={handleFormChange}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="OUT_OF_SERVICE">Out of Service</option>
                </select>
              </label>

              <label className="form-label">
                Availability Windows
                <input
                  className="form-input"
                  name="availabilityWindows"
                  placeholder="Mon 08:00-17:00, Tue 08:00-17:00"
                  value={form.availabilityWindows}
                  onChange={handleFormChange}
                />
                <span className="form-hint">Comma-separated time windows</span>
              </label>

              <div className="modal-actions">
                <button type="button" className="btn btn--ghost" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary" disabled={saving}>
                  {saving ? 'Saving…' : editing ? 'Update Resource' : 'Create Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
