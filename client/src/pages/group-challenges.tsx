import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Users, Trophy, Loader2 } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import GroupChallenges from '@/components/challenges/GroupChallenges';
import CreateGroupChallengeForm from '@/components/challenges/CreateGroupChallengeForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';

const GroupChallengePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('active');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  // Fetch active group challenges
  const { data: activeChallenges, isLoading: isLoadingActive } = useQuery({
    queryKey: ['/api/group-challenges', 'active'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/group-challenges');
      return await res.json();
    },
    enabled: activeTab === 'active'
  });

  // Fetch user's group challenges
  const { data: userChallenges, isLoading: isLoadingUserChallenges } = useQuery({
    queryKey: ['/api/my-group-challenges'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/my-group-challenges');
      return await res.json();
    },
    enabled: activeTab === 'my'
  });
  
  // Create group challenge mutation
  const createChallengeMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/group-challenges", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/group-challenges'] });
      queryClient.invalidateQueries({ queryKey: ['/api/my-group-challenges'] });
      setCreateDialogOpen(false);
      toast({
        title: "Challenge Created",
        description: "Your new group challenge has been created successfully.",
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

  return (
    <div className="container px-4 py-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-1">Group Challenges</h1>
            <p className="text-muted-foreground">
              Join challenges with multiple participants to build stronger recovery habits
            </p>
          </div>
          <Button 
            className="flex items-center gap-2"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus size={16} /> 
            <span>New Challenge</span>
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="active" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="my">My Challenges</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="discover">Discover</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="space-y-4">
          {isLoadingActive ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : activeChallenges?.challenges && activeChallenges.challenges.length > 0 ? (
            <GroupChallenges challenges={activeChallenges.challenges} />
          ) : (
            <div className="text-center py-12">
              <h3 className="text-xl font-medium mb-2">No active challenges found</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                There are currently no active group challenges. Check back soon or create your own!
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Create Challenge
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="my">
          {isLoadingUserChallenges ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : userChallenges?.challenges && userChallenges.challenges.length > 0 ? (
            <GroupChallenges challenges={userChallenges.challenges} />
          ) : (
            <div className="text-center py-12">
              <div className="mb-4">
                <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-medium mb-2">You haven't joined any challenges yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Join a group challenge to track progress together with others in recovery
              </p>
              <Button onClick={() => setActiveTab('discover')}>Browse Challenges</Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="completed">
          <div className="text-center py-12">
            <div className="mb-4">
              <Trophy className="mx-auto h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-medium mb-2">No completed challenges yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Once you complete a challenge, it will appear here
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="discover">
          <div className="text-center py-12">
            <h3 className="text-xl font-medium mb-2">Discover challenges</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Browse and join upcoming group challenges to improve your recovery journey with others
            </p>
            <Button onClick={() => setActiveTab('active')}>See Active Challenges</Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GroupChallengePage;