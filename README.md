# Tsie Masilo AI Chat Application

A professional full-stack real-time chat application built with modern web technologies. Features an intelligent AI chatbot with mood analysis, voice message support, and comprehensive admin dashboard.

## 🚀 Features

### Core Functionality
- **Real-time Chat**: WebSocket-powered bidirectional communication
- **AI Integration**: GPT-4 powered responses with mood analysis
- **Voice Messages**: Voice-to-text transcription using OpenAI Whisper
- **User Management**: Multi-user support with conversation isolation
- **Admin Dashboard**: Real-time user monitoring and message statistics

### Technical Features
- **TypeScript**: Full type safety across frontend and backend
- **Database**: PostgreSQL with Drizzle ORM for data persistence
- **Real-time Updates**: WebSocket connections for instant messaging
- **Responsive Design**: Mobile-first UI with dark/light mode support
- **Professional UI**: shadcn/ui components with Tailwind CSS

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for responsive styling
- **shadcn/ui** for accessible UI components
- **React Query** for efficient server state management
- **Wouter** for lightweight client-side routing

### Backend
- **Node.js** with Express.js
- **TypeScript** for type-safe server code
- **WebSocket** for real-time communication
- **PostgreSQL** with Drizzle ORM
- **OpenAI API** for AI responses and voice transcription
- **Multer** for file upload handling

## 🔧 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL database
- OpenAI API key

### Environment Variables
Create a `.env` file with the following variables:

```env
DATABASE_URL=postgresql://username:password@host:port/database
OPENAI_API_KEY=your_openai_api_key_here
NODE_ENV=development
```

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tsie-masilo-chat
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   ```bash
   npm run db:push
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5000`

## 📁 Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Application pages
│   │   ├── lib/           # Utility libraries
│   │   └── App.tsx        # Main application component
├── server/                # Express backend
│   ├── services/          # Business logic services
│   ├── db.ts             # Database configuration
│   ├── storage.ts        # Data access layer
│   ├── routes.ts         # API routes and WebSocket
│   └── index.ts          # Server entry point
├── shared/               # Shared types and schemas
│   └── schema.ts         # Database schema definitions
└── src/                  # Serverless functions
    └── functions/        # API endpoints for deployment
```

## 🎯 Usage

### Main Chat Interface
- Navigate to `/` for the main chat interface
- Enter your name to start chatting
- Send text messages or voice recordings
- AI responds with mood-aware, contextual messages

### Admin Dashboard
- Navigate to `/admin` and enter password: `secretadminspy`
- View all users and their conversation statistics
- Monitor real-time message activity
- Access user-specific conversation history

### Database Statistics
- Navigate to `/database` for real-time database statistics
- View message counts, user activity, and system metrics
- Monitor application performance and usage

## 🔐 Security Features

- **Environment Variables**: Secure API key management
- **Input Validation**: Comprehensive data validation using Zod
- **File Upload Security**: Restricted file types and size limits
- **Admin Authentication**: Password-protected admin areas
- **SQL Injection Prevention**: Parameterized queries with Drizzle ORM

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

### Database Migration
```bash
npm run db:push
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support or questions, please open an issue in the repository.

---

Built with ❤️ using modern web technologies