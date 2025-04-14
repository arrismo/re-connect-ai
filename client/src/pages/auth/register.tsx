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
import { useState, useEffect } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest } from "@/lib/queryClient";

// Common interest categories
const SUGGESTED_INTERESTS = [
  "Anxiety Management",
  "Depression Support",
  "Addiction Recovery",
  "Stress Reduction",
  "Healthy Habits",
  "Meditation",
  "Mindfulness",
  "Exercise",
  "Grief Support",
  "PTSD Support",
  "ADHD Management",
  "Sleep Improvement",
  "Self-care",
  "Career Goals",
  "Relationship Building"
];

// Personality characteristics
const PERSONALITY_TRAITS = [
  "Empathetic",
  "Patient",
  "Organized",
  "Supportive",
  "Motivated",
  "Creative",
  "Analytical",
  "Resilient",
  "Optimistic",
  "Detail-oriented",
  "Communicative",
  "Focused"
];

export default function Register() {
  const auth = useAuth();
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
    email: "",
    bio: "",
  });
  
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);
  const [customInterest, setCustomInterest] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleInterestSelect = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else {
      if (selectedInterests.length < 5) {
        setSelectedInterests([...selectedInterests, interest]);
      }
    }
  };

  const handleTraitSelect = (trait: string) => {
    if (selectedTraits.includes(trait)) {
      setSelectedTraits(selectedTraits.filter(t => t !== trait));
    } else {
      if (selectedTraits.length < 3) {
        setSelectedTraits([...selectedTraits, trait]);
      }
    }
  };

  const handleAddCustomInterest = () => {
    if (customInterest && !selectedInterests.includes(customInterest) && selectedInterests.length < 5) {
      setSelectedInterests([...selectedInterests, customInterest]);
      setCustomInterest("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Basic validation
    const newErrors: Record<string, string> = {};
    
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    
    if (!formData.confirmPassword) newErrors.confirmPassword = "Please confirm your password";
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    
    if (!formData.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Please enter a valid email";
    
    if (selectedInterests.length === 0) {
      newErrors.interests = "Please select at least one interest";
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Submit registration with AI-generated username
    const { confirmPassword, ...registrationData } = formData;
    auth.registerMutation.mutate({
      ...registrationData,
      interests: selectedInterests,
      characteristics: selectedTraits,
    });
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
                  <div className="flex justify-between items-center">
                    <Label htmlFor="interests">Interests (max 5)</Label>
                    <p className="text-sm text-muted-foreground">{selectedInterests.length}/5 selected</p>
                  </div>
                  <div className="border rounded-md p-3 space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {selectedInterests.map((interest) => (
                        <Badge key={interest} className="text-sm py-1 px-2">
                          {interest}
                          <button 
                            type="button"
                            onClick={() => handleInterestSelect(interest)} 
                            className="ml-1 text-primary-foreground hover:text-primary-foreground/80"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Add custom interest"
                        value={customInterest}
                        onChange={(e) => setCustomInterest(e.target.value)}
                        disabled={selectedInterests.length >= 5 || auth.registerMutation.isPending}
                        className="flex-1"
                      />
                      <Button 
                        type="button" 
                        size="sm" 
                        variant="outline"
                        onClick={handleAddCustomInterest}
                        disabled={!customInterest || selectedInterests.length >= 5 || auth.registerMutation.isPending}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div>
                      <p className="text-sm mb-2">Suggested interests:</p>
                      <div className="flex flex-wrap gap-2">
                        {SUGGESTED_INTERESTS.map((interest) => (
                          <Badge 
                            key={interest}
                            className={`cursor-pointer ${selectedInterests.includes(interest) ? 'bg-primary' : 'bg-secondary hover:bg-secondary/80'}`}
                            onClick={() => handleInterestSelect(interest)}
                          >
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  {errors.interests && (
                    <p className="text-sm text-destructive">{errors.interests}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="traits">Your Personality Traits (max 3)</Label>
                    <p className="text-sm text-muted-foreground">{selectedTraits.length}/3 selected</p>
                  </div>
                  <div className="border rounded-md p-3 space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {selectedTraits.map((trait) => (
                        <Badge key={trait} variant="outline" className="text-sm py-1 px-2">
                          {trait}
                          <button 
                            type="button"
                            onClick={() => handleTraitSelect(trait)} 
                            className="ml-1 text-primary hover:text-primary/80"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    
                    <div>
                      <div className="flex flex-wrap gap-2">
                        {PERSONALITY_TRAITS.map((trait) => (
                          <Badge 
                            key={trait}
                            variant="outline"
                            className={`cursor-pointer ${selectedTraits.includes(trait) ? 'bg-primary/10 border-primary/30' : 'hover:bg-secondary/50'}`}
                            onClick={() => handleTraitSelect(trait)}
                          >
                            {trait}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
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
                
                <div className="pt-2">
                  <Label className="text-base font-medium" htmlFor="passwordSection">
                    Create Password
                  </Label>
                  <p className="text-sm text-muted-foreground mb-4">
                    Your username will be generated automatically to maintain anonymity
                  </p>
                  
                  <div className="space-y-4">
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
                  </div>
                </div>
                
                <Button
                  type="submit"
                  className="w-full mt-6"
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