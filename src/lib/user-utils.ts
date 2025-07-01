import { User as FirebaseUser } from "firebase/auth";

/**
 * Checks if a user should have unlimited access to all features
 * This includes test accounts and pro users
 */
export function hasUnlimitedAccess(user: FirebaseUser | null): boolean {
  if (!user) return false;
  
  // Test account gets full access for UX development
  if (user.email === "test@rapidcv.com") return true;
  
  // Add other unlimited access conditions here
  // For example: pro users, admin users, etc.
  
  return false;
}

/**
 * Checks if a user can create more resumes
 */
export function canCreateResume(user: FirebaseUser | null, resumeCount: number = 0): boolean {
  if (!user) return false;
  
  // Test account and pro users have unlimited access
  if (hasUnlimitedAccess(user)) return true;
  
  // Free users are limited to 2 resumes
  return resumeCount < 2;
}

/**
 * Checks if a user can access AI features
 */
export function canUseAIFeatures(user: FirebaseUser | null): boolean {
  if (!user) return false;
  
  // Test account gets full AI access
  if (hasUnlimitedAccess(user)) return true;
  
  // For now, AI features are pro-only (except test account)
  return false;
}

/**
 * Gets the user's plan display name
 */
export function getUserPlanName(user: FirebaseUser | null): string {
  if (!user) return "Not signed in";
  
  if (user.email === "test@rapidcv.com") return "Test Account";
  
  // Add logic for detecting pro users
  return "Free";
}