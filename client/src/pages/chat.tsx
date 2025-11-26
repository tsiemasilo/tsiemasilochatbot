import { ChatInterface } from '@/components/chat/ChatInterface';
import { AnimatedBackground } from '@/components/ui/animated-background';
import { useEffect, useState } from 'react';

export default function Chat() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }

    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark');
      setTheme(isDark ? 'dark' : 'light');
    });

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return (
    <div className={`min-h-screen relative ${
      theme === 'dark' 
        ? 'animated-gradient-bg-dark' 
        : 'animated-gradient-bg'
    }`}>
      <AnimatedBackground />
      <div className="relative z-10">
        <ChatInterface />
      </div>
    </div>
  );
}
