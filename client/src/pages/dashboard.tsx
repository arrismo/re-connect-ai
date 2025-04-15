import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import StatsCard from "@/components/shared/StatsCard";
import MatchCard from "@/components/match/MatchCard";
import ChallengeCard from "@/components/challenge/ChallengeCard";
import { UsersRound, CheckSquare } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  
  // Get matches
  const { data: matchesData, isLoading: matchesLoading } = useQuery({
    queryKey: ['/api/matches'],
    retry: 1,
  });
  
  // Get challenges
  const { data: challengesData, isLoading: challengesLoading } = useQuery({
    queryKey: ['/api/challenges'],
    retry: 1,
  });
  
  // Achievements feature removed
  
  // Active challenges only
  const activeChallenges = challengesData?.challenges?.filter(
    (challenge: any) => challenge.status === 'active'
  ) || [];
  
  // Active matches only - max 2
  const activeMatches = (matchesData?.matches || [])
    .filter((match: any) => match.status === 'active')
    .slice(0, 2);
  
  // Achievements feature removed
  const recentAchievements = [];

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-6xl">
      <h1 className="text-2xl font-bold mb-6">Welcome, {user?.displayName || user?.username}</h1>
      
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatsCard 
          icon={<UsersRound className="text-lg" />} 
          label="Active Matches" 
          value={activeMatches.length} 
          color="primary"
        />
        
        <StatsCard 
          icon={<CheckSquare className="text-lg" />} 
          label="Challenges Completed" 
          value={challengesData?.challenges?.filter((c: any) => c.status === 'completed').length || 0} 
          color="secondary"
        />
        
        <StatsCard 
          icon={<CheckSquare className="text-lg" />} 
          label="Your Points" 
          value={user?.points || 0} 
          color="accent"
        />
      </div>
      
      {/* Active Matches Section */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Your Active Matches</h2>
          <Link href="/matches">
            <a className="text-primary text-sm font-medium flex items-center hover:text-primary/80">
              View all matches
            </a>
          </Link>
        </div>
        
        {matchesLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-5 h-64 animate-pulse" />
            <div className="bg-white rounded-xl shadow-sm p-5 h-64 animate-pulse" />
          </div>
        ) : activeMatches.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {activeMatches.map((match: any) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <h3 className="font-medium text-lg mb-2">No active matches yet</h3>
            <p className="text-neutral-600 mb-4">Find a support partner to help you reach your goals</p>
            <Link href="/matches">
              <a className="inline-block bg-primary hover:bg-primary/90 text-white py-2 px-4 rounded-lg font-medium transition">
                Find Matches
              </a>
            </Link>
          </div>
        )}
      </section>
      
      {/* Active Challenges Section */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Your Active Challenges</h2>
          <Link href="/challenges">
            <a className="text-primary text-sm font-medium flex items-center hover:text-primary/80">
              View all challenges
            </a>
          </Link>
        </div>
        
        {challengesLoading ? (
          <div className="bg-white rounded-xl shadow-sm p-5 h-24 animate-pulse" />
        ) : activeChallenges.length > 0 ? (
          <div className="space-y-4">
            {activeChallenges.map((challenge: any) => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <h3 className="font-medium text-lg mb-2">No active challenges</h3>
            <p className="text-neutral-600 mb-4">Create a challenge with your match to keep each other accountable</p>
            <Link href="/challenges">
              <a className="inline-block bg-primary hover:bg-primary/90 text-white py-2 px-4 rounded-lg font-medium transition">
                Create Challenge
              </a>
            </Link>
          </div>
        )}
      </section>
      
      {/* Achievements section removed */}
    </div>
  );
}
