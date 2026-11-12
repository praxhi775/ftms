import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { auth, firestore } from '../firebase/client';
import { SAMPLE_MANAGER_EMAIL } from '../firebase/config';
import { friendlyAuthError } from '../firebase/authErrors';
import {
  openUserDatabase,
  closeUserDatabase,
  getOpenDatabaseName,
  databaseNameForUser,
} from '../db/database';
import { prepareManagerData } from '../db/seedData';
import { AuthContext } from './auth-context';

/**
 * Keeps track of who is logged in.
 *  - admin:   has a document in the `admins` collection (created by you in the Firebase console)
 *  - manager: everyone else; their profile lives in `users/{uid}` and has a status (active / blocked)
 * An active manager gets their own local database opened before the app is shown.
 */
export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dbReady, setDbReady] = useState(false);
  const [error, setError] = useState('');

  // name typed on the register form, used when the profile document is created
  const pendingNameRef = useRef('');

  useEffect(() => {
    let unsubscribeProfile = null;
    let session = 0;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      const mySession = ++session;
      const isStale = () => mySession !== session;

      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }
      setDbReady(false);
      setProfile(null);
      setIsAdmin(false);
      setError('');

      if (!firebaseUser) {
        closeUserDatabase();
        setUser(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setUser(firebaseUser);

      // not allowed to read it (or not found) means: not an admin
      const admin = await getDoc(doc(firestore, 'admins', firebaseUser.uid))
        .then((snap) => snap.exists())
        .catch(() => false);
      if (isStale()) return;

      if (admin) {
        closeUserDatabase();
        setIsAdmin(true);
        setLoading(false);
        return;
      }

      let loginRecorded = false;

      unsubscribeProfile = onSnapshot(
        doc(firestore, 'users', firebaseUser.uid),
        async (snapshot) => {
          if (isStale()) return;

          // First time this account is seen: create the manager profile
          if (!snapshot.exists()) {
            try {
              await setDoc(doc(firestore, 'users', firebaseUser.uid), {
                name:
                  pendingNameRef.current ||
                  firebaseUser.displayName ||
                  (firebaseUser.email || 'Manager').split('@')[0],
                email: firebaseUser.email,
                role: 'manager',
                status: 'active',
                createdAt: serverTimestamp(),
                lastLoginAt: serverTimestamp(),
              });
              loginRecorded = true;
              pendingNameRef.current = '';
            } catch (err) {
              if (!isStale()) {
                setError(friendlyAuthError(err));
                setLoading(false);
              }
            }
            return; // the snapshot fires again once the document exists
          }

          const data = snapshot.data();
          setProfile({ id: snapshot.id, ...data });

          // Blocked managers never get their data opened
          if (data.status === 'blocked') {
            closeUserDatabase();
            setDbReady(false);
            setLoading(false);
            return;
          }

          try {
            if (getOpenDatabaseName() !== databaseNameForUser(firebaseUser.uid)) {
              await openUserDatabase(firebaseUser.uid);
              await prepareManagerData({
                sample:
                  (firebaseUser.email || '').toLowerCase() === SAMPLE_MANAGER_EMAIL.toLowerCase(),
              });
            }
          } catch (err) {
            console.error('Could not open local data:', err);
            if (!isStale()) {
              setError('Could not open your local data in this browser.');
              setLoading(false);
            }
            return;
          }
          if (isStale()) return;

          setDbReady(true);
          setLoading(false);

          if (!loginRecorded) {
            loginRecorded = true;
            updateDoc(doc(firestore, 'users', firebaseUser.uid), {
              lastLoginAt: serverTimestamp(),
            }).catch(() => {});
          }
        },
        (err) => {
          console.error('Profile listener failed:', err);
          if (!isStale()) {
            setError(friendlyAuthError(err));
            setLoading(false);
          }
        }
      );
    });

    return () => {
      session += 1;
      if (unsubscribeProfile) unsubscribeProfile();
      unsubscribeAuth();
    };
  }, []);

  const register = useCallback(async ({ name, email, password }) => {
    pendingNameRef.current = name.trim();
    try {
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(credential.user, { displayName: name.trim() }).catch(() => {});
    } catch (err) {
      pendingNameRef.current = '';
      throw err;
    }
  }, []);

  const login = useCallback(
    (email, password) => signInWithEmailAndPassword(auth, email.trim(), password),
    []
  );

  const logout = useCallback(() => signOut(auth), []);

  const resetPassword = useCallback((email) => sendPasswordResetEmail(auth, email.trim()), []);

  const value = useMemo(
    () => ({
      user,
      profile,
      isAdmin,
      loading,
      dbReady,
      blocked: profile?.status === 'blocked',
      error,
      register,
      login,
      logout,
      resetPassword,
    }),
    [user, profile, isAdmin, loading, dbReady, error, register, login, logout, resetPassword]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
