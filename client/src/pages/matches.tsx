import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import MatchCard from "@/components/match/MatchCard";
import MatchDetail from "@/components/match/MatchDetail";
import MatchFinder from "@/components/match/MatchFinder";
import StatsCard from "@/components/shared/StatsCard";
import { UsersRound, CheckSquare, Award, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Matches() {
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [showFinder, setShowFinder] = useState(false);
  
  // Get matches
  const { data: matchesData, isLoading: matchesLoading } = useQuery({
    queryKey: ['/api/matches'],
  });
  
  // Get challenges
  const { data: challengesData, isLoading: challengesLoading } = useQuery({
    queryKey: ['/api/challenges'],
  });
  
  // Get selected match details if any
  const { data: matchDetailData, isLoading: matchDetailLoading } = useQuery({
    queryKey: ['/api/matches', selectedMatchId],
    enabled: !!selectedMatchId,
  });
  
  // Active matches only
  const activeMatches = (matchesData?.matches || [])
    .filter((match: any) => match.status === 'active');

  // Completed challenges count
  const completedChallengesCount = challengesData?.challenges?.filter(
    (challenge: any) => challenge.status === 'completed'
  ).length || 0;
  
  // User points - from first active match
  const userPoints = activeMatches[0]?.otherUser?.points || 0;
  
  const handleSelectMatch = (id: number) => {
    setSelectedMatchId(id);
    setShowFinder(false);
  };
  
  const handleClose = () => {
    setSelectedMatchId(null);
    setShowFinder(false);
  };
  
  const handleFindMatch = () => {
    setSelectedMatchId(null);
    setShowFinder(true);
  };

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-6xl">
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
          value={completedChallengesCount} 
          color="secondary"
        />
        
        <StatsCard 
          icon={<Award className="text-lg" />} 
          label="Your Points" 
          value={userPoints} 
          color="accent"
        />
      </div>
      
      {/* Current Matches Section */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Your Current Matches</h2>
          <Button 
            onClick={handleFindMatch}
            className="text-primary bg-white border border-primary hover:bg-primary/5 text-sm"
            variant="outline"
          >
            Find new match <Plus className="ml-2 h-4 w-4" />
          </Button>
        </div>
        
        {matchesLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-5 h-64 animate-pulse" />
            <div className="bg-white rounded-xl shadow-sm p-5 h-64 animate-pulse" />
          </div>
        ) : activeMatches.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {activeMatches.map((match: any) => (
              <MatchCard 
                key={match.id} 
                match={match} 
                onViewDetails={() => handleSelectMatch(match.id)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <h3 className="font-medium text-lg mb-2">No active matches yet</h3>
            <p className="text-neutral-600 mb-4">Find a support partner to help you reach your goals</p>
            <Button 
              onClick={handleFindMatch}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              Find Matches
            </Button>
          </div>
        )}
      </section>
      
      {/* Match Detail View */}
      {selectedMatchId && matchDetailData && (
        <MatchDetail 
          match={matchDetailData.match} 
          onClose={handleClose} 
        />
      )}
      
      {/* Match Finder View */}
      {showFinder && (
        <MatchFinder onClose={handleClose} />
      )}
    </div>
  );
}
