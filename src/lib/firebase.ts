import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

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
export default app;
