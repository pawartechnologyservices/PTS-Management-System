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
  const [showUserList, setShowUserList] = useState(true); // For mobile toggle

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
    // On mobile, hide user list after selection
    if (window.innerWidth < 768) {
      setShowUserList(false);
    }
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

  // Toggle user list on mobile
  const toggleUserList = () => {
    setShowUserList(!showUserList);
  };

  return (
    <div className="flex flex-col md:flex-row h-full bg-gray-50 relative">
      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between p-3 border-b border-gray-200 bg-white">
        <button 
          onClick={toggleUserList}
          className="p-2 rounded-md hover:bg-gray-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold">
          {selectedUser ? selectedUser.name : 'Chat'}
        </h1>
        <div className="w-8"></div> {/* Spacer for alignment */}
      </div>

      {/* Sidebar - Conditionally shown on mobile */}
      <div className={`${showUserList ? 'flex' : 'hidden'} md:flex w-full md:w-80 border-r border-gray-200 bg-white flex-shrink-0 absolute md:relative z-10 h-full md:h-auto`}>
        <UserList
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedUser={selectedUser}
          onUserSelect={handleUserSelect}
          onlineUsers={onlineUsers}
          onCloseMobile={() => setShowUserList(false)}
        />
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
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
              // On mobile, show user list when exiting chat
              if (window.innerWidth < 768) {
                setShowUserList(true);
              }
            }}
            onTyping={handleTyping}
            typingUsers={getCurrentTypingUsers()}
            messagesEndRef={messagesEndRef}
            onBackToUsers={toggleUserList}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 bg-gray-50">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center p-4"
            >
              <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-blue-100 to-green-100 rounded-full flex items-center justify-center mb-4 md:mb-6 mx-auto">
                <span className="text-4xl md:text-6xl">💬</span>
              </div>
              <h3 className="text-lg md:text-xl font-semibold mb-2 md:mb-3 text-gray-700">
                {user?.role === 'admin' ? 'Admin Chat Panel' : 'Employee Communication'}
              </h3>
              <p className="text-sm md:text-base text-gray-500 max-w-xs md:max-w-sm leading-relaxed">
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