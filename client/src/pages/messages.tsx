import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import ChatInterface from "@/components/chat/ChatInterface";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Clock, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Messages() {
  const { user } = useAuth();
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  
  // Get all matches to show in sidebar
  const { data: matchesData, isLoading } = useQuery({
    queryKey: ['/api/matches'],
  });
  
  console.log("Messages component matchesData:", matchesData);
  
  // Get active matches
  const activeMatches = matchesData?.matches?.filter(
    (match: any) => match.status === 'active'
  ) || [];
  
  const handleSelectMatch = (matchId: number) => {
    setSelectedMatchId(matchId);
  };
  
  // Format date for last message
  const formatLastActive = (date: string) => {
    if (!date) return 'Never';
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };
  
  return (
    <div className="container mx-auto p-4 md:p-6 max-w-6xl h-full">
      <div className="flex flex-col md:flex-row h-[calc(100vh-9rem)] md:space-x-4">
        {/* Matches sidebar */}
        <div className="md:w-1/3 mb-4 md:mb-0">
          <Card className="h-full">
            <CardContent className="p-4">
              <h2 className="text-xl font-bold mb-4">Conversations</h2>
              
              {isLoading ? (
                <div className="space-y-4">
                  <div className="h-16 bg-neutral-100 rounded-lg animate-pulse" />
                  <div className="h-16 bg-neutral-100 rounded-lg animate-pulse" />
                </div>
              ) : activeMatches.length > 0 ? (
                <div className="space-y-2">
                  {activeMatches.map((match: any) => (
                    <div 
                      key={match.id}
                      className={`p-3 rounded-lg cursor-pointer hover:bg-neutral-100 transition 
                        ${selectedMatchId === match.id ? 'bg-primary/10 border border-primary/20' : ''}
                      `}
                      onClick={() => handleSelectMatch(match.id)}
                    >
                      <div className="flex items-center">
                        <Avatar className="h-10 w-10">
                          {match.otherUser.profilePic ? (
                            <AvatarImage src={match.otherUser.profilePic} alt={match.otherUser.displayName} />
                          ) : (
                            <AvatarFallback className="bg-primary text-white">
                              {match.otherUser.displayName.charAt(0)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="ml-3 flex-1">
                          <div className="flex justify-between">
                            <span className="font-medium text-sm">{match.otherUser.displayName}</span>
                            <span className="text-xs text-neutral-500 flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatLastActive(match.otherUser.lastActive)}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-600 truncate">
                            {match.matchScore}% Match • {match.activeChallenge ? 'Active Challenge' : 'No Active Challenge'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-neutral-300 mx-auto mb-2" />
                  <h3 className="font-medium mb-1">No Conversations Yet</h3>
                  <p className="text-sm text-neutral-500 mb-4">You don't have any active matches</p>
                  <Button variant="outline">Find Matches</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Chat area */}
        <div className="md:w-2/3 h-full">
          <Card className="h-full">
            <CardContent className="p-0 h-full">
              {selectedMatchId ? (
                <ChatInterface 
                  matchId={selectedMatchId}
                  userId={user?.id || 0}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-center p-4">
                  <div>
                    <MessageSquare className="h-16 w-16 text-neutral-300 mx-auto mb-3" />
                    <h3 className="text-xl font-medium mb-2">Your Messages</h3>
                    <p className="text-neutral-500 max-w-md mx-auto">
                      Select a conversation from the sidebar to start chatting with your support partners.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
