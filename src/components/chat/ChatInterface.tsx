import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { getDatabase, ref, set } from 'firebase/database'; // Firebase Realtime DB
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/use-toast';
import { useChatStore } from '../../store/chatStore';
import UserList from './UserList';
import ChatWindow from './ChatWindow';
import { User } from '../../types/chat';

const db = getDatabase();

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

    const initialOnlineUsers = otherUsers
      .slice(0, Math.floor(Math.random() * otherUsers.length / 2) + 1)
      .map((u: any) => u.id);

    setOnlineUsers(initialOnlineUsers);

    const presenceInterval = setInterval(() => {
      const onlineCount = Math.floor(Math.random() * otherUsers.length / 2) + 1;
      const shuffled = [...otherUsers].sort(() => 0.5 - Math.random());
      setOnlineUsers(shuffled.slice(0, onlineCount).map((u: any) => u.id));
    }, 30000);

    return () => clearInterval(presenceInterval);
  }, [user?.id, setOnlineUsers]);

  // Auto-scroll on new messages
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

  // Get chatId helper
  const generateChatId = (uid1: string, uid2: string) => {
    return [uid1, uid2].sort().join('_');
  };

  // Helper to build DB path depending on role
  const getChatPath = (
    uid: string,
    otherUser: User,
    isSender: boolean
  ): string => {
    // If other user is employee, path is users/{uid}/employees/{employeeId}/chat
    // else users/{uid}/chat
    if (otherUser.role === 'employee') {
      return `users/${uid}/employees/${otherUser.id}/chat`;
    }
    return `users/${uid}/chat`;
  };

  // Send message with full Firebase logic
  const sendMessage = async (
    content: string,
    type: 'text' | 'image' | 'video' = 'text'
  ) => {
    if (!selectedUser || !user || !content.trim()) return;

    const chatId = generateChatId(user.id, selectedUser.id);
    const timestamp = Date.now();
    const messageId = timestamp.toString();

    const newMessage = {
      id: messageId,
      senderId: user.id,
      receiverId: selectedUser.id,
      content,
      type,
      timestamp,
      status: 'sent' as const,
      ...(type !== 'text' && { mediaUrl: content }),
    };

    addMessage(chatId, newMessage);

    // Build sender and receiver paths
    const senderPath = `${getChatPath(user.id, selectedUser, true)}/${chatId}/${messageId}`;
    const receiverPath = `${getChatPath(selectedUser.id, user, false)}/${chatId}/${messageId}`;

    try {
      // Write message under both paths
      await set(ref(db, senderPath), newMessage);
      await set(ref(db, receiverPath), newMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Send Failed',
        description: 'Could not send message.',
        variant: 'destructive',
      });
      return;
    }

    // Simulate delivery status
    setTimeout(async () => {
      const deliveredMessage = { ...newMessage, status: 'delivered' as const };

      editMessage(chatId, messageId, deliveredMessage);

      await set(ref(db, senderPath), deliveredMessage);
      await set(ref(db, receiverPath), deliveredMessage);

      // Simulate read status
      setTimeout(async () => {
        const readMessage = { ...deliveredMessage, status: 'read' as const };
        editMessage(chatId, messageId, readMessage);
        await set(ref(db, senderPath), readMessage);
        await set(ref(db, receiverPath), readMessage);
      }, Math.random() * 3000 + 1000);
    }, Math.random() * 1000 + 500);
  };

  // Handle typing with debounce
  const handleTyping = (isTyping: boolean) => {
    if (!selectedUser || !user) return;

    const chatId = generateChatId(user.id, selectedUser.id);
    setTypingUser(chatId, user.id, isTyping);

    if (isTyping) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setTypingUser(chatId, user.id, false);
      }, 3000);
    }
  };

  // Edit message handler
  const handleEditMessage = (messageId: string, newContent: string) => {
    if (!selectedUser || !user) return;
    const chatId = generateChatId(user.id, selectedUser.id);
    editMessage(chatId, messageId, { content: newContent });

    toast({
      title: 'Message edited',
      description: 'Your message has been updated.',
    });
  };

  // Delete message handler
  const handleDeleteMessage = (messageId: string, deleteForEveryone = false) => {
    if (!selectedUser || !user) return;
    const chatId = generateChatId(user.id, selectedUser.id);
    deleteMessage(chatId, messageId, deleteForEveryone);

    toast({
      title: deleteForEveryone ? 'Message deleted for everyone' : 'Message deleted',
      description: deleteForEveryone
        ? 'This message was removed for all participants.'
        : 'Message was removed for you.',
    });
  };

  const getCurrentChatMessages = () => {
    if (!selectedUser || !user) return [];
    const chatId = generateChatId(user.id, selectedUser.id);
    return messages[chatId] || [];
  };

  const getCurrentTypingUsers = () => {
    if (!selectedUser || !user) return [];
    const chatId = generateChatId(user.id, selectedUser.id);
    return (typingUsers[chatId] || []).filter((id) => id !== user.id);
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
                Select a contact from the sidebar to start a conversation.
                <br />
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
