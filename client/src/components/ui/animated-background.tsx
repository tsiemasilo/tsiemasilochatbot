import { MessageCircle, MessageSquare, Send, Heart, Smile, Star, Sparkles, MessagesSquare, ThumbsUp, Zap, Coffee, Music } from 'lucide-react';

const icons = [
  MessageCircle,
  MessageSquare,
  Send,
  Heart,
  Smile,
  Star,
  Sparkles,
  MessagesSquare,
  ThumbsUp,
  Zap,
  Coffee,
  Music,
];

const positions = [
  { left: 5, top: 10 },
  { left: 85, top: 5 },
  { left: 15, top: 75 },
  { left: 75, top: 80 },
  { left: 45, top: 15 },
  { left: 90, top: 45 },
  { left: 8, top: 45 },
  { left: 60, top: 70 },
  { left: 25, top: 30 },
  { left: 70, top: 25 },
  { left: 35, top: 85 },
  { left: 55, top: 50 },
  { left: 20, top: 60 },
  { left: 80, top: 60 },
  { left: 40, top: 35 },
  { left: 65, top: 10 },
  { left: 10, top: 90 },
  { left: 50, top: 90 },
  { left: 30, top: 5 },
  { left: 95, top: 75 },
];

export function AnimatedBackground() {
  return (
    <div 
      className="fixed inset-0 pointer-events-none"
      aria-hidden="true"
      style={{ zIndex: 0 }}
    >
      {positions.map((pos, index) => {
        const Icon = icons[index % icons.length];
        const size = 24 + (index % 4) * 8;
        const delay = (index * 0.4) % 8;
        const duration = 5 + (index % 3) * 2;
        
        return (
          <div
            key={index}
            className="absolute animate-float"
            style={{
              left: `${pos.left}%`,
              top: `${pos.top}%`,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
            }}
          >
            <Icon 
              size={size} 
              strokeWidth={1.5}
              className="text-emerald-600/20 dark:text-emerald-400/15"
            />
          </div>
        );
      })}
    </div>
  );
}
