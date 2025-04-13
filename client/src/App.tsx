import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import AppShell from "@/layouts/AppShell";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import Dashboard from "@/pages/dashboard";
import Matches from "@/pages/matches";
import Challenges from "@/pages/challenges";
import Messages from "@/pages/messages";
import Achievements from "@/pages/achievements";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";
import { AuthProvider, useAuth } from "@/hooks/useAuth";

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, loading, setLocation]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return isAuthenticated ? <Component {...rest} /> : null;
}

function PublicOnlyRoute({ component: Component, ...rest }: any) {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, loading, setLocation]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return !isAuthenticated ? <Component {...rest} /> : null;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={(props) => <PublicOnlyRoute component={Login} {...props} />} />
      <Route path="/register" component={(props) => <PublicOnlyRoute component={Register} {...props} />} />
      
      <Route path="/" component={() => {
        const [, setLocation] = useLocation();
        useEffect(() => {
          setLocation("/dashboard");
        }, [setLocation]);
        return null;
      }} />
      
      <Route path="/dashboard" component={(props) => 
        <ProtectedRoute component={() => 
          <AppShell>
            <Dashboard {...props} />
          </AppShell>
        } {...props} />
      } />
      
      <Route path="/matches" component={(props) => 
        <ProtectedRoute component={() => 
          <AppShell>
            <Matches {...props} />
          </AppShell>
        } {...props} />
      } />
      
      <Route path="/challenges" component={(props) => 
        <ProtectedRoute component={() => 
          <AppShell>
            <Challenges {...props} />
          </AppShell>
        } {...props} />
      } />
      
      <Route path="/messages" component={(props) => 
        <ProtectedRoute component={() => 
          <AppShell>
            <Messages {...props} />
          </AppShell>
        } {...props} />
      } />
      
      <Route path="/achievements" component={(props) => 
        <ProtectedRoute component={() => 
          <AppShell>
            <Achievements {...props} />
          </AppShell>
        } {...props} />
      } />
      
      <Route path="/settings" component={(props) => 
        <ProtectedRoute component={() => 
          <AppShell>
            <Settings {...props} />
          </AppShell>
        } {...props} />
      } />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
