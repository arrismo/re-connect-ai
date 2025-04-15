import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export interface Suggestion {
  id: string;
  text: string;
  type: 'encouragement' | 'tip' | 'question' | 'reminder' | 'resource';
  priority: 'low' | 'medium' | 'high';
  expiresAt?: string;
}

export interface SuggestionRequest {
  contextType: 'chat' | 'challenge' | 'match' | 'dashboard';
  matchId?: number;
  challengeId?: number;
  additionalContext?: Record<string, any>;
}

export function useSuggestions() {
  const { toast } = useToast();

  const suggestionsMutation = useMutation({
    mutationFn: async (request: SuggestionRequest): Promise<Suggestion[]> => {
      try {
        const response = await apiRequest("POST", "/api/suggestions", request);
        const data = await response.json();
        return data.suggestions || [];
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        toast({
          title: "Couldn't load suggestions",
          description: "We couldn't load personalized suggestions at this time.",
          variant: "destructive"
        });
        return [];
      }
    }
  });

  return {
    getSuggestions: suggestionsMutation.mutate,
    getSuggestionsAsync: suggestionsMutation.mutateAsync,
    suggestions: suggestionsMutation.data || [],
    isLoading: suggestionsMutation.isPending,
    error: suggestionsMutation.error
  };
}