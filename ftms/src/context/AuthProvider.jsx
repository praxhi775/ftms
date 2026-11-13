import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
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
import { writeActivity, touchLastActive } from '../firebase/activityWriter';
import { setActivitySink, flushActivityLog, discardPendingActivity } from '../utils/activityLog';
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
  // true while the person has just pressed "Sign in" / "Create account" (not a restored session)
  const explicitLoginRef = useRef(false);
  // the manager whose activity is being logged, and when "last active" was last saved
  const activeUidRef = useRef(null);
  const lastTouchRef = useRef(0);
  const { pathname } = useLocation();

  // "Last active": saved at most once every 5 minutes
  const touchActive = useCallback(() => {
    const uid = activeUidRef.current;
    if (!uid || Date.now() - lastTouchRef.current < 5 * 60 * 1000) return;
    lastTouchRef.current = Date.now();
    touchLastActive(uid).catch(() => {});
  }, []);

  // moving around the app counts as being active
  useEffect(() => {
    touchActive();
  }, [pathname, touchActive]);

  // changes that are still being combined into one log entry are saved when the page is closed or hidden
  useEffect(() => {
    const flushWhenHidden = () => {
      if (document.visibilityState === 'hidden') flushActivityLog();
    };
    window.addEventListener('pagehide', flushActivityLog);
    document.addEventListener('visibilitychange', flushWhenHidden);
    return () => {
      window.removeEventListener('pagehide', flushActivityLog);
      document.removeEventListener('visibilitychange', flushWhenHidden);
    };
  }, []);

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
      setActivitySink(null);
      activeUidRef.current = null;

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
              explicitLoginRef.current = false;
              pendingNameRef.current = '';
              writeActivity(firebaseUser.uid, 'account.registered', 'Registered an account').catch(() => {});
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

          // Blocked managers never get their data opened, and nothing they do is logged any more
          if (data.status === 'blocked') {
            discardPendingActivity();
            setActivitySink(null);
            activeUidRef.current = null;
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

          // from here on, what this manager does is written to their activity log
          // (installed once; profile updates such as "last active" must not reset it)
          const managerUid = firebaseUser.uid;
          if (activeUidRef.current !== managerUid) {
            activeUidRef.current = managerUid;
            setActivitySink((type, message) => {
              writeActivity(managerUid, type, message).catch(() => {});
              touchActive();
            });
          }

          setDbReady(true);
          setLoading(false);

          if (!loginRecorded) {
            loginRecorded = true;
            if (explicitLoginRef.current) {
              // a real sign-in (not just reopening the page with a saved session)
              explicitLoginRef.current = false;
              updateDoc(doc(firestore, 'users', managerUid), {
                lastLoginAt: serverTimestamp(),
                lastActiveAt: serverTimestamp(),
              }).catch(() => {});
              lastTouchRef.current = Date.now();
              writeActivity(managerUid, 'account.login', 'Logged in').catch(() => {});
            } else {
              touchActive();
            }
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
      setActivitySink(null);
      if (unsubscribeProfile) unsubscribeProfile();
      unsubscribeAuth();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const register = useCallback(async ({ name, email, password }) => {
    pendingNameRef.current = name.trim();
    explicitLoginRef.current = true;
    try {
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(credential.user, { displayName: name.trim() }).catch(() => {});
    } catch (err) {
      pendingNameRef.current = '';
      explicitLoginRef.current = false;
      throw err;
    }
  }, []);

  const login = useCallback(async (email, password) => {
    explicitLoginRef.current = true;
    try {
      return await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      explicitLoginRef.current = false;
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    const uid = activeUidRef.current;
    if (uid) {
      // entries still being combined are sent first; Firebase keeps writes in order, so waiting
      // for the logout entry also means the earlier ones were saved. Never wait long though.
      flushActivityLog();
      await Promise.race([
        writeActivity(uid, 'account.logout', 'Logged out').catch(() => {}),
        new Promise((resolve) => setTimeout(resolve, 1500)),
      ]);
    }
    await signOut(auth);
  }, []);

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
