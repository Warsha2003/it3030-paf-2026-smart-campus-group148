import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import {
  cancelBooking,
  deleteBooking,
  getAllBookings,
  reviewBooking,
} from '../services/bookingApi';
import { extractApiErrorMessage } from '../utils/apiErrorUtils';
import {
  ADMIN_BOOKING_STATUS_OPTIONS,
  getBookingStatusLabel,
  getResourceTypeLabel,
} from '../utils/bookingUtils';
import { formatDate, formatDistanceToNow, formatSchedule } from '../utils/dateUtils';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [bookingDateFilter, setBookingDateFilter] = useState('');
  const [actionBookingId, setActionBookingId] = useState('');

  const fetchBookings = useCallback(async (filters = {}) => {
    setLoading(true);
    try {
      const response = await getAllBookings(filters);
      setBookings(response.data || []);
    } catch (error) {
      toast.error(extractApiErrorMessage(error, 'Failed to load booking requests.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings({
      status: statusFilter || undefined,
      bookingDate: bookingDateFilter || undefined,
    });
  }, [statusFilter, bookingDateFilter, fetchBookings]);

  const stats = useMemo(() => {
    const pending = bookings.filter((booking) => booking.status === 'PENDING').length;
    const approved = bookings.filter((booking) => booking.status === 'APPROVED').length;
    const rejected = bookings.filter((booking) => booking.status === 'REJECTED').length;

    return {
      total: bookings.length,
      pending,
      approved,
      rejected,
    };
  }, [bookings]);

  const handleApprove = async (bookingId) => {
    if (!window.confirm('Approve this booking request?')) return;

    setActionBookingId(bookingId);
    try {
      const response = await reviewBooking(bookingId, { status: 'APPROVED', reason: '' });
      toast.success(response.message || 'Booking approved.');
      await fetchBookings({
        status: statusFilter || undefined,
        bookingDate: bookingDateFilter || undefined,
      });
    } catch (error) {
      toast.error(extractApiErrorMessage(error, 'Failed to approve booking.'));
    } finally {
      setActionBookingId('');
    }
  };

  const handleReject = async (bookingId) => {
    const reason = window.prompt('Add a rejection reason:');
    if (reason === null) return;
    if (!reason.trim()) {
      toast.error('A rejection reason is required.');
      return;
    }

    setActionBookingId(bookingId);
    try {
      const response = await reviewBooking(bookingId, { status: 'REJECTED', reason: reason.trim() });
      toast.success(response.message || 'Booking rejected.');
      await fetchBookings({
        status: statusFilter || undefined,
        bookingDate: bookingDateFilter || undefined,
      });
    } catch (error) {
      toast.error(extractApiErrorMessage(error, 'Failed to reject booking.'));
    } finally {
      setActionBookingId('');
    }
  };

  const handleCancel = async (bookingId) => {
    const reason = window.prompt('Optional cancellation reason:');
    if (reason === null) return;

    setActionBookingId(bookingId);
    try {
      const response = await cancelBooking(bookingId, { reason: reason.trim() });
      toast.success(response.message || 'Booking cancelled.');
      await fetchBookings({
        status: statusFilter || undefined,
        bookingDate: bookingDateFilter || undefined,
      });
    } catch (error) {
      toast.error(extractApiErrorMessage(error, 'Failed to cancel booking.'));
    } finally {
      setActionBookingId('');
    }
  };

  const handleDelete = async (bookingId) => {
    if (!window.confirm('Delete this booking record?')) return;

    setActionBookingId(bookingId);
    try {
      const response = await deleteBooking(bookingId);
      toast.success(response.message || 'Booking deleted.');
      await fetchBookings({
        status: statusFilter || undefined,
        bookingDate: bookingDateFilter || undefined,
      });
    } catch (error) {
      toast.error(extractApiErrorMessage(error, 'Failed to delete booking.'));
    } finally {
      setActionBookingId('');
    }
  };

  return (
    <div className="adm-layout">
      <Sidebar />

      <main className="adm-content">
        <header className="adm-page-header">
          <div>
            <h1 className="adm-page-header__title">Booking Management</h1>
            <p className="adm-page-header__sub">
              Review pending requests, monitor approved schedules, and resolve conflicts quickly.
            </p>
          </div>
          <div className="adm-page-header__actions">
            <select
              className="adm-select"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              {ADMIN_BOOKING_STATUS_OPTIONS.map((option) => (
                <option key={option.value || 'all'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <input
              className="adm-date-input"
              type="date"
              value={bookingDateFilter}
              onChange={(event) => setBookingDateFilter(event.target.value)}
            />
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() =>
                fetchBookings({
                  status: statusFilter || undefined,
                  bookingDate: bookingDateFilter || undefined,
                })
              }
            >
              Refresh
            </button>
          </div>
        </header>

        <section className="adm-stats">
          <StatCard icon="B" label="All Requests" value={stats.total} color="#4f46e5" loading={loading} />
          <StatCard icon="P" label="Pending Review" value={stats.pending} color="#f59e0b" loading={loading} />
          <StatCard icon="A" label="Approved" value={stats.approved} color="#10b981" loading={loading} />
          <StatCard icon="R" label="Rejected" value={stats.rejected} color="#ef4444" loading={loading} />
        </section>

        {!loading && (
          <p className="adm-results-count">
            Showing <strong>{bookings.length}</strong> booking request{bookings.length !== 1 ? 's' : ''}
          </p>
        )}

        {loading ? (
          <div className="skeleton-list">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="skeleton-item" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="empty-state">
            <h3>No booking requests found</h3>
            <p>Try another status or date filter.</p>
          </div>
        ) : (
          <div className="adm-table-wrapper">
            <table className="adm-table" aria-label="Bookings table">
              <thead>
                <tr>
                  <th>Requester</th>
                  <th>Resource</th>
                  <th>Schedule</th>
                  <th>Status</th>
                  <th>Purpose</th>
                  <th>Review Details</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => {
                  const busy = actionBookingId === booking.id;
                  const isPending = booking.status === 'PENDING';
                  const isApproved = booking.status === 'APPROVED';

                  return (
                    <tr key={booking.id} className="adm-table__row">
                      <td>
                        <div className="adm-booking-person">
                          <p className="adm-table__cell-title">{booking.userName}</p>
                          <p className="adm-table__cell-email">{booking.userEmail}</p>
                        </div>
                      </td>
                      <td>
                        <p className="adm-table__cell-title">{booking.resourceName}</p>
                        <p className="adm-table__cell-msg">
                          {getResourceTypeLabel(booking.resourceType)} · {booking.resourceLocation}
                        </p>
                      </td>
                      <td>
                        <p className="adm-table__cell-title">
                          {formatSchedule(booking.bookingDate, booking.startTime, booking.endTime)}
                        </p>
                        <p className="adm-table__cell-time">
                          Requested {formatDistanceToNow(booking.createdAt)}
                        </p>
                      </td>
                      <td>
                        <span
                          className={`booking-badge booking-badge--table booking-badge--${String(
                            booking.status || ''
                          ).toLowerCase()}`}
                        >
                          {getBookingStatusLabel(booking.status)}
                        </span>
                      </td>
                      <td>
                        <p className="adm-table__cell-msg adm-table__cell-msg--wrap">{booking.purpose}</p>
                        <p className="adm-table__cell-time">Attendees: {booking.expectedAttendees || 'N/A'}</p>
                      </td>
                      <td>
                        {booking.reviewedByAdminName ? (
                          <div className="adm-booking-note">
                            <p className="adm-table__cell-title">{booking.reviewedByAdminName}</p>
                            <p className="adm-table__cell-time">
                              {booking.reviewedAt ? formatDate(booking.reviewedAt) : 'Reviewed'}
                            </p>
                            {booking.adminDecisionReason && (
                              <p className="adm-table__cell-msg adm-table__cell-msg--wrap">
                                {booking.adminDecisionReason}
                              </p>
                            )}
                          </div>
                        ) : booking.cancellationReason ? (
                          <div className="adm-booking-note">
                            <p className="adm-table__cell-title">Cancelled</p>
                            <p className="adm-table__cell-msg adm-table__cell-msg--wrap">
                              {booking.cancellationReason}
                            </p>
                          </div>
                        ) : (
                          <span className="adm-table__cell-time">Awaiting review</span>
                        )}
                      </td>
                      <td>
                        <div className="adm-table__actions">
                          {isPending && (
                            <>
                              <button
                                type="button"
                                className="btn btn--sm btn--success-ghost"
                                disabled={busy}
                                onClick={() => handleApprove(booking.id)}
                              >
                                {busy ? 'Working...' : 'Approve'}
                              </button>
                              <button
                                type="button"
                                className="btn btn--sm btn--danger-ghost"
                                disabled={busy}
                                onClick={() => handleReject(booking.id)}
                              >
                                {busy ? 'Working...' : 'Reject'}
                              </button>
                            </>
                          )}

                          {isApproved && (
                            <button
                              type="button"
                              className="btn btn--sm btn--ghost"
                              disabled={busy}
                              onClick={() => handleCancel(booking.id)}
                            >
                              {busy ? 'Working...' : 'Cancel'}
                            </button>
                          )}

                          {!isApproved && (
                            <button
                              type="button"
                              className="btn btn--sm btn--danger-ghost"
                              disabled={busy}
                              onClick={() => handleDelete(booking.id)}
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

        <footer className="adm-footer">Smart Campus Admin Panel · Booking Management</footer>
      </main>
    </div>
  );
}
