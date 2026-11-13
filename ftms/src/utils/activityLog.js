// Tiny hook the data services call after something happens ("player added", "goal recorded"...).
// While a manager is logged in, the sign-in code plugs in a function that saves the entry to
// Firebase. With nothing plugged in (tests, logged out, admin) logging does nothing.
let sink = null;

// Changes that happen in quick succession (typing a rating, dragging players between teams)
// are combined into ONE entry: "from the state before the first change, to the state after the last".
const pending = new Map(); // key -> { type, before, after, ctx, build, timer }
const COALESCE_MS = 6000;

export function setActivitySink(fn) {
  flushActivityLog(); // anything still waiting goes to the previous sink first
  sink = typeof fn === 'function' ? fn : null;
}

export function logActivity(type, message) {
  if (!sink) return;
  try {
    sink(type, String(message).slice(0, 200));
  } catch {
    /* logging must never break the action being logged */
  }
}

const mergeContext = (a = {}, b = {}) => {
  const out = { ...a };
  Object.keys(b).forEach((k) => {
    const x = a[k];
    const y = b[k];
    const plain = (v) => v && typeof v === 'object' && !Array.isArray(v);
    out[k] = plain(x) && plain(y) ? { ...x, ...y } : y;
  });
  return out;
};

function flushOne(key) {
  const entry = pending.get(key);
  if (!entry) return;
  clearTimeout(entry.timer);
  pending.delete(key);
  try {
    const message = entry.build(entry.before, entry.after, entry.ctx);
    if (message) logActivity(entry.type, message); // null = nothing changed in the end
  } catch {
    /* ignore */
  }
}

/**
 * Log a change that may be repeated many times in a row.
 * `before` / `after` are the states around THIS change; `build(firstBefore, lastAfter, ctx)` returns
 * the message (or null when the net result is "no change").
 */
export function logActivityCoalesced(key, type, { before, after, ctx }, build, delay = COALESCE_MS) {
  if (!sink) return;
  const existing = pending.get(key);
  if (existing) {
    clearTimeout(existing.timer);
    existing.after = after;
    existing.ctx = mergeContext(existing.ctx, ctx);
  } else {
    pending.set(key, { type, before, after, ctx: ctx || {}, build });
  }
  const entry = pending.get(key);
  entry.timer = setTimeout(() => flushOne(key), delay);
}

// Writes everything that is still waiting (on logout, when the page is closed, in tests)
export function flushActivityLog() {
  [...pending.keys()].forEach(flushOne);
}

// Throws away what is still waiting WITHOUT saving it (the account was blocked, so it can't be saved)
export function discardPendingActivity() {
  pending.forEach((entry) => clearTimeout(entry.timer));
  pending.clear();
}
