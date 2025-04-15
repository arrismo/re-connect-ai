import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Progress,
  ProgressIndicator 
} from "@/components/ui/progress";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trophy, Users, Calendar, Clock, Plus, Award } from "lucide-react";
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { format } from 'date-fns';

interface ChallengeProgressProps {
  progress: number; // 0-100
}

const ChallengeProgress: React.FC<ChallengeProgressProps> = ({ progress }) => {
  const progressValue = Math.min(100, Math.max(0, progress));
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span>Progress</span>
        <span>{progressValue}%</span>
      </div>
      <Progress value={progressValue} className="h-2">
        <ProgressIndicator style={{ transform: `translateX(-${100 - progressValue}%)` }} />
      </Progress>
    </div>
  );
};

interface GroupChallengeCardProps {
  challenge: any;
  userProgress?: any;
  onView: (challengeId: number) => void;
  onJoin: (challengeId: number) => void;
}

const GroupChallengeCard: React.FC<GroupChallengeCardProps> = ({ 
  challenge, 
  userProgress,
  onView,
  onJoin
}) => {
  const startDate = challenge.startDate ? new Date(challenge.startDate) : null;
  const endDate = challenge.endDate ? new Date(challenge.endDate) : null;
  
  const isActive = challenge.status === 'active';
  const hasJoined = !!userProgress;
  const progressPercentage = hasJoined 
    ? Math.round((userProgress.stepsCompleted / challenge.totalSteps) * 100) 
    : 0;
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg md:text-xl">{challenge.title}</CardTitle>
            <CardDescription>
              {challenge.challengeType || 'General'} Challenge
            </CardDescription>
          </div>
          <Badge 
            variant={isActive ? "default" : "secondary"}
          >
            {isActive ? 'Active' : challenge.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-3">
        <p className="text-sm">{challenge.description}</p>
        
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>
            {startDate ? format(startDate, 'MMM d, yyyy') : 'Start date not set'} 
            {endDate ? ` - ${format(endDate, 'MMM d, yyyy')}` : ''}
          </span>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span>
            {challenge.participantCount || 0} participants
          </span>
        </div>
        
        {hasJoined && (
          <ChallengeProgress progress={progressPercentage} />
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="secondary"
          onClick={() => onView(challenge.id)}
        >
          View Details
        </Button>
        
        {!hasJoined && isActive ? (
          <Button 
            variant="default" 
            onClick={() => onJoin(challenge.id)}
          >
            Join Challenge
          </Button>
        ) : hasJoined ? (
          <Button 
            variant="outline" 
            onClick={() => onView(challenge.id)}
          >
            {userProgress.stepsCompleted >= challenge.totalSteps 
              ? 'Completed' 
              : 'Continue Challenge'}
          </Button>
        ) : (
          <Button variant="outline" disabled>
            {challenge.status === 'completed' ? 'Ended' : 'Coming Soon'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

interface GroupChallengeDetailProps {
  challengeId: number;
  onBack: () => void;
}

const GroupChallengeDetail: React.FC<GroupChallengeDetailProps> = ({ 
  challengeId,
  onBack
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [updateProgress, setUpdateProgress] = useState(0);
  
  // Fetch challenge details
  const { 
    data: challengeData, 
    isLoading: isLoadingChallenge
  } = useQuery({
    queryKey: [`/api/group-challenges/${challengeId}`],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/group-challenges/${challengeId}`);
      return await res.json();
    }
  });
  
  // Fetch leaderboard
  const { 
    data: leaderboardData, 
    isLoading: isLoadingLeaderboard
  } = useQuery({
    queryKey: [`/api/group-challenges/${challengeId}/leaderboard`],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/group-challenges/${challengeId}/leaderboard`);
      return await res.json();
    },
    enabled: activeTab === 'leaderboard'
  });
  
  // Fetch user's progress
  const { 
    data: userProgressData,
    isLoading: isLoadingUserProgress
  } = useQuery({
    queryKey: [`/api/group-challenges/${challengeId}/progress`],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/group-challenges/${challengeId}/progress`);
      return await res.json();
    }
  });
  
  // Mutation to update progress
  const updateProgressMutation = useMutation({
    mutationFn: async ({ steps }: { steps: number }) => {
      const res = await apiRequest('POST', `/api/group-challenges/${challengeId}/progress`, { 
        steps 
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/group-challenges/${challengeId}/progress`] });
      queryClient.invalidateQueries({ queryKey: [`/api/group-challenges/${challengeId}/leaderboard`] });
      
      toast({
        title: "Progress updated",
        description: "Your challenge progress has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Failed to update your progress. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  if (isLoadingChallenge) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
        <span className="ml-2">Loading challenge details...</span>
      </div>
    );
  }
  
  if (!challengeData?.challenge) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-medium">Challenge not found</h3>
        <p className="text-muted-foreground mt-2">
          The challenge you're looking for doesn't exist or has been removed.
        </p>
        <Button onClick={onBack} variant="outline" className="mt-4">
          Back to Challenges
        </Button>
      </div>
    );
  }
  
  const challenge = challengeData.challenge;
  const userProgress = userProgressData?.progress;
  const leaderboard = leaderboardData?.leaderboard || [];
  
  const startDate = challenge.startDate ? new Date(challenge.startDate) : null;
  const endDate = challenge.endDate ? new Date(challenge.endDate) : null;
  
  const hasJoined = !!userProgress;
  const isActive = challenge.status === 'active';
  const progressPercentage = hasJoined 
    ? Math.round((userProgress.stepsCompleted / challenge.totalSteps) * 100) 
    : 0;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button 
          variant="ghost" 
          onClick={onBack} 
          className="p-2 h-auto"
        >
          <span aria-hidden="true">&larr;</span>
        </Button>
        <div className="ml-4">
          <h2 className="text-2xl font-bold">{challenge.title}</h2>
          <p className="text-muted-foreground">
            {challenge.challengeType || 'General'} Challenge
          </p>
        </div>
      </div>
      
      <Tabs defaultValue="overview" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Challenge Details</span>
                <Badge 
                  variant={isActive ? "default" : "secondary"}
                >
                  {isActive ? 'Active' : challenge.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>{challenge.description}</p>
              
              <div className="space-y-2">
                <div className="flex items-center">
                  <Calendar className="mr-2 h-5 w-5 text-muted-foreground" />
                  <span>
                    {startDate ? format(startDate, 'MMMM d, yyyy') : 'Start date not set'} 
                    {endDate ? ` - ${format(endDate, 'MMMM d, yyyy')}` : ''}
                  </span>
                </div>
                
                <div className="flex items-center">
                  <Trophy className="mr-2 h-5 w-5 text-muted-foreground" />
                  <span>Total Steps: {challenge.totalSteps}</span>
                </div>
                
                <div className="flex items-center">
                  <Users className="mr-2 h-5 w-5 text-muted-foreground" />
                  <span>
                    {challenge.participantCount || 0} participants
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {hasJoined ? (
            <Card>
              <CardHeader>
                <CardTitle>Your Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ChallengeProgress progress={progressPercentage} />
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Steps Completed</p>
                    <p className="text-2xl font-bold">{userProgress.stepsCompleted} / {challenge.totalSteps}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium">Points Earned</p>
                    <p className="text-2xl font-bold">{userProgress.pointsEarned || 0}</p>
                  </div>
                </div>
                
                {isActive && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>Update Progress</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Update Your Progress</DialogTitle>
                        <DialogDescription>
                          Enter your current progress for the "{challenge.title}" challenge.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="py-4">
                        <label className="text-sm font-medium mb-2 block">
                          Steps Completed (out of {challenge.totalSteps})
                        </label>
                        <input
                          type="number"
                          className="w-full p-2 border rounded"
                          min={userProgress.stepsCompleted || 0}
                          max={challenge.totalSteps}
                          value={updateProgress || userProgress.stepsCompleted || 0}
                          onChange={(e) => setUpdateProgress(parseInt(e.target.value) || 0)}
                        />
                      </div>
                      
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setUpdateProgress(0)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={() => {
                            updateProgressMutation.mutate({ steps: updateProgress });
                            setUpdateProgress(0);
                          }}
                          disabled={
                            updateProgressMutation.isPending || 
                            updateProgress === 0 || 
                            updateProgress === userProgress.stepsCompleted ||
                            updateProgress > challenge.totalSteps
                          }
                        >
                          Save Progress
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </CardContent>
            </Card>
          ) : isActive ? (
            <Card>
              <CardHeader>
                <CardTitle>Join This Challenge</CardTitle>
                <CardDescription>
                  Participate with others and track your progress together.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => {
                    // Join the challenge
                  }}
                >
                  Join Challenge
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </TabsContent>
        
        <TabsContent value="leaderboard">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Leaderboard</span>
                <Badge variant="outline">
                  {leaderboard.length} Participants
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingLeaderboard ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="animate-spin h-6 w-6 text-primary" />
                </div>
              ) : leaderboard.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Participant</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead className="text-right">Points</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaderboard.map((entry, index) => (
                      <TableRow key={entry.id} className={
                        entry.userId === (userProgress?.userId) ? "bg-primary/10" : ""
                      }>
                        <TableCell className="font-medium">
                          {index === 0 ? (
                            <Trophy className="h-5 w-5 text-yellow-500" />
                          ) : index === 1 ? (
                            <Trophy className="h-5 w-5 text-gray-400" />
                          ) : index === 2 ? (
                            <Trophy className="h-5 w-5 text-amber-700" />
                          ) : (
                            `#${index + 1}`
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{entry.user.displayName}</div>
                        </TableCell>
                        <TableCell>
                          <ChallengeProgress 
                            progress={Math.round((entry.stepsCompleted / challenge.totalSteps) * 100)} 
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end">
                            <Award className="h-4 w-4 mr-1 text-primary" />
                            {entry.pointsEarned || 0}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">
                    No participants yet. Be the first to join!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface GroupChallengesProps {
  userId?: number;
}

const GroupChallenges: React.FC<GroupChallengesProps> = ({ userId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedChallenge, setSelectedChallenge] = useState<number | null>(null);
  
  // Fetch active group challenges
  const { 
    data: challengesData, 
    isLoading: isLoadingChallenges 
  } = useQuery({
    queryKey: ['/api/group-challenges'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/group-challenges');
      return await res.json();
    }
  });
  
  // Fetch user's challenges
  const { 
    data: userChallengesData, 
    isLoading: isLoadingUserChallenges 
  } = useQuery({
    queryKey: ['/api/my-group-challenges'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/my-group-challenges');
      return await res.json();
    },
    enabled: !!user
  });
  
  // Mutation to join a challenge
  const joinChallengeMutation = useMutation({
    mutationFn: async (challengeId: number) => {
      const res = await apiRequest('POST', `/api/group-challenges/${challengeId}/join`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/my-group-challenges'] });
      
      toast({
        title: "Joined challenge",
        description: "You've successfully joined the challenge.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to join",
        description: "There was an error joining the challenge. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  if (selectedChallenge !== null) {
    return (
      <GroupChallengeDetail 
        challengeId={selectedChallenge} 
        onBack={() => setSelectedChallenge(null)} 
      />
    );
  }
  
  const handleJoinChallenge = (challengeId: number) => {
    joinChallengeMutation.mutate(challengeId);
  };
  
  // Get user progress map for easy lookup
  const userProgressMap = ((userChallengesData?.challenges || []).reduce((acc, challenge) => {
    if (challenge.userProgress) {
      acc[challenge.id] = challenge.userProgress;
    }
    return acc;
  }, {}));
  
  // Get all active challenges
  const activeChallenges = challengesData?.challenges || [];
  
  // Get user's joined challenges
  const userChallenges = userChallengesData?.challenges || [];
  
  const isLoading = isLoadingChallenges || isLoadingUserChallenges;
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Group Challenges</h2>
      </div>
      
      {userChallenges.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Your Challenges</h3>
          
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="animate-spin h-6 w-6 text-primary" />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
              {userChallenges.map(challenge => (
                <GroupChallengeCard 
                  key={challenge.id}
                  challenge={challenge}
                  userProgress={challenge.userProgress}
                  onView={(id) => setSelectedChallenge(id)}
                  onJoin={handleJoinChallenge}
                />
              ))}
            </div>
          )}
        </div>
      )}
      
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Active Challenges</h3>
        
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="animate-spin h-6 w-6 text-primary" />
          </div>
        ) : activeChallenges.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
            {activeChallenges.map(challenge => (
              <GroupChallengeCard 
                key={challenge.id}
                challenge={challenge}
                userProgress={userProgressMap[challenge.id]}
                onView={(id) => setSelectedChallenge(id)}
                onJoin={handleJoinChallenge}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-secondary/20 rounded-lg">
            <p className="mb-2">No active challenges available.</p>
            <p className="text-sm text-muted-foreground">
              Check back later for new challenges or speak with your recovery coach.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupChallenges;