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
import { getAnalytics, isSupported } from "firebase/analytics";
import imageCompression from "browser-image-compression";
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

// Compress image client-side to fit safely in Firestore, then store as data URL.
// A base64 data URL adds ~33% overhead, so we target ~600KB before encoding to
// stay well under Firestore's 1 MiB per-document limit.
export async function compressImageDataUrl(
  dataUrl: string,
  maxSizeBytes: number = 600000
): Promise<string> {
  // Convert data URL to Blob
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  
  const options = {
    maxSizeMB: maxSizeBytes / (1024 * 1024),
    maxWidthOrHeight: 1024,
    useWebWorker: true,
  };
  
  const compressedBlob = await imageCompression.compress(blob, options);
  
  // Convert back to data URL
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(compressedBlob);
  });
}
