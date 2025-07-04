
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  MoreVertical,
  Search,
  Phone,
  Video,
  Image as ImageIcon
} from 'lucide-react';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { useAuth } from '../../hooks/useAuth';
import { useChatStore } from '../../store/chatStore';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import MediaGallery from './MediaGallery';
import { User } from '../../types/chat';
import { Message } from '../../store/chatStore';

interface ChatWindowProps {
  selectedUser: User;
  messages: Message[];
  onSendMessage: (content: string, type?: 'text' | 'image' | 'video') => void;
  onEditMessage: (messageId: string, newContent: string) => void;
  onDeleteMessage: (messageId: string, deleteForEveryone?: boolean) => void;
  onExitChat: () => void;
  onTyping: (isTyping: boolean) => void;
  typingUsers: string[];
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  selectedUser,
  messages,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onExitChat,
  onTyping,
  typingUsers,
  messagesEndRef
}) => {
  const { user: currentUser } = useAuth();
  const { onlineUsers } = useChatStore();
  const [showMediaGallery, setShowMediaGallery] = useState(false);

  const isOnline = onlineUsers.includes(selectedUser.id);
  const isTyping = typingUsers.includes(selectedUser.id);

  const formatDateSeparator = (timestamp: Date) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  // Group messages by date
  const groupedMessages = messages.reduce((acc, message) => {
    const dateKey = new Date(message.timestamp).toDateString();
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(message);
    return acc;
  }, {} as Record<string, Message[]>);

  const startEdit = (message: Message) => {
    // Handle edit functionality
    const newContent = prompt('Edit message:', message.content);
    if (newContent && newContent !== message.content) {
      onEditMessage(message.id, newContent);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onExitChat}
            className="lg:hidden"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="relative">
            <Avatar className="w-10 h-10">
              <AvatarImage src={selectedUser.profileImage} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                {selectedUser.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            {isOnline && (
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{selectedUser.name}</h3>
            <p className="text-sm text-gray-600">
              {isTyping ? 'typing...' : isOnline ? 'online' : 'last seen recently'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="text-gray-600">
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-600">
            <Phone className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-600">
            <Video className="h-5 w-5" />
          </Button>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="text-gray-600">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2">
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setShowMediaGallery(true)}
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  View Media
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-red-600 hover:text-red-700"
                >
                  Clear Chat
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Messages Container */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f0f0f0' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      >
        {Object.entries(groupedMessages).length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                <span className="text-3xl">💬</span>
              </div>
              <p>Start a conversation with {selectedUser.name}</p>
            </div>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([dateKey, dayMessages]) => (
            <div key={dateKey}>
              {/* Date separator */}
              <div className="text-center mb-4">
                <div className="inline-block bg-white/80 backdrop-blur-sm text-gray-600 text-xs px-3 py-1 rounded-full shadow-sm border">
                  {formatDateSeparator(new Date(dateKey))}
                </div>
              </div>
              
              {/* Messages for this day */}
              <div className="space-y-1">
                {dayMessages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwn={message.senderId === currentUser?.id}
                    onEdit={startEdit}
                    onDelete={onDeleteMessage}
                    user={message.senderId === currentUser?.id ? currentUser : selectedUser}
                  />
                ))}
              </div>
            </div>
          ))
        )}
        
        {/* Typing indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-2 max-w-xs">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <MessageInput
        onSendMessage={onSendMessage}
        onTyping={onTyping}
        placeholder={`Message ${selectedUser.name}...`}
      />

      {/* Media Gallery Modal */}
      <MediaGallery
        messages={messages}
        isOpen={showMediaGallery}
        onClose={() => setShowMediaGallery(false)}
      />
    </div>
  );
};

export default ChatWindow;
