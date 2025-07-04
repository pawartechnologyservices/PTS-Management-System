
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Send, 
  Image, 
  Video, 
  MoreVertical,
  Edit3,
  Trash2,
  Info
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { useAuth } from '../../hooks/useAuth';
import MessageBubble from './MessageBubble';
import { User } from '../../types/chat';

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: 'text' | 'image' | 'video';
  timestamp: Date;
  edited?: boolean;
  deleted?: boolean;
  status: 'sent' | 'delivered' | 'read';
}

interface ChatWindowProps {
  selectedUser: User;
  messages: Message[];
  onSendMessage: (content: string, type?: 'text' | 'image' | 'video') => void;
  onEditMessage: (messageId: string, newContent: string) => void;
  onDeleteMessage: (messageId: string, deleteForEveryone?: boolean) => void;
  onExitChat: () => void;
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
  typingUsers,
  messagesEndRef
}) => {
  const { user: currentUser } = useAuth();
  const [messageInput, setMessageInput] = useState('');
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      if (editingMessage) {
        onEditMessage(editingMessage, messageInput);
        setEditingMessage(null);
      } else {
        onSendMessage(messageInput);
      }
      setMessageInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = (type: 'image' | 'video') => {
    const input = type === 'image' ? fileInputRef.current : videoInputRef.current;
    if (input) {
      input.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        onSendMessage(reader.result as string, type);
      };
      reader.readAsDataURL(file);
    }
  };

  const startEdit = (message: Message) => {
    setEditingMessage(message.id);
    setMessageInput(message.content);
  };

  const cancelEdit = () => {
    setEditingMessage(null);
    setMessageInput('');
  };

  const formatMessageTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

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
      return date.toLocaleDateString();
    }
  };

  const groupedMessages = messages.reduce((acc, message) => {
    const dateKey = new Date(message.timestamp).toDateString();
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(message);
    return acc;
  }, {} as Record<string, Message[]>);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onExitChat}
              className="md:hidden"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Avatar className="w-10 h-10">
              <AvatarImage src={selectedUser.profileImage} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                {selectedUser.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-gray-900">{selectedUser.name}</h3>
              <p className="text-sm text-gray-600">
                {typingUsers.includes(selectedUser.id) ? 'Typing...' : 'Online'}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onExitChat}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Object.entries(groupedMessages).map(([dateKey, dayMessages]) => (
          <div key={dateKey}>
            {/* Date separator */}
            <div className="text-center">
              <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                {formatDateSeparator(new Date(dateKey))}
              </span>
            </div>
            
            {/* Messages for this day */}
            <div className="space-y-2 mt-4">
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
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-end gap-3">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleFileUpload('image')}
              className="text-gray-500 hover:text-blue-600"
            >
              <Image className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleFileUpload('video')}
              className="text-gray-500 hover:text-blue-600"
            >
              <Video className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="flex-1 relative">
            <Input
              placeholder={editingMessage ? "Edit message..." : "Type a message..."}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pr-12"
            />
            {editingMessage && (
              <Button
                variant="ghost"
                size="sm"
                onClick={cancelEdit}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs"
              >
                Cancel
              </Button>
            )}
          </div>
          
          <Button
            onClick={handleSendMessage}
            disabled={!messageInput.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png"
        onChange={(e) => handleFileChange(e, 'image')}
        className="hidden"
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/mp4"
        onChange={(e) => handleFileChange(e, 'video')}
        className="hidden"
      />
    </div>
  );
};

export default ChatWindow;
