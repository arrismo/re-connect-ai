import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";

interface MessageBubbleProps {
  message: {
    id: number;
    senderId: number;
    content: string;
    sentAt: string;
    isRead: boolean;
  };
  isOwnMessage: boolean;
  senderAvatar?: string;
  senderName: string;
}

export default function MessageBubble({ 
  message, 
  isOwnMessage, 
  senderAvatar, 
  senderName 
}: MessageBubbleProps) {
  const sentTime = new Date(message.sentAt);
  
  // Format time
  const formattedTime = format(sentTime, "h:mm a");
  
  // Style for different bubble types
  const bubbleClass = isOwnMessage 
    ? "bg-primary text-white chat-bubble-right ml-12" 
    : "bg-white chat-bubble-left mr-12";

  return (
    <div className={`flex items-start ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
      <Avatar className="h-8 w-8 flex-shrink-0">
        {senderAvatar ? (
          <AvatarImage src={senderAvatar} alt={senderName} />
        ) : (
          <AvatarFallback className={isOwnMessage ? "bg-primary/80 text-white" : "bg-neutral-300"}>
            {senderName.charAt(0)}
          </AvatarFallback>
        )}
      </Avatar>
      <div className={`${isOwnMessage ? 'mr-2' : 'ml-2'} p-3 rounded-[1.25rem] ${bubbleClass}`}>
        <p className="text-sm break-words">{message.content}</p>
        <div className={`text-[10px] mt-1 text-right ${isOwnMessage ? 'text-primary-foreground/70' : 'text-neutral-500'}`}>
          {formattedTime}
          {isOwnMessage && (
            <span className="ml-1">{message.isRead ? "✓✓" : "✓"}</span>
          )}
        </div>
      </div>
    </div>
  );
}
