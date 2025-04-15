import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Calendar, Loader2, Star, X, UserX } from "lucide-react";
import MessageBubble from "@/components/chat/MessageBubble";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface MatchDetailProps {
  match: {
    id: number;
    matchScore: number;
    matchDetails?: {
      goalAlignment?: number;
      experienceComplementary?: number;
      scheduleCompatibility?: number;
    };
    otherUser: {
      id: number;
      displayName: string;
      profilePic?: string;
      memberSince?: string;
      goals?: string[];
      experiences?: string[];
    };
    challenges?: {
      id: number;
      title: string;
      status: string;
      completedAt?: string;
      description?: string;
    }[];
    messages?: {
      id: number;
      senderId: number;
      content: string;
      sentAt: string;
      isRead: boolean;
    }[];
  };
  onClose: () => void;
}

export default function MatchDetail({ match, onClose }: MatchDetailProps) {
  const { toast } = useToast();
  
  // Check if match is undefined or null
  if (!match) {
    return (
      <div className="p-6 rounded-lg bg-neutral-50 text-center">
        <div className="animate-pulse text-neutral-500 mb-4">
          <Loader2 className="h-8 w-8 mx-auto" />
        </div>
        <h3 className="font-semibold mb-2">Loading match details...</h3>
        <p className="text-neutral-500 text-sm">
          Please wait while we retrieve the match information.
        </p>
      </div>
    );
  }
  
  const { otherUser, matchScore, matchDetails, challenges, messages } = match;
  
  // Default values if match details aren't provided
  const goalAlignment = matchDetails?.goalAlignment || 95;
  const experienceComplementary = matchDetails?.experienceComplementary || 89;
  const scheduleCompatibility = matchDetails?.scheduleCompatibility || 86;
  
  // Filter goals and experiences
  const userGoals = otherUser?.goals || [];
  const userExperiences = otherUser?.experiences || [];
  
  // Get completed challenges
  const completedChallenges = challenges?.filter(c => c.status === 'completed') || [];
  
  // Get recent messages
  const recentMessages = messages?.slice(0, 2) || [];
  
  // Unmatch mutation
  const unmatchMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PUT", `/api/matches/${match.id}/unmatch`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Match ended",
        description: `You are no longer matched with ${otherUser.displayName}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/matches'] });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to end match",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <section className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
      <div className="border-b border-neutral-200 p-5">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Match Details</h2>
          <div className="flex items-center gap-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="text-destructive border-destructive hover:bg-destructive/10 flex items-center gap-1"
                  size="sm"
                >
                  <UserX className="h-4 w-4 mr-1" />
                  Unmatch
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>End this match?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently end your match with {otherUser.displayName}. You'll both be able to find new matches afterward.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    className="bg-destructive hover:bg-destructive/90" 
                    onClick={() => unmatchMutation.mutate()}
                    disabled={unmatchMutation.isPending}
                  >
                    {unmatchMutation.isPending ? "Ending match..." : "End match"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <button 
              className="text-neutral-500 hover:text-neutral-700"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
      
      <div className="p-5">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left Column - Profile Info */}
          <div className="md:w-1/3">
            <div className="flex flex-col items-center mb-6">
              <Avatar className="h-24 w-24 mb-4">
                {otherUser.profilePic ? (
                  <AvatarImage src={otherUser.profilePic} alt={otherUser.displayName} />
                ) : (
                  <AvatarFallback className="bg-primary text-white text-xl">
                    {otherUser.displayName.charAt(0)}
                  </AvatarFallback>
                )}
              </Avatar>
              <h3 className="font-bold text-lg">{otherUser.displayName}</h3>
              <div className="text-sm text-neutral-500 mb-2">
                Member since {otherUser.memberSince || '2023'}
              </div>
              <div className="bg-primary/10 text-primary text-sm font-medium px-3 py-1 rounded-full">
                {matchScore}% Match
              </div>
            </div>
            
            {/* Match Analytics */}
            <div>
              <h4 className="font-medium mb-2">Match Analytics</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Goal Alignment</span>
                    <span className="font-medium">{goalAlignment}%</span>
                  </div>
                  <div className="bg-neutral-200 rounded-full h-2">
                    <div 
                      className="bg-primary rounded-full h-2" 
                      style={{ width: `${goalAlignment}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Experience Complementary</span>
                    <span className="font-medium">{experienceComplementary}%</span>
                  </div>
                  <div className="bg-neutral-200 rounded-full h-2">
                    <div 
                      className="bg-primary rounded-full h-2" 
                      style={{ width: `${experienceComplementary}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Schedule Compatibility</span>
                    <span className="font-medium">{scheduleCompatibility}%</span>
                  </div>
                  <div className="bg-neutral-200 rounded-full h-2">
                    <div 
                      className="bg-primary rounded-full h-2" 
                      style={{ width: `${scheduleCompatibility}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Column - Details */}
          <div className="md:w-2/3">
            
            {/* Match Goals */}
            <div className="mb-6">
              <h4 className="font-semibold mb-3">Goals & Experiences</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-neutral-100 rounded-lg p-4">
                  <h5 className="font-medium text-sm mb-2 text-neutral-700">Goals</h5>
                  <ul className="space-y-2">
                    {userGoals.map((goal, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <Check className="text-secondary h-4 w-4 mr-2" />
                        <span>{goal}</span>
                      </li>
                    ))}
                    {userGoals.length === 0 && (
                      <li className="text-sm text-neutral-500">No goals shared yet</li>
                    )}
                  </ul>
                </div>
                
                <div className="bg-neutral-100 rounded-lg p-4">
                  <h5 className="font-medium text-sm mb-2 text-neutral-700">Experiences</h5>
                  <ul className="space-y-2">
                    {userExperiences.map((experience, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <Star className="text-accent h-4 w-4 mr-2" />
                        <span>{experience}</span>
                      </li>
                    ))}
                    {userExperiences.length === 0 && (
                      <li className="text-sm text-neutral-500">No experiences shared yet</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
            
            {/* Challenge History */}
            {completedChallenges.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold mb-3">Challenge History</h4>
                {completedChallenges.map((challenge, index) => (
                  <div key={index} className="bg-neutral-100 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
                          <Check className="h-4 w-4" />
                        </div>
                        <h5 className="font-medium text-sm ml-2">{challenge.title}</h5>
                      </div>
                      <span className="text-xs font-medium bg-secondary/10 text-secondary px-2 py-1 rounded-full">
                        Completed
                      </span>
                    </div>
                    {challenge.description && (
                      <p className="text-sm text-neutral-600 mb-2">{challenge.description}</p>
                    )}
                    {challenge.completedAt && (
                      <div className="flex items-center text-sm text-neutral-500">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>Completed on {new Date(challenge.completedAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Communication */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold">Communication</h4>
                <Link href={`/messages?matchId=${match.id}`}>
                  <Button variant="link" className="h-auto p-0">
                    View all messages
                  </Button>
                </Link>
              </div>
              
              {/* Chat Preview */}
              <div className="bg-neutral-100 rounded-lg p-4">
                {recentMessages.length > 0 ? (
                  <div className="flex flex-col space-y-3">
                    {recentMessages.map((message, index) => (
                      <MessageBubble
                        key={index}
                        message={message}
                        isOwnMessage={message.senderId !== otherUser.id}
                        senderAvatar={message.senderId === otherUser.id ? otherUser.profilePic : undefined}
                        senderName={message.senderId === otherUser.id ? otherUser.displayName : 'You'}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-neutral-500">No messages yet. Start a conversation!</p>
                    <Link href={`/messages?matchId=${match.id}`}>
                      <Button className="mt-2" size="sm">
                        Send Message
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
