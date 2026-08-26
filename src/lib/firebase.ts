import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail, 
  updateProfile,
  onAuthStateChanged,
  type User 
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp,
  type Firestore
} from "firebase/firestore";
import firebaseConfigJson from "../../firebase-applet-config.json";

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfigJson);

// Auth instance
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Firestore instance
export const db: Firestore = getFirestore(app, firebaseConfigJson.firestoreDatabaseId || "(default)");

export {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  type User,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
};
