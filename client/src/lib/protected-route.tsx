import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType;
}

export function ProtectedRoute({
  path,
  component: Component
}: ProtectedRouteProps) {
  const auth = useAuth();

  return (
    <Route path={path}>
      {() => {
        if (auth.loading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          );
        }

        if (!auth.isAuthenticated) {
          return <Redirect to="/auth" />;
        }

        return <Component />;
      }}
    </Route>
  );
}

interface PublicOnlyRouteProps {
  path: string;
  component: React.ComponentType;
}

export function PublicOnlyRoute({
  path,
  component: Component
}: PublicOnlyRouteProps) {
  const auth = useAuth();

  return (
    <Route path={path}>
      {() => {
        if (auth.loading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          );
        }

        if (auth.isAuthenticated) {
          return <Redirect to="/dashboard" />;
        }

        return <Component />;
      }}
    </Route>
  );
}