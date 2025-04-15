import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import ChallengeCard from "@/components/challenge/ChallengeCard";
import CreateChallengeForm from "@/components/challenge/CreateChallengeForm";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Challenges() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  
  // Get challenges
  const { data: challengesData, isLoading } = useQuery({
    queryKey: ['/api/challenges'],
  });
  
  // Get matches for challenge creation
  const { data: matchesData } = useQuery({
    queryKey: ['/api/matches'],
  });
  
  const activeMatches = matchesData?.matches?.filter(
    (match: any) => match.status === 'active'
  ) || [];
  
  // Active and completed challenges
  const activeChallenges = challengesData?.challenges?.filter(
    (challenge: any) => challenge.status === 'active'
  ) || [];
  
  const completedChallenges = challengesData?.challenges?.filter(
    (challenge: any) => challenge.status === 'completed'
  ) || [];
  
  // Create challenge mutation
  const createChallengeMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/challenges", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/challenges'] });
      setCreateDialogOpen(false);
      toast({
        title: "Challenge Created",
        description: "Your new challenge has been created successfully.",
        variant: "success",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Create Challenge",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const handleCreateChallenge = (data: any) => {
    createChallengeMutation.mutate(data);
  };
  
  // Update challenge progress mutation
  const updateProgressMutation = useMutation({
    mutationFn: async ({ challengeId, stepsCompleted }: { challengeId: number, stepsCompleted: number }) => {
      const response = await apiRequest("PUT", `/api/challenges/${challengeId}/progress`, { stepsCompleted });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/challenges'] });
      if (data.achievement) {
        toast({
          title: "Achievement Unlocked!",
          description: `${data.achievement.title} (+${data.achievement.points} points)`,
          variant: "success",
        });
      }
    },
  });
  
  // Sobriety update mutation
  const updateSobrietyMutation = useMutation({
    mutationFn: async ({ challengeId, daysSober }: { challengeId: number, daysSober: number }) => {
      const response = await apiRequest("PUT", `/api/challenges/${challengeId}/sobriety`, { daysSober });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/challenges'] });
      if (data.achievement) {
        toast({
          title: "Achievement Unlocked!",
          description: `${data.achievement.title} (+${data.achievement.points} points)`,
          variant: "success",
        });
      }
    },
  });
  
  // Reset sobriety counter mutation
  const resetSobrietyMutation = useMutation({
    mutationFn: async (challengeId: number) => {
      const response = await apiRequest("POST", `/api/challenges/${challengeId}/sobriety/reset`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/challenges'] });
      toast({
        title: "Sobriety Counter Reset",
        description: "Your sobriety counter has been reset. Don't give up!",
        variant: "default",
      });
    },
  });
  
  // Check-in streak mutation
  const checkInMutation = useMutation({
    mutationFn: async (challengeId: number) => {
      const response = await apiRequest("POST", `/api/challenges/${challengeId}/check-in`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/challenges'] });
      if (data.achievement) {
        toast({
          title: "Achievement Unlocked!",
          description: `${data.achievement.title} (+${data.achievement.points} points)`,
          variant: "success",
        });
      } else {
        toast({
          title: "Check-In Recorded",
          description: `Your streak is now ${data.progress.currentStreak} days!`,
          variant: "success",
        });
      }
    },
  });
  
  const handleUpdateProgress = (challengeId: number, stepsCompleted: number) => {
    updateProgressMutation.mutate({ challengeId, stepsCompleted });
  };
  
  const handleSobrietyUpdate = (challengeId: number, daysSober: number) => {
    updateSobrietyMutation.mutate({ challengeId, daysSober });
  };
  
  const handleSobrietyReset = (challengeId: number) => {
    resetSobrietyMutation.mutate(challengeId);
  };
  
  const handleCheckIn = (challengeId: number) => {
    checkInMutation.mutate(challengeId);
  };

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-6xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Recovery Challenges</h1>
        <p className="text-neutral-600">
          AI-generated recovery challenges to help you and your accountability partner maintain sobriety.
        </p>
      </div>
      
      {/* Active Challenges Section */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Active Recovery Challenges</h2>
          <Button 
            onClick={() => setCreateDialogOpen(true)}
            className="text-primary bg-white border border-primary hover:bg-primary/5 text-sm"
            variant="outline"
            disabled={activeMatches.length === 0}
          >
            Generate New Challenge <Plus className="ml-2 h-4 w-4" />
          </Button>
        </div>
        
        {isLoading ? (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm p-5 h-24 animate-pulse" />
            <div className="bg-white rounded-xl shadow-sm p-5 h-24 animate-pulse" />
          </div>
        ) : activeChallenges.length > 0 ? (
          <div className="space-y-4">
            {activeChallenges.map((challenge: any) => (
              <ChallengeCard 
                key={challenge.id} 
                challenge={challenge}
                onUpdateProgress={handleUpdateProgress}
                onSobrietyUpdate={handleSobrietyUpdate}
                onSobrietyReset={handleSobrietyReset}
                onCheckIn={handleCheckIn}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <h3 className="font-medium text-lg mb-2">No Active Recovery Challenges</h3>
            <p className="text-neutral-600 mb-4">
              Generate AI-powered recovery challenges to support your sobriety journey with your accountability partner.
            </p>
            {activeMatches.length > 0 ? (
              <Button 
                onClick={() => setCreateDialogOpen(true)}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                Generate Recovery Challenge
              </Button>
            ) : (
              <p className="text-sm text-neutral-500">You need an active match to generate recovery challenges.</p>
            )}
          </div>
        )}
      </section>
      
      {/* Completed Challenges Section */}
      {completedChallenges.length > 0 && (
        <section className="mb-8">
          <div className="mb-4">
            <h2 className="text-xl font-bold">Completed Recovery Milestones</h2>
            <p className="text-sm text-neutral-600">Celebrate your recovery achievements and progress</p>
          </div>
          
          <div className="space-y-4">
            {completedChallenges.map((challenge: any) => (
              <ChallengeCard 
                key={challenge.id} 
                challenge={challenge}
                completed
              />
            ))}
          </div>
        </section>
      )}
      
      {/* Create Challenge Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Generate AI Recovery Challenge</DialogTitle>
          </DialogHeader>
          <CreateChallengeForm 
            matches={activeMatches}
            onSubmit={handleCreateChallenge}
            isSubmitting={createChallengeMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
