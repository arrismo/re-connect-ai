import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect, createContext, useContext } from "react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

type NotificationType = "new_match_request" | "pending_matches" | "match_accepted" | "new_message";

export interface MatchNotification {
  type: NotificationType;
  matchId: number;
  userId: number;
  displayName: string;
  profilePic?: string;
  timestamp: string;
}

export interface PendingMatchesNotification {
  type: "pending_matches";
  matches: {
    matchId: number;
    userId: number;
    displayName: string;
    profilePic?: string;
  }[];
}

export interface MessageNotification {
  type: "new_message";
  matchId: number;
  message: {
    id: number;
    senderId: number;
    content: string;
    sentAt: string;
    isRead: boolean;
  };
  sender: {
    id: number;
    displayName: string;
    profilePic?: string;
  };
}

type NotificationMessage = MatchNotification | PendingMatchesNotification | MessageNotification;

interface NotificationContextType {
  notifications: MatchNotification[];
  pendingMatchRequests: number;
  clearNotification: (id: number) => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [notifications, setNotifications] = useState<MatchNotification[]>([]);
  const { toast } = useToast();

  // Count of pending match requests
  const pendingMatchRequests = notifications.filter(
    n => n.type === "new_match_request"
  ).length;

  // Connect to WebSocket when user is authenticated
  useEffect(() => {
    if (user) {
      // Close any existing connection
      if (socket) {
        socket.close();
      }

      // Create WebSocket connection
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const newSocket = new WebSocket(wsUrl);

      newSocket.onopen = () => {
        console.log("WebSocket connected");
        // Authenticate with user ID
        newSocket.send(JSON.stringify({ type: "auth", userId: user.id }));
      };

      newSocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as NotificationMessage;
          console.log("WebSocket message received:", data);
          
          // Handle different notification types
          if (data.type === "new_match_request") {
            // Add notification to state
            setNotifications(prev => [...prev, data as MatchNotification]);
            
            // Show toast
            toast({
              title: "New Match Request",
              description: `${data.displayName} wants to connect with you`,
              variant: "default",
            });
          } 
          else if (data.type === "pending_matches") {
            // Add notifications for each pending match
            const pendingData = data as PendingMatchesNotification;
            const pendingMatches = pendingData.matches.map((match) => ({
              type: "new_match_request" as NotificationType,
              matchId: match.matchId,
              userId: match.userId,
              displayName: match.displayName,
              profilePic: match.profilePic,
              timestamp: new Date().toISOString()
            }));
            
            if (pendingMatches.length > 0) {
              setNotifications(prev => [...prev, ...pendingMatches]);
              
              toast({
                title: "Pending Match Requests",
                description: `You have ${pendingMatches.length} pending match requests`,
                variant: "default",
              });
            }
          }
          else if (data.type === "new_message") {
            // Handle new message notification
            const messageData = data as MessageNotification;
            
            // Create a notification for the message
            const messageNotification: MatchNotification = {
              type: "new_message",
              matchId: messageData.matchId,
              userId: messageData.sender.id,
              displayName: messageData.sender.displayName,
              profilePic: messageData.sender.profilePic,
              timestamp: messageData.message.sentAt
            };
            
            setNotifications(prev => [...prev, messageNotification]);
            
            // Show toast for new message
            toast({
              title: "New Message",
              description: `${messageData.sender.displayName}: ${messageData.message.content.substring(0, 30)}${messageData.message.content.length > 30 ? '...' : ''}`,
              variant: "default",
            });
            
            // Also invalidate the messages cache so the new message appears if the user is on the messages page
            queryClient.invalidateQueries({ queryKey: [`/api/matches/${messageData.matchId}/messages`] });
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      newSocket.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      newSocket.onclose = () => {
        console.log("WebSocket connection closed");
      };

      setSocket(newSocket);

      // Clean up on unmount
      return () => {
        newSocket.close();
      };
    }
  }, [user]);

  // Clear a notification by ID
  const clearNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.matchId !== id));
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const value = {
    notifications,
    pendingMatchRequests,
    clearNotification,
    clearAllNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}