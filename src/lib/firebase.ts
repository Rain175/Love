import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { getFirestore, setLogLevel } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";
import firebaseConfigJson from "../../firebase-applet-config.json";

setLogLevel("error");

// Dynamic configuration prioritizing Vite environment variables (for Vercel deployment)
// with fallback to local JSON config
const metaEnv = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: (metaEnv.VITE_FIREBASE_API_KEY as string) || firebaseConfigJson?.apiKey || "",
  authDomain: (metaEnv.VITE_FIREBASE_AUTH_DOMAIN as string) || firebaseConfigJson?.authDomain || "",
  projectId: (metaEnv.VITE_FIREBASE_PROJECT_ID as string) || firebaseConfigJson?.projectId || "",
  storageBucket: (metaEnv.VITE_FIREBASE_STORAGE_BUCKET as string) || firebaseConfigJson?.storageBucket || "",
  messagingSenderId: (metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || firebaseConfigJson?.messagingSenderId || "",
  appId: (metaEnv.VITE_FIREBASE_APP_ID as string) || firebaseConfigJson?.appId || "",
  measurementId: (metaEnv.VITE_FIREBASE_MEASUREMENT_ID as string) || firebaseConfigJson?.measurementId || "",
};

const databaseId = (metaEnv.VITE_FIRESTORE_DATABASE_ID as string) || firebaseConfigJson?.firestoreDatabaseId || "(default)";

// Initialize Firebase App safely
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Analytics safely
export let analytics: any = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch((err) => {
    console.warn("Analytics not supported in this environment:", err);
  });
}

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app, databaseId);
export const storage = getStorage(app);

/**
 * Uploads a File object or Blob to Firebase Storage and returns its download URL.
 */
export async function uploadFileToStorage(file: File | Blob, folder: string, customFileName?: string): Promise<string> {
  const fileName = customFileName || `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const fileRef = ref(storage, `${folder}/${fileName}`);
  const snapshot = await uploadBytes(fileRef, file);
  return getDownloadURL(snapshot.ref);
}

/**
 * Uploads a base64 DataURL string to Firebase Storage and returns its download URL.
 */
export async function uploadBase64ToStorage(base64DataUrl: string, folder: string): Promise<string> {
  // Extract content-type and raw base64 data
  const parts = base64DataUrl.split(",");
  if (parts.length !== 2) {
    throw new Error("Invalid base64 data format");
  }
  const mimeMatch = parts[0].match(/data:(.*?);/);
  const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
  const binaryStr = atob(parts[1]);
  const len = binaryStr.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mimeType });
  const extension = mimeType.split("/")[1] || "jpg";
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${extension}`;
  return uploadFileToStorage(blob, folder, fileName);
}

// Auth Providers
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

// Helper for Google Sign-In (with popup and redirect support for Vercel/mobile)
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.warn("Google popup sign-in failed, attempting redirect method:", error);
    if (error?.code === "auth/popup-blocked" || error?.code === "auth/popup-closed-by-user") {
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    throw error;
  }
};

export const logoutUser = async () => {
  await signOut(auth);
};

export { signInWithEmailAndPassword, createUserWithEmailAndPassword };

export function sanitizeForFirestore<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForFirestore) as unknown as T;
  }
  const sanitized: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    const val = (obj as Record<string, any>)[key];
    if (val !== undefined) {
      sanitized[key] = sanitizeForFirestore(val);
    }
  }
  return sanitized as T;
}


