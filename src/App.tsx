import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import { onAuthStateChange, handleAuthRedirect } from "./lib/firebase";
import { User as FirebaseUser } from "firebase/auth";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import ResumeBuilder from "@/pages/resume-builder";
import CoverLetter from "@/pages/cover-letter";
import JobAnalyzer from "@/pages/job-analyzer";
import Admin from "@/pages/admin";
import NotFound from "@/pages/not-found";
import UnifiedWorkspace from "@/pages/unified-workspace";
import ErrorBoundary from "@/components/error-boundary";

function Router() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Handle redirect result on app load
    const handleRedirectOnLoad = async () => {
      try {
        const redirectUser = await handleAuthRedirect();
        if (redirectUser) {
          setUser(redirectUser);
        }
      } catch (error) {
        console.error("Auth redirect handling error:", error);
      }
    };

    handleRedirectOnLoad();

    const unsubscribe = onAuthStateChange((user) => {
      console.log("App.tsx - Current user loaded:", user);
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={() => <Landing user={user} onUserChange={setUser} />} />
      <Route path="/dashboard" component={() => <Dashboard user={user} onUserChange={setUser} />} />
      <Route path="/workspace" component={() => <UnifiedWorkspace user={user} />} />
      <Route path="/builder" component={() => <ResumeBuilder user={user} />} />
      <Route path="/builder/:id" component={() => <ResumeBuilder user={user} />} />
      <Route path="/resume-builder" component={() => <ResumeBuilder user={user} />} />
      <Route path="/cover-letter" component={() => <CoverLetter user={user} />} />
      <Route path="/job-analyzer" component={() => <JobAnalyzer user={user} />} />
      <Route path="/admin" component={() => <Admin user={user} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
