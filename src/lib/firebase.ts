import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  signInAnonymously,
  type User 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  getDoc,
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  deleteDoc, 
  updateDoc, 
  setDoc,
  serverTimestamp,
  type DocumentData,
  type Timestamp
} from 'firebase/firestore';

// Inlined config fallback in case JSON import differs in packaging
import configData from '../../firebase-applet-config.json';

const firebaseConfig = {
  projectId: configData.projectId || "aistudio-499215",
  appId: configData.appId || "1:993064557878:web:32b50fb372fbb463a02797",
  apiKey: configData.apiKey || "AIzaSyDkMpHQg9O_wgP8xnylgF0qaXKCynCjB6c",
  authDomain: configData.authDomain || "aistudio-499215.firebaseapp.com",
  firestoreDatabaseId: configData.firestoreDatabaseId || "ai-studio-productiondirect-ca1e4556-68eb-4d95-83be-569fe2155c09",
  storageBucket: configData.storageBucket || "aistudio-499215.firebasestorage.app",
  messagingSenderId: configData.messagingSenderId || "993064557878",
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Use specified custom firestoreDatabaseId if configured
export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  signInAnonymously,
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  getDoc,
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  deleteDoc, 
  updateDoc, 
  setDoc,
  serverTimestamp 
};

export type { User, DocumentData, Timestamp };
