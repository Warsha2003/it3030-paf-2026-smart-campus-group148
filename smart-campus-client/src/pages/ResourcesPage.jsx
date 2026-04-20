/**
 * ResourcesPage.jsx
 * User-facing page to browse, search, and filter campus resources.
 * Read-only — no add/edit/delete capabilities.
 *
 * Features:
 *   - Card grid view of all resources
 *   - Search by name or location
 *   - Filter by type, status, min capacity
 *   - Detail view modal
 *
 * Member 1 – Facilities & Assets Catalogue
 */

import { useState, useEffect } from 'react';
import { getResources, getResourceById } from '../services/resourceApi';
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

const TYPE_ICONS = {
  LECTURE_HALL: '🏛️',
  LAB: '🔬',
  MEETING_ROOM: '🤝',
  PROJECTOR: '📽️',
  CAMERA: '📷',
  OTHER: '📦',
};

/* ── component ─────────────────────────────────────────── */
export default function ResourcesPage() {
  const [resources,  setResources]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [capacityFilter, setCapacityFilter] = useState('');

  // Detail modal
  const [selected,   setSelected]   = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => { fetchResources(); }, []);
  useEffect(() => { fetchResources(); }, [typeFilter, statusFilter]);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (typeFilter) params.type = typeFilter;
      if (statusFilter) params.status = statusFilter;
      if (capacityFilter) params.minCapacity = Number(capacityFilter);

      const res = await getResources(params);
      if (res.success) setResources(res.data);
    } catch {
      toast.error('Failed to load resources.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchResources();
  };

  const openDetail = async (id) => {
    setDetailLoading(true);
    try {
      const res = await getResourceById(id);
      if (res.success) setSelected(res.data);
    } catch {
      toast.error('Failed to load resource details.');
    } finally {
      setDetailLoading(false);
    }
  };

  /* ── local search filter ───────────────────────────── */
  const filtered = resources.filter((r) => {
    const matchesSearch =
      r.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.location?.toLowerCase().includes(search.toLowerCase());
    const matchesCapacity = capacityFilter
      ? (r.capacity ?? 0) >= Number(capacityFilter)
      : true;
    return matchesSearch && matchesCapacity;
  });

  return (
    <div className="resources-page">
      <header className="resources-page__header">
        <h1>🏢 Campus Resources</h1>
        <p>Browse available facilities and assets</p>
      </header>

      {/* ── Search & Filters ─────────────── */}
      <form className="resources-filters" onSubmit={handleSearch}>
        <div className="resources-search">
          <span className="resources-search__icon">🔍</span>
          <input
            type="text"
            placeholder="Search by name or location…"
            className="resources-search__input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="resources-search__clear"
              onClick={() => { setSearch(''); }}
            >
              ✕
            </button>
          )}
        </div>

        <div className="resources-filters__row">
          <select
            className="resources-filter-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All Types</option>
            {RESOURCE_TYPES.map((t) => (
              <option key={t} value={t}>{TYPE_LABELS[t]}</option>
            ))}
          </select>

          <select
            className="resources-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="OUT_OF_SERVICE">Out of Service</option>
          </select>

          <input
            type="number"
            className="resources-filter-select"
            placeholder="Min capacity"
            min="0"
            value={capacityFilter}
            onChange={(e) => setCapacityFilter(e.target.value)}
          />

          <button type="submit" className="btn btn--primary btn--sm">
            Apply
          </button>
        </div>
      </form>

      {!loading && (
        <p className="resources-count">
          Showing <strong>{filtered.length}</strong> resource{filtered.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* ── Content ──────────────────────── */}
      {loading ? (
        <div className="resources-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="resource-card resource-card--skeleton" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state__icon">🏢</span>
          <h3>No resources found</h3>
          <p>Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="resources-grid">
          {filtered.map((r) => (
            <div
              key={r.id}
              className={`resource-card ${r.status === 'OUT_OF_SERVICE' ? 'resource-card--disabled' : ''}`}
              onClick={() => openDetail(r.id)}
            >
              <div className="resource-card__icon">
                {TYPE_ICONS[r.type] || '📦'}
              </div>
              <h3 className="resource-card__name">{r.name}</h3>
              <span className="resource-card__type">
                {TYPE_LABELS[r.type] || r.type}
              </span>
              <div className="resource-card__meta">
                {r.capacity && <span>👥 {r.capacity}</span>}
                <span>📍 {r.location}</span>
              </div>
              <span
                className={`resource-card__status ${
                  r.status === 'ACTIVE'
                    ? 'resource-card__status--active'
                    : 'resource-card__status--inactive'
                }`}
              >
                {r.status === 'ACTIVE' ? '● Available' : '○ Out of Service'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Detail Modal ─────────────────── */}
      {(selected || detailLoading) && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {detailLoading ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>Loading…</div>
            ) : selected && (
              <>
                <div className="modal-header">
                  <h2>{TYPE_ICONS[selected.type]} {selected.name}</h2>
                  <button className="modal-close" onClick={() => setSelected(null)}>✕</button>
                </div>
                <div className="resource-detail">
                  <div className="resource-detail__row">
                    <span className="resource-detail__label">Type</span>
                    <span>{TYPE_LABELS[selected.type] || selected.type}</span>
                  </div>
                  <div className="resource-detail__row">
                    <span className="resource-detail__label">Location</span>
                    <span>{selected.location}</span>
                  </div>
                  <div className="resource-detail__row">
                    <span className="resource-detail__label">Capacity</span>
                    <span>{selected.capacity ?? '—'}</span>
                  </div>
                  <div className="resource-detail__row">
                    <span className="resource-detail__label">Status</span>
                    <span
                      className={`status-badge ${
                        selected.status === 'ACTIVE'
                          ? 'status-badge--active'
                          : 'status-badge--inactive'
                      }`}
                    >
                      {selected.status === 'ACTIVE' ? '● Active' : '○ Out of Service'}
                    </span>
                  </div>
                  {selected.description && (
                    <div className="resource-detail__row">
                      <span className="resource-detail__label">Description</span>
                      <span>{selected.description}</span>
                    </div>
                  )}
                  {selected.availabilityWindows?.length > 0 && (
                    <div className="resource-detail__row">
                      <span className="resource-detail__label">Availability</span>
                      <div className="resource-detail__windows">
                        {selected.availabilityWindows.map((w, i) => (
                          <span key={i} className="resource-detail__window-tag">{w}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
