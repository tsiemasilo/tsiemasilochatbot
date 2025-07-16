/**
 * Chat Interface Component
 * 
 * The main chat interface that handles:
 * - Text message input and sending
 * - Voice message recording and playback
 * - Emoji picker integration
 * - Theme switching (light/dark mode)
 * - Real-time message display
 * - WhatsApp-style voice recording with minimum duration
 */

import { useState, useRef, useEffect } from 'react';
import { Send, Smile, Moon, Sun, MoreVertical, Mic, MicOff, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { MessageBubble } from './MessageBubble';
import { EmojiPicker } from './EmojiPicker';
import { TypingIndicator } from './TypingIndicator';
import { WelcomePrompt } from './WelcomePrompt';
import { MobileVoiceRecording } from '@/components/mobile/MobileVoiceRecording';
import { useChat } from '@/hooks/useChat';

export function ChatInterface() {
  // State for message input and UI controls
  const [message, setMessage] = useState('');
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingActive, setIsRecordingActive] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  // Refs for DOM elements and media handling
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingStartTimeRef = useRef<number>(0);
  
  // Chat functionality from custom hook
  const { 
    messages, 
    isLoading, 
    isConnected, 
    isTyping, 
    theme, 
    toggleTheme, 
    sendMessage,
    wsRef,
    userName,
    hasEnteredName,
    handleNameSubmit,
    handleLogout
  } = useChat();

  // Auto-scroll to bottom when new messages arrive - Mobile optimized
  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        // Use smooth scrolling for desktop, instant for mobile to avoid issues
        const isMobile = window.innerWidth <= 430;
        messagesEndRef.current.scrollIntoView({ 
          behavior: isMobile ? 'instant' : 'smooth',
          block: 'end'
        });
      }
    };
    
    // Small delay to ensure DOM is updated
    const timeoutId = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timeoutId);
  }, [messages, isTyping]);

  // Lock scroll position on mobile when recording
  useEffect(() => {
    if (isRecording) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    }
    
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, [isRecording]);

  // Clean up recording timer on component unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  const handleSendMessage = () => {
    if (message.trim()) {
      sendMessage(message, userName);
      setMessage('');
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
    inputRef.current?.focus();
  };

  // Additional state for voice recording - must be declared before any conditional returns
  const [micPermissionGranted, setMicPermissionGranted] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [permissionRequested, setPermissionRequested] = useState(false);
  const [isButtonPressed, setIsButtonPressed] = useState(false);
  const isRecordingRef = useRef(false);
  const isProcessingRef = useRef(false);

  // Show welcome prompt if user hasn't entered their name
  if (!hasEnteredName) {
    return <WelcomePrompt onNameSubmit={handleNameSubmit} theme={theme} />;
  }

  // Check and request permission once
  const ensureMicPermission = async () => {
    if (micPermissionGranted) return true;
    if (isRequestingPermission) return false;
    
    try {
      setIsRequestingPermission(true);
      
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia is not supported in this browser');
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      // Stop the stream immediately after getting permission
      stream.getTracks().forEach(track => track.stop());
      setMicPermissionGranted(true);
      setPermissionRequested(true);
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      setMicPermissionGranted(false);
      setPermissionRequested(true);
      
      // Show user-friendly error message
      if (error.name === 'NotAllowedError') {
        alert('Microphone access was denied. Please enable microphone access in your browser settings and try again.');
      } else if (error.name === 'NotFoundError') {
        alert('No microphone found. Please connect a microphone and try again.');
      } else {
        alert('Unable to access microphone. Please check your browser settings and try again.');
      }
      
      return false;
    } finally {
      setIsRequestingPermission(false);
    }
  };

  const handleRecordingStart = async () => {
    console.log('Handle recording start called');
    
    // Prevent multiple calls
    if (isProcessingRef.current) {
      console.log('Already processing, ignoring');
      return;
    }
    
    isProcessingRef.current = true;
    setIsButtonPressed(true);
    
    // Add recording active class to prevent text selection
    setIsRecordingActive(true);
    document.body.classList.add('recording-active');
    
    try {
      // Always try to get permission if we don't have it
      if (!micPermissionGranted) {
        console.log('Requesting microphone permission');
        const granted = await ensureMicPermission();
        if (!granted) {
          setIsButtonPressed(false);
          setIsRecordingActive(false);
          document.body.classList.remove('recording-active');
          return;
        }
      }
      
      // If we have permission and not already recording, start recording
      if (micPermissionGranted && !isRecordingRef.current) {
        console.log('Starting recording immediately');
        await startRecording();
      }
    } finally {
      isProcessingRef.current = false;
    }
  };

  const handleRecordingStop = () => {
    console.log('Handle recording stop called');
    
    // Prevent multiple calls
    if (isProcessingRef.current) {
      console.log('Already processing stop, ignoring');
      return;
    }
    
    isProcessingRef.current = true;
    setIsButtonPressed(false);
    
    // Remove recording active class
    setIsRecordingActive(false);
    document.body.classList.remove('recording-active');
    
    try {
      // Only stop if actually recording
      if (isRecordingRef.current) {
        console.log('Stopping recording');
        stopRecording();
      }
    } finally {
      // Reset processing flag after a short delay
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 500);
    }
  };

  const startRecording = async () => {
    // Prevent multiple recordings
    if (isRecording || isRecordingRef.current) {
      console.log('Already recording, ignoring start request');
      return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      // Try to use WAV format first, fall back to webm if not supported
      let options = {};
      if (MediaRecorder.isTypeSupported('audio/wav')) {
        options = { mimeType: 'audio/wav' };
      } else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        options = { mimeType: 'audio/webm;codecs=opus' };
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        options = { mimeType: 'audio/webm' };
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        options = { mimeType: 'audio/ogg' };
      }
      
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const actualRecordingTime = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);
        console.log('=== RECORDING STOPPED ===');
        console.log('Recording stopped, chunks:', audioChunksRef.current.length, 'actual time:', actualRecordingTime);
        
        // Check if recording was at least 1 second long
        if (actualRecordingTime < 1) {
          console.log('❌ Recording too short, canceling voice message');
          stream.getTracks().forEach(track => track.stop());
          setRecordingTime(0);
          isRecordingRef.current = false;
          if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = null;
          }
          return;
        }
        
        // Use the actual recording time for the voice message
        setRecordingTime(actualRecordingTime);
        
        if (audioChunksRef.current.length > 0) {
          const mimeType = mediaRecorder.mimeType || 'audio/webm';
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          
          console.log('✓ Audio blob created - size:', audioBlob.size, 'bytes, type:', mimeType);
          
          // Only send if we have a reasonable audio size
          if (audioBlob.size > 100) {
            console.log('📤 Calling sendVoiceMessage...');
            await sendVoiceMessage(audioBlob);
            console.log('✓ sendVoiceMessage completed');
          } else {
            console.log('❌ Audio blob too small, not sending');
          }
        } else {
          console.log('❌ Not sending voice message - no audio chunks captured');
        }
        
        stream.getTracks().forEach(track => track.stop());
        
        // Reset recording time
        setRecordingTime(0);
        isRecordingRef.current = false;
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        
        console.log('=== RECORDING CLEANUP COMPLETE ===');
      };

      mediaRecorder.start(1000); // Collect data every 1 second
      setIsRecording(true);
      isRecordingRef.current = true;
      setRecordingTime(0);
      recordingStartTimeRef.current = Date.now();
      
      // Start recording timer
      recordingTimerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);
        setRecordingTime(elapsed);
      }, 100); // Update every 100ms for smooth display
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setMicPermissionGranted(false);
      
      // Show user-friendly error message
      if (error.name === 'NotAllowedError') {
        alert('Microphone access was denied. Please enable microphone access in your browser settings and try again.');
      } else if (error.name === 'NotFoundError') {
        alert('No microphone found. Please connect a microphone and try again.');
      } else {
        alert('Unable to access microphone. Please check your browser settings and try again.');
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && (isRecording || isRecordingRef.current)) {
      console.log('Actually stopping recording');
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      isRecordingRef.current = false;
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  const sendVoiceNote = async (content: string) => {
    try {
      console.log('Sending voice note:', content);
      
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        const messagePayload = {
          type: 'voice_note',
          content: content,
          isUser: true,
          userName: userName
        };
        wsRef.current.send(JSON.stringify(messagePayload));
      } else {
        // HTTP fallback
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: content,
            isUser: true,
            userName: userName
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to send voice note');
        }
      }
    } catch (error) {
      console.error('Error sending voice note:', error);
    }
  };

  const sendVoiceMessage = async (audioBlob: Blob) => {
    try {
      console.log('=== VOICE MESSAGE DEBUG ===');
      console.log('sendVoiceMessage called with blob size:', audioBlob.size);
      console.log('Current userName:', userName);
      console.log('WebSocket state:', wsRef.current?.readyState);
      console.log('Recording start time:', recordingStartTimeRef.current);
      
      // Use the actual recording time
      const actualTime = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);
      const voiceNoteMessage = `🎤 Voice message (${actualTime}s)`;
      console.log('Voice note message to send:', voiceNoteMessage);
      
      // First send the voice note message to chat using voice_note type (won't trigger AI response)
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        const messagePayload = {
          type: 'voice_note',
          content: voiceNoteMessage,
          isUser: true,
          userName: userName
        };
        console.log('Sending WebSocket voice note message:', messagePayload);
        wsRef.current.send(JSON.stringify(messagePayload));
        console.log('✓ Voice note message sent to WebSocket');
      } else {
        console.error('❌ WebSocket not ready, state:', wsRef.current?.readyState);
        // If WebSocket is not ready, let's try to send via HTTP API as fallback
        try {
          console.log('Attempting HTTP API fallback...');
          const response = await fetch('/api/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              content: voiceNoteMessage,
              isUser: true,
              userName: userName
            })
          });
          
          if (response.ok) {
            console.log('✓ Voice message sent via HTTP API');
          } else {
            console.error('❌ HTTP API failed:', response.status);
          }
        } catch (httpError) {
          console.error('❌ HTTP API error:', httpError);
        }
      }

      // Show typing indicator while processing transcription
      const typingMessage = { type: 'typing' };
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(typingMessage));
      }

      const formData = new FormData();
      // Determine file extension based on mime type
      const fileExtension = audioBlob.type.includes('wav') ? 'wav' : 
                           audioBlob.type.includes('ogg') ? 'ogg' : 'webm';
      formData.append('audio', audioBlob, `voice_message.${fileExtension}`);

      console.log('Attempting audio transcription...');
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const { text } = await response.json();
        console.log('Transcription result:', text);
        if (text?.trim()) {
          // Send transcribed text to WebSocket for AI processing
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              type: 'voice_transcription',
              content: text,
              userName: userName
            }));
            console.log('✓ Voice transcription sent for AI processing');
          }
        } else {
          console.log('Empty transcription, stopping typing indicator');
          // Stop typing indicator if transcription is empty
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'stop_typing' }));
          }
        }
      } else {
        console.error('❌ Failed to transcribe audio, status:', response.status);
        // Stop typing indicator on error but don't show error message
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'stop_typing' }));
        }
      }
    } catch (error) {
      console.error('Error sending voice message:', error);
      // Stop typing indicator on error
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'stop_typing' }));
      }
    }
  };

  const connectionStatus = isConnected ? 'Online • AI Assistant' : 'Connecting...';

  return (
    <div className={cn(
      "app-container chat-container chat-interface",
      "flex flex-col h-screen max-w-[390px] mx-auto bg-white dark:bg-gray-900 shadow-lg",
      "mobile-chat-container mobile-sharp-text transition-colors duration-300"
    )}>
      {/* Header */}
      <div className="chat-header bg-green-600 dark:bg-green-700 px-4 py-3 flex items-center justify-between mobile-chat-header">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <img 
              src="/tsie-masilo-avatar.png" 
              alt="Tsie Masilo Bot Avatar" 
              className="w-12 h-12 rounded-full object-cover"
            />
            {isConnected && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white dark:border-gray-900"></div>
            )}
          </div>
          <div className="text-white">
            <h2 className="font-semibold">Tsie Masilo Bot</h2>
            <p className="text-sm text-green-100">
              {isTyping ? 'Typing...' : userName ? `Chatting with ${userName}` : connectionStatus}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="touch-target text-white hover:text-green-100 p-1"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="touch-target text-white hover:text-green-100 p-1"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages Container */}
      <div className={cn(
        "chat-messages messages-area",
        "flex-1 overflow-y-auto p-4 space-y-3",
        "bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800",
        "mobile-chat-messages"
      )}>
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="text-gray-500 dark:text-gray-400">Loading messages...</div>
          </div>
        ) : (
          <>
            {/* Welcome messages */}
            {messages.length === 0 && (
              <MessageBubble
                content="Hi it's Tsie Masilo (BOT), How are you doing today? 😊"
                isUser={false}
                timestamp={new Date()}
                theme={theme}
              />
            )}
            
            {/* Chat messages */}
            {messages.map((msg, index) => (
              <MessageBubble
                key={index}
                content={msg.content}
                isUser={msg.isUser}
                timestamp={msg.timestamp}
                theme={theme}
              />
            ))}
            
            {/* Typing indicator */}
            <TypingIndicator isVisible={isTyping} theme={theme} />
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className={cn(
        "chat-input-container input-area",
        "p-4 border-t border-gray-200 dark:border-gray-700",
        "bg-gray-50 dark:bg-gray-800",
        "mobile-chat-input"
      )}>
  
        
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
              className="touch-target text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mobile-touch-button"
              disabled={isRecording}
            >
              <Smile className="w-5 h-5" />
            </Button>
            <EmojiPicker
              isOpen={isEmojiPickerOpen && !isRecording}
              onClose={() => setIsEmojiPickerOpen(false)}
              onEmojiSelect={handleEmojiSelect}
              theme={theme}
            />
          </div>
          
          <Input
            ref={inputRef}
            type="text"
            placeholder={isRecording ? "Recording..." : isConnected ? "Type a message..." : "Connecting..."}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 rounded-full border-gray-300 dark:border-gray-600 focus:border-green-500 dark:focus:border-green-400 mobile-input-field"
            disabled={isRecording}
          />
          
          <MobileVoiceRecording
            onVoiceMessage={sendVoiceMessage}
            onVoiceNote={sendVoiceNote}
            disabled={isRequestingPermission}
            className="mobile-voice-button"
          />
          
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim() || isRecording}
            className={cn(
              "touch-target bg-green-600 hover:bg-green-700 text-white rounded-full p-2 transition-opacity",
              "mobile-touch-button",
              isRecording ? "opacity-50" : "opacity-100"
            )}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
