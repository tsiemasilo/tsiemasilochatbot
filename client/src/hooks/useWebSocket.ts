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
  const [isNetlify, setIsNetlify] = useState(false);

  useEffect(() => {
    // Check if we're on Netlify (no WebSocket support)
    const isNetlifyDeploy = window.location.host.includes('netlify.app');
    setIsNetlify(isNetlifyDeploy);
    
    if (isNetlifyDeploy) {
      // For Netlify, just set connected to true and use HTTP polling
      setIsConnected(true);
      return;
    }
    
    // For local development, use WebSocket
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
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, []);

  const sendMessage = async (content: string, userName?: string) => {
    if (isNetlify) {
      // For Netlify, use HTTP API directly
      try {
        const response = await fetch('/.netlify/functions/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: content,
            userName: userName || 'Anonymous'
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          // Add user message
          setMessages(prev => [...prev, {
            content,
            isUser: true,
            timestamp: new Date()
          }]);
          
          // Show typing indicator
          setIsTyping(true);
          
          // Add bot response after a delay
          setTimeout(() => {
            setMessages(prev => [...prev, {
              content: data.response,
              isUser: false,
              timestamp: new Date()
            }]);
            setIsTyping(false);
          }, 1000);
        }
      } catch (error) {
        console.error('Error sending message:', error);
      }
    } else if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      // For local development, use WebSocket
      wsRef.current.send(JSON.stringify({
        type: 'message',
        content,
        isUser: true,
        userName: userName || 'Anonymous'
      }));
      
      // Add user message to local state immediately
      setMessages(prev => [...prev, {
        content,
        isUser: true,
        timestamp: new Date()
      }]);
    }
  };

  const sendVoiceMessage = (content: string, userName?: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'voice_note',
        content,
        isUser: true,
        userName: userName || 'Anonymous'
      }));
    }
  };

  const sendVoiceTranscription = async (content: string, userName?: string) => {
    if (isNetlify) {
      // For Netlify, use sendMessage for voice transcription
      await sendMessage(content, userName);
    } else if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'voice_transcription',
        content,
        userName: userName || 'Anonymous'
      }));
    }
  };

  return {
    isConnected,
    isTyping,
    messages,
    sendMessage,
    sendVoiceMessage,
    sendVoiceTranscription,
    wsRef
  };
}
