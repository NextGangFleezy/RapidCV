import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup,
  signInWithRedirect, 
  getRedirectResult, 
  signOut, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  User as FirebaseUser 
} from "firebase/auth";

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
  console.log('🚀 signInWithGoogle called');
  try {
    // Try popup first, fallback to redirect if blocked
    console.log('🔄 Starting Google sign-in popup...');
    const result = await signInWithPopup(auth, googleProvider);
    
    if (result?.user) {
      console.log('✅ Google sign-in successful:', result.user.email);
      return result.user;
    }
    
    console.log('⚠️ No user returned from popup');
    return null;
  } catch (error: any) {
    console.error('❌ Google sign-in error:', error);
    console.error('❌ Error details:', {
      code: error?.code || 'unknown',
      message: error?.message || 'Unknown error',
      stack: error?.stack || 'No stack trace'
    });
    
    // Handle specific Firebase auth errors
    if (error.code === 'auth/popup-closed-by-user') {
      console.log('ℹ️ User closed the popup');
      return null;
    }
    
    // If popup is blocked, fallback to redirect
    if (error.code === 'auth/popup-blocked') {
      console.log('🔄 Popup blocked, falling back to redirect...');
      try {
        await signInWithRedirect(auth, googleProvider);
        return null; // Will redirect away from page
      } catch (redirectError: any) {
        console.error('❌ Redirect fallback failed:', redirectError);
        throw redirectError;
      }
    }
    
    throw error;
  }
};

// Handle redirect result on page load (for popup fallback)
export const handleAuthRedirect = async (): Promise<FirebaseUser | null> => {
  console.log('🔄 handleAuthRedirect called');
  try {
    const result = await getRedirectResult(auth);
    console.log('📥 Page load redirect result:', result);
    
    if (result?.user) {
      console.log('✅ User authenticated via redirect fallback:', result.user.email);
      return result.user;
    } else {
      console.log('ℹ️ No redirect authentication result');
    }
    
    return result?.user || null;
  } catch (error: any) {
    console.error('❌ Auth redirect error:', error);
    console.error('❌ Redirect error details:', {
      code: error?.code || 'unknown',
      message: error?.message || 'Unknown error'
    });
    throw error;
  }
};

// Email/Password Authentication
export const signUpWithEmail = async (email: string, password: string): Promise<FirebaseUser> => {
  console.log('📧 Email sign-up attempt for:', email);
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    console.log('✅ Email sign-up successful:', result.user.email);
    return result.user;
  } catch (error: any) {
    console.error('❌ Email sign-up error:', error);
    console.error('❌ Error details:', {
      code: error.code,
      message: error.message
    });
    throw error;
  }
};

export const signInWithEmail = async (email: string, password: string): Promise<FirebaseUser> => {
  console.log('📧 Email sign-in attempt for:', email);
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    console.log('✅ Email sign-in successful:', result.user.email);
    return result.user;
  } catch (error: any) {
    console.error('❌ Email sign-in error:', error);
    console.error('❌ Error details:', {
      code: error.code,
      message: error.message
    });
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
