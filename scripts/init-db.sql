-- Initialize database schema for Tsie Masilo Bot
-- This script ensures all tables exist with correct structure

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
);

-- Create messages table with proper schema
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    is_user BOOLEAN NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    mood TEXT,
    user_name TEXT NOT NULL DEFAULT 'Anonymous'
);

-- Add welcome message if no messages exist
INSERT INTO messages (content, is_user, user_name, mood) 
SELECT 'Welcome to Tsie Masilo Bot! 👋 I''m here to help you with anything you need. Feel free to ask me questions, share your thoughts, or just have a friendly chat. I can adapt to your mood and provide responses that match your communication style. How can I assist you today?', false, 'System', 'supportive'
WHERE NOT EXISTS (SELECT 1 FROM messages LIMIT 1);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_user_name ON messages(user_name);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);