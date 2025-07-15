# Tsie Masilo Bot - AI-Powered Chat Application

## Overview

This is a full-stack real-time chat application built with React (frontend), Express.js (backend), and WebSocket communication. The application features an AI-powered chatbot that can analyze user mood and provide contextual responses with voice recording capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: React Query (@tanstack/react-query) for server state
- **Routing**: Wouter for lightweight client-side routing
- **Real-time Communication**: WebSocket API for bidirectional communication

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Real-time**: WebSocket Server (ws library) for chat functionality
- **AI Integration**: OpenAI GPT-4 API for natural language processing and mood analysis
- **Database**: PostgreSQL with Drizzle ORM (using Neon serverless database)
- **File Upload**: Multer for handling voice message uploads

## Key Components

### Real-time Chat System
- **WebSocket Integration**: Bidirectional communication between client and server
- **Message Broadcasting**: Real-time message delivery with typing indicators
- **Connection Management**: Automatic reconnection and connection state tracking
- **Voice Recording**: Speech-to-text transcription using OpenAI Whisper API

### AI-Powered Features
- **Mood Analysis**: Uses OpenAI GPT-4 to analyze user sentiment and emotional state
- **Contextual Responses**: Bot responses consider conversation history and user mood
- **Voice Message Processing**: Converts audio messages to text and generates contextual responses
- **Emoji Suggestions**: AI provides relevant emoji suggestions based on mood analysis

### User Interface Components
- **WelcomePrompt**: WhatsApp-style name collection screen that appears before users can access the chat
- **ChatInterface**: Main chat container with message display and input controls
- **MessageBubble**: Individual message components with timestamps and status indicators
- **EmojiPicker**: Emoji selection interface with categorized emojis
- **TypingIndicator**: Shows when the bot is typing a response
- **Theme Toggle**: Dark/light mode switching with persistent storage

## Data Flow

1. **User Onboarding**: WhatsApp-style name prompt collects user information and stores in localStorage
2. **User-Specific Conversations**: Each user name creates a separate conversation thread with isolated message history
3. **User Input**: Messages are captured from the input field or voice recording
4. **WebSocket Transmission**: Real-time message sending through WebSocket connection with user identification
5. **AI Processing**: OpenAI GPT-4 analyzes mood and generates responses based on user-specific conversation history
6. **Database Storage**: Messages are persisted in PostgreSQL with userName field for conversation isolation
7. **Real-time Updates**: All clients receive updates through WebSocket broadcasts

## External Dependencies

### AI Services
- **OpenAI GPT-4**: For natural language processing and mood analysis
- **OpenAI Whisper**: For voice-to-text transcription
- **API Key**: Required environment variable for OpenAI services

### Database
- **Neon PostgreSQL**: Serverless PostgreSQL database
- **Connection String**: DATABASE_URL environment variable required

### UI Libraries
- **Radix UI**: Accessible UI primitives for all components
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library for UI elements

## Deployment Strategy

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (Neon)
- `OPENAI_API_KEY` or `API_KEY`: OpenAI API authentication
- `NODE_ENV`: Environment mode (development/production)

### Build Process
1. **Frontend**: Vite builds React app to `dist/public`
2. **Backend**: ESBuild bundles Node.js server to `dist/index.js`
3. **Database**: Drizzle migrations applied with `db:push`

### Production Considerations
- WebSocket server runs on same port as Express server
- Static files served from `dist/public` directory
- Database migrations managed through Drizzle Kit
- Error handling and logging implemented for production stability
- User-specific conversation isolation ensures privacy and personalized experience

### Recent Changes (July 2025)

#### Netlify Chat Functionality Fix (July 15, 2025)
- **Issue**: WebSocket connections failing on Netlify causing chat interface to block user input
- **Root Cause**: Serverless functions don't support persistent WebSocket connections
- **Solution**: Updated `useWebSocket.ts` hook to detect platform and use appropriate communication method
- **Key Changes**:
  - Netlify deployment uses HTTP API calls to `/.netlify/functions/chat`
  - Local development maintains WebSocket functionality for real-time communication
  - Fixed API payload format to match serverless function expectations
  - Added proper voice transcription handling for both platforms
- **Result**: Chat interface now works seamlessly on both Replit and Netlify
- **Admin Dashboard**: Previously fixed with `admin.ts` and `admin-messages.ts` functions

#### Profile Picture and Database Viewer Update (July 15, 2025)
- **Profile Picture**: Updated to use new professional image provided by user
- **Database Viewer**: Added new `/database` route with comprehensive database viewing interface
- **Database Status**: Confirmed 31 messages stored across multiple users with full functionality
- **New Features**: 
  - Interactive database statistics dashboard
  - Real-time message viewing with mood analysis
  - User activity tracking and analytics
  - Voice message identification and counting
- **Database Queries**: Created `database-queries.sql` file with 8 ready-to-use SQL queries
- **Access**: Database viewer available at `/database` route for easy data inspection

### Original Recent Changes

#### WebSocket Fix for Netlify Deployment (July 15, 2025)
- **Issue**: WebSocket connections failing on Netlify (serverless functions don't support persistent connections)
- **Solution**: Implemented hybrid approach:
  - Local development: Uses WebSocket for real-time communication  
  - Netlify deployment: Uses HTTP API calls with simulated typing indicators
- **New Files**: 
  - `src/functions/chat.ts` - HTTP-based chat API for Netlify
  - `src/functions/messages.ts` - Message retrieval API for Netlify
  - `src/functions/services/openai.ts` - OpenAI service for serverless functions
- **Modified Files**:
  - `client/src/hooks/useWebSocket.ts` - Added Netlify detection and HTTP fallback
  - `netlify.toml` - Updated redirects for new chat endpoints
  - `build-netlify.sh` - Added Netlify functions build step
- **Result**: Chat functionality now works on both Replit (WebSocket) and Netlify (HTTP API)

### Original Recent Changes
- **User-Specific Conversations**: Each user name now creates a separate conversation thread with isolated message history
- **Storage Layer Updates**: Modified IStorage interface to support user-specific message retrieval
- **API Updates**: Updated /api/messages endpoint to accept userName parameter for conversation isolation
- **Admin Dashboard**: Fixed date formatting issues and added proper user conversation tracking
- **Fresh Start Experience**: New users get their own welcome message and conversation history
- **Adaptive Response Length**: AI now analyzes user engagement patterns to adjust response length (short/medium/long)
- **Logout Functionality**: Added logout button to chat interface for easy user switching
- **Engagement Analysis**: Bot adapts response style based on user message patterns and conversation depth
- **Netlify Deployment Fixes**: Resolved all build issues including missing UI components, serverless function conflicts, and directory structure problems
- **GitHub Repository Updated**: All code synced to https://github.com/tsiemasilo/tsiemasilochatbot with complete deployment configuration
- **Database Configuration**: Updated to use Netlify-specific database URLs with automatic schema migrations
- **Production Ready**: Added _redirects file, favicon, robust build script, and comprehensive error handling for successful deployment
- **Advanced Debugging System**: Added comprehensive debugging and logging features to identify deployment issues
- **Build Process Optimization**: Created fast build script with 30-second timeouts and comprehensive fallbacks
- **Deployment Troubleshooting**: Identified and resolved npm package-lock.json sync issues causing deployment failures
- **Multi-Layer Fallbacks**: Added progressive fallback system for Vite build failures and function build issues
- **Professional Loading Pages**: Created polished loading/deployment pages with auto-refresh functionality
- **Deployment Success**: Site is now live at tsiemasilochatbot.netlify.app with professional loading interface
- **Build Process Fixed**: Resolved Vite module resolution issues and optimized build command structure
- **Zero-Downtime Deployment**: Implemented seamless fallback system ensuring site is always accessible
- **Production Build Solution**: Created build-netlify.sh script that properly installs dev dependencies for Vite build
- **Automatic Deployment**: GitHub integration active - pushes trigger automatic Netlify rebuilds with full React app

### Development Setup
- Hot reload enabled through Vite dev server
- WebSocket connection automatically configured for local development
- TypeScript compilation with strict mode enabled
- Path aliases configured for clean imports (@/, @shared/)