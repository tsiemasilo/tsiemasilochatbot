import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertMessageSchema } from "@shared/schema";
import { analyzeMood, generateResponse, transcribeAudio, analyzeEngagement } from "./services/openai";
import multer from "multer";
import { tmpdir } from "os";
import { join } from "path";

interface WebSocketMessage {
  type: 'message' | 'typing' | 'stop_typing' | 'voice_transcription' | 'voice_note' | 'user_name';
  content?: string;
  isUser?: boolean;
  userName?: string;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Configure multer for handling file uploads
  const upload = multer({
    dest: tmpdir(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
      const allowedMimeTypes = [
        'audio/webm',
        'audio/ogg',
        'audio/wav',
        'audio/mp3',
        'audio/m4a',
        'audio/flac',
        'audio/mp4',
        'audio/mpeg',
        'audio/mpga',
        'audio/oga'
      ];
      
      if (allowedMimeTypes.includes(file.mimetype) || file.mimetype.startsWith('audio/')) {
        cb(null, true);
      } else {
        cb(new Error('Only audio files are allowed'));
      }
    }
  });
  
  // WebSocket setup for real-time chat
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');
    
    ws.on('message', async (data) => {
      try {
        const message: WebSocketMessage = JSON.parse(data.toString());
        
        if (message.type === 'message' && message.content) {
          console.log('=== MESSAGE RECEIVED ===');
          console.log('Message type:', message.type);
          console.log('Message content:', message.content);
          console.log('Message userName:', message.userName);
          console.log('Message isUser:', message.isUser);
          
          // Store user message
          const storedMessage = await storage.createMessage({
            content: message.content,
            isUser: true,
            mood: 'neutral',
            userName: message.userName || 'Anonymous'
          });
          
          console.log('✓ Message stored with ID:', storedMessage.id);
          
          // Broadcast the user's message to all clients immediately
          broadcast({ 
            type: 'message', 
            content: message.content, 
            isUser: true 
          });
          
          console.log('✓ Message broadcasted to all clients');
          
          // Broadcast typing indicator
          broadcast({ type: 'typing' });
          
          // Get conversation history for context
          const history = await storage.getMessages(message.userName || 'Anonymous', 20);
          const conversationHistory = history.map(msg => ({
            content: msg.content,
            isUser: msg.isUser
          }));
          
          // Analyze mood and generate response
          const moodAnalysis = await analyzeMood(message.content);
          const botResponse = await generateResponse(
            message.content, 
            conversationHistory, 
            moodAnalysis
          );
          
          // Store bot response
          await storage.createMessage({
            content: botResponse,
            isUser: false,
            mood: moodAnalysis.mood,
            userName: message.userName || 'Anonymous'
          });
          
          // Stop typing and send response
          broadcast({ type: 'stop_typing' });
          broadcast({ 
            type: 'message', 
            content: botResponse, 
            isUser: false 
          });
        } else if (message.type === 'voice_note' && message.content) {
          console.log('=== VOICE NOTE RECEIVED ===');
          console.log('Voice note content:', message.content);
          console.log('Voice note userName:', message.userName);
          
          // Store voice note display message but don't trigger AI response
          const storedVoiceNote = await storage.createMessage({
            content: message.content,
            isUser: true,
            userName: message.userName || 'Anonymous'
          });
          
          console.log('✓ Voice note stored with ID:', storedVoiceNote.id);
          
          // Broadcast to all clients
          broadcast({ 
            type: 'message', 
            content: message.content, 
            isUser: true 
          });
          
          console.log('✓ Voice note broadcasted to all clients');
        } else if (message.type === 'voice_transcription' && message.content) {
          // Process voice transcription for AI response only (don't store as user message)
          try {
            // Broadcast typing indicator
            broadcast({ type: 'typing' });
            
            // Get conversation history for context
            const history = await storage.getMessages(message.userName || 'Anonymous', 20);
            const conversationHistory = history.map(msg => ({
              content: msg.content,
              isUser: msg.isUser
            }));
            
            // Analyze mood and generate response
            const moodAnalysis = await analyzeMood(message.content);
            const botResponse = await generateResponse(
              message.content, 
              conversationHistory, 
              moodAnalysis
            );
            
            // Store bot response
            await storage.createMessage({
              content: botResponse,
              isUser: false,
              mood: moodAnalysis.mood,
              userName: message.userName || 'Anonymous'
            });
            
            // Stop typing and send response
            broadcast({ type: 'stop_typing' });
            broadcast({ 
              type: 'message', 
              content: botResponse, 
              isUser: false 
            });
          } catch (error) {
            console.error('Error processing voice transcription:', error);
            broadcast({ type: 'stop_typing' });
            // Don't send error message, just stop typing indicator
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({ 
          type: 'error', 
          content: 'Sorry, there was an error processing your message.' 
        }));
      }
    });
    
    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
    });
  });
  
  function broadcast(message: WebSocketMessage) {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }
  
  // REST API endpoints
  app.get('/api/messages', async (req, res) => {
    try {
      const userName = req.query.userName as string || 'Anonymous';
      const messages = await storage.getMessages(userName);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });
  
  app.post('/api/messages', async (req, res) => {
    try {
      const messageData = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage(messageData);
      res.json(message);
    } catch (error) {
      res.status(400).json({ error: 'Invalid message data' });
    }
  });
  
  app.delete('/api/messages', async (req, res) => {
    try {
      await storage.clearMessages();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to clear messages' });
    }
  });

  // Chat endpoint for HTTP API (used by Netlify and as fallback)
  app.post('/api/chat', async (req, res) => {
    try {
      const { content, userName = 'Anonymous' } = req.body;

      if (!content) {
        return res.status(400).json({ error: 'Content is required' });
      }

      // Store user message
      await storage.createMessage({
        content,
        isUser: true,
        mood: 'neutral',
        userName
      });

      // Get conversation history for context
      const history = await storage.getMessages(userName, 20);
      const conversationHistory = history.map(msg => ({
        content: msg.content,
        isUser: msg.isUser
      }));

      // Analyze mood and generate response
      const moodAnalysis = await analyzeMood(content);
      const botResponse = await generateResponse(
        content, 
        conversationHistory, 
        moodAnalysis
      );

      // Store bot response
      await storage.createMessage({
        content: botResponse,
        isUser: false,
        mood: moodAnalysis.mood,
        userName: 'Tsie Masilo Bot'
      });

      // Return the response
      res.json({
        response: botResponse,
        mood: moodAnalysis.mood
      });
    } catch (error) {
      console.error('Chat error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Admin API endpoints
  app.get('/api/admin/contacts', async (req, res) => {
    try {
      const contacts = await storage.getContacts();
      res.json(contacts);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      res.status(500).json({ error: 'Failed to fetch contacts' });
    }
  });

  app.get('/api/admin/messages/:userName', async (req, res) => {
    try {
      const { userName } = req.params;
      const messages = await storage.getMessagesByUser(userName);
      res.json(messages);
    } catch (error) {
      console.error('Error fetching user messages:', error);
      res.status(500).json({ error: 'Failed to fetch user messages' });
    }
  });

  // Audio transcription endpoint
  app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No audio file provided' });
      }

      console.log('Received audio file:', {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      });

      const transcription = await transcribeAudio(req.file.path, req.file.originalname, req.file.mimetype);
      res.json({ text: transcription.text });
    } catch (error) {
      console.error('Transcription error:', error);
      res.status(500).json({ error: 'Failed to transcribe audio' });
    }
  });
  
  return httpServer;
}
