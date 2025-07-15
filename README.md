# Tsie Masilo Bot - AI-Powered Chat Application

An advanced AI chatbot that delivers intelligent, personalized conversational experiences with dynamic user management and intelligent interaction features.

## 🚀 Features

### Core Functionality
- **AI-Powered Chat**: Integration with OpenAI GPT-4 for intelligent responses
- **Voice Messages**: WhatsApp-style voice recording with speech-to-text transcription
- **User-Specific Conversations**: Each user gets their own isolated conversation thread
- **Adaptive Response Length**: AI adjusts response length based on user engagement patterns
- **Mood Analysis**: Bot analyzes user sentiment and adapts responses accordingly
- **Real-time Communication**: WebSocket-based real-time messaging

### User Interface
- **WhatsApp-Style Design**: Familiar and intuitive chat interface
- **Dark/Light Mode**: Toggle between themes with persistent storage
- **Mobile Responsive**: Optimized for all device sizes
- **Emoji Support**: Full emoji picker with categorized selection
- **Typing Indicators**: Shows when the bot is typing responses
- **Compact Welcome Form**: Streamlined user onboarding

### Admin Features
- **Secret Admin Dashboard**: Access with "secretadminspy" login
- **Multi-User Monitoring**: View all user conversations in one interface
- **Contact List**: WhatsApp-style contact management
- **Conversation History**: Complete message history for each user

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for styling
- **shadcn/ui** components built on Radix UI
- **React Query** for server state management
- **Wouter** for lightweight routing

### Backend
- **Node.js** with Express.js
- **WebSocket Server** for real-time communication
- **PostgreSQL** with Drizzle ORM (Neon serverless)
- **OpenAI API** for GPT-4 and Whisper integration
- **Multer** for file upload handling

### AI Integration
- **OpenAI GPT-4** for natural language processing
- **OpenAI Whisper** for speech-to-text transcription
- **Mood Analysis** for emotional context understanding
- **Engagement Analysis** for adaptive response generation

## 🚦 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database (or Neon account)
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/tsiemasilo/tsiemasilochatbot.git
cd tsiemasilochatbot
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Create .env file with:
DATABASE_URL=your_postgresql_connection_string
OPENAI_API_KEY=your_openai_api_key
```

4. Set up the database:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## 🔧 Configuration

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: OpenAI API key for GPT-4 and Whisper
- `NODE_ENV`: Environment mode (development/production)

### Database Schema
The application uses PostgreSQL with the following main tables:
- `users`: User account information
- `messages`: Chat message history with user isolation

## 📱 Usage

### Regular Users
1. Enter your name in the welcome form
2. Start chatting with the AI bot
3. Use voice messages for speech-to-text functionality
4. Toggle between light and dark themes
5. Log out to switch users

### Admin Access
1. Enter "secretadminspy" as the username
2. Access the admin dashboard to monitor all conversations
3. View user contact list and message history
4. Switch between different user conversations

## 🎯 Key Features Explained

### Adaptive Response System
The bot analyzes user engagement patterns including:
- Message length preferences
- Conversation depth
- Interaction frequency
- Response style preferences

Based on this analysis, it adjusts:
- Response length (concise/balanced/detailed)
- Tone and complexity
- Emoji usage
- Conversation flow

### Voice Message Processing
1. User records voice message (minimum 1 second)
2. Audio is transcribed using OpenAI Whisper
3. Transcribed text is processed by GPT-4
4. Bot responds with contextual message
5. Original voice note is preserved in chat

### User Isolation
Each user name creates a separate conversation thread:
- Independent message history
- Personalized AI responses
- Isolated user preferences
- Fresh welcome experience for new users

## 🔒 Security Features

- Secret admin access code
- User input validation
- Secure WebSocket connections
- Environment variable protection
- Database query sanitization

## 📊 Architecture

The application follows a modern full-stack architecture:

```
Frontend (React) ↔ WebSocket ↔ Backend (Express)
                                      ↓
                              Database (PostgreSQL)
                                      ↓
                               AI Services (OpenAI)
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- OpenAI for GPT-4 and Whisper APIs
- Neon for serverless PostgreSQL
- Radix UI for accessible components
- Tailwind CSS for styling utilities

## 📞 Support

For support, please open an issue in the GitHub repository or contact the maintainer.

---

Built with ❤️ by Tsie Masilo