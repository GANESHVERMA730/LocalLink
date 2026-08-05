// Mirrors TRANSITIONS in server/routes/bookings.js. Kept in one place so a
// button is never offered for a move the server will reject.
const TRANSITIONS = {
  pending: { accepted: 'provider', rejected: 'provider', cancelled: 'customer' },
  accepted: { completed: 'provider', cancelled: 'provider' },
  rejected: {},
  completed: {},
  cancelled: {},
};

const ACTION_META = {
  accepted: { label: 'Accept', variant: 'primary' },
  rejected: { label: 'Reject', variant: 'danger' },
  completed: { label: 'Mark complete', variant: 'secondary' },
  cancelled: { label: 'Cancel booking', variant: 'ghost' },
};

export function allowedActions(status, viewerRole) {
  const moves = TRANSITIONS[status] ?? {};
  return Object.entries(moves)
    .filter(([, requiredRole]) => requiredRole === viewerRole)
    .map(([target]) => ({ status: target, ...ACTION_META[target] }));
}

export const TERMINAL_STATUSES = ['rejected', 'completed', 'cancelled'];

export function isTerminal(status) {
  return TERMINAL_STATUSES.includes(status);
}
