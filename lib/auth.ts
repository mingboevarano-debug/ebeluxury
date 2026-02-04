import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  User as FirebaseUser,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from './firebase';
import { User, UserRole } from '@/types';

export const signIn = async (email: string, password: string): Promise<User | null> => {
  try {
    await setPersistence(auth, browserLocalPersistence);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));

    if (userDoc.exists()) {
      const userData = userDoc.data();
      return {
        id: userCredential.user.uid,
        email: userCredential.user.email || '',
        name: userData.name,
        role: userData.role as UserRole,
        createdAt: userData.createdAt?.toDate?.() || new Date(),
      };
    }
    return null;
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
};

export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

export const createUser = async (
  email: string,
  password: string,
  name: string,
  role: UserRole
): Promise<string> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const userData: Omit<User, 'id'> = {
      email,
      name,
      role,
      createdAt: new Date(),
    };
    await setDoc(doc(db, 'users', userCredential.user.uid), userData);
    return userCredential.user.uid;
  } catch (error) {
    console.error('Create user error:', error);
    throw error;
  }
};

export const createSecondaryUser = async (
  email: string,
  password: string,
  name: string,
  role: UserRole
): Promise<string> => {
  let tempApp;
  try {
    // Import dynamically to avoid side effects if needed, or just standard import
    const { initializeApp, deleteApp } = await import('firebase/app');
    const { getAuth, createUserWithEmailAndPassword, signOut } = await import('firebase/auth');
    const { firebaseConfig } = await import('./firebase');

    tempApp = initializeApp(firebaseConfig, `secondaryApp-${Date.now()}`);
    const tempAuth = getAuth(tempApp);

    const userCredential = await createUserWithEmailAndPassword(tempAuth, email, password);

    // Use main db to save user data
    const userData: Omit<User, 'id'> = {
      email,
      name,
      role,
      createdAt: new Date(),
    };
    await setDoc(doc(db, 'users', userCredential.user.uid), userData);

    await signOut(tempAuth);
    return userCredential.user.uid;
  } catch (error) {
    console.error('Create secondary user error:', error);
    throw error;
  } finally {
    if (tempApp) {
      const { deleteApp } = await import('firebase/app');
      await deleteApp(tempApp);
    }
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) return null;

    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return {
        id: currentUser.uid,
        email: currentUser.email || '',
        name: userData.name,
        role: userData.role as UserRole,
        createdAt: userData.createdAt.toDate(),
      };
    }
    return null;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
};


export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      callback(null);
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        callback({
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: userData.name,
          role: userData.role as UserRole,
          createdAt: userData.createdAt?.toDate?.() || new Date(),
        });
      } else {
        callback(null);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      callback(null);
    }
  });
};
