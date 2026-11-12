import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { firestore } from '../firebase/client';

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
  });
}
