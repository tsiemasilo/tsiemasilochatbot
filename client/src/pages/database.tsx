import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: number;
  content: string;
  isUser: boolean;
  timestamp: Date;
  mood?: string;
  userName: string;
}

export default function Database() {
  const { data: messages, isLoading } = useQuery({
    queryKey: ['/api/messages'],
    select: (data: any[]) => data.map(msg => ({
      ...msg,
      timestamp: new Date(msg.timestamp)
    })) as Message[]
  });

  const { data: contacts } = useQuery({
    queryKey: ['/api/contacts']
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading database...</p>
        </div>
      </div>
    );
  }

  const totalMessages = messages?.length || 0;
  const totalUsers = contacts?.length || 0;
  const aiResponses = messages?.filter(m => !m.isUser).length || 0;
  const voiceMessages = messages?.filter(m => m.content.includes('Voice message')).length || 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Database Viewer
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View all conversations and database statistics
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{totalMessages}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Active Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                AI Responses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{aiResponses}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Voice Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{voiceMessages}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Messages */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Messages</CardTitle>
              <CardDescription>Latest conversations across all users</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                {messages?.slice(0, 50).map((message) => (
                  <div key={message.id} className="mb-4 p-3 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={message.isUser ? "default" : "secondary"}>
                          {message.isUser ? "User" : "AI"}
                        </Badge>
                        <span className="text-sm font-medium">{message.userName}</span>
                        {message.mood && (
                          <Badge variant="outline" className="text-xs">
                            {message.mood}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {message.content.length > 100 
                        ? `${message.content.substring(0, 100)}...` 
                        : message.content}
                    </p>
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* User Activity */}
          <Card>
            <CardHeader>
              <CardTitle>User Activity</CardTitle>
              <CardDescription>Message counts by user</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                {contacts?.map((contact: any, index: number) => (
                  <div key={index} className="mb-4 p-3 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{contact.userName}</span>
                      <Badge>{contact.messageCount} messages</Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Last message: {contact.lastMessage.length > 50 
                        ? `${contact.lastMessage.substring(0, 50)}...` 
                        : contact.lastMessage}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(contact.lastActivity), { addSuffix: true })}
                    </p>
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}