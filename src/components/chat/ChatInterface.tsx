
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
    getChatId,
    playNotificationSound
  } = useChatStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize online users and simulate real-time presence
  useEffect(() => {
    const allUsers = JSON.parse(localStorage.getItem('hrms_users') || '[]');
    const otherUsers = allUsers.filter((u: any) => u.id !== user?.id);
    
    // Initially set some users as online
    const initialOnlineUsers = otherUsers
      .slice(0, Math.floor(Math.random() * otherUsers.length / 2) + 1)
      .map((u: any) => u.id);
    
    setOnlineUsers(initialOnlineUsers);
    
    // Simulate users going online/offline every 30 seconds
    const presenceInterval = setInterval(() => {
      const onlineCount = Math.floor(Math.random() * otherUsers.length / 2) + 1;
      const shuffled = [...otherUsers].sort(() => 0.5 - Math.random());
      setOnlineUsers(shuffled.slice(0, onlineCount).map((u: any) => u.id));
    }, 30000);

    return () => clearInterval(presenceInterval);
  }, [user?.id, setOnlineUsers]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, currentChat]);

  // Handle user selection
  const handleUserSelect = (selectedUser: User) => {
    setSelectedUser(selectedUser);
    const chatId = getChatId(user!.id, selectedUser.id);
    setCurrentChat(chatId);
  };

  // Send message with improved delivery simulation
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

    // Simulate realistic message delivery statuses
    setTimeout(() => {
      const updatedMessage = { ...newMessage, status: 'delivered' as const };
      editMessage(chatId, newMessage.id, content);
      
      // Simulate read status after a delay
      setTimeout(() => {
        const readMessage = { ...updatedMessage, status: 'read' as const };
        editMessage(chatId, newMessage.id, content);
      }, Math.random() * 3000 + 1000); // 1-4 seconds delay
    }, Math.random() * 1000 + 500); // 0.5-1.5 seconds delay

    // Simulate auto-reply for demo purposes (optional)
    if (Math.random() > 0.7) { // 30% chance of auto-reply
      setTimeout(() => {
        const autoReply = {
          id: (Date.now() + 1).toString(),
          senderId: selectedUser.id,
          receiverId: user.id,
          content: getAutoReply(content),
          type: 'text' as const,
          timestamp: new Date(),
          status: 'delivered' as const
        };
        addMessage(chatId, autoReply);
      }, Math.random() * 5000 + 2000); // 2-7 seconds delay
    }
  };

  // Simple auto-reply generator for demo
  const getAutoReply = (originalMessage: string): string => {
    const replies = [
      "Thanks for your message!",
      "I'll get back to you on this.",
      "Understood, will handle it.",
      "Got it, thanks!",
      "Let me check and respond.",
      "Received, working on it.",
      "Okay, I'll take care of this."
    ];
    return replies[Math.floor(Math.random() * replies.length)];
  };

  // Handle typing with debounce
  const handleTyping = (isTyping: boolean) => {
    if (!selectedUser || !user) return;
    
    const chatId = getChatId(user.id, selectedUser.id);
    setTypingUser(chatId, user.id, isTyping);

    if (isTyping) {
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set typing to false after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        setTypingUser(chatId, user.id, false);
      }, 3000);
    }
  };

  // Edit message
  const handleEditMessage = (messageId: string, newContent: string) => {
    if (!selectedUser || !user) return;
    const chatId = getChatId(user.id, selectedUser.id);
    editMessage(chatId, messageId, newContent);
    
    toast({
      title: "Message edited",
      description: "Your message has been updated.",
    });
  };

  // Delete message
  const handleDeleteMessage = (messageId: string, deleteForEveryone: boolean = false) => {
    if (!selectedUser || !user) return;
    const chatId = getChatId(user.id, selectedUser.id);
    deleteMessage(chatId, messageId, deleteForEveryone);
    
    toast({
      title: deleteForEveryone ? "Message deleted for everyone" : "Message deleted",
      description: deleteForEveryone ? "This message was removed for all participants." : "Message was removed for you.",
    });
  };

  const getCurrentChatMessages = () => {
    if (!selectedUser || !user) return [];
    const chatId = getChatId(user.id, selectedUser.id);
    return messages[chatId] || [];
  };

  const getCurrentTypingUsers = () => {
    if (!selectedUser || !user) return [];
    const chatId = getChatId(user.id, selectedUser.id);
    return (typingUsers[chatId] || []).filter(id => id !== user.id);
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
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-green-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                <span className="text-6xl">💬</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-700">
                {user?.role === 'admin' ? 'Admin Chat Panel' : 'Employee Communication'}
              </h3>
              <p className="text-gray-500 max-w-sm leading-relaxed">
                Select a contact from the sidebar to start a conversation.<br />
                Stay connected with your team through instant messaging.
              </p>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
