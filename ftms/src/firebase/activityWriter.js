import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { auth, firestore } from './client';

/**
 * Saves one entry to users/{uid}/activity. The security rules only accept these four fields,
 * a server timestamp, and refuse any later edit or delete, so a log entry can't be changed.
 */
export function writeActivity(uid, type, message) {
  return addDoc(collection(firestore, 'users', uid, 'activity'), {
    type,
    message: String(message).slice(0, 200),
    at: serverTimestamp(),
    actorId: auth.currentUser?.uid || uid,
  });
}

// "Last active" time shown to the admin
export function touchLastActive(uid) {
  return updateDoc(doc(firestore, 'users', uid), { lastActiveAt: serverTimestamp() });
}
