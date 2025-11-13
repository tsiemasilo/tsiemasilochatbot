import OpenAI from "openai";

// Netlify environment configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const DEFAULT_MODEL = "gpt-4o";

export interface MoodAnalysis {
  mood: 'happy' | 'sad' | 'excited' | 'anxious' | 'neutral' | 'angry' | 'confused' | 'supportive';
  confidence: number;
  suggestedEmojis: string[];
}

export interface EngagementAnalysis {
  level: 'low' | 'medium' | 'high';
  messageLength: 'short' | 'medium' | 'long';
  responseStyle: 'concise' | 'balanced' | 'detailed';
  conversationDepth: number;
}

export async function analyzeMood(message: string): Promise<MoodAnalysis> {
  try {
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: "system",
          content: `You are a mood analysis expert. Analyze the emotional tone and sentiment of the user's message. 
          Respond with JSON in this exact format: {
            "mood": "happy|sad|excited|anxious|neutral|angry|confused|supportive",
            "confidence": 0.95,
            "suggestedEmojis": ["😊", "👍", "🎉"]
          }`
        },
        {
          role: "user",
          content: message
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 200
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      mood: result.mood || 'neutral',
      confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
      suggestedEmojis: result.suggestedEmojis || ['😊']
    };
  } catch (error) {
    console.error('Error analyzing mood:', error);
    return {
      mood: 'neutral',
      confidence: 0.5,
      suggestedEmojis: ['😊']
    };
  }
}

export function analyzeEngagement(
  messageHistory: Array<{ content: string; isUser: boolean; timestamp: Date }>,
  currentMessage: string
): EngagementAnalysis {
  const userMessages = messageHistory.filter(msg => msg.isUser);
  const avgMessageLength = userMessages.reduce((sum, msg) => sum + msg.content.length, 0) / (userMessages.length || 1);
  const currentMessageLength = currentMessage.length;
  
  // Determine engagement level
  let level: 'low' | 'medium' | 'high' = 'medium';
  if (userMessages.length > 10 && avgMessageLength > 50) {
    level = 'high';
  } else if (userMessages.length < 3 || avgMessageLength < 20) {
    level = 'low';
  }
  
  // Determine response style
  let responseStyle: 'concise' | 'balanced' | 'detailed' = 'balanced';
  if (currentMessageLength < 20) {
    responseStyle = 'concise';
  } else if (currentMessageLength > 100) {
    responseStyle = 'detailed';
  }
  
  return {
    level,
    messageLength: currentMessageLength < 30 ? 'short' : currentMessageLength > 80 ? 'long' : 'medium',
    responseStyle,
    conversationDepth: userMessages.length
  };
}

export async function generateResponse(
  message: string,
  userName: string,
  messageHistory: Array<{ content: string; isUser: boolean; timestamp: Date }>,
  userMood: MoodAnalysis
): Promise<string> {
  try {
    const engagement = analyzeEngagement(messageHistory, message);
    const moodContext = getMoodContext(userMood.mood);
    const responseGuidelines = getResponseGuidelines(engagement);
    const maxTokens = getMaxTokens(engagement);
    
    const conversationHistory = messageHistory.slice(-10).map(msg => ({
      role: msg.isUser ? 'user' : 'assistant',
      content: msg.content
    }));
    
    const systemPrompt = `You are Tsie Masilo Bot, a friendly and professional AI assistant representing Tsie Masilo - a 25-year-old QA Analyst and Junior Software Developer from South Africa.

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

Current user: ${userName}
User's current mood: ${userMood.mood} (confidence: ${userMood.confidence})

${moodContext}
${responseGuidelines}

Reply in a friendly, professional manner. Be helpful, supportive, and authentic.`;

    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        ...conversationHistory,
        { role: "user", content: message }
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
    });

    return response.choices[0].message.content || "I'm not sure how to respond to that. Can you try rephrasing?";
  } catch (error) {
    console.error('Error generating response:', error);
    return "I'm experiencing some technical difficulties. Please try again in a moment.";
  }
}

function getMoodContext(mood: string): string {
  const moodContexts = {
    happy: "The user seems happy and upbeat. Match their positive energy and be enthusiastic.",
    sad: "The user appears to be feeling down. Be empathetic, supportive, and gentle in your response.",
    excited: "The user is excited about something. Share in their enthusiasm and ask engaging questions.",
    anxious: "The user seems anxious or worried. Be reassuring, calm, and provide comfort.",
    neutral: "The user has a neutral tone. Be friendly and helpful without being overly emotional.",
    angry: "The user seems frustrated or angry. Be calm, understanding, and try to defuse the situation.",
    confused: "The user appears confused. Be clear, helpful, and provide explanations.",
    supportive: "The user is being supportive. Acknowledge their kindness and reciprocate the positive energy."
  };
  
  return moodContexts[mood] || moodContexts.neutral;
}

function getResponseGuidelines(engagement: EngagementAnalysis): string {
  const guidelines = {
    concise: "Keep responses brief and to the point. 1-2 sentences maximum.",
    balanced: "Provide a well-rounded response. 2-3 sentences with good detail.",
    detailed: "Give a comprehensive response. 3-4 sentences with examples and explanations."
  };
  
  return guidelines[engagement.responseStyle];
}

function getMaxTokens(engagement: EngagementAnalysis): number {
  const tokenLimits = {
    concise: 100,
    balanced: 200,
    detailed: 300
  };
  
  return tokenLimits[engagement.responseStyle];
}

export async function transcribeAudio(audioFilePath: string, originalName: string, mimeType: string): Promise<{ text: string, duration?: number }> {
  try {
    const fs = await import('fs');
    const audioReadStream = fs.createReadStream(audioFilePath);

    const transcription = await openai.audio.transcriptions.create({
      file: audioReadStream,
      model: "whisper-1",
    });

    return {
      text: transcription.text,
      duration: transcription.duration || 0,
    };
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw new Error('Failed to transcribe audio');
  }
}