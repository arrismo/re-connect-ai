import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ProgressRing from "@/components/shared/ProgressRing";
import { format, isFuture, formatDistanceToNow } from "date-fns";
import { 
  Brain, 
  MessageSquare, 
  Calendar, 
  Plus, 
  Check, 
  Clock, 
  BrainCircuit 
} from "lucide-react";

interface ChallengeCardProps {
  challenge: {
    id: number;
    title: string;
    description?: string;
    type: string;
    startDate: string;
    endDate: string;
    totalSteps: number;
    status: string;
    match: {
      id: number;
      matchScore: number;
    };
    partner: {
      id: number;
      displayName: string;
      profilePic?: string;
    };
    progress: {
      user: { stepsCompleted: number };
      partner: { stepsCompleted: number };
    };
  };
  completed?: boolean;
  onUpdateProgress?: (challengeId: number, stepsCompleted: number) => void;
}

export default function ChallengeCard({ challenge, completed = false, onUpdateProgress }: ChallengeCardProps) {
  const [isLoggingProgress, setIsLoggingProgress] = useState(false);
  
  // Extract challenge data
  const { 
    id, 
    title, 
    endDate, 
    totalSteps, 
    partner, 
    progress,
    status
  } = challenge;
  
  // Calculate progress percentages
  const userProgress = Math.floor((progress.user.stepsCompleted / totalSteps) * 100);
  const partnerProgress = Math.floor((progress.partner.stepsCompleted / totalSteps) * 100);
  const averageProgress = Math.floor((userProgress + partnerProgress) / 2);
  
  // Calculate days left
  const endDateObj = new Date(endDate);
  const daysLeft = isFuture(endDateObj) 
    ? Math.ceil((endDateObj.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;
  
  // Get icon based on challenge type
  const getIcon = () => {
    switch (challenge.type) {
      case 'daily':
        return <Brain className="text-lg" />;
      case 'weekly':
        return <BrainCircuit className="text-lg" />;
      default:
        return <MessageSquare className="text-lg" />;
    }
  };
  
  // Handle logging progress
  const handleLogProgress = () => {
    if (!onUpdateProgress) return;
    
    setIsLoggingProgress(true);
    const newProgress = progress.user.stepsCompleted + 1;
    onUpdateProgress(id, newProgress <= totalSteps ? newProgress : totalSteps);
    setTimeout(() => setIsLoggingProgress(false), 500);
  };
  
  // Determine button state
  const buttonDisabled = 
    completed || 
    status === 'completed' || 
    progress.user.stepsCompleted >= totalSteps ||
    isLoggingProgress;
  
  const getButtonText = () => {
    if (completed || status === 'completed') return "Completed";
    if (progress.user.stepsCompleted >= totalSteps) return "Completed";
    if (daysLeft === 0) return "Schedule";
    return "Log Today";
  };
  
  const getButtonVariant = () => {
    if (completed || status === 'completed') return "outline";
    if (progress.user.stepsCompleted >= totalSteps) return "outline";
    if (daysLeft === 0) return "warning";
    return "default";
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="md:w-1/4">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
              {getIcon()}
            </div>
            <div className="ml-3">
              <h3 className="font-medium">{title}</h3>
              <div className="flex items-center text-xs text-neutral-500 mt-1">
                <div className="flex items-center">
                  <Avatar className="h-4 w-4 mr-1">
                    {partner.profilePic ? (
                      <AvatarImage src={partner.profilePic} alt={partner.displayName} />
                    ) : (
                      <AvatarFallback className="bg-primary text-white text-[8px]">
                        {partner.displayName.charAt(0)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <span>With {partner.displayName}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="md:w-2/5">
          <div className="bg-neutral-100 rounded-lg p-3">
            <div className="flex justify-between mb-1 text-sm">
              <span>Progress</span>
              <span className="font-medium">
                {progress.user.stepsCompleted} of {totalSteps} {challenge.type === 'daily' ? 'days' : 'steps'} complete
              </span>
            </div>
            <div className="flex items-center">
              <div className="flex-1 bg-neutral-200 rounded-full h-2 mr-3">
                <div 
                  className={`rounded-full h-2 ${
                    completed || status === 'completed' 
                      ? 'bg-secondary' 
                      : averageProgress <= 30 
                        ? 'bg-red-400' 
                        : averageProgress <= 70 
                          ? 'bg-amber-400' 
                          : 'bg-secondary'
                  }`}
                  style={{ width: `${averageProgress}%` }}
                ></div>
              </div>
              <span className="text-xs font-medium">{averageProgress}%</span>
            </div>
          </div>
        </div>
        
        <div className="md:w-1/5">
          <div className="flex items-center justify-center">
            <ProgressRing 
              percent={daysLeft === 0 ? 100 : 100 - Math.min(100, (daysLeft / 7) * 100)}
              size={60}
              strokeWidth={6}
              color={daysLeft <= 1 ? "#F59E0B" : "#10B981"}
            >
              <div className="text-sm font-medium">
                {daysLeft > 0 ? `${daysLeft}d` : '0d'}
              </div>
            </ProgressRing>
            <div className="ml-3 text-sm">
              <div className="font-medium">
                {daysLeft > 0 ? 'Left' : 'Ended'}
              </div>
              <div className="text-neutral-500">
                {format(endDateObj, 'MMM d')}
              </div>
            </div>
          </div>
        </div>
        
        <div className="md:w-1/6 flex justify-end">
          <Button
            onClick={handleLogProgress}
            disabled={buttonDisabled}
            variant={getButtonVariant() as any}
            className="flex items-center gap-1"
          >
            {isLoggingProgress ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-1" />
            ) : completed || status === 'completed' ? (
              <Check className="h-4 w-4 mr-1" />
            ) : progress.user.stepsCompleted >= totalSteps ? (
              <Check className="h-4 w-4 mr-1" />
            ) : daysLeft === 0 ? (
              <Clock className="h-4 w-4 mr-1" />
            ) : (
              <Plus className="h-4 w-4 mr-1" />
            )}
            {getButtonText()}
          </Button>
        </div>
      </div>
    </div>
  );
}
