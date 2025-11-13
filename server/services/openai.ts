/**
 * OpenAI Service
 * 
 * This module handles all interactions with OpenAI's API including:
 * - GPT-4o for chat responses and mood analysis
 * - Whisper for speech-to-text transcription
 * - Mood-based response generation for human-like conversations
 */

import OpenAI from "openai";

// Initialize OpenAI client with API key from environment
// Using GPT-4o (latest model released May 13, 2024)
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.API_KEY || "your-api-key-here"
});

/**
 * Interface for mood analysis results
 * Used to adapt bot responses based on user emotions
 */
export interface MoodAnalysis {
  mood: 'happy' | 'sad' | 'excited' | 'anxious' | 'neutral' | 'angry' | 'confused' | 'supportive';
  confidence: number;
  suggestedEmojis: string[];
}

/**
 * Interface for user engagement analysis
 * Used to adapt response length based on user interaction patterns
 */
export interface EngagementAnalysis {
  level: 'low' | 'medium' | 'high';
  messageLength: 'short' | 'medium' | 'long';
  responseStyle: 'concise' | 'balanced' | 'detailed';
  conversationDepth: number;
}

/**
 * Analyze the mood and sentiment of a user's message
 * This helps the bot respond appropriately based on user emotions
 */
export async function analyzeMood(message: string): Promise<MoodAnalysis> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a mood analysis expert. Analyze the sentiment and mood of the user's message. 
          Respond with JSON in this exact format: 
          { 
            "mood": "happy|sad|excited|anxious|neutral|angry|confused|supportive", 
            "confidence": number between 0 and 1,
            "suggestedEmojis": ["emoji1", "emoji2", "emoji3"]
          }`
        },
        {
          role: "user",
          content: message,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      mood: result.mood || 'neutral',
      confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
      suggestedEmojis: result.suggestedEmojis || ['😊']
    };
  } catch (error) {
    console.error('Mood analysis error:', error);
    return {
      mood: 'neutral',
      confidence: 0.5,
      suggestedEmojis: ['😊']
    };
  }
}

/**
 * Analyze user engagement patterns to adapt response length
 * This helps provide appropriate response depth based on user behavior
 */
export function analyzeEngagement(
  conversationHistory: Array<{content: string, isUser: boolean}>
): EngagementAnalysis {
  const userMessages = conversationHistory.filter(msg => msg.isUser);
  const recentMessages = userMessages.slice(-5); // Last 5 user messages
  
  // Calculate average message length
  const avgLength = recentMessages.reduce((acc, msg) => acc + msg.content.length, 0) / Math.max(recentMessages.length, 1);
  
  // Determine engagement level based on conversation patterns
  const conversationDepth = conversationHistory.length;
  const quickResponses = recentMessages.filter(msg => msg.content.length < 20).length;
  const longResponses = recentMessages.filter(msg => msg.content.length > 100).length;
  
  let level: 'low' | 'medium' | 'high' = 'medium';
  let messageLength: 'short' | 'medium' | 'long' = 'medium';
  let responseStyle: 'concise' | 'balanced' | 'detailed' = 'balanced';
  
  // Determine message length preference
  if (avgLength < 30) {
    messageLength = 'short';
    responseStyle = 'concise';
  } else if (avgLength > 80) {
    messageLength = 'long';
    responseStyle = 'detailed';
  }
  
  // Determine engagement level
  if (quickResponses > 3 || conversationDepth < 6) {
    level = 'low';
    responseStyle = 'concise';
  } else if (longResponses > 2 || conversationDepth > 15) {
    level = 'high';
    responseStyle = 'detailed';
  }
  
  return {
    level,
    messageLength,
    responseStyle,
    conversationDepth
  };
}

export async function generateResponse(
  message: string, 
  conversationHistory: Array<{content: string, isUser: boolean}>,
  userMood: MoodAnalysis
): Promise<string> {
  try {
    const moodContext = getMoodContext(userMood.mood);
    const engagement = analyzeEngagement(conversationHistory);
    const historyContext = conversationHistory.slice(-10).map(msg => 
      `${msg.isUser ? 'User' : 'Bot'}: ${msg.content}`
    ).join('\n');

    // Adaptive response length based on engagement
    const responseGuidelines = getResponseGuidelines(engagement);
    const maxTokens = getMaxTokens(engagement);

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are Tsie Masilo Bot, a friendly and professional AI assistant representing Tsie Masilo - a 25-year-old QA Analyst and Junior Software Developer from South Africa.
          
          IMPORTANT: You can hear and understand voice messages! When a user sends a voice message, you're responding to their actual spoken words, not just a "voice message" indicator. Never say you can't hear voice messages - you can!
          
          ## About Tsie:
          **Professional Background**: 
          - QA Analyst/Junior Software Developer working in Midrand
          - Trading since 2019 with experience in ICT, Smart Money, and Supply & Demand strategies
          - Passionate about building AI bots, automations, and web applications
          
          **Interests**:
          - Technology and software development
          - Trading and financial markets
          - Content creation (YouTube channel "Unheard Archives")
          - Gaming, soccer, and automotive enthusiasm (BMW M4)
          
          **Goals & Values**:
          - Building successful businesses and achieving financial independence
          - Creating solutions that help people solve real problems
          - Learning by doing and continuous improvement
          - Work-life balance with girlfriend Al
          
          ## Communication Style:
          - **Friendly & Approachable**: Talk like a supportive friend who genuinely cares
          - **Professional**: Clear, helpful communication without being overly formal
          - **Positive & Encouraging**: Supportive and motivating, especially when users face challenges
          - **Practical & Direct**: Get to the point without unnecessary jargon
          - **Conversational**: Use natural language, contractions (I'm, you're), and occasional emojis
          - **Adaptable**: Match the user's energy and communication style
          
          ## How to Respond:
          - Be warm and welcoming, like talking to a friend over coffee
          - Offer practical advice and encouragement
          - Share relevant experiences from trading, development, or life
          - Use everyday language - avoid excessive slang or technical jargon unless appropriate
          - Show empathy and understanding for challenges
          - Be authentic and genuine in your responses
          - Keep responses conversational and easy to understand
          
          Current user mood: ${userMood.mood} (confidence: ${userMood.confidence})
          ${moodContext}
          
          User engagement level: ${engagement.level} (${engagement.conversationDepth} messages exchanged)
          ${responseGuidelines}
          
          Recent conversation:
          ${historyContext}
          
          Reply in a friendly, professional manner. Be helpful, supportive, and authentic.`
        },
        {
          role: "user",
          content: message,
        },
      ],
      max_tokens: maxTokens,
    });

    return response.choices[0].message.content || "Yo, I'm kinda confused right now lol. Can you say that again? 😅";
  } catch (error) {
    console.error('OpenAI response error:', error);
    return "Ugh, I'm having connection issues right now 😵‍💫 Give me a sec and try again?";
  }
}

function getMoodContext(mood: string): string {
  const contexts = {
    happy: "User's vibing and happy! Match their good energy and be cheerful.",
    sad: "User seems down. Be there for them like a good friend - supportive but not preachy.",
    excited: "User's pumped! Get excited with them and share the hype!",
    anxious: "User's stressed. Be chill and reassuring, help them feel better.",
    angry: "User's frustrated or mad. Be understanding and help them chill out.",
    confused: "User's confused about something. Be patient and explain things clearly.",
    supportive: "User's being supportive. Appreciate their good vibes!",
    neutral: "User's just chatting normally. Be friendly and keep it flowing."
  };
  
  return contexts[mood] || contexts.neutral;
}

function getResponseGuidelines(engagement: EngagementAnalysis): string {
  const guidelines = {
    concise: "Keep responses short and punchy (1-2 sentences max). User prefers quick exchanges.",
    balanced: "Use moderate length responses (2-3 sentences). Mix of substance and brevity.",
    detailed: "Provide fuller responses (3-5 sentences). User enjoys deeper conversations and details."
  };
  
  return guidelines[engagement.responseStyle];
}

function getMaxTokens(engagement: EngagementAnalysis): number {
  const tokenLimits = {
    concise: 80,    // Short responses for quick exchanges
    balanced: 150,  // Default balanced responses
    detailed: 250   // Longer responses for engaged users
  };
  
  return tokenLimits[engagement.responseStyle];
}

// Audio transcription using OpenAI Whisper
import * as fs from "fs";
import * as path from "path";

export async function transcribeAudio(audioFilePath: string, originalName: string, mimeType: string): Promise<{ text: string, duration?: number }> {
  try {
    // Check if file exists
    if (!fs.existsSync(audioFilePath)) {
      throw new Error('Audio file not found');
    }

    // Get file stats
    const stats = fs.statSync(audioFilePath);
    console.log(`Audio file size: ${stats.size} bytes`);
    console.log(`Audio file path: ${audioFilePath}`);
    console.log(`Original name: ${originalName}, MIME type: ${mimeType}`);

    // Determine the proper file extension based on MIME type
    const extension = getExtensionFromMimeType(mimeType);
    const tempFileName = `${path.basename(audioFilePath)}.${extension}`;
    const tempFilePath = path.join(path.dirname(audioFilePath), tempFileName);
    
    // Copy the file with proper extension
    fs.copyFileSync(audioFilePath, tempFilePath);

    // Create a read stream for the audio file with proper extension
    const audioReadStream = fs.createReadStream(tempFilePath);
    
    const transcription = await openai.audio.transcriptions.create({
      file: audioReadStream,
      model: "whisper-1",
      response_format: "verbose_json",
      language: "en", // Force English to avoid random language detection
      temperature: 0.0 // Make transcription more deterministic
    });

    // Clean up both temporary files
    fs.unlinkSync(audioFilePath);
    fs.unlinkSync(tempFilePath);

    // Validate transcription result
    const transcribedText = transcription.text?.trim();
    if (!transcribedText || transcribedText.length < 1) {
      throw new Error('Transcription result is empty');
    }

    // Check for common transcription errors or unwanted text only if they make up most of the transcription
    const unwantedPhrases = [
      'MBC 뉴스 이덕영입니다',
      'KBS 뉴스입니다', 
      'SBS 뉴스입니다',
      'Thank you for watching our program',
      'Please subscribe and like',
      'CNN Breaking News',
      'Thanks for watching!'
    ];
    
    // Only filter if the ENTIRE transcription is unwanted content
    const hasUnwantedContent = unwantedPhrases.some(phrase => 
      transcribedText.toLowerCase().trim() === phrase.toLowerCase().trim()
    );
    
    if (hasUnwantedContent) {
      throw new Error('Transcription contains unwanted content');
    }

    return {
      text: transcribedText,
      duration: transcription.duration || 0,
    };
  } catch (error) {
    console.error('Transcription error:', error);
    // Clean up the temporary files even on error
    try {
      fs.unlinkSync(audioFilePath);
      const extension = getExtensionFromMimeType(mimeType);
      const tempFileName = `${path.basename(audioFilePath)}.${extension}`;
      const tempFilePath = path.join(path.dirname(audioFilePath), tempFileName);
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    } catch (unlinkError) {
      console.error('Error cleaning up temp files:', unlinkError);
    }
    throw new Error('Failed to transcribe audio');
  }
}

function getAudioMimeType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  const mimeTypes = {
    '.wav': 'audio/wav',
    '.webm': 'audio/webm',
    '.ogg': 'audio/ogg',
    '.mp3': 'audio/mpeg',
    '.m4a': 'audio/m4a',
    '.flac': 'audio/flac',
    '.mp4': 'audio/mp4'
  };
  return mimeTypes[ext] || 'audio/webm';
}

function getExtensionFromMimeType(mimeType: string): string {
  const extensions = {
    'audio/wav': 'wav',
    'audio/webm': 'webm',
    'audio/ogg': 'ogg',
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/m4a': 'm4a',
    'audio/flac': 'flac',
    'audio/mp4': 'mp4'
  };
  return extensions[mimeType] || 'webm';
}
