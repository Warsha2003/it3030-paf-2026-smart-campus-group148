import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import toast from 'react-hot-toast';
import StatCard from '../components/StatCard';
import {
  cancelBooking,
  createBooking,
  deleteBooking,
  getMyBookings,
  updateBooking,
} from '../services/bookingApi';
import { getResources } from '../services/resourceApi';
import { useAuth } from '../hooks/useAuth';
import { extractApiErrorMessage } from '../utils/apiErrorUtils';
import {
  BOOKING_STATUS_OPTIONS,
  RESOURCE_TYPE_OPTIONS,
  getBookingStatusLabel,
  getResourceStatusLabel,
  getResourceTypeLabel,
} from '../utils/bookingUtils';
import { formatDistanceToNow, formatSchedule, formatTime } from '../utils/dateUtils';

const toInputDate = (date) => {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
};

const normalizeTimeInput = (value) => (value ? String(value).slice(0, 5) : '');

const getDefaultBookingDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return toInputDate(date);
};

const createDefaultBookingForm = (resourceId = '') => ({
  resourceId,
  bookingDate: getDefaultBookingDate(),
  startTime: '09:00',
  endTime: '10:00',
  purpose: '',
  expectedAttendees: '1',
});

const createBookingFormFromBooking = (booking) => ({
  resourceId: booking.resourceId || '',
  bookingDate: booking.bookingDate || getDefaultBookingDate(),
  startTime: normalizeTimeInput(booking.startTime),
  endTime: normalizeTimeInput(booking.endTime),
  purpose: booking.purpose || '',
  expectedAttendees: String(booking.expectedAttendees || 1),
});

const DEFAULT_RESOURCE_FILTERS = {
  type: '',
  location: '',
  minCapacity: '',
};

const buildResourceSearchFilters = (filters, bookingForm) => ({
  ...filters,
  status: 'ACTIVE',
  availableDate: bookingForm.bookingDate,
  startTime: bookingForm.startTime,
  endTime: bookingForm.endTime,
});

const buildQrPayload = (booking) =>
  JSON.stringify({
    bookingId: booking.id,
    resource: booking.resourceName,
    location: booking.resourceLocation,
    bookingDate: booking.bookingDate,
    startTime: booking.startTime,
    endTime: booking.endTime,
    purpose: booking.purpose,
    status: booking.status,
  });

export default function BookingsPage() {
  const { user } = useAuth();
  const composerRef = useRef(null);

  const [resources, setResources] = useState([]);
  const [resourcesLoading, setResourcesLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [resourceFilters, setResourceFilters] = useState(DEFAULT_RESOURCE_FILTERS);
  const [bookingForm, setBookingForm] = useState(createDefaultBookingForm);
  const [bookingStatusFilter, setBookingStatusFilter] = useState('ALL');
  const [composerMode, setComposerMode] = useState('create');
  const [composerOpen, setComposerOpen] = useState(false);
  const [editingBookingId, setEditingBookingId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionBookingId, setActionBookingId] = useState('');
  const [qrBooking, setQrBooking] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [qrLoading, setQrLoading] = useState(false);

  const fetchResources = useCallback(async (filters, preferredResourceId) => {
    setResourcesLoading(true);
    try {
      const response = await getResources(filters);
      const nextResources = response.data || [];
      setResources(nextResources);
      setBookingForm((current) => {
        const nextSelectedId = preferredResourceId ?? current.resourceId;
        const selectedExists = nextResources.some((resource) => resource.id === nextSelectedId);

        return {
          ...current,
          resourceId: selectedExists ? nextSelectedId : nextResources[0]?.id || '',
        };
      });
    } catch (error) {
      toast.error(extractApiErrorMessage(error, 'Failed to load resources.'));
    } finally {
      setResourcesLoading(false);
    }
  }, []);

  const fetchBookings = useCallback(async (status) => {
    setBookingsLoading(true);
    try {
      const response = await getMyBookings(status === 'ALL' ? undefined : status);
      setBookings(response.data || []);
    } catch (error) {
      toast.error(extractApiErrorMessage(error, 'Failed to load your booking requests.'));
    } finally {
      setBookingsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResources({ status: 'ACTIVE' });
  }, [fetchResources]);

  useEffect(() => {
    fetchBookings(bookingStatusFilter);
  }, [bookingStatusFilter, fetchBookings]);

  useEffect(() => {
    if (!qrBooking) {
      setQrCodeUrl('');
      setQrLoading(false);
      return undefined;
    }

    let cancelled = false;
    setQrLoading(true);

    QRCode.toDataURL(buildQrPayload(qrBooking), {
      width: 280,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (!cancelled) {
          setQrCodeUrl(url);
        }
      })
      .catch(() => {
        if (!cancelled) {
          toast.error('Failed to generate the booking QR code.');
          setQrBooking(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setQrLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [qrBooking]);

  const selectedResource = useMemo(
    () => resources.find((resource) => resource.id === bookingForm.resourceId) || null,
    [resources, bookingForm.resourceId]
  );

  const bookingStats = useMemo(() => {
    const pending = bookings.filter((booking) => booking.status === 'PENDING').length;
    const approved = bookings.filter((booking) => booking.status === 'APPROVED').length;
    const rejected = bookings.filter((booking) => booking.status === 'REJECTED').length;

    return {
      activeResources: resources.length,
      pending,
      approved,
      rejected,
    };
  }, [bookings, resources]);

  const composerTitle = useMemo(() => {
    if (composerMode === 'edit') return 'Edit pending request';
    if (composerMode === 'rebook') return 'Re-book rejected request';
    return 'Create booking request';
  }, [composerMode]);

  const submitLabel = useMemo(() => {
    if (submitting) {
      return composerMode === 'edit' ? 'Saving...' : 'Submitting...';
    }
    if (composerMode === 'edit') return 'Save changes';
    if (composerMode === 'rebook') return 'Submit re-book request';
    return 'Submit booking request';
  }, [composerMode, submitting]);

  const resetComposerState = useCallback(() => {
    setComposerMode('create');
    setEditingBookingId('');
    setResourceFilters(DEFAULT_RESOURCE_FILTERS);
    setBookingForm(createDefaultBookingForm(resources[0]?.id || ''));
    setComposerOpen(false);
  }, [resources]);

  useEffect(() => {
    if (!composerOpen) {
      return undefined;
    }

    composerRef.current?.focus();

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        resetComposerState();
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [composerOpen, resetComposerState]);

  const openComposer = useCallback(
    async (mode, form, bookingId = '') => {
      setComposerMode(mode);
      setEditingBookingId(bookingId);
      setResourceFilters(DEFAULT_RESOURCE_FILTERS);
      setBookingForm(form);
      setComposerOpen(true);
      await fetchResources(buildResourceSearchFilters(DEFAULT_RESOURCE_FILTERS, form), form.resourceId);
    },
    [fetchResources]
  );

  const openCreateComposer = async () => {
    const nextForm = createDefaultBookingForm(resources[0]?.id || '');
    await openComposer('create', nextForm);
  };

  const handleEditBooking = async (booking) => {
    await openComposer('edit', createBookingFormFromBooking(booking), booking.id);
  };

  const handleRebook = async (booking) => {
    await openComposer('rebook', createBookingFormFromBooking(booking));
  };

  const handleResourceFilterChange = (event) => {
    const { name, value } = event.target;
    setResourceFilters((current) => ({ ...current, [name]: value }));
  };

  const handleSelectResource = (resourceId) => {
    setBookingForm((current) => ({ ...current, resourceId }));
  };

  const handleBookingFormChange = (event) => {
    const { name, value } = event.target;
    setBookingForm((current) => ({ ...current, [name]: value }));
  };

  const handleSearchResources = async (event) => {
    event.preventDefault();
    await fetchResources(buildResourceSearchFilters(resourceFilters, bookingForm), bookingForm.resourceId);
  };

  const handleResetFilters = async () => {
    setResourceFilters(DEFAULT_RESOURCE_FILTERS);
    await fetchResources(buildResourceSearchFilters(DEFAULT_RESOURCE_FILTERS, bookingForm), bookingForm.resourceId);
  };

  const handleSubmitBooking = async (event) => {
    event.preventDefault();

    if (!bookingForm.resourceId) {
      toast.error('Select a resource before submitting the request.');
      return;
    }

    if (!bookingForm.bookingDate || !bookingForm.startTime || !bookingForm.endTime || !bookingForm.purpose.trim()) {
      toast.error('Complete the resource, date, time, and purpose fields.');
      return;
    }

    const expectedAttendees = Number(bookingForm.expectedAttendees);
    if (!Number.isFinite(expectedAttendees) || expectedAttendees <= 0) {
      toast.error('Expected attendees must be greater than zero.');
      return;
    }

    const payload = {
      resourceId: bookingForm.resourceId,
      bookingDate: bookingForm.bookingDate,
      startTime: bookingForm.startTime,
      endTime: bookingForm.endTime,
      purpose: bookingForm.purpose.trim(),
      expectedAttendees,
    };

    setSubmitting(true);
    try {
      const response =
        composerMode === 'edit' && editingBookingId
          ? await updateBooking(editingBookingId, payload)
          : await createBooking(payload);

      toast.success(
        response.message || (composerMode === 'edit' ? 'Booking request updated.' : 'Booking request submitted.')
      );

      setBookingStatusFilter('ALL');
      await Promise.all([
        fetchBookings('ALL'),
        fetchResources(buildResourceSearchFilters(DEFAULT_RESOURCE_FILTERS, payload), payload.resourceId),
      ]);
      resetComposerState();
    } catch (error) {
      toast.error(
        extractApiErrorMessage(
          error,
          composerMode === 'edit' ? 'Failed to update booking request.' : 'Failed to submit booking request.'
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    const reason = window.prompt('Optional cancellation reason:');
    if (reason === null) return;

    setActionBookingId(bookingId);
    try {
      const response = await cancelBooking(bookingId, { reason: reason.trim() });
      toast.success(response.message || 'Booking cancelled.');
      await fetchBookings(bookingStatusFilter);
    } catch (error) {
      toast.error(extractApiErrorMessage(error, 'Failed to cancel booking.'));
    } finally {
      setActionBookingId('');
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    if (!window.confirm('Delete this booking request?')) return;

    setActionBookingId(bookingId);
    try {
      const response = await deleteBooking(bookingId);
      toast.success(response.message || 'Booking deleted.');
      await fetchBookings(bookingStatusFilter);
    } catch (error) {
      toast.error(extractApiErrorMessage(error, 'Failed to delete booking.'));
    } finally {
      setActionBookingId('');
    }
  };

  const refreshAll = async () => {
    await Promise.all([
      fetchResources(buildResourceSearchFilters(resourceFilters, bookingForm), bookingForm.resourceId),
      fetchBookings(bookingStatusFilter),
    ]);
  };

  return (
    <div className="booking-page">
      <header className="booking-page__banner">
        <div>
          <p className="booking-page__eyebrow">Booking management</p>
          <h1 className="booking-page__title">My Booking Requests</h1>
          <p className="booking-page__subtitle">
            Create new booking requests, track admin decisions, re-book rejected requests, and keep
            approved reservations ready with a QR code.
          </p>
        </div>
        <div className="booking-page__banner-card">
          <span className="booking-page__banner-label">Signed in as</span>
          <strong>{user?.name}</strong>
          <span>{user?.email}</span>
        </div>
      </header>

      <section className="booking-page__cta">
        <div>
          <p className="booking-page__cta-label">Quick action</p>
          <h2 className="booking-page__cta-title">Create a new booking request</h2>
          <p className="booking-page__cta-text">
            Start a fresh request before checking your resource counts and request history below.
          </p>
        </div>
        <button type="button" className="btn btn--primary booking-page__cta-button" onClick={openCreateComposer}>
          + Create Booking Request
        </button>
      </section>

      <section className="booking-page__stats">
        <StatCard icon="R" label="Active Resources" value={bookingStats.activeResources} color="#2563eb" />
        <StatCard icon="P" label="Pending Requests" value={bookingStats.pending} color="#f59e0b" />
        <StatCard icon="A" label="Approved Bookings" value={bookingStats.approved} color="#10b981" />
        <StatCard icon="X" label="Rejected Requests" value={bookingStats.rejected} color="#ef4444" />
      </section>

      <section className="booking-section booking-section--flush">
        <div className="booking-page__toolbar">
          <div>
            <h2>Request history</h2>
            <p>Pending requests can be edited, rejected requests can be submitted again, and approved bookings stay locked.</p>
          </div>
          <div className="booking-page__toolbar-actions">
            <select
              className="adm-select"
              value={bookingStatusFilter}
              onChange={(event) => setBookingStatusFilter(event.target.value)}
            >
              {BOOKING_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button type="button" className="btn btn--ghost" onClick={refreshAll}>
              Refresh
            </button>
          </div>
        </div>

        {bookingsLoading ? (
          <div className="skeleton-list">
            {[1, 2, 3].map((item) => (
              <div key={item} className="skeleton-item" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="empty-state">
            <h3>No booking requests yet</h3>
            <p>Your latest requests will appear here after you submit one.</p>
          </div>
        ) : (
          <div className="adm-table-wrapper">
            <table className="adm-table" aria-label="My booking requests">
              <thead>
                <tr>
                  <th>Resource</th>
                  <th>Schedule</th>
                  <th>Status</th>
                  <th>Request Details</th>
                  <th>Admin Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => {
                  const busy = actionBookingId === booking.id;
                  const isPending = booking.status === 'PENDING';
                  const isApproved = booking.status === 'APPROVED';
                  const isRejected = booking.status === 'REJECTED';

                  return (
                    <tr key={booking.id} className="adm-table__row">
                      <td>
                        <p className="adm-table__cell-title">{booking.resourceName}</p>
                        <p className="adm-table__cell-msg adm-table__cell-msg--wrap">
                          {getResourceTypeLabel(booking.resourceType)} | {booking.resourceLocation}
                        </p>
                      </td>
                      <td>
                        <p className="adm-table__cell-title">
                          {formatSchedule(booking.bookingDate, booking.startTime, booking.endTime)}
                        </p>
                        <p className="adm-table__cell-time">Requested {formatDistanceToNow(booking.createdAt)}</p>
                      </td>
                      <td>
                        <span
                          className={`booking-badge booking-badge--table booking-badge--${String(
                            booking.status || ''
                          ).toLowerCase()}`}
                        >
                          {getBookingStatusLabel(booking.status)}
                        </span>
                        {booking.reviewedByAdminName && (
                          <p className="adm-table__cell-time booking-table__reviewed-by">
                            Reviewed by {booking.reviewedByAdminName}
                          </p>
                        )}
                      </td>
                      <td>
                        <p className="adm-table__cell-msg adm-table__cell-msg--wrap">{booking.purpose}</p>
                        <p className="adm-table__cell-time">Attendees: {booking.expectedAttendees || 'N/A'}</p>
                      </td>
                      <td>
                        {booking.adminDecisionReason ? (
                          <div className="booking-table-note booking-table-note--danger">
                            <strong>{isRejected ? 'Reject reason' : 'Admin note'}</strong>
                            <p>{booking.adminDecisionReason}</p>
                          </div>
                        ) : booking.cancellationReason ? (
                          <div className="booking-table-note booking-table-note--muted">
                            <strong>Cancellation note</strong>
                            <p>{booking.cancellationReason}</p>
                          </div>
                        ) : (
                          <span className="booking-empty-cell">
                            {isPending ? 'Waiting for admin review' : 'No notes'}
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="adm-table__actions">
                          {isPending && (
                            <button
                              type="button"
                              className="btn btn--sm btn--ghost"
                              disabled={busy}
                              onClick={() => handleEditBooking(booking)}
                            >
                              Edit
                            </button>
                          )}

                          {isRejected && (
                            <button
                              type="button"
                              className="btn btn--sm btn--success-ghost"
                              disabled={busy}
                              onClick={() => handleRebook(booking)}
                            >
                              Re-book
                            </button>
                          )}

                          {isApproved && (
                            <button
                              type="button"
                              className="btn btn--sm btn--primary"
                              disabled={busy}
                              onClick={() => setQrBooking(booking)}
                            >
                              QR Code
                            </button>
                          )}

                          {isApproved && (
                            <button
                              type="button"
                              className="btn btn--sm btn--ghost"
                              disabled={busy}
                              onClick={() => handleCancelBooking(booking.id)}
                            >
                              {busy ? 'Working...' : 'Cancel'}
                            </button>
                          )}

                          {!isApproved && (
                            <button
                              type="button"
                              className="btn btn--sm btn--danger-ghost"
                              disabled={busy}
                              onClick={() => handleDeleteBooking(booking.id)}
                            >
                              {busy ? 'Working...' : 'Delete'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {composerOpen && (
        <div className="booking-composer-modal" role="presentation" onClick={resetComposerState}>
          <div
            ref={composerRef}
            className="booking-composer-modal__card"
            role="dialog"
            aria-modal="true"
            aria-label={composerTitle}
            tabIndex={-1}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="booking-composer">
              <div className="booking-composer__header">
                <div>
                  <h3>{composerTitle}</h3>
                  <p>
                    Search active resources for the selected date and time, then submit the request from
                    this panel.
                  </p>
                </div>
                <button
                  type="button"
                  className="booking-composer__close"
                  aria-label="Close create booking request"
                  onClick={resetComposerState}
                >
                  x
                </button>
              </div>

              <div className="booking-composer__grid">
                <section className="booking-composer__panel">
                  <div className="booking-composer__panel-header">
                    <div>
                      <span className="booking-composer__step">Step 1</span>
                      <h4>Find a resource</h4>
                      <p>Resource search uses the date and time from the request form.</p>
                    </div>
                  </div>

                  <form className="booking-resource-filters" onSubmit={handleSearchResources}>
                    <div className="booking-form-grid">
                      <label className="booking-field">
                        <span>Resource type</span>
                        <select name="type" value={resourceFilters.type} onChange={handleResourceFilterChange}>
                          {RESOURCE_TYPE_OPTIONS.map((option) => (
                            <option key={option.value || 'all'} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="booking-field">
                        <span>Location</span>
                        <input
                          type="text"
                          name="location"
                          placeholder="Library, Block A..."
                          value={resourceFilters.location}
                          onChange={handleResourceFilterChange}
                        />
                      </label>

                      <label className="booking-field">
                        <span>Minimum capacity</span>
                        <input
                          type="number"
                          name="minCapacity"
                          min="1"
                          value={resourceFilters.minCapacity}
                          onChange={handleResourceFilterChange}
                        />
                      </label>

                      <label className="booking-field">
                        <span>Available resource</span>
                        <select
                          name="resourceId"
                          value={bookingForm.resourceId}
                          onChange={handleBookingFormChange}
                          disabled={resourcesLoading || resources.length === 0}
                        >
                          {resources.length === 0 && <option value="">No matching active resources</option>}
                          {resources.map((resource) => (
                            <option key={resource.id} value={resource.id}>
                              {resource.name} | {resource.location}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <div className="booking-resource-filters__actions">
                      <button type="submit" className="btn btn--ghost" disabled={resourcesLoading}>
                        {resourcesLoading ? 'Searching...' : 'Search matching resources'}
                      </button>
                      <button type="button" className="btn btn--ghost btn--sm" onClick={handleResetFilters}>
                        Reset filters
                      </button>
                    </div>
                  </form>

                  <div className="booking-resource-browser">
                    <div className="booking-resource-browser__header">
                      <div>
                        <h5>Currently loaded active resources</h5>
                        <p>
                          Until the Facilities & Assets Catalogue module is fully integrated, the booking page
                          shows the active resources currently available through this API.
                        </p>
                      </div>
                      <span className="booking-resource-browser__count">{resources.length} resources</span>
                    </div>

                    {resourcesLoading ? (
                      <div className="skeleton-list">
                        {[1, 2].map((item) => (
                          <div key={item} className="skeleton-item" />
                        ))}
                      </div>
                    ) : resources.length === 0 ? (
                      <div className="booking-placeholder">
                        <p>No active resources matched this search.</p>
                        <span>Try changing the type, location, date, or capacity filters.</span>
                      </div>
                    ) : (
                      <div className="resource-grid">
                        {resources.map((resource) => {
                          const isSelected = resource.id === bookingForm.resourceId;

                          return (
                            <article
                              key={resource.id}
                              className={`resource-card ${isSelected ? 'resource-card--selected' : ''}`}
                            >
                              <div className="resource-card__top">
                                <div>
                                  <p className="resource-card__name">{resource.name}</p>
                                  <p className="resource-card__type">{getResourceTypeLabel(resource.type)}</p>
                                </div>
                                <span
                                  className={`booking-badge booking-badge--resource booking-badge--${String(
                                    resource.status || ''
                                  ).toLowerCase()}`}
                                >
                                  {getResourceStatusLabel(resource.status)}
                                </span>
                              </div>

                              <div className="resource-card__meta">
                                <span>{resource.location}</span>
                                <span>Capacity {resource.capacity || 'N/A'}</span>
                                <span>
                                  {formatTime(resource.availabilityStart)} - {formatTime(resource.availabilityEnd)}
                                </span>
                              </div>

                              <button
                                type="button"
                                className={`btn btn--sm ${isSelected ? 'btn--ghost' : 'btn--primary'}`}
                                onClick={() => handleSelectResource(resource.id)}
                              >
                                {isSelected ? 'Selected' : 'Choose resource'}
                              </button>
                            </article>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {!selectedResource ? (
                    <div className="booking-placeholder">
                      <p>No active resource selected.</p>
                      <span>Search again or choose another date and time if you need more options.</span>
                    </div>
                  ) : (
                    <div className="booking-resource-summary">
                      <div>
                        <p className="booking-resource-summary__name">{selectedResource.name}</p>
                        <p className="booking-resource-summary__meta">
                          {getResourceTypeLabel(selectedResource.type)} | {selectedResource.location}
                        </p>
                      </div>
                      <div className="booking-resource-summary__details">
                        <span>Capacity: {selectedResource.capacity || 'N/A'}</span>
                        <span>
                          Open: {formatTime(selectedResource.availabilityStart)} -{' '}
                          {formatTime(selectedResource.availabilityEnd)}
                        </span>
                      </div>
                    </div>
                  )}
                </section>

                <form className="booking-composer__panel" onSubmit={handleSubmitBooking}>
                  <div className="booking-composer__panel-header">
                    <div>
                      <span className="booking-composer__step">Step 2</span>
                      <h4>Request details</h4>
                      <p>Approved requests cannot be edited later, so double-check the schedule before saving.</p>
                    </div>
                  </div>

                  <div className="booking-form-grid">
                    <label className="booking-field">
                      <span>Booking date</span>
                      <input
                        type="date"
                        name="bookingDate"
                        value={bookingForm.bookingDate}
                        onChange={handleBookingFormChange}
                        min={toInputDate(new Date())}
                      />
                    </label>

                    <label className="booking-field">
                      <span>Start time</span>
                      <input
                        type="time"
                        name="startTime"
                        value={bookingForm.startTime}
                        onChange={handleBookingFormChange}
                      />
                    </label>

                    <label className="booking-field">
                      <span>End time</span>
                      <input
                        type="time"
                        name="endTime"
                        value={bookingForm.endTime}
                        onChange={handleBookingFormChange}
                      />
                    </label>

                    <label className="booking-field">
                      <span>Expected attendees</span>
                      <input
                        type="number"
                        name="expectedAttendees"
                        min="1"
                        value={bookingForm.expectedAttendees}
                        onChange={handleBookingFormChange}
                      />
                    </label>

                    <label className="booking-field booking-field--full">
                      <span>Purpose</span>
                      <textarea
                        name="purpose"
                        rows="4"
                        maxLength="250"
                        placeholder="Add a short purpose for the booking request."
                        value={bookingForm.purpose}
                        onChange={handleBookingFormChange}
                      />
                    </label>
                  </div>

                  <div className="booking-composer__panel-footer">
                    <button type="button" className="btn btn--ghost" onClick={resetComposerState}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn--primary" disabled={submitting}>
                      {submitLabel}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {qrBooking && (
        <div className="booking-qr-modal" role="presentation" onClick={() => setQrBooking(null)}>
          <div
            className="booking-qr-modal__card"
            role="dialog"
            aria-modal="true"
            aria-label="Approved booking QR code"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="booking-qr-modal__header">
              <div>
                <h3>{qrBooking.resourceName}</h3>
                <p>{formatSchedule(qrBooking.bookingDate, qrBooking.startTime, qrBooking.endTime)}</p>
              </div>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setQrBooking(null)}>
                Close
              </button>
            </div>

            <div className="booking-qr-modal__body">
              {qrLoading ? (
                <div className="booking-qr-modal__placeholder">Generating QR code...</div>
              ) : (
                <img src={qrCodeUrl} alt={`${qrBooking.resourceName} booking QR code`} className="booking-qr-modal__image" />
              )}

              <div className="booking-qr-modal__meta">
                <p className="adm-table__cell-title">{qrBooking.resourceLocation}</p>
                <p className="adm-table__cell-msg adm-table__cell-msg--wrap">{qrBooking.purpose}</p>
                <p className="adm-table__cell-time">
                  Show this QR code when you need to verify the approved booking.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
