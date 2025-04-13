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
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function Register() {
  const auth = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    displayName: "",
    email: "",
    bio: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Basic validation
    const newErrors: Record<string, string> = {};
    if (!formData.username) newErrors.username = "Username is required";
    else if (formData.username.length < 3) newErrors.username = "Username must be at least 3 characters";
    
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    
    if (!formData.confirmPassword) newErrors.confirmPassword = "Please confirm your password";
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    
    if (!formData.displayName) newErrors.displayName = "Display name is required";
    
    if (!formData.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Please enter a valid email";
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Submit registration
    const { confirmPassword, ...registrationData } = formData;
    auth.registerMutation.mutate(registrationData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="flex flex-col md:flex-row w-full max-w-4xl bg-background rounded-lg shadow-lg overflow-hidden">
        {/* Info Side */}
        <div className="w-full md:w-1/2 bg-primary p-12 hidden md:flex flex-col justify-center text-primary-foreground">
          <h2 className="text-3xl font-bold mb-4">Join Our Community</h2>
          <p className="mb-6">
            Sign up today and be paired with someone who understands your challenges
            and can support your growth journey.
          </p>
          <ul className="space-y-2">
            <li className="flex items-center">
              <div className="mr-2 text-xl">✓</div>
              <span>Find a compatible accountability partner</span>
            </li>
            <li className="flex items-center">
              <div className="mr-2 text-xl">✓</div>
              <span>Participate in gamified challenges</span>
            </li>
            <li className="flex items-center">
              <div className="mr-2 text-xl">✓</div>
              <span>Track your progress and earn achievements</span>
            </li>
          </ul>
        </div>

        {/* Form Side */}
        <div className="w-full md:w-1/2 p-4">
          <Card className="border-none shadow-none">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold">Create an Account</CardTitle>
              <CardDescription>
                Sign up to find your ideal accountability partner
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    name="username"
                    placeholder="Choose a username"
                    value={formData.username}
                    onChange={handleChange}
                    disabled={auth.registerMutation.isPending}
                    className={errors.username ? "border-destructive" : ""}
                  />
                  {errors.username && (
                    <p className="text-sm text-destructive">{errors.username}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    name="displayName"
                    placeholder="Enter your display name"
                    value={formData.displayName}
                    onChange={handleChange}
                    disabled={auth.registerMutation.isPending}
                    className={errors.displayName ? "border-destructive" : ""}
                  />
                  {errors.displayName && (
                    <p className="text-sm text-destructive">{errors.displayName}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={auth.registerMutation.isPending}
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
                    name="password"
                    type="password"
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={auth.registerMutation.isPending}
                    className={errors.password ? "border-destructive" : ""}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={auth.registerMutation.isPending}
                    className={errors.confirmPassword ? "border-destructive" : ""}
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bio">About You (Optional)</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    placeholder="Tell us a bit about yourself"
                    value={formData.bio}
                    onChange={handleChange}
                    disabled={auth.registerMutation.isPending}
                    className="resize-none"
                  />
                </div>
                
                <Button
                  type="submit"
                  className="w-full"
                  disabled={auth.registerMutation.isPending}
                >
                  {auth.registerMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
                
                {auth.registerMutation.isError && (
                  <p className="text-sm text-destructive text-center">
                    {auth.registerMutation.error.message}
                  </p>
                )}
              </form>
            </CardContent>
            <CardFooter className="flex justify-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/auth/login">
                  <span className="text-primary cursor-pointer hover:underline">
                    Sign in
                  </span>
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}