import { useState, useEffect } from "react";
import { auth, signInWithGoogle, handleAuthRedirect, signInWithEmail, signUpWithEmail } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FirebaseDebug() {
  const [authState, setAuthState] = useState<any>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`🔧 DEBUG: ${message}`);
  };

  useEffect(() => {
    addLog("Firebase Debug Panel initialized");
    addLog(`Firebase Config: ${JSON.stringify({
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY?.substring(0, 10) + "...",
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID?.substring(0, 10) + "...",
    })}`);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      addLog(`Auth state changed: ${user ? user.email : 'null'}`);
      setAuthState(user);
    });

    // Check for redirect result on mount
    handleAuthRedirect().then((user) => {
      if (user) {
        addLog(`Redirect result found: ${user.email}`);
      } else {
        addLog("No redirect result on page load");
      }
    }).catch((error) => {
      addLog(`Redirect error: ${error.message}`);
    });

    return () => unsubscribe();
  }, []);

  const testGoogleSignIn = async () => {
    setIsLoading(true);
    addLog("Testing Google sign-in flow...");
    
    try {
      const result = await signInWithGoogle();
      if (result) {
        addLog(`Google sign-in successful: ${result.email}`);
      } else {
        addLog("Google sign-in initiated redirect");
      }
    } catch (error: any) {
      addLog(`Google sign-in error: ${error.code} - ${error.message}`);
    }
    
    setIsLoading(false);
  };

  const testEmailAuth = async () => {
    setIsLoading(true);
    const testEmail = "test@example.com";
    const testPassword = "test123456";
    
    addLog("Testing email authentication...");
    
    try {
      // Try sign up first
      addLog(`Attempting sign-up with ${testEmail}`);
      const signUpResult = await signUpWithEmail(testEmail, testPassword);
      addLog(`Sign-up successful: ${signUpResult.email}`);
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        addLog("Email already exists, trying sign-in...");
        try {
          const signInResult = await signInWithEmail(testEmail, testPassword);
          addLog(`Sign-in successful: ${signInResult.email}`);
        } catch (signInError: any) {
          addLog(`Sign-in error: ${signInError.code} - ${signInError.message}`);
        }
      } else {
        addLog(`Sign-up error: ${error.code} - ${error.message}`);
      }
    }
    
    setIsLoading(false);
  };

  const clearLogs = () => {
    setDebugLogs([]);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Firebase Authentication Debug Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-2">Current Auth State</h3>
            <div className="bg-gray-100 p-3 rounded text-sm">
              {authState ? (
                <div>
                  <p><strong>Email:</strong> {authState.email}</p>
                  <p><strong>UID:</strong> {authState.uid}</p>
                  <p><strong>Display Name:</strong> {authState.displayName || 'N/A'}</p>
                  <p><strong>Provider:</strong> {authState.providerData?.[0]?.providerId || 'N/A'}</p>
                </div>
              ) : (
                <p>No user authenticated</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Environment Check</h3>
            <div className="bg-gray-100 p-3 rounded text-sm">
              <p><strong>API Key:</strong> {import.meta.env.VITE_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing'}</p>
              <p><strong>Project ID:</strong> {import.meta.env.VITE_FIREBASE_PROJECT_ID || '❌ Missing'}</p>
              <p><strong>App ID:</strong> {import.meta.env.VITE_FIREBASE_APP_ID ? '✅ Set' : '❌ Missing'}</p>
              <p><strong>Auth Domain:</strong> {import.meta.env.VITE_FIREBASE_PROJECT_ID ? `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com` : '❌ Missing'}</p>
            </div>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">Test Actions</h3>
            <div className="space-x-2">
              <Button onClick={testGoogleSignIn} disabled={isLoading} size="sm">
                {isLoading ? "Testing..." : "Test Google"}
              </Button>
              <Button onClick={testEmailAuth} disabled={isLoading} size="sm">
                {isLoading ? "Testing..." : "Test Email"}
              </Button>
              <Button onClick={clearLogs} variant="outline" size="sm">
                Clear Logs
              </Button>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Debug Logs</h3>
          <div className="bg-black text-green-400 p-3 rounded text-xs font-mono h-64 overflow-y-auto">
            {debugLogs.length === 0 ? (
              <p>No logs yet...</p>
            ) : (
              debugLogs.map((log, index) => (
                <div key={index}>{log}</div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}