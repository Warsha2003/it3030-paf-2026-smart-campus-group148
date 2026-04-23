const toLabel = (value) =>
  value
    ?.toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || '';

export const BOOKING_STATUS_META = {
  PENDING: { label: 'Pending' },
  APPROVED: { label: 'Approved' },
  REJECTED: { label: 'Rejected' },
  CANCELLED: { label: 'Cancelled' },
};

export const RESOURCE_STATUS_META = {
  ACTIVE: { label: 'Active' },
  OUT_OF_SERVICE: { label: 'Out Of Service' },
};

export const RESOURCE_TYPE_META = {
  LECTURE_HALL: { label: 'Lecture Hall' },
  LAB: { label: 'Lab' },
  MEETING_ROOM: { label: 'Meeting Room' },
  EQUIPMENT: { label: 'Equipment' },
  STUDY_ROOM: { label: 'Study Room' },
  PROJECTOR: { label: 'Projector' },
  CAMERA: { label: 'Camera' },
  OTHER: { label: 'Other' },
};

export const BOOKING_STATUS_OPTIONS = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export const ADMIN_BOOKING_STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export const RESOURCE_TYPE_OPTIONS = [
  { value: '', label: 'All resource types' },
  { value: 'LECTURE_HALL', label: 'Lecture Hall' },
  { value: 'LAB', label: 'Lab' },
  { value: 'MEETING_ROOM', label: 'Meeting Room' },
  { value: 'EQUIPMENT', label: 'Equipment' },
  { value: 'STUDY_ROOM', label: 'Study Room' },
  { value: 'PROJECTOR', label: 'Projector' },
  { value: 'CAMERA', label: 'Camera' },
  { value: 'OTHER', label: 'Other' },
];

export const RESOURCE_STATUS_OPTIONS = [
  { value: '', label: 'All resource statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'OUT_OF_SERVICE', label: 'Out Of Service' },
];

export const getBookingStatusLabel = (status) => BOOKING_STATUS_META[status]?.label || toLabel(status);

export const getResourceStatusLabel = (status) => RESOURCE_STATUS_META[status]?.label || toLabel(status);

export const getResourceTypeLabel = (type) => RESOURCE_TYPE_META[type]?.label || toLabel(type);
