import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, X, UserPlus } from "lucide-react";

interface MatchFinderProps {
  onClose: () => void;
}

interface Interest {
  id: number;
  name: string;
  category: string;
}

interface InterestsResponse {
  interests: Interest[];
}

interface MatchRecommendation {
  userId: number;
  displayName: string;
  profilePic?: string;
  matchScore: number;
  sharedInterests: string[];
  memberSince: string;
}

interface RecommendationsResponse {
  recommendations: MatchRecommendation[];
}

interface MatchesResponse {
  matches: Array<{
    id: number;
    status: string;
    userId1: number;
    userId2: number;
    otherUser: {
      id: number;
      displayName: string;
      profilePic?: string;
    };
  }>;
}

export default function MatchFinder({ onClose }: MatchFinderProps) {
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const { toast } = useToast();
  
  // Get all interests
  const { data: interestsData, isLoading: interestsLoading } = useQuery<InterestsResponse>({
    queryKey: ['/api/interests'],
  });
  
  // Get existing matches to check if user already has an active match
  const { data: matchesData } = useQuery<MatchesResponse>({
    queryKey: ['/api/matches'],
  });
  
  // Check if the user already has an active match
  const hasActiveMatch = (matchesData?.matches || []).some((match) => match.status === 'active');
  
  // Find match recommendations
  const { data: recommendationsData, isLoading: recommendationsLoading, refetch } = useQuery<RecommendationsResponse>({
    queryKey: ['/api/matches/find', selectedInterests],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedInterests.length > 0) {
        params.set('interests', selectedInterests.join(','));
      }
      const response = await fetch(`/api/matches/find?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to find matches');
      }
      return response.json();
    },
    enabled: false,
  });
  
  // Request match mutation
  const requestMatchMutation = useMutation({
    mutationFn: async (matchData: { otherUserId: number, matchScore: number }) => {
      const response = await apiRequest("POST", "/api/matches", matchData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/matches'] });
      toast({
        title: "Match Request Sent",
        description: "Your match request has been sent successfully.",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Match Request Failed",
        description: error.message || "Failed to send match request.",
        variant: "destructive",
      });
    },
  });
  
  // Handle interest selection
  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };
  
  // Find matches
  const handleFindMatches = async () => {
    // Double-check that user doesn't have an active match
    if (hasActiveMatch) {
      toast({
        title: "Cannot Find Matches",
        description: "You already have an active match. Please end your current match before finding new matches.",
        variant: "destructive",
      });
      return;
    }
    
    if (selectedInterests.length === 0) {
      toast({
        title: "No Interests Selected",
        description: "Please select at least one interest to find matches.",
        variant: "destructive",
      });
      return;
    }
    
    console.log("Finding matches with interests:", selectedInterests);
    try {
      // Create a new fetch request manually instead of using refetch
      // This gives us more control over error handling
      const params = new URLSearchParams();
      if (selectedInterests.length > 0) {
        params.set('interests', selectedInterests.join(','));
      }

      const response = await fetch(`/api/matches/find?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to find matches" }));
        toast({
          title: "Error Finding Matches",
          description: errorData.message || "An error occurred while finding matches",
          variant: "destructive",
        });
        return;
      }
      
      const data = await response.json();
      // Update the query cache with the new data
      queryClient.setQueryData(['/api/matches/find', selectedInterests], data);
      
      if (!data.recommendations || data.recommendations.length === 0) {
        toast({
          title: "No Matches Found",
          description: "No matching users were found with the selected interests. Try selecting different interests or check back later.",
          variant: "default",
        });
      } else {
        toast({
          title: "Matches Found",
          description: `Found ${data.recommendations.length} potential matches based on your interests.`,
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error finding matches:", error);
      toast({
        title: "Error Finding Matches",
        description: "An unexpected error occurred while finding matches. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Request a match
  const handleRequestMatch = (userId: number, matchScore: number) => {
    // Double-check that user doesn't have an active match 
    if (hasActiveMatch) {
      toast({
        title: "Cannot Request Match",
        description: "You already have an active match. Please end your current match before requesting a new one.",
        variant: "destructive",
      });
      return;
    }
    
    requestMatchMutation.mutate({ otherUserId: userId, matchScore });
  };
  
  // Load all available interests
  const interests = (interestsData as InterestsResponse)?.interests || [];
  
  // Get recommendations
  const recommendations = (recommendationsData as RecommendationsResponse)?.recommendations || [];

  return (
    <section className="mb-8">
      <div className="mb-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Find New Matches</h2>
          <button 
            className="text-neutral-500 hover:text-neutral-700"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="text-neutral-600 text-sm mt-1">
          We use AI to match you with people who have complementary goals and experiences
        </p>
      </div>
      
      {/* Active Match Warning */}
      {hasActiveMatch && (
        <Card className="mb-4 bg-amber-50 border-amber-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-3 text-amber-800">You Already Have an Active Match</h3>
            <p className="text-amber-700 mb-4">
              You can only have one active match at a time. To find a new match, you'll need to end your current match first.
            </p>
            <div className="flex justify-end">
              <Button
                variant="outline"
                className="border-amber-500 text-amber-700 hover:bg-amber-100"
                onClick={onClose}
              >
                Return to Matches
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Interest Selection */}
      {!hasActiveMatch && (
        <Card className="mb-4">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-3">What are you looking for support with?</h3>
            {interestsLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {interests.length > 0 ? (
                  <>
                    <p className="text-sm text-neutral-600 mb-3">
                      Select the areas where you're looking for support. You can select multiple options.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
                      {interests.map((interest: any) => (
                        <div 
                          key={interest.id} 
                          className={`border rounded-lg p-3 flex items-center hover:border-primary cursor-pointer ${
                            selectedInterests.includes(interest.name) 
                              ? 'bg-primary/5 border-primary' 
                              : 'border-neutral-300'
                          }`}
                          onClick={() => toggleInterest(interest.name)}
                        >
                          <Checkbox 
                            id={`interest-${interest.id}`}
                            checked={selectedInterests.includes(interest.name)}
                            className="h-4 w-4 text-primary"
                            onCheckedChange={() => toggleInterest(interest.name)}
                          />
                          <label 
                            htmlFor={`interest-${interest.id}`} 
                            className="ml-2 text-sm font-medium cursor-pointer w-full"
                          >
                            {interest.name}
                          </label>
                        </div>
                      ))}
                    </div>
                    {selectedInterests.length > 0 && (
                      <div className="bg-accent/10 p-3 rounded-lg mb-4">
                        <p className="text-sm font-medium">Selected interests: {selectedInterests.length}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedInterests.map((interest, index) => (
                            <span 
                              key={index}
                              className="bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded-full flex items-center"
                            >
                              {interest}
                              <button 
                                className="ml-1 text-primary hover:text-primary/80"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleInterest(interest);
                                }}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-neutral-600 mb-2">No interests found in the system.</p>
                    <p className="text-sm text-neutral-500">Please try again later or contact support.</p>
                  </div>
                )}
                
                <div className="flex justify-end">
                  <Button
                    onClick={handleFindMatches}
                    disabled={recommendationsLoading}
                  >
                    {recommendationsLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Finding Matches...
                      </>
                    ) : (
                      <>
                        Find Matches 
                        <svg 
                          className="ml-2 h-4 w-4" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth="2" 
                            d="M14 5l7 7m0 0l-7 7m7-7H3"
                          />
                        </svg>
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Match Results */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader className="border-b border-neutral-200 pb-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Recommended Matches</h3>
              <div className="text-sm text-neutral-500">{recommendations.length} matches found</div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <div className="divide-y divide-neutral-200">
              {recommendations.map((match: any) => (
                <div 
                  key={match.userId} 
                  className="p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-neutral-50 transition"
                >
                  <div className="sm:w-1/4">
                    <div className="flex items-center">
                      <Avatar className="h-12 w-12">
                        {match.profilePic ? (
                          <AvatarImage src={match.profilePic} alt={match.displayName} />
                        ) : (
                          <AvatarFallback className="bg-primary text-white">
                            {match.displayName.charAt(0)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="ml-3">
                        <h4 className="font-medium">{match.displayName}</h4>
                        <div className="text-xs text-neutral-500">
                          Member since {match.memberSince}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="sm:w-2/5">
                    <div className="flex flex-wrap gap-2">
                      {match.sharedInterests.map((interest: string, index: number) => (
                        <span 
                          key={index}
                          className="bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded-full"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="sm:w-1/6">
                    <div className="bg-primary/10 text-primary text-sm font-medium px-3 py-1 rounded-full text-center">
                      {match.matchScore}% Match
                    </div>
                  </div>
                  
                  <div className="sm:w-1/6 flex justify-end">
                    <Button
                      onClick={() => handleRequestMatch(match.userId, match.matchScore)}
                      disabled={requestMatchMutation.isPending}
                      className="flex items-center gap-1"
                    >
                      {requestMatchMutation.isPending && requestMatchMutation.variables?.otherUserId === match.userId ? (
                        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                      ) : (
                        <UserPlus className="h-4 w-4 mr-1" />
                      )}
                      Connect
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
