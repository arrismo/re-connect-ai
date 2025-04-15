import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import MessageBubble from "@/components/chat/MessageBubble";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, Calendar, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { SuggestionContainer } from "@/components/suggestions/SuggestionContainer";

interface ChatInterfaceProps {
  matchId: number;
  userId: number;
}

export default function ChatInterface({ matchId, userId }: ChatInterfaceProps) {
  const [messageText, setMessageText] = useState("");
  const messageContainerRef = useRef<HTMLDivElement>(null);
  
  // Handle suggestion selection
  const handleSuggestionSelect = (text: string) => {
    setMessageText(text);
  };
  
  // Get match details and messages
  const { data, isLoading } = useQuery({
    queryKey: ['/api/matches', matchId, 'messages'],
    refetchInterval: 15000, // Refetch every 15 seconds
  });
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", "/api/messages", {
        matchId,
        senderId: userId,
        content
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/matches', matchId, 'messages'] });
      setMessageText("");
    }
  });
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [data?.messages]);
  
  // Handle sending message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageText.trim()) return;
    
    sendMessageMutation.mutate(messageText);
  };
  
  // Extract data
  const messages = data?.messages || [];
  const match = data?.match;
  const otherUser = match?.otherUser;
  
  // For debugging
  console.log("Chat data received:", data);
  console.log("Messages:", messages);
  console.log("Match:", match);
  console.log("OtherUser:", otherUser);
  
  // Format last active time
  const formatLastActive = (date?: string) => {
    if (!date) return 'Never';
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="border-b p-4 flex items-center justify-between">
        {isLoading ? (
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-neutral-200 animate-pulse"></div>
            <div className="ml-3">
              <div className="h-4 w-32 bg-neutral-200 rounded animate-pulse"></div>
              <div className="h-3 w-24 bg-neutral-200 rounded mt-1 animate-pulse"></div>
            </div>
          </div>
        ) : otherUser ? (
          <div className="flex items-center">
            <Avatar>
              {otherUser.profilePic ? (
                <AvatarImage src={otherUser.profilePic} alt={otherUser.displayName} />
              ) : (
                <AvatarFallback className="bg-primary text-white">
                  {otherUser.displayName.charAt(0)}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="ml-3">
              <h3 className="font-medium">{otherUser.displayName}</h3>
              <div className="flex items-center text-xs text-neutral-500">
                <Clock className="h-3 w-3 mr-1" />
                <span>{formatLastActive(otherUser.lastActive)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div>Conversation not found</div>
        )}
        
        {match?.activeChallenge && (
          <div className="text-sm">
            <div className="flex items-center text-neutral-500">
              <Calendar className="h-4 w-4 mr-1" />
              <span>Active Challenge: {match.activeChallenge.title}</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Suggestions */}
      {!isLoading && otherUser && (
        <div className="px-4 pt-3">
          <SuggestionContainer 
            context={{ 
              contextType: 'chat',
              matchId,
              additionalContext: {
                otherUserName: otherUser.displayName,
                messageCount: messages.length,
                hasActiveChallenge: !!match?.activeChallenge,
                challengeTitle: match?.activeChallenge?.title
              }
            }}
            max={2}
            autoFetch={true}
            refreshInterval={300000} // 5 minutes
            onSelectSuggestion={handleSuggestionSelect}
          />
        </div>
      )}
      
      {/* Messages Container */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4" 
        ref={messageContainerRef}
      >
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : messages.length > 0 ? (
          messages.map((message: any) => (
            <MessageBubble 
              key={message.id}
              message={message}
              isOwnMessage={message.senderId === userId}
              senderAvatar={message.senderId === otherUser?.id ? otherUser.profilePic : undefined}
              senderName={message.senderId === otherUser?.id ? otherUser.displayName : 'You'}
            />
          ))
        ) : (
          <div className="text-center py-12 text-neutral-500">
            <p className="mb-2">No messages yet</p>
            <p className="text-sm">Start the conversation with {otherUser?.displayName}</p>
          </div>
        )}
      </div>
      
      {/* Message Input */}
      <div className="border-t p-4">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <Input
            type="text"
            placeholder="Type a message..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            className="flex-1"
          />
          <Button 
            type="submit" 
            size="icon"
            disabled={sendMessageMutation.isPending || !messageText.trim()}
          >
            {sendMessageMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
