import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-api-key",
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-project"}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-project"}.firebasestorage.app`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "demo-app-id",
};

// Debug Firebase config
console.log("Firebase config:", {
  apiKey: firebaseConfig.apiKey?.substring(0, 10) + "...",
  projectId: firebaseConfig.projectId,
  appId: firebaseConfig.appId?.substring(0, 10) + "...",
  hasApiKey: !!import.meta.env.VITE_FIREBASE_API_KEY,
  hasProjectId: !!import.meta.env.VITE_FIREBASE_PROJECT_ID,
  hasAppId: !!import.meta.env.VITE_FIREBASE_APP_ID,
});

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

// Authentication functions
export const signInWithGoogle = async (): Promise<FirebaseUser | null> => {
  try {
    // First, try to get any pending redirect result
    const redirectResult = await getRedirectResult(auth);
    if (redirectResult?.user) {
      return redirectResult.user;
    }
    
    // If no redirect result, initiate redirect
    await signInWithRedirect(auth, googleProvider);
    return null; // Will redirect away from page
  } catch (error) {
    console.error('Google sign-in error:', error);
    throw error;
  }
};

// Handle redirect result on page load
export const handleAuthRedirect = async (): Promise<FirebaseUser | null> => {
  try {
    const result = await getRedirectResult(auth);
    return result?.user || null;
  } catch (error) {
    console.error('Auth redirect error:', error);
    throw error;
  }
};

export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

export const onAuthStateChange = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export default app;
