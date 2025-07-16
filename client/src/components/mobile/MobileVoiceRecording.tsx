import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileVoiceRecordingProps {
  onVoiceMessage: (audioBlob: Blob) => Promise<void>;
  onVoiceNote: (content: string) => Promise<void>;
  disabled?: boolean;
  className?: string;
}

export function MobileVoiceRecording({ 
  onVoiceMessage, 
  onVoiceNote, 
  disabled = false,
  className
}: MobileVoiceRecordingProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [micPermissionGranted, setMicPermissionGranted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [permissionJustGranted, setPermissionJustGranted] = useState(false);
  const [isButtonPressed, setIsButtonPressed] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<number>(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  // Safety mechanism: If recording is active but button is not pressed, stop recording
  useEffect(() => {
    if (isRecording && !isButtonPressed) {
      console.log('Safety stop: Recording active but button not pressed');
      stopRecording();
    }
  }, [isRecording, isButtonPressed]);

  // Prevent text selection and scrolling during recording
  useEffect(() => {
    if (isRecording) {
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';
      document.body.style.webkitTouchCallout = 'none';
      document.body.style.touchAction = 'none';
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
      document.body.style.webkitTouchCallout = '';
      document.body.style.touchAction = '';
      document.body.style.overflow = '';
    }
  }, [isRecording]);

  const ensureMicPermission = async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setMicPermissionGranted(true);
      setPermissionJustGranted(true);
      
      // Clear the "just granted" state after 3 seconds
      setTimeout(() => {
        setPermissionJustGranted(false);
      }, 3000);
      
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      setMicPermissionGranted(false);
      setPermissionJustGranted(false);
      return false;
    }
  };

  const startRecording = async (): Promise<void> => {
    if (isRecording || isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      streamRef.current = stream;
      
      let options = {};
      if (MediaRecorder.isTypeSupported('audio/webm')) {
        options = { mimeType: 'audio/webm' };
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
        
        if (actualRecordingTime < 1) {
          console.log('Recording too short, canceling');
          cleanup();
          return;
        }
        
        if (audioChunksRef.current.length > 0) {
          const mimeType = mediaRecorder.mimeType || 'audio/webm';
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          
          if (audioBlob.size > 100) {
            // Send voice note indicator first
            const voiceNoteMessage = `🎤 Voice message (${actualRecordingTime}s)`;
            await onVoiceNote(voiceNoteMessage);
            
            // Then process the audio
            await onVoiceMessage(audioBlob);
          }
        }
        
        cleanup();
      };
      
      recordingStartTimeRef.current = Date.now();
      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      
      // If permission was denied during recording start, reset permission state
      if (error.name === 'NotAllowedError') {
        setMicPermissionGranted(false);
      }
      
      cleanup();
    } finally {
      setIsProcessing(false);
    }
  };

  const stopRecording = (): void => {
    if (!isRecording || !mediaRecorderRef.current) return;
    
    console.log('Stopping recording...');
    setIsProcessing(true);
    
    try {
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      cleanup();
    }
  };

  const cleanup = (): void => {
    console.log('Cleaning up recording state...');
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    
    setIsRecording(false);
    setIsButtonPressed(false);
    setRecordingTime(0);
    setIsProcessing(false);
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    
    console.log('Recording state cleaned up');
  };

  const handlePointerDown = async (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled || isProcessing || isRecording) return;
    
    console.log('Button pressed down');
    setIsButtonPressed(true);
    
    // If permission not granted, request it but don't start recording yet
    if (!micPermissionGranted) {
      setIsProcessing(true);
      const granted = await ensureMicPermission();
      setIsProcessing(false);
      setIsButtonPressed(false);
      
      if (!granted) return;
      
      // Permission was just granted, user needs to press and hold again
      console.log('Microphone permission granted. Please press and hold the voice button again to start recording.');
      return;
    }
    
    // Only start recording if permission was already granted and not currently recording
    setPermissionJustGranted(false); // Clear the indicator
    await startRecording();
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Button released');
    setIsButtonPressed(false);
    
    // Always stop recording when pointer is released
    if (isRecording) {
      console.log('Stopping recording due to button release');
      stopRecording();
    }
  };

  const handlePointerLeave = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Pointer left button');
    setIsButtonPressed(false);
    
    // Always stop recording when pointer leaves the button
    if (isRecording) {
      console.log('Stopping recording due to pointer leave');
      stopRecording();
    }
  };

  const handlePointerCancel = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Pointer cancelled');
    setIsButtonPressed(false);
    
    // Always stop recording when pointer is cancelled
    if (isRecording) {
      console.log('Stopping recording due to pointer cancel');
      stopRecording();
    }
  };

  return (
    <>
      {/* Recording overlay */}
      {isRecording && (
        <div 
          className="fixed inset-0 bg-red-500 bg-opacity-20 flex items-center justify-center z-50"
          style={{ 
            touchAction: 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            WebkitTouchCallout: 'none'
          }}
        >
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
      
      {/* Voice recording button */}
      <button
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onPointerCancel={handlePointerCancel}
        onContextMenu={(e) => e.preventDefault()}
        disabled={disabled || isProcessing}
        className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200",
          "select-none outline-none focus:outline-none",
          "pointer-events-auto cursor-pointer",
          "active:scale-95", // Visual feedback for press
          isRecording 
            ? "bg-red-600 hover:bg-red-700 text-white scale-110 shadow-lg" 
            : isProcessing
            ? "bg-yellow-600 hover:bg-yellow-700 text-white opacity-75"
            : permissionJustGranted
            ? "bg-green-600 hover:bg-green-700 text-white animate-pulse"
            : !micPermissionGranted
            ? "bg-blue-600 hover:bg-blue-700 text-white"
            : "bg-gray-600 hover:bg-gray-700 text-white",
          className
        )}
        style={{ 
          touchAction: 'none',
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none',
          WebkitTapHighlightColor: 'transparent'
        }}
      >
        {isRecording ? (
          <MicOff className="w-5 h-5" />
        ) : isProcessing ? (
          <Mic className="w-5 h-5 animate-pulse" />
        ) : permissionJustGranted ? (
          <Mic className="w-5 h-5 animate-bounce" />
        ) : !micPermissionGranted ? (
          <Mic className="w-5 h-5 animate-bounce" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
      </button>
    </>
  );
}