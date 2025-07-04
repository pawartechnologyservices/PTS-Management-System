
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/use-toast';
import { useChatStore } from '../../store/chatStore';
import UserList from './UserList';
import ChatWindow from './ChatWindow';
import { User } from '../../types/chat';

const ChatInterface = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const {
    messages,
    onlineUsers,
    typingUsers,
    currentChat,
    addMessage,
    editMessage,
    deleteMessage,
    setOnlineUsers,
    setTypingUser,
    setCurrentChat,
    getChatId
  } = useChatStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize online users (simulate some users being online)
  useEffect(() => {
    const allUsers = JSON.parse(localStorage.getItem('hrms_users') || '[]');
    const randomOnlineUsers = allUsers
      .filter((u: any) => u.id !== user?.id)
      .slice(0, Math.floor(Math.random() * 3) + 1)
      .map((u: any) => u.id);
    
    setOnlineUsers(randomOnlineUsers);
    
    // Simulate users going online/offline
    const interval = setInterval(() => {
      const onlineCount = Math.floor(Math.random() * allUsers.length / 2) + 1;
      const shuffled = allUsers.filter((u: any) => u.id !== user?.id).sort(() => 0.5 - Math.random());
      setOnlineUsers(shuffled.slice(0, onlineCount).map((u: any) => u.id));
    }, 30000); // Change every 30 seconds

    return () => clearInterval(interval);
  }, [user?.id, setOnlineUsers]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentChat]);

  // Handle user selection
  const handleUserSelect = (selectedUser: User) => {
    setSelectedUser(selectedUser);
    const chatId = getChatId(user!.id, selectedUser.id);
    setCurrentChat(chatId);
  };

  // Send message
  const sendMessage = (content: string, type: 'text' | 'image' | 'video' = 'text') => {
    if (!selectedUser || !user) return;

    const chatId = getChatId(user.id, selectedUser.id);
    const newMessage = {
      id: Date.now().toString(),
      senderId: user.id,
      receiverId: selectedUser.id,
      content,
      type,
      timestamp: new Date(),
      status: 'sent' as const,
      ...(type !== 'text' && { mediaUrl: content })
    };

    addMessage(chatId, newMessage);
    playNotificationSound();

    // Simulate message delivery and read status
    setTimeout(() => {
      editMessage(chatId, newMessage.id, content);
      // Update status to delivered then read
      setTimeout(() => {
        const updatedMessage = { ...newMessage, status: 'delivered' as const };
        setTimeout(() => {
          const readMessage = { ...updatedMessage, status: 'read' as const };
        }, 1000);
      }, 500);
    }, 100);
  };

  // Handle typing
  const handleTyping = (isTyping: boolean) => {
    if (!selectedUser || !user) return;
    const chatId = getChatId(user.id, selectedUser.id);
    setTypingUser(chatId, user.id, isTyping);
  };

  // Edit message
  const handleEditMessage = (messageId: string, newContent: string) => {
    if (!selectedUser || !user) return;
    const chatId = getChatId(user.id, selectedUser.id);
    editMessage(chatId, messageId, newContent);
  };

  // Delete message
  const handleDeleteMessage = (messageId: string, deleteForEveryone: boolean = false) => {
    if (!selectedUser || !user) return;
    const chatId = getChatId(user.id, selectedUser.id);
    deleteMessage(chatId, messageId, deleteForEveryone);
  };

  const playNotificationSound = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+PtwmYgBFqy4+Fzew==');
    audio.volume = 0.1;
    audio.play().catch(() => {});
  };

  const getCurrentChatMessages = () => {
    if (!selectedUser || !user) return [];
    const chatId = getChatId(user.id, selectedUser.id);
    return messages[chatId] || [];
  };

  const getCurrentTypingUsers = () => {
    if (!selectedUser || !user) return [];
    const chatId = getChatId(user.id, selectedUser.id);
    return typingUsers[chatId] || [];
  };

  return (
    <div className="flex h-full bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-200 bg-white flex-shrink-0">
        <UserList
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedUser={selectedUser}
          onUserSelect={handleUserSelect}
          onlineUsers={onlineUsers}
        />
      </div>
      
      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedUser ? (
          <ChatWindow
            selectedUser={selectedUser}
            messages={getCurrentChatMessages()}
            onSendMessage={sendMessage}
            onEditMessage={handleEditMessage}
            onDeleteMessage={handleDeleteMessage}
            onExitChat={() => {
              setSelectedUser(null);
              setCurrentChat(null);
            }}
            onTyping={handleTyping}
            typingUsers={getCurrentTypingUsers()}
            messagesEndRef={messagesEndRef}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 bg-gray-50">
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                <span className="text-4xl">💬</span>
              </div>
              <h3 className="text-lg font-medium mb-2 text-gray-700">WhatsApp Web</h3>
              <p className="text-gray-500 max-w-sm">
                Send and receive messages without keeping your phone online.<br />
                Use WhatsApp on up to 4 linked devices and 1 phone at the same time.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
