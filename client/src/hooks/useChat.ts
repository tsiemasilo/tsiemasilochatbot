import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useWebSocket } from './useWebSocket';

interface Message {
  id?: number;
  content: string;
  isUser: boolean;
  timestamp: Date;
  mood?: string;
}

export function useChat() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [userName, setUserName] = useState<string>('');
  const [hasEnteredName, setHasEnteredName] = useState(false);
  const { isConnected, isTyping, messages: wsMessages, sendMessage: wsSendMessage, loadMessages, wsRef } = useWebSocket();
  const [allMessages, setAllMessages] = useState<Message[]>([]);

  // Load existing messages from API
  const { data: existingMessages, isLoading, refetch } = useQuery({
    queryKey: ['/api/messages', userName],
    queryFn: async () => {
      if (!userName) return [];
      
      // Use platform-specific loading from useWebSocket
      if (loadMessages) {
        await loadMessages(userName);
        return [];
      }
      
      // Fallback to direct API call
      const response = await fetch(`/api/messages?userName=${encodeURIComponent(userName)}`);
      if (!response.ok) {
        throw new Error('Failed to load messages');
      }
      return response.json();
    },
    enabled: isConnected && Boolean(userName),
  });

  // Load theme and user preferences
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const savedUserName = localStorage.getItem('userName');
    
    if (savedTheme) {
      setTheme(savedTheme);
    }
    
    if (savedUserName) {
      setUserName(savedUserName);
      setHasEnteredName(true);
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Merge existing messages with WebSocket messages
  useEffect(() => {
    if (existingMessages) {
      const apiMessages = existingMessages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
      setAllMessages(apiMessages);
    }
  }, [existingMessages]);

  // Add WebSocket messages to the list
  useEffect(() => {
    if (wsMessages.length > 0) {
      setAllMessages(prev => {
        // Start with existing messages
        const currentMessages = [...prev];
        
        // Add new WebSocket messages that don't already exist
        wsMessages.forEach(newMessage => {
          const exists = currentMessages.some(msg => 
            msg.content === newMessage.content && 
            msg.isUser === newMessage.isUser &&
            Math.abs(msg.timestamp.getTime() - newMessage.timestamp.getTime()) < 1000
          );
          
          if (!exists) {
            currentMessages.push(newMessage);
          }
        });
        
        // Sort by timestamp to maintain order
        return currentMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      });
    }
  }, [wsMessages]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleSendMessage = (content: string, userNameParam?: string) => {
    if (content.trim()) {
      // Allow sending even if WebSocket isn't fully connected yet
      // The WebSocket hook will handle buffering or retrying if needed
      wsSendMessage(content.trim(), userNameParam || userName);
    }
  };

  const handleNameSubmit = (name: string) => {
    // Clear previous user's data
    setAllMessages([]);
    
    // Set new user
    setUserName(name);
    setHasEnteredName(true);
    localStorage.setItem('userName', name);
    
    // Force refetch messages for the new user
    setTimeout(() => {
      refetch();
    }, 100);
  };

  const handleLogout = () => {
    // Clear all user data
    setAllMessages([]);
    setUserName('');
    setHasEnteredName(false);
    localStorage.removeItem('userName');
    
    // Close WebSocket connection if open
    if (wsRef.current) {
      wsRef.current.close();
    }
  };

  return {
    messages: allMessages,
    isLoading,
    isConnected,
    isTyping,
    theme,
    toggleTheme,
    sendMessage: handleSendMessage,
    wsRef,
    userName,
    hasEnteredName,
    handleNameSubmit,
    handleLogout
  };
}
