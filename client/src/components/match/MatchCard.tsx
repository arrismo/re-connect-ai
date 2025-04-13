import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface MatchCardProps {
  match: {
    id: number;
    matchScore: number;
    status: string;
    otherUser: {
      id: number;
      displayName: string;
      profilePic?: string;
      lastActive?: string;
      goals?: string[];
      interests?: string[];
    };
    activeChallenge?: {
      id: number;
      title: string;
      totalSteps: number;
      endDate: string;
      status: string;
    };
  };
  onViewDetails?: () => void;
}

export default function MatchCard({ match, onViewDetails }: MatchCardProps) {
  const { otherUser, matchScore, activeChallenge } = match;
  
  // Calculate matching goals/interests
  const sharedGoals = otherUser.goals || [];
  const isOnline = new Date(otherUser.lastActive || "").getTime() > Date.now() - 5 * 60 * 1000;
  
  // Calculate progress if there's an active challenge
  let progress = 0;
  if (activeChallenge) {
    // Mocked progress calculation - in real app this would come from the API
    progress = 70; // Example value
  }
  
  // Format time since last active
  const formatLastActive = () => {
    if (!otherUser.lastActive) return "Never active";
    if (isOnline) return "Online Now";
    
    const lastActive = new Date(otherUser.lastActive);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return "Last active just now";
    if (diffHours === 1) return "Last active 1h ago";
    if (diffHours < 24) return `Last active ${diffHours}h ago`;
    return `Last active ${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center">
            <Avatar className="h-12 w-12">
              {otherUser.profilePic ? (
                <AvatarImage src={otherUser.profilePic} alt={otherUser.displayName} />
              ) : (
                <AvatarFallback className="bg-primary text-white">
                  {otherUser.displayName.charAt(0)}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="ml-3">
              <h3 className="font-semibold">{otherUser.displayName}</h3>
              <div className="flex items-center text-xs text-neutral-500 mt-1">
                <span className={`inline-block w-2 h-2 rounded-full ${isOnline ? 'bg-secondary' : 'bg-neutral-400'} mr-1`}></span>
                <span>{formatLastActive()}</span>
              </div>
            </div>
          </div>
          <div className="bg-primary/10 text-primary text-sm font-medium px-3 py-1 rounded-full">
            {matchScore}% Match
          </div>
        </div>
        
        {sharedGoals.length > 0 && (
          <div className="mb-4">
            <div className="flex justify-between mb-2">
              <h4 className="text-sm font-medium">Shared Goals</h4>
              <span className="text-xs text-neutral-500">
                {sharedGoals.length} matching
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {sharedGoals.map((goal, index) => (
                <span 
                  key={index} 
                  className="bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded-full"
                >
                  {goal}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {activeChallenge && (
          <div className="mb-4">
            <div className="flex justify-between mb-2">
              <h4 className="text-sm font-medium">Current Challenge</h4>
              <span className="text-xs text-status-success">
                {new Date(activeChallenge.endDate) > new Date() ? 
                  `${Math.ceil((new Date(activeChallenge.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left` :
                  'Expired'
                }
              </span>
            </div>
            <div className="bg-neutral-100 rounded-lg p-3">
              <h5 className="font-medium text-sm mb-2">{activeChallenge.title}</h5>
              <div className="flex items-center">
                <div className="flex-1 bg-neutral-200 rounded-full h-2 mr-3">
                  <div 
                    className="bg-secondary rounded-full h-2" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <span className="text-xs font-medium">{progress}%</span>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex space-x-3">
          <Link href={`/messages?matchId=${match.id}`}>
            <Button className="flex-1">
              Message
            </Button>
          </Link>
          <Button 
            onClick={onViewDetails} 
            variant="outline" 
            className="flex-1"
          >
            View Details
          </Button>
        </div>
      </div>
    </div>
  );
}
