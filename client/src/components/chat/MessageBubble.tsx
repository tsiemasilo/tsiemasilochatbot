import { cn } from '@/lib/utils';
import { Check, CheckCheck } from 'lucide-react';

interface MessageBubbleProps {
  content: string;
  isUser: boolean;
  timestamp: Date;
  theme: 'light' | 'dark';
}

export function MessageBubble({ content, isUser, timestamp, theme }: MessageBubbleProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true
    });
  };

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className={cn(
          "max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow-sm",
          "mobile-message-bubble",
          theme === 'light' 
            ? "bg-green-100 text-gray-800" 
            : "bg-green-900 text-gray-100"
        )}>
          <p className="text-sm">{content}</p>
          <div className="flex items-center justify-end space-x-1 mt-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatTime(timestamp)}
            </span>
            <CheckCheck className="w-3 h-3 text-blue-500" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start space-x-2">
      <img 
        src="/tsie-masilo-avatar.png" 
        alt="Bot Avatar" 
        className="w-10 h-10 rounded-full object-cover mt-1"
      />
      <div className={cn(
        "max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow-sm",
        "mobile-message-bubble",
        theme === 'light' 
          ? "bg-white text-gray-800" 
          : "bg-gray-800 text-gray-100"
      )}>
        <p className="text-sm">{content}</p>
        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
          {formatTime(timestamp)}
        </span>
      </div>
    </div>
  );
}
