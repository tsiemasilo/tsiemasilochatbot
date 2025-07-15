import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
  isVisible: boolean;
  theme: 'light' | 'dark';
}

export function TypingIndicator({ isVisible, theme }: TypingIndicatorProps) {
  if (!isVisible) return null;

  return (
    <div className="flex items-start space-x-2">
      <img 
        src="/tsie-masilo-avatar.png" 
        alt="Bot Avatar" 
        className="w-10 h-10 rounded-full object-cover mt-1"
      />
      <div className={cn(
        "p-3 rounded-lg shadow-sm max-w-xs",
        theme === 'light' ? "bg-white" : "bg-gray-800"
      )}>
        <div className="flex space-x-1">
          <div className="typing-dot"></div>
          <div className="typing-dot"></div>
          <div className="typing-dot"></div>
        </div>
      </div>
    </div>
  );
}
