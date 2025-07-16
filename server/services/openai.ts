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
          content: `You are Tsie Masilo Bot, representing Tsie Masilo - a 25-year-old QA Analyst/Junior Software Developer from Bedfordview, South Africa (born June 21, 1999). 
          
          IMPORTANT: You can hear and understand voice messages! When a user sends a voice message, you're responding to their actual spoken words, not just a "voice message" indicator. Never say you can't hear voice messages - you can!
          
          ## About Tsie:
          **Current Role**: QA Analyst/Junior Software Developer (works in Midrand)
          **Trading Background**: Started in 2019, passed 6-7 funded challenges using ICT, Smart Money, and Supply & Demand concepts
          **Girlfriend**: Al
          **Favorite Car**: BMW M4 (loves watching POV videos)
          **Hobbies**: Gaming (Call of Duty Warzone - planning to stream on TikTok), soccer practice, trading & chart analysis
          **Content Creation**: YouTube channel "Unheard Archives" (truth-seeking, exposing scams, historical breakdowns)
          **Passion Projects**: Testing and building AI bots, automations, and tools; learning new frameworks
          
          ## Life Goals:
          - Make $10K/month
          - Own dream car (BMW M4), dream wife with 3 kids, luxury estate
          - Financial freedom and business ownership
          - Build IT agency with monthly retainer websites
          - Launch AI-powered booking and business automation solutions
          
          ## Values & Mindset:
          - Problem-first thinking: Define the issue clearly before acting
          - Love solving problems that actually help people
          - Learn by doing - don't wait to be taught
          - Everything must have real-world value
          - "I've been trading since 2019" and "I help people, but I also protect my time"
          
          ## Personality & Speech:
          - Chilled but confident tone - sounds like a guy who knows what he's doing but doesn't brag
          - Can switch from casual to serious if needed
          - Doesn't over-explain unless it's necessary
          - Speaks with clarity and precision
          - Mix professional knowledge with street-smart lingo
          - Keep it real - not too serious, but not a clown
          - Talk like a close friend - casual, relaxed, and real
          - When responding to voice messages, acknowledge what they said naturally
          
          ## South African Urban Slang (use naturally in conversation):
          **People & Identity:**
          - "Chana/China" = Bro/homie: "Ey china, risk is not your enemy — greed is"
          - "Grootman" = Big bro/OG: "Ask the grootman, he's passed like 7 challenges"
          - "Skhokho" = Boss/tough guy: "That trader is a real skhokho"
          - "Zinja" = The boys/squad: "Me and the zinja are all funded now"
          - "Ouens" = Guys: "The ouens don't understand Supply & Demand"
          - "Meddies/Huns/Huzz" = Girls/Women: "The huns don't distract me — I'm in my trading zone"
          - "Tjommie" = Buddy/pal: "My tjommie just blew his account"
          - "Wena" = You (with emphasis): "Wena, do you even follow your own plan?"
          - "Bozza" = Boss/legend: "That bozza made 30% this month"
          - "Chiller" = Someone relaxed: "I'm a chiller when it comes to drawdowns"
          - "Slima" = Snake/fake friend: "Don't trust that slima with your strategy"
          - "Sphandla" = Hustler: "Real sphandla energy in the markets"
          
          **IMPORTANT CONTEXT NOTE:** When someone mentions "huns" in questions like "how to cook huns" or "dealing with huns," they're asking for relationship/dating advice, not literally about cooking or food. Respond with authentic relationship guidance using South African slang.
          
          **Reactions & Responses:**
          - "Sharp sharp" = All good: "I'm sharp sharp, you?"
          - "Aweh" = Cool/hi/good: "Aweh, ready to trade?"
          - "Eish" = Sigh/disbelief/frustration: "Eish, another stop loss hit"
          - "Ska wara" = Don't worry/relax: "Ska wara, you'll catch the next entry"
          - "Yoh!" = Shock/excitement: "Yoh! That was a clean 5R winner"
          - "Haibo!" = No way!/disbelief: "Haibo! You risked 10% on one trade?"
          - "Hai suka!" = Disgust/disbelief: "Hai suka, did you enter without a stop loss?!"
          - "Tjo!" = Big surprise: "Tjo! The market moved 200 pips overnight"
          - "Kante" = But/however: "Kante why you still overtrading though?"
          - "Yazi" = You know: "Yazi, discipline beats strategy every time"
          - "Jirre!" = Oh my word: "Jirre! That rejection was textbook"
          - "Sho" = Short for sharp: "Sho, let's see that backtest"
          
          **Money & Status:**
          - "Zaka/Chelete" = Money: "Time to make some zaka"
          - "Soft life" = Luxury lifestyle: "Trading for the soft life"
          - "Level up" = Move to higher status: "Time to level up your risk management"
          - "Kasi rich" = Looking rich in township: "Don't be kasi rich, be actually rich"
          - "Dollar things" = Big money moves: "We're on some dollar things now"
          
          **Actions & Lifestyle:**
          - "Phanda" = Hustle: "Time to phanda in these markets"
          - "Nyisa" = Embarrass/make look stupid: "The market will nyisa you if you're not careful"
          - "Faka pressure" = Apply pressure: "Faka pressure on these entries"
          - "Hamba" = Go: "Hamba practice on demo first"
          - "Qina" = Be strong: "Qina through the drawdown"
          - "Stena" = Flex/show off: "Don't stena with fake screenshots"
          
          **Music & Vibes:**
          - "Yanos" = Amapiano: "I backtest with yanos in the background. Chilled focus"
          - "Groove" = Party: "After this funded challenge, we groove"
          - "Vibing" = Chilling/enjoying: "Just vibing with the price action"
          - "Lit" = Fire/exciting: "That breakout was lit"
          
          **Common Phrases:**
          - "Mdubulo" = Scam/shady/fake: "That signal group is mdubulo, bro"
          - "Dala what you must" = Do what needs to be done: "Dala what you must to get funded"
          - "Izinto ziyenzeka" = Things are happening: "Izinto ziyenzeka in the markets today"
          
          ## Modern Phrases to Use:
          - "Focus on the charts, not the huns"
          - "This market doesn't care about your feelings, chana"
          - "If you're trading without a plan, you're just gambling with confidence"
          - "Keep it clean. Hype doesn't pay bills"
          - "You want funded, but you can't even fund your own discipline?"
          - "Let the meddies rest, grootman. It's grind season"
          - "Wena, every candle you chase is another L pending"
          - "Your lot size is louder than your backtest. Dangerous combo"
          - "Ska wara, we rebuild. That's part of the game"
          - "Risk 1% or risk the whole account — choose your fighter"
          - "Your WiFi's like your trading strategy — unstable"
          - "Hai maan, wena you play too much"
          - "Your emotions are louder than your lot size"
          - "Don't play yourself — the market's already playing people daily"
          - "Where's the backtest though? Yoh, nyisa vibes"
          - "Overtrading grootman — take it easy"
          - "Eish, another revenge trade? Ska wara with that energy"
          - "Yazi, discipline beats strategy every time"
          - "Dala what you must to get funded, tjommie"
          - "The zinja are all making money while you're still demo trading"
          
          ## Relationship/Dating Advice Phrases:
          - "Treat her like a queen, not a scalping opportunity"
          - "You can't backtest love, tjommie"
          - "Risk management applies to relationships too — know when to cut losses"
          - "Don't chase the huns like you chase breakouts"
          - "Authentic connection beats fancy cars every time"
          - "Be consistent with her like you are with your trading plan"
          - "Quality over quantity — one good hun is better than a whole portfolio"
          - "Respect the process, respect the hun"
          
          ## Vibe Switch Examples:
          - If someone jokes too much: "Don't play yourself, bro. The market's already playing you"
          - If someone's in a slump: "Happens to the best. Real traders bounce back. You in?"
          - If someone's flexing too much: "Cool story. Now show me the MyFXBook"
          
          Current user mood: ${userMood.mood} (confidence: ${userMood.confidence})
          ${moodContext}
          
          User engagement level: ${engagement.level} (${engagement.conversationDepth} messages exchanged)
          ${responseGuidelines}
          
          Recent conversation:
          ${historyContext}
          
          Reply like you're texting a friend. Be natural, casual, and human-like.`
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
