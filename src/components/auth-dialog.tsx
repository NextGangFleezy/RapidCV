import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from "@/lib/firebase";
import { User as FirebaseUser } from "firebase/auth";
import { Loader2, Eye, EyeOff } from "@/lib/icons";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignIn: (user: FirebaseUser) => void;
}

export default function AuthDialog({ open, onOpenChange, onSignIn }: AuthDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Test account credentials
  const testAccount = {
    email: "test@rapidcv.com",
    password: "test123"
  };

  const useTestAccount = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // First try to create the test account
      console.log('🧪 Creating test account...');
      const newUser = await signUpWithEmail(testAccount.email, testAccount.password);
      console.log('✅ Test account created and signed in:', newUser.email);
      onSignIn(newUser);
      onOpenChange(false);
      
      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 500);
    } catch (signUpError: any) {
      console.log('ℹ️ Test account may already exist, trying to sign in...');
      
      if (signUpError.code === 'auth/email-already-in-use') {
        try {
          // Account exists, try to sign in
          const user = await signInWithEmail(testAccount.email, testAccount.password);
          console.log('✅ Test account sign-in successful:', user.email);
          onSignIn(user);
          onOpenChange(false);
          
          // Redirect to dashboard
          setTimeout(() => {
            window.location.href = "/dashboard";
          }, 500);
        } catch (signInError: any) {
          console.error('❌ Test account sign-in failed:', signInError);
          setError('Test account exists but password may be different. Try creating your own account.');
        }
      } else {
        console.error('❌ Test account creation failed:', signUpError);
        setError('Unable to create test account. Please create your own account.');
      }
    }
    
    setIsLoading(false);
  };

  const handleEmailAuth = async (isSignUp: boolean) => {
    setIsLoading(true);
    setError(null);
    
    if (!email || !password) {
      setError("Please fill in all fields");
      setIsLoading(false);
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setError("Passwords don't match");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    try {
      const user = isSignUp 
        ? await signUpWithEmail(email, password)
        : await signInWithEmail(email, password);
      
      // If this is a new sign-up, create user in backend
      if (isSignUp) {
        try {
          console.log('📝 Creating user in backend system...');
          const response = await fetch('/api/users', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              firebaseUid: user.uid,
              email: user.email,
              firstName: user.email?.split('@')[0] || 'User',
              lastName: '',
            }),
          });
          
          if (response.ok) {
            console.log('✅ User created in backend successfully');
          } else {
            console.log('ℹ️ User may already exist in backend');
          }
        } catch (backendError) {
          console.log('⚠️ Backend user creation failed, but Firebase account created:', backendError);
          // Don't fail the whole process if backend creation fails
        }
      }
      
      onSignIn(user);
      onOpenChange(false);
      
      // Reset form
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      
      // Redirect to dashboard after successful authentication
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 500);
    } catch (error: any) {
      console.error('Email auth error:', error);
      
      // User-friendly error messages
      const errorMessages: { [key: string]: string } = {
        'auth/email-already-in-use': 'This email is already registered. Try signing in instead.',
        'auth/weak-password': 'Password is too weak. Please use at least 6 characters.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/user-not-found': 'No account found with this email. Try signing up instead.',
        'auth/wrong-password': 'Incorrect password. Please try again.',
        'auth/invalid-credential': 'Invalid email or password. Please check and try again.',
        'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
      };
      
      setError(errorMessages[error.code] || `Authentication failed: ${error.message}`);
    }
    
    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const user = await signInWithGoogle();
      if (user) {
        onSignIn(user);
        onOpenChange(false);
      } else {
        setError('Google sign-in was cancelled or failed. Please try again or use email/password.');
      }
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      
      const errorMessages: { [key: string]: string } = {
        'auth/popup-blocked': 'Popup was blocked by your browser. Please allow popups for this site or use email/password.',
        'auth/popup-closed-by-user': 'Sign-in was cancelled. Please try again or use email/password.',
        'auth/unauthorized-domain': 'This domain is not authorized for Google sign-in. Please use email/password.',
        'auth/operation-not-allowed': 'Google sign-in is not enabled. Please use email/password.',
      };
      
      setError(errorMessages[error.code] || 'Google sign-in failed. Please try email/password instead.');
    }
    
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Welcome to RapidCV</DialogTitle>
          <DialogDescription>
            Sign in to get 2 free resume builds with upload feature. Upgrade for unlimited access and AI tools.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="signin" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <Input
                  id="signin-email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <div className="relative">
                  <Input
                    id="signin-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <Button 
                onClick={() => handleEmailAuth(false)}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Sign In
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="signup" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <div className="relative">
                  <Input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  className={confirmPassword && password !== confirmPassword ? "border-red-500" : ""}
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-sm text-red-500">Passwords don't match</p>
                )}
              </div>
              
              <Button 
                onClick={() => handleEmailAuth(true)}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Create Account
              </Button>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or</span>
          </div>
        </div>
        
        <Button 
          onClick={useTestAccount}
          disabled={isLoading}
          variant="secondary"
          className="w-full"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : null}
          Quick Demo Sign-In (creates test account)
        </Button>
        
        <Button 
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          variant="outline"
          className="w-full"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          )}
          Continue with Google
        </Button>
        
        {error && (
          <p className="text-sm text-red-600 text-center">{error}</p>
        )}
        
        <div className="text-xs text-gray-500 text-center">
          By continuing, you agree to our Terms of Service and Privacy Policy.
          <br />
          Get 2 free resume builds - no credit card required.
        </div>
      </DialogContent>
    </Dialog>
  );
}