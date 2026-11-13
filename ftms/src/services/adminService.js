import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { firestore } from '../firebase/client';
import { writeActivity } from '../firebase/activityWriter';

export const MANAGER_STATUS = { ACTIVE: 'active', BLOCKED: 'blocked' };

/**
 * Live list of every registered manager (newest first).
 * New sign-ups and block / unblock changes show up without refreshing.
 * Returns the unsubscribe function.
 */
export function subscribeToManagers(onData, onError) {
  const managersQuery = query(collection(firestore, 'users'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    managersQuery,
    (snapshot) => onData(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError
  );
}

/**
 * Block or unblock a manager. Only these three fields are written, which is exactly
 * what the security rules allow the admin to change.
 */
export function setManagerStatus(managerId, status, adminId) {
  if (!Object.values(MANAGER_STATUS).includes(status)) {
    return Promise.reject(new Error('Invalid status.'));
  }
  return updateDoc(doc(firestore, 'users', managerId), {
    status,
    statusChangedAt: serverTimestamp(),
    statusChangedBy: adminId,
  }).then(() =>
    // the change is also written to that manager's activity log
    writeActivity(
      managerId,
      status === MANAGER_STATUS.BLOCKED ? 'account.blocked' : 'account.unblocked',
      status === MANAGER_STATUS.BLOCKED ? 'Blocked by the admin' : 'Unblocked by the admin'
    ).catch(() => {})
  );
}

export async function getManager(managerId) {
  const snapshot = await getDoc(doc(firestore, 'users', managerId));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}

export const ACTIVITY_PAGE_SIZE = 50;

/**
 * One page of a manager's activity, newest first.
 *  - from / to: optional Date limits (applied on the server)
 *  - after:     the cursor returned by the previous page
 */
export async function fetchActivityPage(managerId, { pageSize = ACTIVITY_PAGE_SIZE, after = null, from = null, to = null } = {}) {
  const constraints = [orderBy('at', 'desc')];
  if (from) constraints.push(where('at', '>=', Timestamp.fromDate(from)));
  if (to) constraints.push(where('at', '<=', Timestamp.fromDate(to)));
  if (after) constraints.push(startAfter(after));
  constraints.push(limit(pageSize));

  const snapshot = await getDocs(
    query(collection(firestore, 'users', managerId, 'activity'), ...constraints)
  );
  return {
    entries: snapshot.docs.map((d) => ({ id: d.id, ...d.data() })),
    cursor: snapshot.docs[snapshot.docs.length - 1] || null,
    hasMore: snapshot.docs.length === pageSize,
  };
}
