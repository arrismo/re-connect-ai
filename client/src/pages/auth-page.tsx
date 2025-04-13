import { Route, Switch, useLocation } from "wouter";
import Login from "./auth/login";
import Register from "./auth/register";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export default function AuthPage() {
  const [location, setLocation] = useLocation();
  const auth = useAuth();

  // Redirect to home if already authenticated
  useEffect(() => {
    if (auth.isAuthenticated && !auth.loading) {
      setLocation("/");
    }
  }, [auth.isAuthenticated, auth.loading, setLocation]);

  // If path is exactly /auth, redirect to the login page
  useEffect(() => {
    if (location === "/auth") {
      setLocation("/auth/login");
    }
  }, [location, setLocation]);

  if (auth.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 rounded-full border-t-2 border-primary"></div>
      </div>
    );
  }

  // If user is authenticated, nothing will render as they'll be redirected
  if (auth.isAuthenticated) return null;

  return (
    <Switch>
      <Route path="/auth/login" component={Login} />
      <Route path="/auth/register" component={Register} />
    </Switch>
  );
}