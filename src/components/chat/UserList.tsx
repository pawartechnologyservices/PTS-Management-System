
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, MoreVertical, MessageCircle } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { useAuth } from '../../hooks/useAuth';
import { useChatStore } from '../../store/chatStore';
import { User } from '../../types/chat';

interface UserListProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedUser: User | null;
  onUserSelect: (user: User) => void;
  onlineUsers: string[];
}

const UserList: React.FC<UserListProps> = ({
  searchTerm,
  onSearchChange,
  selectedUser,
  onUserSelect,
  onlineUsers
}) => {
  const { user: currentUser } = useAuth();
  const { messages, unreadCounts, getChatId } = useChatStore();
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    const allUsers = JSON.parse(localStorage.getItem('hrms_users') || '[]');
    const filteredUsers = allUsers.filter((u: any) => u.id !== currentUser?.id);
    setUsers(filteredUsers);
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLastMessage = (userId: string) => {
    if (!currentUser) return null;
    const chatId = getChatId(currentUser.id, userId);
    const chatMessages = messages[chatId] || [];
    return chatMessages[chatMessages.length - 1] || null;
  };

  const getUnreadCount = (userId: string) => {
    if (!currentUser) return 0;
    const chatId = getChatId(currentUser.id, userId);
    return unreadCounts[chatId] || 0;
  };

  const formatLastMessageTime = (timestamp: Date) => {
    const now = new Date();
    const msgDate = new Date(timestamp);
    const diffInHours = (now.getTime() - msgDate.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return diffInMinutes === 0 ? 'now' : `${diffInMinutes}m`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else {
      return msgDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const truncateMessage = (content: string, maxLength: number = 30) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Chats</h2>
          <Button variant="ghost" size="icon" className="text-gray-600">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search or start new chat"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-white border-gray-200 rounded-lg"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No chats found</p>
          </div>
        ) : (
          <div>
            {filteredUsers.map((user, index) => {
              const lastMessage = getLastMessage(user.id);
              const unreadCount = getUnreadCount(user.id);
              const isOnline = onlineUsers.includes(user.id);
              const isSelected = selectedUser?.id === user.id;

              return (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 transition-colors ${
                    isSelected ? 'bg-gray-100 border-l-4 border-l-green-500' : ''
                  }`}
                  onClick={() => onUserSelect(user)}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={user.profileImage} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    {isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0 ml-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900 truncate">{user.name}</h3>
                      <div className="flex items-center gap-2">
                        {lastMessage && (
                          <span className="text-xs text-gray-500">
                            {formatLastMessageTime(lastMessage.timestamp)}
                          </span>
                        )}
                        {unreadCount > 0 && (
                          <Badge className="bg-green-600 text-white rounded-full min-w-[20px] h-5 text-xs flex items-center justify-center px-1.5">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-gray-600 truncate">
                        {lastMessage ? (
                          <>
                            {lastMessage.type === 'image' && '📷 Photo'}
                            {lastMessage.type === 'video' && '🎥 Video'}
                            {lastMessage.type === 'text' && truncateMessage(lastMessage.content)}
                            {lastMessage.deleted && '🚫 This message was deleted'}
                          </>
                        ) : (
                          <span className="text-gray-400">{user.designation}</span>
                        )}
                      </p>
                      
                      {lastMessage && lastMessage.senderId === currentUser?.id && (
                        <div className="flex-shrink-0 ml-2">
                          {lastMessage.status === 'sent' && (
                            <span className="text-gray-400">✓</span>
                          )}
                          {lastMessage.status === 'delivered' && (
                            <span className="text-gray-400">✓✓</span>
                          )}
                          {lastMessage.status === 'read' && (
                            <span className="text-blue-500">✓✓</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserList;
