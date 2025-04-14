import { useState } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { formatTimeAgo } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, pendingMatchRequests, clearNotification } = useNotifications();

  // Toggle dropdown
  const toggleDropdown = () => setIsOpen(prev => !prev);

  // Close dropdown
  const closeDropdown = () => setIsOpen(false);

  // Accept match request mutation
  const acceptMatchMutation = useMutation({
    mutationFn: async ({ matchId }: { matchId: number }) => {
      const response = await apiRequest("PUT", `/api/matches/${matchId}/status`, { status: "active" });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/matches'] });
    },
  });

  // Reject match request mutation
  const rejectMatchMutation = useMutation({
    mutationFn: async ({ matchId }: { matchId: number }) => {
      const response = await apiRequest("PUT", `/api/matches/${matchId}/status`, { status: "rejected" });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/matches'] });
    },
  });

  // Handle accepting a match request
  const handleAccept = (matchId: number) => {
    acceptMatchMutation.mutate({ matchId });
    clearNotification(matchId);
    closeDropdown();
  };

  // Handle rejecting a match request
  const handleReject = (matchId: number) => {
    rejectMatchMutation.mutate({ matchId });
    clearNotification(matchId);
    closeDropdown();
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleDropdown}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {pendingMatchRequests > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {pendingMatchRequests}
          </span>
        )}
      </Button>

      {isOpen && (
        <>
          {/* Backdrop to close on click outside */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={closeDropdown}
          />
          
          <Card className="absolute right-0 top-full mt-2 w-80 z-50 p-3 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">Notifications</h3>
              {pendingMatchRequests > 0 && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                  {pendingMatchRequests} new
                </span>
              )}
            </div>
            
            {notifications.length === 0 ? (
              <div className="text-center py-4 text-sm text-neutral-500">
                No notifications
              </div>
            ) : (
              <div className="divide-y divide-neutral-200">
                {notifications.map((notification) => (
                  <div key={notification.matchId} className="py-3">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        {notification.profilePic ? (
                          <AvatarImage src={notification.profilePic} alt={notification.displayName} />
                        ) : (
                          <AvatarFallback>{notification.displayName.charAt(0)}</AvatarFallback>
                        )}
                      </Avatar>
                      
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium">{notification.displayName}</span>
                          {" "}wants to connect with you
                        </p>
                        <p className="text-xs text-neutral-500 mt-1">
                          {formatTimeAgo(notification.timestamp)}
                        </p>
                        
                        <div className="flex gap-2 mt-2">
                          <Button 
                            size="sm" 
                            variant="default"
                            className="h-8 text-xs flex-1"
                            onClick={() => handleAccept(notification.matchId)}
                            disabled={acceptMatchMutation.isPending}
                          >
                            Accept
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-8 text-xs flex-1"
                            onClick={() => handleReject(notification.matchId)}
                            disabled={rejectMatchMutation.isPending}
                          >
                            Decline
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}