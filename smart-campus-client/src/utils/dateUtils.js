/**
 * dateUtils.js
 * Lightweight date formatting utility (no heavy library needed).
 */

export function formatDistanceToNow(isoString) {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function formatDate(isoString) {
  if (!isoString) return '';
  return new Date(isoString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatTime(timeString) {
  if (!timeString) return '';

  const [hours = '00', minutes = '00'] = String(timeString).split(':');
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatSchedule(dateString, startTime, endTime) {
  if (!dateString) return '';

  const dateLabel = formatDate(dateString);
  const startLabel = formatTime(startTime);
  const endLabel = formatTime(endTime);

  if (!startLabel || !endLabel) return dateLabel;
  return `${dateLabel} | ${startLabel} - ${endLabel}`;
}
