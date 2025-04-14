import { Route, Switch, useLocation, useRoute } from "wouter";
import Login from "./auth/login";
import Register from "./auth/register";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export default function AuthPage() {
  const [location, setLocation] = useLocation();
  const auth = useAuth();
  const [isLoginRoute] = useRoute("/auth/login");
  const [isRegisterRoute] = useRoute("/auth/register");
  const [isExactAuthRoute] = useRoute("/auth");

  // Redirect to home if already authenticated
  useEffect(() => {
    if (auth.isAuthenticated && !auth.loading) {
      setLocation("/dashboard");
    }
  }, [auth.isAuthenticated, auth.loading, setLocation]);

  // If path is exactly /auth, redirect to the login page
  useEffect(() => {
    if (isExactAuthRoute) {
      console.log("Redirecting from /auth to /auth/login");
      // Use a small timeout to avoid potential router conflicts
      setTimeout(() => {
        setLocation("/auth/login");
      }, 50);
    }
  }, [isExactAuthRoute, setLocation]);

  if (auth.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 rounded-full border-t-2 border-primary"></div>
      </div>
    );
  }

  // If user is authenticated, nothing will render as they'll be redirected
  if (auth.isAuthenticated) return null;

  // Set default component to Login if not on a specific auth route
  if (!isLoginRoute && !isRegisterRoute && !isExactAuthRoute) {
    return <Login />;
  }

  return (
    <Switch>
      <Route path="/auth/login" component={Login} />
      <Route path="/auth/register" component={Register} />
      <Route path="/auth">
        <Login />
      </Route>
    </Switch>
  );
}