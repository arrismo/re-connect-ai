import React from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Users, Trophy, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import GroupChallenges from '@/components/challenges/GroupChallenges';

const GroupChallengePage: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState('active');

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
          <Button className="flex items-center gap-2">
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