import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User as SelectUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

// Type definitions
type AuthContextType = {
  user: SelectUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginCredentials>;
  registerMutation: UseMutationResult<SelectUser, Error, RegisterData>;
  logout: () => Promise<void>;
};

type LoginCredentials = {
  username: string;
  password: string;
};

type RegisterData = {
  username: string;
  password: string;
  displayName: string;
  email: string;
  bio?: string | null;
  interests?: string[] | null;
  goals?: string[] | null;
  experiences?: string[] | null;
  profilePic?: string | null;
};

// Create context
export const AuthContext = createContext<AuthContextType | null>(null);

// Schemas for validation
const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  displayName: z.string().min(2, "Display name is required"),
  email: z.string().email("Please enter a valid email"),
  bio: z.string().nullable().optional(),
  interests: z.array(z.string()).nullable().optional(),
  goals: z.array(z.string()).nullable().optional(),
  experiences: z.array(z.string()).nullable().optional(),
  profilePic: z.string().nullable().optional(),
});

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();

  // Get current user
  const {
    data: user,
    error,
    isLoading: loading,
  } = useQuery<SelectUser | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      // Validate credentials
      loginSchema.parse(credentials);
      
      const res = await apiRequest("POST", "/api/login", credentials);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Login failed");
      }
      
      // Return the user data
      const userData = await res.json();
      return userData;
    },
    onSuccess: (data: SelectUser) => {
      queryClient.setQueryData(["/api/user"], data);
      toast({
        title: "Login successful",
        description: `Welcome back, ${data.displayName}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Registration mutation
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      // Validate registration data
      registerSchema.parse(data);
      
      const res = await apiRequest("POST", "/api/register", data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Registration failed");
      }
      
      // Return the user data
      const userData = await res.json();
      return userData;
    },
    onSuccess: (data: SelectUser) => {
      queryClient.setQueryData(["/api/user"], data);
      toast({
        title: "Registration successful",
        description: `Welcome, ${data.displayName}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Logout function
  const logout = async () => {
    try {
      await apiRequest("POST", "/api/logout");
      queryClient.setQueryData(["/api/user"], null);
      queryClient.invalidateQueries();
      toast({
        title: "Logout successful",
        description: "You have been logged out",
      });
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "An error occurred during logout",
        variant: "destructive",
      });
    }
  };

  const value: AuthContextType = {
    user: user || null,
    isAuthenticated: !!user,
    loading,
    error,
    loginMutation,
    registerMutation,
    logout,
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook for consuming the context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}