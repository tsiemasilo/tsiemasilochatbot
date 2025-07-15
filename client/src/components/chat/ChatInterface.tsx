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
import { useChat } from '@/hooks/useChat';

export function ChatInterface() {
  // State for message input and UI controls
  const [message, setMessage] = useState('');
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
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

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

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
    
    try {
      // If we don't have permission yet, request it first
      if (!micPermissionGranted && !permissionRequested) {
        console.log('Need to request permission first');
        const granted = await ensureMicPermission();
        if (!granted) {
          alert('Microphone permission is required for voice messages.');
          setIsButtonPressed(false);
          return;
        }
        // Don't start recording after permission - user needs to press again
        console.log('Permission granted, please press and hold again to record');
        setIsButtonPressed(false);
        return;
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
        console.log('Recording stopped, chunks:', audioChunksRef.current.length, 'actual time:', actualRecordingTime);
        
        // Check if recording was at least 1 second long
        if (actualRecordingTime < 1) {
          console.log('Recording too short, canceling voice message');
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
          
          console.log('Audio blob size:', audioBlob.size, 'bytes');
          
          // Only send if we have a reasonable audio size
          if (audioBlob.size > 100) {
            console.log('Sending voice message...');
            await sendVoiceMessage(audioBlob);
          } else {
            console.log('Audio blob too small, not sending');
          }
        } else {
          console.log('Not sending voice message - no audio chunks captured');
        }
        
        stream.getTracks().forEach(track => track.stop());
        
        // Reset recording time
        setRecordingTime(0);
        isRecordingRef.current = false;
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
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
      alert('Unable to access microphone. Please check your permissions.');
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

  const sendVoiceMessage = async (audioBlob: Blob) => {
    try {
      console.log('sendVoiceMessage called with blob size:', audioBlob.size);
      
      // Use the actual recording time
      const actualTime = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);
      const voiceNoteMessage = `🎤 Voice message (${actualTime}s)`;
      console.log('Sending voice note message:', voiceNoteMessage);
      
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'voice_note',
          content: voiceNoteMessage,
          userName: userName
        }));
        console.log('Voice note message sent to WebSocket');
      } else {
        console.log('WebSocket not ready, state:', wsRef.current?.readyState);
      }

      // Show typing indicator while processing
      const typingMessage = { type: 'typing' };
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(typingMessage));
      }

      const formData = new FormData();
      // Determine file extension based on mime type
      const fileExtension = audioBlob.type.includes('wav') ? 'wav' : 
                           audioBlob.type.includes('ogg') ? 'ogg' : 'webm';
      formData.append('audio', audioBlob, `voice_message.${fileExtension}`);

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const { text } = await response.json();
        if (text?.trim()) {
          // Send transcribed text to WebSocket for AI processing only
          // This won't show in chat, only triggers AI response
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              type: 'voice_transcription',
              content: text,
              userName: userName
            }));
          }
        } else {
          // Stop typing indicator if transcription is empty
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'stop_typing' }));
          }
        }
      } else {
        console.error('Failed to transcribe audio');
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
      "flex flex-col h-screen max-w-md mx-auto bg-white dark:bg-gray-900 shadow-lg",
      "transition-colors duration-300"
    )}>
      {/* Header */}
      <div className="bg-green-600 dark:bg-green-700 px-4 py-3 flex items-center justify-between">
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
            className="text-white hover:text-green-100 p-1"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-white hover:text-green-100 p-1"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages Container */}
      <div className={cn(
        "flex-1 overflow-y-auto p-4 space-y-3",
        "bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800"
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
        "p-4 border-t border-gray-200 dark:border-gray-700",
        "bg-gray-50 dark:bg-gray-800"
      )}>
        {/* Recording indicator overlay */}
        {isRecording && (
          <div className="absolute inset-0 bg-red-500 bg-opacity-10 flex items-center justify-center z-50">
            <div className="bg-red-500 text-white px-6 py-3 rounded-full flex items-center space-x-3 shadow-lg">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Recording</span>
              <span className="text-lg font-mono font-bold">
                {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
              </span>
              <span className="text-xs opacity-75">Release to send</span>
            </div>
          </div>
        )}
        
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
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
            placeholder={isRecording ? "Recording..." : "Type a message..."}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 rounded-full border-gray-300 dark:border-gray-600 focus:border-green-500 dark:focus:border-green-400"
            disabled={!isConnected || isRecording}
          />
          
          <Button
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleRecordingStart();
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleRecordingStop();
            }}
            onPointerLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleRecordingStop();
            }}
            onPointerCancel={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleRecordingStop();
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            disabled={!isConnected || isRequestingPermission}
            className={cn(
              "rounded-full p-3 transition-all duration-200",
              "select-none outline-none focus:outline-none",
              "pointer-events-auto cursor-pointer",
              "voice-recording-button",
              "w-12 h-12 flex items-center justify-center",
              isRecording 
                ? "bg-red-600 hover:bg-red-700 text-white scale-110 shadow-lg" 
                : isRequestingPermission
                ? "bg-yellow-600 hover:bg-yellow-700 text-white opacity-75"
                : !micPermissionGranted && !permissionRequested
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : isButtonPressed
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-gray-600 hover:bg-gray-700 text-white"
            )}
            style={{ 
              touchAction: 'manipulation',
              WebkitTouchCallout: 'none',
              WebkitUserSelect: 'none',
              userSelect: 'none',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : 
             isRequestingPermission ? <Mic className="w-5 h-5 animate-pulse" /> : 
             !micPermissionGranted && !permissionRequested ? <Mic className="w-5 h-5 animate-bounce" /> :
             <Mic className="w-5 h-5" />}
          </Button>
          
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim() || !isConnected || isRecording}
            className={cn(
              "bg-green-600 hover:bg-green-700 text-white rounded-full p-2 transition-opacity",
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
