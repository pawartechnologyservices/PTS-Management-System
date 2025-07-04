
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Circle } from 'lucide-react';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useAuth } from '../../hooks/useAuth';
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

  const formatLastSeen = (userId: string) => {
    const isOnline = onlineUsers.includes(userId);
    if (isOnline) return 'Online';
    
    // For demo purposes, showing random last seen times
    const hours = Math.floor(Math.random() * 24);
    return hours === 0 ? 'Last seen recently' : `Last seen ${hours}h ago`;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold mb-3">Messages</h2>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredUsers.map((user, index) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 ${
              selectedUser?.id === user.id ? 'bg-blue-50 border-blue-200' : ''
            }`}
            onClick={() => onUserSelect(user)}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={user.profileImage} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                  onlineUsers.includes(user.id) ? 'bg-green-500' : 'bg-gray-400'
                }`}>
                  <Circle className={`w-3 h-3 ${onlineUsers.includes(user.id) ? 'text-green-500' : 'text-gray-400'}`} />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900 truncate">{user.name}</h3>
                  <span className="text-xs text-gray-500">12:30 PM</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 truncate">{user.designation}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    onlineUsers.includes(user.id) 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {formatLastSeen(user.id)}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        
        {filteredUsers.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <p>No users found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserList;
