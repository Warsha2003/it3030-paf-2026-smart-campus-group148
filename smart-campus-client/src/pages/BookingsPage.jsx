import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import StatCard from '../components/StatCard';
import {
  cancelBooking,
  createBooking,
  deleteBooking,
  getMyBookings,
} from '../services/bookingApi';
import { getResources } from '../services/resourceApi';
import { useAuth } from '../hooks/useAuth';
import { extractApiErrorMessage } from '../utils/apiErrorUtils';
import {
  BOOKING_STATUS_OPTIONS,
  RESOURCE_STATUS_OPTIONS,
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

const getDefaultBookingDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return toInputDate(date);
};

const createDefaultBookingForm = () => ({
  resourceId: '',
  bookingDate: getDefaultBookingDate(),
  startTime: '09:00',
  endTime: '10:00',
  purpose: '',
  expectedAttendees: '1',
});

const DEFAULT_RESOURCE_FILTERS = {
  type: '',
  location: '',
  minCapacity: '',
  status: 'ACTIVE',
  availableDate: '',
  startTime: '',
  endTime: '',
};

export default function BookingsPage() {
  const { user } = useAuth();

  const [resources, setResources] = useState([]);
  const [resourcesLoading, setResourcesLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [resourceFilters, setResourceFilters] = useState(DEFAULT_RESOURCE_FILTERS);
  const [bookingForm, setBookingForm] = useState(createDefaultBookingForm);
  const [bookingStatusFilter, setBookingStatusFilter] = useState('ALL');
  const [submitting, setSubmitting] = useState(false);
  const [actionBookingId, setActionBookingId] = useState('');

  const fetchResources = useCallback(async (filters) => {
    setResourcesLoading(true);
    try {
      const response = await getResources(filters);
      const nextResources = response.data || [];
      setResources(nextResources);
      setBookingForm((current) => {
        const selectedExists = nextResources.some((resource) => resource.id === current.resourceId);
        return {
          ...current,
          resourceId: selectedExists ? current.resourceId : nextResources[0]?.id || '',
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
      toast.error(extractApiErrorMessage(error, 'Failed to load your bookings.'));
    } finally {
      setBookingsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResources(DEFAULT_RESOURCE_FILTERS);
  }, [fetchResources]);

  useEffect(() => {
    fetchBookings(bookingStatusFilter);
  }, [bookingStatusFilter, fetchBookings]);

  const selectedResource = useMemo(
    () => resources.find((resource) => resource.id === bookingForm.resourceId) || null,
    [resources, bookingForm.resourceId]
  );

  const bookingStats = useMemo(() => {
    const pending = bookings.filter((booking) => booking.status === 'PENDING').length;
    const approved = bookings.filter((booking) => booking.status === 'APPROVED').length;
    const activeResources = resources.filter((resource) => resource.status === 'ACTIVE').length;

    return {
      activeResources,
      pending,
      approved,
      total: bookings.length,
    };
  }, [bookings, resources]);

  const handleResourceFilterChange = (event) => {
    const { name, value } = event.target;
    setResourceFilters((current) => ({ ...current, [name]: value }));
  };

  const handleBookingFormChange = (event) => {
    const { name, value } = event.target;
    setBookingForm((current) => ({ ...current, [name]: value }));
  };

  const handleSearchResources = async (event) => {
    event.preventDefault();
    await fetchResources(resourceFilters);
  };

  const handleResetFilters = async () => {
    setResourceFilters(DEFAULT_RESOURCE_FILTERS);
    await fetchResources(DEFAULT_RESOURCE_FILTERS);
  };

  const handleSelectResource = (resourceId) => {
    setBookingForm((current) => ({ ...current, resourceId }));
  };

  const handleCreateBooking = async (event) => {
    event.preventDefault();

    if (!bookingForm.resourceId) {
      toast.error('Select a resource before submitting the request.');
      return;
    }

    if (!bookingForm.bookingDate || !bookingForm.startTime || !bookingForm.endTime || !bookingForm.purpose.trim()) {
      toast.error('Complete the booking date, time, and purpose fields.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await createBooking({
        resourceId: bookingForm.resourceId,
        bookingDate: bookingForm.bookingDate,
        startTime: bookingForm.startTime,
        endTime: bookingForm.endTime,
        purpose: bookingForm.purpose.trim(),
        expectedAttendees: Number(bookingForm.expectedAttendees),
      });

      toast.success(response.message || 'Booking request submitted.');
      setBookingForm((current) => ({
        ...current,
        purpose: '',
        expectedAttendees: '1',
      }));
      setBookingStatusFilter('ALL');
      await fetchBookings('ALL');
    } catch (error) {
      toast.error(extractApiErrorMessage(error, 'Failed to submit booking request.'));
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
    if (!window.confirm('Delete this booking record?')) return;

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
      fetchResources(resourceFilters),
      fetchBookings(bookingStatusFilter),
    ]);
  };

  return (
    <div className="booking-page">
      <header className="booking-page__banner">
        <div>
          <p className="booking-page__eyebrow">Booking management</p>
          <h1 className="booking-page__title">Plan, request, and track campus reservations</h1>
          <p className="booking-page__subtitle">
            Submit resource requests for classes, meetings, labs, and study sessions. Admin approval
            updates will appear here and in your notifications.
          </p>
        </div>
        <div className="booking-page__banner-card">
          <span className="booking-page__banner-label">Signed in as</span>
          <strong>{user?.name}</strong>
          <span>{user?.email}</span>
        </div>
      </header>

      <section className="booking-page__stats">
        <StatCard icon="R" label="Active Resources" value={bookingStats.activeResources} color="#4f46e5" />
        <StatCard icon="P" label="Pending Requests" value={bookingStats.pending} color="#f59e0b" />
        <StatCard icon="A" label="Approved Bookings" value={bookingStats.approved} color="#10b981" />
        <StatCard icon="T" label="My Booking Records" value={bookingStats.total} color="#0ea5e9" />
      </section>

      <section className="booking-page__workspace">
        <div className="booking-page__sidebar">
          <form className="booking-panel" onSubmit={handleSearchResources}>
            <div className="booking-panel__header">
              <h2>Find a resource</h2>
              <button type="button" className="btn btn--ghost btn--sm" onClick={handleResetFilters}>
                Reset
              </button>
            </div>

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
                <span>Status</span>
                <select name="status" value={resourceFilters.status} onChange={handleResourceFilterChange}>
                  {RESOURCE_STATUS_OPTIONS.map((option) => (
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
                <span>Available date</span>
                <input
                  type="date"
                  name="availableDate"
                  value={resourceFilters.availableDate}
                  onChange={handleResourceFilterChange}
                />
              </label>

              <label className="booking-field">
                <span>Start time</span>
                <input
                  type="time"
                  name="startTime"
                  value={resourceFilters.startTime}
                  onChange={handleResourceFilterChange}
                />
              </label>

              <label className="booking-field">
                <span>End time</span>
                <input
                  type="time"
                  name="endTime"
                  value={resourceFilters.endTime}
                  onChange={handleResourceFilterChange}
                />
              </label>
            </div>

            <button type="submit" className="btn btn--primary booking-panel__submit">
              Search Resources
            </button>
          </form>

          <form className="booking-panel" onSubmit={handleCreateBooking}>
            <div className="booking-panel__header">
              <h2>Create booking request</h2>
              <span className="booking-panel__hint">Selected resource required</span>
            </div>

            {!selectedResource ? (
              <div className="booking-placeholder">
                <p>No resource selected yet.</p>
                <span>Choose an available resource card to start your request.</span>
              </div>
            ) : (
              <>
                <div className="booking-resource-summary">
                  <div>
                    <p className="booking-resource-summary__name">{selectedResource.name}</p>
                    <p className="booking-resource-summary__meta">
                      {getResourceTypeLabel(selectedResource.type)} · {selectedResource.location}
                    </p>
                  </div>
                  <span
                    className={`booking-badge booking-badge--resource booking-badge--${String(
                      selectedResource.status || ''
                    ).toLowerCase()}`}
                  >
                    {getResourceStatusLabel(selectedResource.status)}
                  </span>
                </div>

                <div className="booking-resource-summary__details">
                  <span>Capacity: {selectedResource.capacity || 'N/A'}</span>
                  <span>
                    Hours: {formatTime(selectedResource.availabilityStart)} - {formatTime(selectedResource.availabilityEnd)}
                  </span>
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

                <button type="submit" className="btn btn--primary booking-panel__submit" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Booking Request'}
                </button>
              </>
            )}
          </form>
        </div>

        <div className="booking-page__content">
          <section className="booking-section">
            <div className="booking-section__header">
              <div>
                <h2>Available resources</h2>
                <p>{resources.length} matching resource{resources.length !== 1 ? 's' : ''}</p>
              </div>
              <button type="button" className="btn btn--ghost" onClick={refreshAll}>
                Refresh
              </button>
            </div>

            {resourcesLoading ? (
              <div className="skeleton-list">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="skeleton-item" />
                ))}
              </div>
            ) : resources.length === 0 ? (
              <div className="empty-state">
                <h3>No resources match these filters</h3>
                <p>Try changing the date, time window, or capacity.</p>
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
                        className={`btn ${isSelected ? 'btn--ghost' : 'btn--primary'}`}
                        onClick={() => handleSelectResource(resource.id)}
                      >
                        {isSelected ? 'Selected' : 'Choose Resource'}
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section className="booking-section">
            <div className="booking-section__header">
              <div>
                <h2>My bookings</h2>
                <p>Track pending, approved, rejected, and cancelled requests.</p>
              </div>
              <div className="booking-section__actions">
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
                <button type="button" className="btn btn--ghost" onClick={() => fetchBookings(bookingStatusFilter)}>
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
                <p>Your submitted requests will appear here once you create one.</p>
              </div>
            ) : (
              <div className="booking-list">
                {bookings.map((booking) => {
                  const busy = actionBookingId === booking.id;
                  const canCancel = booking.status === 'APPROVED';
                  const canDelete = booking.status !== 'APPROVED';

                  return (
                    <article key={booking.id} className="booking-card">
                      <div className="booking-card__top">
                        <div>
                          <p className="booking-card__title">{booking.resourceName}</p>
                          <p className="booking-card__subtitle">
                            {getResourceTypeLabel(booking.resourceType)} · {booking.resourceLocation}
                          </p>
                        </div>
                        <span
                          className={`booking-badge booking-badge--${String(booking.status || '').toLowerCase()}`}
                        >
                          {getBookingStatusLabel(booking.status)}
                        </span>
                      </div>

                      <div className="booking-card__meta">
                        <span>{formatSchedule(booking.bookingDate, booking.startTime, booking.endTime)}</span>
                        <span>Attendees: {booking.expectedAttendees || 'N/A'}</span>
                        <span>Requested {formatDistanceToNow(booking.createdAt)}</span>
                      </div>

                      <div className="booking-card__body">
                        <div>
                          <strong>Purpose</strong>
                          <p>{booking.purpose}</p>
                        </div>

                        {booking.adminDecisionReason && (
                          <div className="booking-card__note booking-card__note--warning">
                            <strong>Decision note</strong>
                            <p>{booking.adminDecisionReason}</p>
                          </div>
                        )}

                        {booking.cancellationReason && (
                          <div className="booking-card__note booking-card__note--muted">
                            <strong>Cancellation note</strong>
                            <p>{booking.cancellationReason}</p>
                          </div>
                        )}
                      </div>

                      <div className="booking-card__footer">
                        <span>
                          {booking.reviewedByAdminName
                            ? `Reviewed by ${booking.reviewedByAdminName}`
                            : 'Awaiting admin review'}
                        </span>

                        <div className="booking-card__actions">
                          {canCancel && (
                            <button
                              type="button"
                              className="btn btn--ghost"
                              disabled={busy}
                              onClick={() => handleCancelBooking(booking.id)}
                            >
                              {busy ? 'Working...' : 'Cancel'}
                            </button>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              className="btn btn--danger-ghost"
                              disabled={busy}
                              onClick={() => handleDeleteBooking(booking.id)}
                            >
                              {busy ? 'Working...' : 'Delete'}
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}
