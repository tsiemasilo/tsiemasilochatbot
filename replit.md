# Tsie Masilo Bot - AI-Powered Chat Application

## Overview

This project is a full-stack, real-time AI-powered chat application. It combines React for the frontend, Express.js for the backend, and WebSocket for real-time communication. The core functionality includes an AI chatbot capable of analyzing user mood, providing contextual responses, and processing voice messages. The application aims to deliver a professional, friendly, and engaging conversational experience with a South African urban flair, focusing on financial freedom, tech, and trading.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS
- **State Management**: React Query (`@tanstack/react-query`)
- **Routing**: Wouter
- **Real-time Communication**: WebSocket API for Replit environment, HTTP API for serverless environments (Netlify)

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (ES modules)
- **Real-time**: WebSocket Server (`ws` library)
- **AI Integration**: OpenAI GPT-4 for NLP and mood analysis, OpenAI Whisper for speech-to-text
- **Database**: PostgreSQL with Drizzle ORM (using Neon serverless database)
- **File Upload**: Multer for voice message uploads

### Key Features
- **Real-time Chat System**: Bidirectional WebSocket communication, message broadcasting, typing indicators, connection management.
- **AI-Powered Features**: Mood analysis, contextual responses based on conversation history, voice message processing, and emoji suggestions.
- **User Interface Components**: WhatsApp-style name prompt, ChatInterface, MessageBubble, EmojiPicker, TypingIndicator, Theme Toggle.
- **Data Flow**: User onboarding, user-specific conversations, WebSocket transmission, AI processing, PostgreSQL storage, real-time updates.
- **AI Personality**: Tsie Masilo, a 25-year-old QA Analyst/Junior Software Developer from Bedfordview, South Africa. Knowledgeable in trading (ICT, Smart Money, Supply & Demand), gaming, content creation, and AI bot building. Personality is chilled but confident, using professional knowledge with street-smart lingo and South African urban slang where appropriate, but adapted to a friendly and professional tone for the primary AI responses.

### UI/UX Decisions
- **Mobile Optimization**: Designed with a mobile-first approach, targeting a custom viewport (390×700px) with touch-friendly components and iOS optimizations.
- **Theming**: Dark/light mode with persistent storage.
- **WhatsApp-style UI**: Familiar interface for user comfort and ease of use.

### Technical Implementations
- **Environment Configuration**: Vite configured for Replit's proxy environment (host `0.0.0.0`, port `5000`, HMR client port `443`).
- **Database Schema**: `users`, `messages`, `user_stats` tables managed via Drizzle ORM.
- **Deployment Strategy**: Replit uses VM type for WebSocket persistence. Netlify deployment uses serverless functions for HTTP API communication.
- **Secure API Key Management**: API keys are stored in Replit Secrets.

## External Dependencies

### AI Services
- **OpenAI GPT-4**: For natural language processing, contextual responses, and mood analysis.
- **OpenAI Whisper**: For speech-to-text transcription of voice messages.

### Database
- **Neon PostgreSQL**: Serverless PostgreSQL database for message and user data persistence.

### UI Libraries
- **Radix UI**: Provides accessible and unstyled UI primitives.
- **Tailwind CSS**: Utility-first CSS framework for styling.
- **Lucide React**: Icon library.