import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyBIkaPPE_gpf-F9U-jxhabVbaTaWjCyfOw",
  authDomain: "ebeluxury-4d9b7.firebaseapp.com",
  databaseURL: "https://ebeluxury-4d9b7-default-rtdb.firebaseio.com",
  projectId: "ebeluxury-4d9b7",
  storageBucket: "ebeluxury-4d9b7.firebasestorage.app",
  messagingSenderId: "672311636676",
  appId: "1:672311636676:web:752861034bb843f7a44f91",
  measurementId: "G-SPNKVDPET1"
};

let app: FirebaseApp = {} as FirebaseApp;
let auth: Auth = {} as Auth;
let db: Firestore = {} as Firestore;

if (typeof window !== 'undefined') {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  auth = getAuth(app);
  db = getFirestore(app);
}

export { auth, db };
export default app;

