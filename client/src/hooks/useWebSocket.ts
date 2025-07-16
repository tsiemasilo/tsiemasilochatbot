/**
 * WebSocket Hook for Real-time Communication
 * 
 * This hook manages WebSocket connections for real-time chat functionality:
 * - Handles connection state and message broadcasting
 * - Provides fallback HTTP API for serverless environments
 * - Manages typing indicators and connection resilience
 * - Supports voice message transcription and file uploads
 */

import { useState, useEffect, useRef } from 'react';

interface WebSocketMessage {
  type: 'message' | 'typing' | 'stop_typing' | 'error' | 'voice_transcription' | 'voice_note' | 'user_name';
  content?: string;
  isUser?: boolean;
  userName?: string;
}

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const [messages, setMessages] = useState<Array<{content: string, isUser: boolean, timestamp: Date}>>([]);
  const [isServerless, setIsServerless] = useState(false);

  useEffect(() => {
    // Detect if we're running in a serverless environment
    const isServerlessEnvironment = window.location.hostname.includes('netlify.app') || 
                                   window.location.hostname.includes('vercel.app') ||
                                   window.location.hostname.includes('herokuapp.com');
    setIsServerless(isServerlessEnvironment);
    
    console.log('Environment detection:', { 
      hostname: window.location.hostname, 
      isServerless: isServerlessEnvironment 
    });

    // For serverless environments, we're always "connected" since we use HTTP
    if (isServerlessEnvironment) {
      setIsConnected(true);
      return;
    }

    // Connect WebSocket for local development
    const connectWebSocket = () => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        console.log('Connected to WebSocket');
      };

      ws.onmessage = (event) => {
        const message: WebSocketMessage = JSON.parse(event.data);
        
        switch (message.type) {
          case 'message':
            if (message.content) {
              setMessages(prev => [...prev, {
                content: message.content!,
                isUser: message.isUser || false,
                timestamp: new Date()
              }]);
            }
            break;
          case 'typing':
            setIsTyping(true);
            break;
          case 'stop_typing':
            setIsTyping(false);
            break;
          case 'error':
            console.error('WebSocket error:', message.content);
            break;
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        console.log('Disconnected from WebSocket');
        
        // Attempt to reconnect after 1 second
        setTimeout(() => {
          if (!isServerlessEnvironment) {
            connectWebSocket();
          }
        }, 1000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

      return ws;
    };

    const ws = connectWebSocket();
    
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  const sendMessage = async (content: string, userName?: string) => {
    if (isServerless) {
      // Serverless: Use HTTP API
      try {
        // Add user message immediately
        setMessages(prev => [...prev, {
          content,
          isUser: true,
          timestamp: new Date()
        }]);
        
        // Show typing indicator
        setIsTyping(true);
        
        const response = await fetch('/.netlify/functions/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: content,
            userName: userName || 'Anonymous'
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // Add bot response after a delay
          setTimeout(() => {
            setMessages(prev => [...prev, {
              content: data.response,
              isUser: false,
              timestamp: new Date()
            }]);
            setIsTyping(false);
          }, 1000);
        } else {
          console.error('Failed to send message:', response.status);
          setIsTyping(false);
        }
      } catch (error) {
        console.error('Error sending message:', error);
        setIsTyping(false);
      }
    } else {
      // Direct Server: Use WebSocket
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'message',
          content,
          isUser: true,
          userName: userName || 'Anonymous'
        }));
      } else {
        // If WebSocket is not ready, add user message to display immediately
        // and store it to send when connection is established
        setMessages(prev => [...prev, {
          content,
          isUser: true,
          timestamp: new Date()
        }]);
        
        // Try to send when connection is ready
        const checkConnection = () => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              type: 'message',
              content,
              isUser: true,
              userName: userName || 'Anonymous'
            }));
          } else {
            setTimeout(checkConnection, 500); // Try again after 500ms
          }
        };
        
        setTimeout(checkConnection, 100);
      }
    }
  };

  const sendVoiceMessage = (content: string, userName?: string) => {
    if (isServerless) {
      // For serverless environments, use regular sendMessage
      sendMessage(content, userName);
    } else {
      // For WebSocket
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'voice_note',
          content,
          isUser: true,
          userName: userName || 'Anonymous'
        }));
      }
    }
  };

  const sendVoiceTranscription = async (content: string, userName?: string) => {
    if (isServerless) {
      // For serverless environments, use sendMessage for voice transcription
      await sendMessage(content, userName);
    } else if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'voice_transcription',
        content,
        userName: userName || 'Anonymous'
      }));
    }
  };

  const loadMessages = async (userName: string) => {
    try {
      let response;
      
      if (isServerless) {
        // For serverless environments, use functions
        response = await fetch(`/.netlify/functions/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userName })
        });
      } else {
        // For direct server connection, use regular API
        response = await fetch(`/api/messages?userName=${encodeURIComponent(userName)}`);
      }
      
      if (response.ok) {
        const messages = await response.json();
        setMessages(messages.map((msg: any) => ({
          content: msg.content,
          isUser: msg.isUser,
          timestamp: new Date(msg.timestamp)
        })));
      } else {
        console.error('Failed to load messages:', response.status);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  return {
    isConnected,
    isTyping,
    messages,
    sendMessage,
    sendVoiceMessage,
    sendVoiceTranscription,
    loadMessages,
    wsRef
  };
}