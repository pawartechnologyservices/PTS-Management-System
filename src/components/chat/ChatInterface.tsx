
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/use-toast';
import UserList from './UserList';
import ChatWindow from './ChatWindow';
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

const ChatInterface = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load messages from localStorage
  useEffect(() => {
    if (selectedUser) {
      const chatKey = `chat_${[user?.id, selectedUser.id].sort().join('_')}`;
      const savedMessages = localStorage.getItem(chatKey);
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      } else {
        setMessages([]);
      }
    }
  }, [selectedUser, user?.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Save messages to localStorage
  const saveMessages = (newMessages: Message[]) => {
    if (selectedUser) {
      const chatKey = `chat_${[user?.id, selectedUser.id].sort().join('_')}`;
      localStorage.setItem(chatKey, JSON.stringify(newMessages));
    }
  };

  const sendMessage = (content: string, type: 'text' | 'image' | 'video' = 'text') => {
    if (!selectedUser || !user) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: user.id,
      receiverId: selectedUser.id,
      content,
      type,
      timestamp: new Date(),
      status: 'sent'
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    saveMessages(updatedMessages);

    // Play notification sound
    playNotificationSound();
  };

  const editMessage = (messageId: string, newContent: string) => {
    const updatedMessages = messages.map(msg =>
      msg.id === messageId ? { ...msg, content: newContent, edited: true } : msg
    );
    setMessages(updatedMessages);
    saveMessages(updatedMessages);
  };

  const deleteMessage = (messageId: string, deleteForEveryone: boolean = false) => {
    const updatedMessages = messages.map(msg =>
      msg.id === messageId ? { ...msg, deleted: true, content: deleteForEveryone ? 'This message was deleted' : '' } : msg
    );
    setMessages(updatedMessages);
    saveMessages(updatedMessages);
  };

  const playNotificationSound = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+PtwmYgBFqy4+Fzew==');
    audio.volume = 0.1;
    audio.play().catch(() => {});
  };

  return (
    <div className="flex h-full bg-gray-50">
      <div className="w-80 border-r border-gray-200 bg-white">
        <UserList
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedUser={selectedUser}
          onUserSelect={setSelectedUser}
          onlineUsers={onlineUsers}
        />
      </div>
      
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <ChatWindow
            selectedUser={selectedUser}
            messages={messages}
            onSendMessage={sendMessage}
            onEditMessage={editMessage}
            onDeleteMessage={deleteMessage}
            onExitChat={() => setSelectedUser(null)}
            typingUsers={typingUsers}
            messagesEndRef={messagesEndRef}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                💬
              </div>
              <h3 className="text-lg font-medium mb-2">Start a conversation</h3>
              <p>Select a user from the sidebar to begin chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
