export function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatResponseTime(minutes) {
  if (!minutes) return 'Not stated';
  if (minutes < 60) return `~${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `~${hours} hr${hours === 1 ? '' : 's'}`;
  const days = Math.round(hours / 24);
  return `~${days} day${days === 1 ? '' : 's'}`;
}

export function formatMonthYear(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

export function formatPrice(price, unit) {
  const value = Number(price) || 0;
  const formatted = value % 1 === 0 ? value.toString() : value.toFixed(2);
  return `$${formatted} ${unit}`.trim();
}

export function formatDateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatTime(iso) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatRelativeTime(iso) {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDate(iso);
}

export function toLocalInputValue(iso) {
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return local.toISOString().slice(0, 16);
}

export function fromLocalInputValue(value) {
  return new Date(value).toISOString();
}
