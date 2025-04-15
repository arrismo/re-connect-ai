import { useState, useEffect } from "react";
import { useSuggestions, Suggestion, SuggestionRequest } from "@/hooks/useSuggestions";
import { SuggestionBubble } from "./SuggestionBubble";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface SuggestionContainerProps {
  context: SuggestionRequest;
  refreshInterval?: number; // in milliseconds, default is 0 (no refresh)
  max?: number; // max number of suggestions to show
  className?: string;
  autoFetch?: boolean; // whether to fetch suggestions automatically
}

export function SuggestionContainer({
  context,
  refreshInterval = 0,
  max = 3,
  className = "",
  autoFetch = true
}: SuggestionContainerProps) {
  const { 
    getSuggestionsAsync,
    isLoading
  } = useSuggestions();
  
  const [localSuggestions, setLocalSuggestions] = useState<Suggestion[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Function to fetch suggestions
  const fetchSuggestions = async () => {
    try {
      const suggestions = await getSuggestionsAsync(context);
      
      // Only add new suggestions that are not already in the list
      const newSuggestions = suggestions.filter(
        suggestion => !localSuggestions.some(s => s.id === suggestion.id)
      );
      
      if (newSuggestions.length > 0) {
        setLocalSuggestions(prev => {
          // Combine and limit to max
          const combined = [...prev, ...newSuggestions];
          // Sort by priority (high to low)
          const sorted = combined.sort((a, b) => {
            const priorityMap = { high: 3, medium: 2, low: 1 };
            return (priorityMap[b.priority] || 0) - (priorityMap[a.priority] || 0);
          });
          return sorted.slice(0, max);
        });
      }
      
      setIsInitialLoad(false);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setIsInitialLoad(false);
    }
  };
  
  // Fetch suggestions when context changes or on initial load
  useEffect(() => {
    if (autoFetch) {
      fetchSuggestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    context.contextType, 
    context.matchId, 
    context.challengeId, 
    // Exclude additionalContext to prevent unnecessary refreshes
  ]);
  
  // Set up refresh interval if specified
  useEffect(() => {
    if (refreshInterval > 0) {
      const intervalId = setInterval(fetchSuggestions, refreshInterval);
      return () => clearInterval(intervalId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshInterval]);
  
  // Handle dismiss suggestion
  const handleDismiss = (id: string) => {
    setLocalSuggestions(prev => prev.filter(s => s.id !== id));
  };
  
  // Don't render anything if no suggestions and not loading
  if (localSuggestions.length === 0 && !isLoading && !isInitialLoad) {
    return null;
  }
  
  return (
    <div className={`${className}`}>
      {/* Toggle button for minimizing/maximizing */}
      {localSuggestions.length > 0 && (
        <div className="flex justify-end mb-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-xs text-slate-500 hover:text-slate-700"
          >
            {isMinimized ? "Show suggestions" : "Hide suggestions"}
          </button>
        </div>
      )}
      
      {/* Loading indicator */}
      {isLoading && isInitialLoad && (
        <div className="flex justify-center items-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="ml-2 text-sm text-slate-500">Loading suggestions...</span>
        </div>
      )}
      
      {/* Suggestions */}
      <AnimatePresence>
        {!isMinimized && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            {localSuggestions.map(suggestion => (
              <SuggestionBubble
                key={suggestion.id}
                suggestion={suggestion}
                onDismiss={handleDismiss}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}