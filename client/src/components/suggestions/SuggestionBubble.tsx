import { cn } from "@/lib/utils";
import { Suggestion } from "@/hooks/useSuggestions";
import { useState } from "react";
import {
  LightbulbIcon,
  HeartIcon,
  HelpCircleIcon,
  AlertCircleIcon,
  BookOpenIcon,
  XIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface SuggestionBubbleProps {
  suggestion: Suggestion;
  onDismiss?: (id: string) => void;
  className?: string;
}

export function SuggestionBubble({ suggestion, onDismiss, className }: SuggestionBubbleProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Define icons based on suggestion type
  const getIcon = () => {
    switch (suggestion.type) {
      case 'encouragement':
        return <HeartIcon className="w-4 h-4 text-rose-500" />;
      case 'tip':
        return <LightbulbIcon className="w-4 h-4 text-amber-500" />;
      case 'question':
        return <HelpCircleIcon className="w-4 h-4 text-sky-500" />;
      case 'reminder':
        return <AlertCircleIcon className="w-4 h-4 text-violet-500" />;
      case 'resource':
        return <BookOpenIcon className="w-4 h-4 text-emerald-500" />;
      default:
        return <LightbulbIcon className="w-4 h-4 text-amber-500" />;
    }
  };
  
  // Define colors based on priority
  const getBgColor = () => {
    switch (suggestion.priority) {
      case 'high':
        return 'bg-gradient-to-r from-primary/10 to-primary/5 hover:from-primary/15 hover:to-primary/10';
      case 'medium':
        return 'bg-gradient-to-r from-slate-100 to-white hover:from-slate-200 hover:to-slate-100';
      case 'low':
        return 'bg-white hover:bg-slate-50';
      default:
        return 'bg-white hover:bg-slate-50';
    }
  };
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={cn(
          "relative rounded-xl p-3 shadow-sm flex items-start gap-2 transition-colors cursor-pointer max-w-md",
          getBgColor(),
          className
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="mt-0.5">{getIcon()}</div>
        <div className="flex-1">{suggestion.text}</div>
        
        {onDismiss && (
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute -top-2 -right-2"
              >
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-6 w-6 rounded-full bg-slate-200 hover:bg-slate-300"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDismiss(suggestion.id);
                  }}
                >
                  <XIcon className="h-3 w-3" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </motion.div>
    </AnimatePresence>
  );
}