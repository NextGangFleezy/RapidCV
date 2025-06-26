import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";
import { auth } from "./firebase";
import { apiRequest } from "./queryClient";
import type { User } from "@shared/schema";

export interface AuthUser extends FirebaseUser {
  userData?: User;
}

export const signIn = async (email: string, password: string): Promise<AuthUser> => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user as AuthUser;
};

export const signUp = async (email: string, password: string, firstName: string, lastName: string): Promise<AuthUser> => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const firebaseUser = userCredential.user;
  
  // Create user in our database
  try {
    const response = await apiRequest('POST', '/api/users', {
      email: firebaseUser.email,
      firebaseUid: firebaseUser.uid,
      firstName,
      lastName,
    });
    const userData = await response.json();
    (firebaseUser as AuthUser).userData = userData;
  } catch (error) {
    console.error('Failed to create user in database:', error);
  }
  
  return firebaseUser as AuthUser;
};

export const logout = async (): Promise<void> => {
  await signOut(auth);
};

export const getCurrentUser = (): Promise<AuthUser | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();
      if (user) {
        try {
          const response = await fetch(`/api/users/firebase/${user.uid}`);
          if (response.ok) {
            const userData = await response.json();
            (user as AuthUser).userData = userData;
          }
        } catch (error) {
          console.error('Failed to fetch user data:', error);
        }
      }
      resolve(user as AuthUser);
    });
  });
};
