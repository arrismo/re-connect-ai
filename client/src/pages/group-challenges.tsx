import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Users, Trophy, Target } from 'lucide-react';

// This is a placeholder component until we implement the full group challenges feature
const GroupChallengePage: React.FC = () => {
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
      
      <Tabs defaultValue="active">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="my">My Challenges</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="discover">Discover</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Placeholder cards for active challenges */}
            <ChallengeCard 
              title="30 Days of Sobriety" 
              participants={12} 
              progress={40} 
              daysLeft={18} 
              type="daily_check_in"
            />
            <ChallengeCard 
              title="Mindfulness Meditation" 
              participants={8} 
              progress={60} 
              daysLeft={12} 
              type="activity_tracking"
            />
            <ChallengeCard 
              title="Step Work Group" 
              participants={15} 
              progress={25} 
              daysLeft={21} 
              type="milestone"
            />
          </div>
        </TabsContent>
        
        <TabsContent value="my">
          <div className="text-center py-12">
            <div className="mb-4">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-medium mb-2">You haven't joined any challenges yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Join a group challenge to track progress together with others in recovery
            </p>
            <Button>Browse Challenges</Button>
          </div>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Placeholder cards for discoverable challenges */}
            <ChallengeCard 
              title="Gratitude Journal" 
              participants={24} 
              progress={0} 
              daysLeft={30} 
              type="daily_check_in"
              isJoinable={true}
            />
            <ChallengeCard 
              title="Exercise Challenge" 
              participants={16} 
              progress={0} 
              daysLeft={14} 
              type="activity_tracking"
              isJoinable={true}
            />
            <ChallengeCard 
              title="Reading Circle" 
              participants={9} 
              progress={0} 
              daysLeft={28} 
              type="milestone"
              isJoinable={true}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Challenge Card Component
interface ChallengeCardProps {
  title: string;
  participants: number;
  progress: number;
  daysLeft: number;
  type: 'daily_check_in' | 'activity_tracking' | 'milestone';
  isJoinable?: boolean;
}

const ChallengeCard: React.FC<ChallengeCardProps> = ({ 
  title, 
  participants, 
  progress, 
  daysLeft, 
  type,
  isJoinable = false
}) => {
  return (
    <Card className={`overflow-hidden ${isJoinable ? 'border-dashed' : ''}`}>
      <div className="h-2 bg-primary" />
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{title}</CardTitle>
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
            <Users className="mr-1 h-3 w-3" />
            {participants}
          </span>
        </div>
        <CardDescription>
          {type === 'daily_check_in' && 'Daily Check-in'}
          {type === 'activity_tracking' && 'Activity Tracking'}
          {type === 'milestone' && 'Milestone Achievement'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1 text-sm">
              <span>Progress</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <div 
                className="h-full bg-primary" 
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          
          <div className="flex justify-between text-sm">
            <div className="flex items-center">
              <Target className="h-4 w-4 mr-1 text-muted-foreground" />
              <span>{daysLeft} days left</span>
            </div>
            
            {isJoinable ? (
              <Button size="sm" variant="outline">Join</Button>
            ) : (
              <Button size="sm" variant="outline">View</Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GroupChallengePage;