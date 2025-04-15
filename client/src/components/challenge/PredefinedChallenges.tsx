import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

// These are predefined alcohol recovery challenges
const PREDEFINED_CHALLENGES = [
  {
    title: "Sobriety Tracking",
    description: "Track your days of sobriety and celebrate key milestones together. Share daily wins and challenges to maintain accountability.",
    challengeType: "days_sober",
    totalSteps: 4  // Represents 7/30/90/365 day milestones
  },
  {
    title: "Daily Check-in Commitment",
    description: "Commit to daily check-ins with your accountability partner to discuss cravings, triggers, and successes. Build a streak of consistent communication.",
    challengeType: "check_in_streak",
    totalSteps: 3  // Represents 7/30/100 day milestones
  },
  {
    title: "Trigger Identification & Management",
    description: "Work together to identify personal triggers for alcohol cravings and develop healthy coping strategies. Document and share your progress daily.",
    challengeType: "generic",
    totalSteps: 5
  },
  {
    title: "Sober Activities Discovery",
    description: "Discover and engage in five new activities that are enjoyable without alcohol. Share your experiences and feedback with your accountability partner.",
    challengeType: "generic",
    totalSteps: 5
  },
  {
    title: "Mindfulness for Recovery",
    description: "Practice daily mindfulness meditation to manage stress and cravings. Start with 5 minutes and gradually increase to 20 minutes per session.",
    challengeType: "check_in_streak",
    totalSteps: 3
  },
  {
    title: "Recovery Reading Journey",
    description: "Read recovery literature together and discuss insights. Set weekly goals to read specific chapters or articles about alcohol addiction recovery.",
    challengeType: "generic",
    totalSteps: 4
  }
];

interface PredefinedChallengesProps {
  onChallengeSelected: (challenge: {
    title: string;
    description: string;
    challengeType: string;
    totalSteps: number;
  }) => void;
}

export function PredefinedChallenges({ onChallengeSelected }: PredefinedChallengesProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleSelectChallenge = (index: number) => {
    setSelectedIndex(index);
    onChallengeSelected(PREDEFINED_CHALLENGES[index]);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium mb-4 text-center">Select a Recovery Challenge</h3>
      
      <div className="grid gap-4 max-h-[40vh] overflow-y-auto px-1 py-2">
        {PREDEFINED_CHALLENGES.map((challenge, index) => (
          <div 
            key={index}
            className={`p-4 rounded-lg border cursor-pointer transition-all ${
              selectedIndex === index 
                ? 'border-primary bg-primary/5' 
                : 'border-neutral-200 hover:border-primary/50'
            }`}
            onClick={() => handleSelectChallenge(index)}
          >
            <div className="flex justify-between items-start">
              <h3 className="font-medium mb-1">{challenge.title}</h3>
              {selectedIndex === index && <Check className="h-4 w-4 text-primary" />}
            </div>
            <p className="text-sm text-neutral-600">{challenge.description}</p>
            <div className="mt-2 flex items-center text-xs text-neutral-500">
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full mr-2">
                {challenge.challengeType === 'days_sober' 
                  ? 'Sobriety Tracking' 
                  : challenge.challengeType === 'check_in_streak'
                  ? 'Daily Check-in'
                  : 'Standard Challenge'
                }
              </span>
              <span>
                {challenge.totalSteps} {challenge.totalSteps === 1 ? 'step' : 'steps'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}