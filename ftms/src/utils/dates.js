// Firestore timestamps -> readable text
export const toDate = (value) => (value?.toDate ? value.toDate() : value instanceof Date ? value : null);

export const formatTimestamp = (value) => {
  const date = toDate(value);
  return date ? date.toLocaleString() : '—';
};

export const formatTime = (value) => {
  const date = toDate(value);
  return date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
};

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

// "Today", "Yesterday" or a full date, for the day headings in the activity list
export const dayLabel = (value, now = new Date()) => {
  const date = toDate(value);
  if (!date) return 'Just now';
  const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
};
