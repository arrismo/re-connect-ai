import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Award, Users, Check, Trophy, Star, Target } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import StatsCard from "@/components/shared/StatsCard";
import { format } from "date-fns";

export default function Achievements() {
  const { user } = useAuth();
  
  // Get user achievements
  const { data: achievementsData, isLoading } = useQuery({
    queryKey: ['/api/achievements'],
  });
  
  // Process achievements by category
  const achievementsByType: Record<string, any[]> = {
    challenge: [],
    connection: [],
    milestone: [],
    skill: []
  };
  
  const achievements = achievementsData?.achievements || [];
  
  achievements.forEach((achievement: any) => {
    if (achievementsByType[achievement.type]) {
      achievementsByType[achievement.type].push(achievement);
    } else {
      achievementsByType.other = achievementsByType.other || [];
      achievementsByType.other.push(achievement);
    }
  });
  
  // Count achievements & total points
  const totalAchievements = achievements.length;
  const totalPoints = achievements.reduce((sum: number, ach: any) => sum + ach.points, 0);
  
  // Check streak and levels
  const level = Math.floor(totalPoints / 1000) + 1;
  const pointsToNextLevel = 1000 - (totalPoints % 1000);
  
  // Achievement card component
  const AchievementCard = ({ achievement }: { achievement: any }) => {
    const getIcon = () => {
      switch (achievement.type) {
        case 'challenge':
          return <Check className="h-5 w-5" />;
        case 'connection':
          return <Users className="h-5 w-5" />;
        case 'milestone':
          return <Trophy className="h-5 w-5" />;
        case 'skill':
          return <Star className="h-5 w-5" />;
        default:
          return <Award className="h-5 w-5" />;
      }
    };
    
    return (
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center">
          <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
            {getIcon()}
          </div>
          <div className="ml-3 flex-1">
            <div className="flex justify-between">
              <h3 className="font-medium">{achievement.title}</h3>
              <span className="text-primary text-sm font-medium">+{achievement.points} pts</span>
            </div>
            <p className="text-sm text-neutral-600 mt-1">{achievement.description}</p>
            <p className="text-xs text-neutral-500 mt-1">
              Earned {format(new Date(achievement.earnedAt), 'MMM d, yyyy')}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-6xl">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatsCard 
          icon={<Award className="text-lg" />} 
          label="Total Achievements" 
          value={totalAchievements} 
          color="primary"
        />
        
        <StatsCard 
          icon={<Target className="text-lg" />} 
          label={`Level ${level}`} 
          value={`${totalPoints} points`} 
          subtext={`${pointsToNextLevel} points to next level`}
          color="secondary"
        />
        
        <StatsCard 
          icon={<Trophy className="text-lg" />} 
          label="Challenge Completions" 
          value={achievementsByType.challenge.length} 
          color="accent"
        />
      </div>
      
      {/* Progress to Next Level */}
      <Card className="mb-8">
        <CardHeader className="pb-2">
          <CardTitle>Progress to Level {level + 1}</CardTitle>
          <CardDescription>
            Keep earning points by completing challenges and connecting with others
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{totalPoints % 1000} points</span>
              <span>1000 points</span>
            </div>
            <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full" 
                style={{ width: `${(totalPoints % 1000) / 10}%` }}
              ></div>
            </div>
            <p className="text-sm text-neutral-500">
              {pointsToNextLevel} more points needed to reach Level {level + 1}
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Recent Achievements */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4">Recent Achievements</h2>
        
        {isLoading ? (
          <div className="space-y-4">
            <div className="h-24 bg-white rounded-xl shadow-sm animate-pulse" />
            <div className="h-24 bg-white rounded-xl shadow-sm animate-pulse" />
          </div>
        ) : achievements.length > 0 ? (
          <div className="space-y-4">
            {achievements.slice(0, 5).map((achievement: any) => (
              <AchievementCard key={achievement.id} achievement={achievement} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6 text-center">
              <Award className="h-16 w-16 text-neutral-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium mb-1">No Achievements Yet</h3>
              <p className="text-neutral-500 max-w-md mx-auto">
                Complete challenges and connect with support partners to earn achievements and points.
              </p>
            </CardContent>
          </Card>
        )}
      </section>
      
      {/* Achievement Categories */}
      {Object.entries(achievementsByType).map(([type, typeAchievements]) => {
        if (typeAchievements.length === 0) return null;
        
        const typeTitle = type.charAt(0).toUpperCase() + type.slice(1);
        
        return (
          <section key={type} className="mb-8">
            <h2 className="text-xl font-bold mb-4">{typeTitle} Achievements</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {typeAchievements.map((achievement: any) => (
                <AchievementCard key={achievement.id} achievement={achievement} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
