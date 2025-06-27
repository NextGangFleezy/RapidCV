import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { signOutUser } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import AuthDialog from "./auth-dialog";
import { User as FirebaseUser } from "firebase/auth";

interface NavigationProps {
  user?: FirebaseUser | null;
  onUserChange?: (user: FirebaseUser | null) => void;
}

export default function Navigation({ user, onUserChange }: NavigationProps) {
  const [location] = useLocation();
  const { toast } = useToast();
  const [authOpen, setAuthOpen] = useState(false);

  const handleGoogleSignIn = (signedInUser: FirebaseUser) => {
    onUserChange?.(signedInUser);
    toast({
      title: "Welcome!",
      description: "Successfully signed in with Google!",
    });
  };

  const handleLogout = async () => {
    try {
      await signOutUser();
      onUserChange?.(null);
      toast({
        title: "Success",
        description: "Successfully signed out!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out.",
        variant: "destructive",
      });
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/">
              <h1 className="text-2xl font-bold text-primary cursor-pointer">RapidCV</h1>
            </Link>
          </div>
          
          {location !== "/" && (
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link href="/builder" className="text-gray-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Resume Builder
                </Link>
                <Link href="/cover-letter" className="text-gray-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Cover Letter
                </Link>
                <Link href="/job-analyzer" className="text-gray-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Job Analyzer
                </Link>
                <Link href="/workspace" className="text-gray-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Workspace
                </Link>
                {user && (
                  <Link href="/admin" className="text-red-600 hover:text-red-700 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    Admin
                  </Link>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  Welcome, {user.displayName || user.email}
                </span>
                <Button variant="outline" onClick={handleLogout}>
                  Sign Out
                </Button>
              </div>
            ) : (
              <>
                <Button variant="ghost" onClick={() => setAuthOpen(true)}>
                  Sign In
                </Button>
                <Button 
                  className="bg-primary text-white hover:bg-blue-700"
                  onClick={() => setAuthOpen(true)}
                >
                  Get 2 Free Resumes
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
      
      <AuthDialog 
        open={authOpen} 
        onOpenChange={setAuthOpen}
        onSignIn={handleGoogleSignIn}
      />
    </nav>
  );
}