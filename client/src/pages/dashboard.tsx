import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import StatsCard from "@/components/shared/StatsCard";
import MatchCard from "@/components/match/MatchCard";
import ChallengeCard from "@/components/challenge/ChallengeCard";
import ResearchSection from "@/components/research/ResearchSection";
import { UsersRound, CheckSquare, ArrowRight, Plus, User } from "lucide-react";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("main");
  const [isMobile, setIsMobile] = useState(false);
  
  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
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
  
  // Active challenges only
  const activeChallenges = challengesData?.challenges?.filter(
    (challenge: any) => challenge.status === 'active'
  ) || [];
  
  // Active matches only - max 2
  const activeMatches = (matchesData?.matches || [])
    .filter((match: any) => match.status === 'active')
    .slice(0, 2);

  return (
    <div className="container mx-auto p-3 sm:p-4 md:p-6 max-w-6xl pb-20 md:pb-6">
      {/* Welcome message */}
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 mr-3 bg-primary/10 rounded-full flex items-center justify-center text-primary">
          <User size={20} />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Hello, {user?.displayName || user?.username}</h1>
          <p className="text-muted-foreground text-sm">Let's continue your recovery journey</p>
        </div>
      </div>
      
      {/* Mobile Tabs for switching between content */}
      {isMobile ? (
        <Tabs defaultValue="main" value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="main">Dashboard</TabsTrigger>
            <TabsTrigger value="research">Research</TabsTrigger>
          </TabsList>
          
          <TabsContent value="main" className="mt-4">
            {/* Mobile Main Content */}
            <MobileMainContent 
              user={user}
              activeMatches={activeMatches}
              activeChallenges={activeChallenges}
              matchesLoading={matchesLoading}
              challengesLoading={challengesLoading}
              challengesData={challengesData}
            />
          </TabsContent>
          
          <TabsContent value="research" className="mt-4">
            {/* Recovery Research Section */}
            <ResearchSection />
          </TabsContent>
        </Tabs>
      ) : (
        /* Desktop Layout */
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main content area (left side) */}
          <div className="flex-1">
            
            {/* Active Matches Section */}
            <section className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Your Active Matches</h2>
                <Link href="/matches" className="text-primary text-sm font-medium flex items-center hover:text-primary/80">
                  View all
                  <ArrowRight size={16} className="ml-1" />
                </Link>
              </div>
              
              {matchesLoading ? (
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-white rounded-xl shadow-sm p-5 h-64 animate-pulse" />
                </div>
              ) : activeMatches.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {activeMatches.map((match: any) => (
                    <MatchCard key={match.id} match={match} />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                  <h3 className="font-medium text-lg mb-2">No active matches yet</h3>
                  <p className="text-neutral-600 mb-4">Find a support partner to help you reach your goals</p>
                  <Link href="/matches" className="inline-block bg-primary hover:bg-primary/90 text-white py-2 px-4 rounded-lg font-medium transition">
                    Find Matches
                  </Link>
                </div>
              )}
            </section>
            
            {/* Active Challenges Section */}
            <section className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Your Active Challenges</h2>
                <Link href="/challenges" className="text-primary text-sm font-medium flex items-center hover:text-primary/80">
                  View all
                  <ArrowRight size={16} className="ml-1" />
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
                  <Link href="/challenges" className="inline-block bg-primary hover:bg-primary/90 text-white py-2 px-4 rounded-lg font-medium transition">
                    Create Challenge
                  </Link>
                </div>
              )}
            </section>
          </div>
          
          {/* Right sidebar area */}
          <div className="w-full lg:w-80 flex-shrink-0">
            {/* Recovery Research Section */}
            <ResearchSection />
          </div>
        </div>
      )}
    </div>
  );
}

// Mobile-optimized main content component
function MobileMainContent({ 
  user, 
  activeMatches, 
  activeChallenges, 
  matchesLoading, 
  challengesLoading,
  challengesData
}: any) {
  return (
    <div>
      {/* Overview Stats - Scrollable horizontal row on mobile */}
      <div className="flex overflow-x-auto pb-4 mb-6 -mx-2 px-2 space-x-4 snap-x">
        <div className="snap-start min-w-[180px] w-[180px] flex-shrink-0">
          <StatsCard 
            icon={<UsersRound className="text-lg" />} 
            label="Active Matches" 
            value={activeMatches.length} 
            color="primary"
          />
        </div>
        
        <div className="snap-start min-w-[180px] w-[180px] flex-shrink-0">
          <StatsCard 
            icon={<CheckSquare className="text-lg" />} 
            label="Challenges Done" 
            value={challengesData?.challenges?.filter((c: any) => c.status === 'completed').length || 0} 
            color="secondary"
          />
        </div>
        
        <div className="snap-start min-w-[180px] w-[180px] flex-shrink-0">
          <StatsCard 
            icon={<CheckSquare className="text-lg" />} 
            label="Your Points" 
            value={user?.points || 0} 
            color="accent"
          />
        </div>
      </div>
            
      {/* Active Matches Section */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Your Matches</h2>
          <Link href="/matches" className="text-primary text-sm font-medium flex items-center">
            All
            <ArrowRight size={16} className="ml-1" />
          </Link>
        </div>
        
        {matchesLoading ? (
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-5 h-64 animate-pulse" />
          </div>
        ) : activeMatches.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {activeMatches.map((match: any) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <h3 className="font-medium text-base mb-2">No matches yet</h3>
            <p className="text-neutral-600 text-sm mb-4">Find a support partner</p>
            <Link href="/matches" className="inline-block bg-primary hover:bg-primary/90 text-white py-2 px-4 rounded-lg text-sm font-medium transition">
              Find Matches
            </Link>
          </div>
        )}
      </section>
      
      {/* Active Challenges Section */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Your Challenges</h2>
          <Link href="/challenges" className="text-primary text-sm font-medium flex items-center">
            All
            <ArrowRight size={16} className="ml-1" />
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
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <h3 className="font-medium text-base mb-2">No challenges</h3>
            <p className="text-neutral-600 text-sm mb-4">Start a new challenge</p>
            <Link href="/challenges" className="inline-block bg-primary hover:bg-primary/90 text-white py-2 px-4 rounded-lg text-sm font-medium transition">
              <Plus size={16} className="inline mr-1" />
              New Challenge
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
