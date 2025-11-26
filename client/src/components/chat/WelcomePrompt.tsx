/**
 * Welcome Prompt Component
 * 
 * WhatsApp-style welcome screen that collects user's name before allowing
 * them to access the chat interface. This provides personalization and
 * helps create a more engaging user experience.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, User } from 'lucide-react';
import { AnimatedBackground } from '@/components/ui/animated-background';

interface WelcomePromptProps {
  onNameSubmit: (name: string) => void;
  theme: 'light' | 'dark';
}

export function WelcomePrompt({ onNameSubmit, theme }: WelcomePromptProps) {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      // Check for secret admin access
      if (name.trim().toLowerCase() === 'secretadminspy') {
        window.location.href = '/admin';
        return;
      }
      
      setIsSubmitting(true);
      // Add small delay for smooth UX
      await new Promise(resolve => setTimeout(resolve, 500));
      onNameSubmit(name.trim());
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className={`h-screen flex items-center justify-center p-2 relative ${
      theme === 'dark' 
        ? 'animated-gradient-bg-dark' 
        : 'animated-gradient-bg'
    }`}>
      <AnimatedBackground />
      <Card className={`w-full max-w-xs relative z-10 ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      } shadow-xl`}>
        <CardHeader className="text-center space-y-1 pb-2">
          <div className={`mx-auto w-8 h-8 rounded-full flex items-center justify-center ${
            theme === 'dark' 
              ? 'bg-blue-900 text-blue-300' 
              : 'bg-blue-100 text-blue-600'
          }`}>
            <MessageCircle className="w-4 h-4" />
          </div>
          <CardTitle className={`text-base font-bold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Tsie Masilo Bot
          </CardTitle>
          <CardDescription className={`text-xs ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            What's your name?
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-2 pb-3">
          <form onSubmit={handleSubmit} className="space-y-1.5">
            <div className="relative">
              <User className={`absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`} />
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Your name"
                className={`pl-7 py-1 text-sm ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                }`}
                autoFocus
                disabled={isSubmitting}
                required
              />
            </div>
            
            <Button
              type="submit"
              className={`w-full py-1 text-sm font-semibold transition-all duration-200 ${
                name.trim() && !isSubmitting
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              disabled={!name.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center space-x-1">
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Starting...</span>
                </div>
              ) : (
                'Start Chat'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}