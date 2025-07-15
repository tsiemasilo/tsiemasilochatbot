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

  useEffect(() => {
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

  const sendMessage = (content: string, userName?: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
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

  const sendVoiceTranscription = (content: string, userName?: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
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
