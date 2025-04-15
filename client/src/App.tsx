import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import AppShell from "@/layouts/AppShell";
import Dashboard from "@/pages/dashboard";
import Matches from "@/pages/matches";
import Challenges from "@/pages/challenges";
import Messages from "@/pages/messages";
import MeetingsPage from "@/pages/meetings";
import GroupChallengePage from "@/pages/group-challenges";
// Achievements import removed
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import { AuthProvider } from "@/hooks/useAuth";
import { NotificationProvider } from "@/hooks/useNotifications";
import { ProtectedRoute, PublicOnlyRoute } from "@/lib/protected-route";

function Router() {
  return (
    <Switch>
      <PublicOnlyRoute path="/auth" component={AuthPage} />
      <PublicOnlyRoute path="/auth/login" component={AuthPage} />
      <PublicOnlyRoute path="/auth/register" component={AuthPage} />
      
      <Route path="/" component={() => {
        const [, setLocation] = useLocation();
        useEffect(() => {
          setLocation("/dashboard");
        }, [setLocation]);
        return null;
      }} />
      
      <ProtectedRoute path="/dashboard" component={() => (
        <AppShell>
          <Dashboard />
        </AppShell>
      )} />
      
      <ProtectedRoute path="/matches" component={() => (
        <AppShell>
          <Matches />
        </AppShell>
      )} />
      
      <ProtectedRoute path="/challenges" component={() => (
        <AppShell>
          <Challenges />
        </AppShell>
      )} />
      
      <ProtectedRoute path="/messages" component={() => (
        <AppShell>
          <Messages />
        </AppShell>
      )} />
      
      <ProtectedRoute path="/meetings" component={() => (
        <AppShell>
          <MeetingsPage />
        </AppShell>
      )} />
      
      <ProtectedRoute path="/group-challenges" component={() => (
        <AppShell>
          <GroupChallengePage />
        </AppShell>
      )} />
      
      {/* Achievements route removed */}
      
      <ProtectedRoute path="/settings" component={() => (
        <AppShell>
          <Settings />
        </AppShell>
      )} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          <Router />
          <Toaster />
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
