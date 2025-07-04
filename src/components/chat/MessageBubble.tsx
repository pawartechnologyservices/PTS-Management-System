
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MoreVertical, Edit3, Trash2, Info, Check, CheckCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
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

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  onEdit: (message: Message) => void;
  onDelete: (messageId: string, deleteForEveryone?: boolean) => void;
  user: User;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  onEdit,
  onDelete,
  user
}) => {
  const [showOptions, setShowOptions] = useState(false);

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessageContent = () => {
    if (message.deleted) {
      return (
        <span className="italic text-gray-500">
          {message.content || 'This message was deleted'}
        </span>
      );
    }

    switch (message.type) {
      case 'image':
        return (
          <div className="max-w-sm">
            <img 
              src={message.content} 
              alt="Shared image" 
              className="rounded-lg max-w-full h-auto"
            />
          </div>
        );
      case 'video':
        return (
          <div className="max-w-sm">
            <video 
              src={message.content} 
              controls 
              className="rounded-lg max-w-full h-auto"
            />
          </div>
        );
      default:
        return (
          <div>
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
            {message.edited && (
              <span className="text-xs text-gray-500 italic">edited</span>
            )}
          </div>
        );
    }
  };

  const renderStatusIcon = () => {
    if (!isOwn) return null;

    switch (message.status) {
      case 'sent':
        return <Check className="w-3 h-3 text-gray-500" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-gray-500" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}
    >
      <div className={`flex gap-2 max-w-[70%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
        {!isOwn && (
          <Avatar className="w-8 h-8 mt-auto">
            <AvatarImage src={user?.profileImage} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
              {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
            </AvatarFallback>
          </Avatar>
        )}
        
        <div className="relative group">
          <Popover open={showOptions} onOpenChange={setShowOptions}>
            <PopoverTrigger asChild>
              <div
                className={`relative px-4 py-2 rounded-2xl ${
                  isOwn
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                } cursor-pointer hover:shadow-md transition-shadow`}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setShowOptions(true);
                }}
              >
                {renderMessageContent()}
                
                <div className={`flex items-center gap-1 mt-1 ${
                  isOwn ? 'justify-end' : 'justify-start'
                }`}>
                  <span className={`text-xs ${
                    isOwn ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {formatTime(message.timestamp)}
                  </span>
                  {renderStatusIcon()}
                </div>
                
                {/* Options trigger (visible on hover) */}
                {isOwn && !message.deleted && (
                  <button
                    className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full p-1 shadow-md"
                    onClick={() => setShowOptions(true)}
                  >
                    <MoreVertical className="w-3 h-3 text-gray-600" />
                  </button>
                )}
              </div>
            </PopoverTrigger>
            
            {isOwn && !message.deleted && (
              <PopoverContent className="w-48 p-2">
                <div className="space-y-1">
                  {message.type === 'text' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => {
                        onEdit(message);
                        setShowOptions(false);
                      }}
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-red-600 hover:text-red-700"
                    onClick={() => {
                      onDelete(message.id, false);
                      setShowOptions(false);
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete for me
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-red-600 hover:text-red-700"
                    onClick={() => {
                      onDelete(message.id, true);
                      setShowOptions(false);
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete for everyone
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setShowOptions(false)}
                  >
                    <Info className="w-4 h-4 mr-2" />
                    Message info
                  </Button>
                </div>
              </PopoverContent>
            )}
          </Popover>
        </div>
      </div>
    </motion.div>
  );
};

export default MessageBubble;
