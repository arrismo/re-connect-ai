import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const [open, setOpen] = useState(false);
  const [promptInput, setPromptInput] = useState('');
  const [generatedChallenges, setGeneratedChallenges] = useState<any[]>([]);
  const { toast } = useToast();

  const generateMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const res = await apiRequest('POST', '/api/challenges/generate', { 
        prompt,
        matchId
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.challenges && data.challenges.length > 0) {
        setGeneratedChallenges(data.challenges);
      } else {
        toast({
          title: 'No challenges generated',
          description: 'Try providing more details about what you\'re looking for',
          variant: 'destructive'
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to generate challenges',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleGenerateClick = () => {
    if (!promptInput.trim()) {
      toast({
        title: 'Empty prompt',
        description: 'Please describe the kind of challenge you want to create',
        variant: 'destructive'
      });
      return;
    }
    generateMutation.mutate(promptInput);
  };

  const handleChallengeSelect = (challenge: any) => {
    onChallengeSelected(challenge);
    setOpen(false);
    setPromptInput('');
    setGeneratedChallenges([]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="gap-2">
          <Sparkles className="h-4 w-4" />
          AI Challenge Generator
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>AI-Powered Challenge Generator</DialogTitle>
          <DialogDescription>
            Describe the challenge you want to create, and our AI will generate suggestions based on your description.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="challenge-prompt">Your Challenge Description</Label>
            <Textarea
              id="challenge-prompt"
              placeholder="E.g., Create a challenge to help us both stay sober for 30 days, or a daily meditation challenge for anxiety management"
              className="min-h-[100px]"
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
            />
          </div>

          <Button 
            onClick={handleGenerateClick} 
            disabled={generateMutation.isPending || !promptInput.trim()}
            className="w-full"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Challenge Ideas
              </>
            )}
          </Button>

          {generatedChallenges.length > 0 && (
            <div className="grid gap-4 mt-4">
              <h3 className="text-lg font-semibold">Choose a Challenge:</h3>
              <div className="grid gap-4 max-h-[400px] overflow-y-auto pr-2">
                {generatedChallenges.map((challenge, index) => (
                  <Card key={index} className="cursor-pointer hover:bg-accent/50 transition-colors">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{challenge.title}</CardTitle>
                      <CardDescription className="text-xs">
                        {challenge.challengeType === 'days_sober' 
                          ? 'Sobriety Challenge' 
                          : challenge.challengeType === 'check_in_streak'
                            ? 'Check-in Streak Challenge'
                            : 'Standard Challenge'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <p className="text-sm">{challenge.description}</p>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => handleChallengeSelect(challenge)}
                      >
                        Select This Challenge
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}