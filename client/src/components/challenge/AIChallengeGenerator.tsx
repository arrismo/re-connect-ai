import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AIChallengeGeneratorProps {
  matchId: number;
  onChallengeSelected: (challenge: {
    title: string;
    description: string;
    challengeType: string;
    totalSteps: number;
  }) => void;
}

export function AIChallengeGenerator({ matchId, onChallengeSelected }: AIChallengeGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const { toast } = useToast();

  const generateChallenges = async () => {
    setIsLoading(true);
    setChallenges([]);
    setSelectedIndex(null);
    
    try {
      const response = await apiRequest(
        "POST", 
        "/api/challenges/generate", 
        { matchId }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to generate challenges: ${response.statusText}`);
      }
      
      const data = await response.json();
      setChallenges(data.challenges || []);
    } catch (error: any) {
      toast({
        title: "Failed to generate challenges",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectChallenge = (index: number) => {
    setSelectedIndex(index);
  };

  const handleConfirmSelection = () => {
    if (selectedIndex !== null && challenges[selectedIndex]) {
      onChallengeSelected(challenges[selectedIndex]);
      setIsOpen(false);
    }
  };

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)} 
        variant="outline"
        className="mb-4 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 hover:bg-primary/10"
      >
        <Sparkles className="h-4 w-4 mr-2 text-primary" />
        Generate Recovery Challenge
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Alcohol Recovery Challenge Generator</DialogTitle>
            <DialogDescription>
              Our AI will generate personalized alcohol addiction recovery challenges for you and your accountability partner.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-sm text-center text-neutral-600">
                  Generating personalized challenges...
                </p>
              </div>
            ) : challenges.length > 0 ? (
              <div className="space-y-4">
                <div className="grid gap-4">
                  {challenges.map((challenge, index) => (
                    <div 
                      key={index}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedIndex === index 
                          ? 'border-primary bg-primary/5' 
                          : 'border-neutral-200 hover:border-primary/50'
                      }`}
                      onClick={() => handleSelectChallenge(index)}
                    >
                      <h3 className="font-medium mb-1">{challenge.title}</h3>
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

                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    variant="outline"
                    onClick={generateChallenges}
                  >
                    Regenerate
                  </Button>
                  <Button
                    onClick={handleConfirmSelection}
                    disabled={selectedIndex === null}
                  >
                    Select Challenge
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6 text-center p-4">
                <p>Click the button below to generate AI-powered alcohol recovery challenges for you and your accountability partner.</p>
                <div className="text-sm text-neutral-600 mb-4">
                  The AI will suggest challenges based on your profiles and shared interests. Choose from:
                  <ul className="mt-2 list-disc text-left pl-6">
                    <li><span className="font-medium">Sobriety Tracking:</span> Track your days without alcohol</li>
                    <li><span className="font-medium">Daily Check-in:</span> Regular accountability communication</li>
                    <li><span className="font-medium">Standard Challenge:</span> Step-by-step recovery activities</li>
                  </ul>
                </div>
                <Button onClick={generateChallenges}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Recovery Challenges
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}