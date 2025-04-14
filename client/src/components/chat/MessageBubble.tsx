import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from 'date-fns';

interface MessageBubbleProps {
  message: {
    id: number;
    senderId: number;
    content: string;
    sentAt: string;
    isRead: boolean;
  };
  isOwnMessage: boolean;
  senderName?: string;
  senderAvatar?: string;
}

export default function MessageBubble({ 
  message, 
  isOwnMessage, 
  senderName = "User",
  senderAvatar,
}: MessageBubbleProps) {
  const formattedTime = format(new Date(message.sentAt), 'h:mm a');
  
  return (
    <div className={`flex items-start gap-2 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
      <Avatar className="w-8 h-8 flex-shrink-0">
        {senderAvatar ? (
          <AvatarImage src={senderAvatar} alt={senderName} />
        ) : (
          <AvatarFallback className={`${isOwnMessage ? 'bg-primary' : 'bg-neutral-500'} text-white text-xs`}>
            {senderName?.charAt(0).toUpperCase() || "U"}
          </AvatarFallback>
        )}
      </Avatar>
      
      <div className={`max-w-[75%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
        <div 
          className={`rounded-xl py-2 px-3 ${
            isOwnMessage 
              ? 'bg-primary text-white rounded-tr-none'
              : 'bg-neutral-200 text-neutral-900 rounded-tl-none'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        
        <div className={`flex items-center mt-1 text-xs text-neutral-500 ${isOwnMessage ? 'justify-end' : ''}`}>
          <span className="mr-1">{formattedTime}</span>
          {isOwnMessage && message.isRead && (
            <span className="text-primary text-xs">✓</span>
          )}
        </div>
      </div>
    </div>
  );
}