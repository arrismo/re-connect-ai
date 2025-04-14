import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function Login() {
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Basic validation
    const newErrors: Record<string, string> = {};
    if (!email) newErrors.email = "Email is required";
    if (!password) newErrors.password = "Password is required";
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Submit login
    try {
      // Use the auth context login method
      auth.loginMutation.mutate(
        { email, password },
        {
          onError: (error) => {
            console.error("Login error:", error);
            setErrors({ form: error.message || "Login failed. Please check your email and password." });
          }
        }
      );
    } catch (error) {
      console.error("Unexpected login error:", error);
      setErrors({ form: "An unexpected error occurred. Please try again." });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="flex flex-col md:flex-row w-full max-w-4xl bg-background rounded-lg shadow-lg overflow-hidden">
        {/* Form Side */}
        <div className="w-full md:w-1/2 p-4">
          <Card className="border-none shadow-none">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
              <CardDescription>
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={auth.loginMutation.isPending}
                    className={errors.email ? "border-destructive" : ""}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={auth.loginMutation.isPending}
                    className={errors.password ? "border-destructive" : ""}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={auth.loginMutation.isPending}
                >
                  {auth.loginMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
                {errors.form && (
                  <p className="text-sm text-destructive text-center">
                    {errors.form}
                  </p>
                )}
                {auth.loginMutation.isError && !errors.form && (
                  <p className="text-sm text-destructive text-center">
                    {auth.loginMutation.error.message}
                  </p>
                )}
              </form>
            </CardContent>
            <CardFooter className="flex justify-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link href="/auth/register">
                  <span className="text-primary cursor-pointer hover:underline">
                    Sign up
                  </span>
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>

        {/* Info Side */}
        <div className="w-full md:w-1/2 bg-primary p-12 flex flex-col justify-center text-primary-foreground">
          <h2 className="text-3xl font-bold mb-4">
            Welcome to Community Support Matchmaking
          </h2>
          <p className="mb-6">
            Connect with others who share similar challenges and goals. Support each
            other through accountability partnerships and meaningful engagement.
          </p>
          <ul className="space-y-2">
            <li className="flex items-center">
              <div className="mr-2 text-xl">✓</div>
              <span>AI-powered matchmaking for ideal partnerships</span>
            </li>
            <li className="flex items-center">
              <div className="mr-2 text-xl">✓</div>
              <span>Structured challenges to foster accountability</span>
            </li>
            <li className="flex items-center">
              <div className="mr-2 text-xl">✓</div>
              <span>Privacy-focused design to share safely</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}