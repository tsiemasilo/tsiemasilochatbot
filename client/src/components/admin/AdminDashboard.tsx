/**
 * Admin Dashboard Component
 * 
 * Secret admin interface for viewing all user conversations with the AI bot.
 * Features WhatsApp-style contact list and chat view functionality.
 */

import { useState, useEffect } from 'react';
import { Search, User, MessageCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Message {
  id: number;
  content: string;
  isUser: boolean;
  timestamp: Date;
  userName: string;
}

interface Contact {
  userName: string;
  lastMessage: string;
  lastActivity: Date;
  messageCount: number;
}

export function AdminDashboard() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Load contacts list
  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      // Check if we're on Netlify or local development
      const isNetlify = window.location.hostname.includes('netlify.app');
      const endpoint = isNetlify ? '/.netlify/functions/admin' : '/api/contacts';
      
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        const contactsWithDates = data.map((contact: any) => ({
          ...contact,
          lastActivity: new Date(contact.lastActivity)
        }));
        setContacts(contactsWithDates);
      } else {
        console.error('Failed to fetch contacts:', response.status);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserMessages = async (userName: string) => {
    try {
      // Check if we're on Netlify or local development
      const isNetlify = window.location.hostname.includes('netlify.app');
      const endpoint = isNetlify 
        ? `/.netlify/functions/admin-messages?userName=${encodeURIComponent(userName)}`
        : `/api/admin/messages/${encodeURIComponent(userName)}`;
      
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        const messagesWithDates = data.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(messagesWithDates);
      } else {
        console.error('Failed to fetch user messages:', response.status);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleContactSelect = (userName: string) => {
    setSelectedContact(userName);
    fetchUserMessages(userName);
  };

  const filteredContacts = contacts.filter(contact =>
    contact.userName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      return 'Invalid time';
    }
    
    return dateObj.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
    
    if (messageDate.getTime() === today.getTime()) {
      return formatTime(dateObj);
    } else if (messageDate.getTime() === today.getTime() - 24 * 60 * 60 * 1000) {
      return 'Yesterday';
    } else {
      return dateObj.toLocaleDateString();
    }
  };

  if (selectedContact) {
    return (
      <div className="flex flex-col h-screen max-w-4xl mx-auto bg-white dark:bg-gray-900">
        {/* Chat Header */}
        <div className="bg-green-600 dark:bg-green-700 px-4 py-3 flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedContact(null)}
            className="text-white hover:text-green-100 p-1"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="text-white">
              <h2 className="font-semibold">{selectedContact}</h2>
              <p className="text-sm text-green-100">
                {messages.length} messages • Admin View
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex",
                message.isUser ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[70%] rounded-2xl px-4 py-2 shadow-sm",
                  message.isUser
                    ? "bg-green-500 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700"
                )}
              >
                <p className="text-sm">{message.content}</p>
                <p className={cn(
                  "text-xs mt-1",
                  message.isUser ? "text-green-100" : "text-gray-500 dark:text-gray-400"
                )}>
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="bg-green-600 dark:bg-green-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = '/'}
              className="text-white hover:text-green-100 p-1 mr-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div className="text-white">
              <h1 className="font-semibold text-lg">Admin Dashboard</h1>
              <p className="text-sm text-green-100">
                {contacts.length} conversations • Secret Access
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="text-gray-500 dark:text-gray-400">Loading contacts...</div>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <MessageCircle className="w-12 h-12 mb-2 opacity-50" />
            <p>No conversations found</p>
          </div>
        ) : (
          filteredContacts.map((contact) => (
            <div
              key={contact.userName}
              onClick={() => handleContactSelect(contact.userName)}
              className="flex items-center space-x-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer border-b border-gray-100 dark:border-gray-800"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                    {contact.userName}
                  </h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(contact.lastActivity)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {contact.lastMessage}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <MessageCircle className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {contact.messageCount} messages
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}