import React, { useEffect, useState, useRef } from 'react';
import { ref, push, set, onValue, off, query, orderByChild, get, update } from 'firebase/database';
import { database } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/button';
import { motion } from 'framer-motion';
import { ImagePlus, Video, Paperclip, X, MessageCircle, MoreVertical, Trash2 } from 'lucide-react';
import MediaGallery from './MediaGallery';
import { toast } from 'react-hot-toast';

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: string;
  timestamp: number;
  status: string;
  mediaUrl?: string;
  deletedForSender?: boolean;
  deletedForReceiver?: boolean;
  deletedForEveryone?: boolean;
}

interface ChatWindowProps {
  selectedUser: {
    id: string;
    name: string;
    designation?: string;
    department?: string;
    profileImage?: string;
  } | null;
  onMessageSent?: () => void;
}

function getChatId(userId1: string, userId2: string): string {
  return [userId1, userId2].sort().join('_');
}

function formatLastSeen(timestamp: number): string {
  if (!timestamp) return 'Unknown';
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds} seconds ago`;
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ selectedUser, onMessageSent }) => {
  const { user: currentUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [userStatus, setUserStatus] = useState<'online' | 'offline'>('offline');
  const [lastSeen, setLastSeen] = useState<number | null>(null);
  const [mediaPreview, setMediaPreview] = useState<{ url: string; type: 'image' | 'video' } | null>(null);
  const [isMediaGalleryOpen, setIsMediaGalleryOpen] = useState(false);
  const [userDetails, setUserDetails] = useState<{
    designation: string;
    department: string;
    profileImage?: string;
  }>({
    designation: '',
    department: '',
  });
  const [isSending, setIsSending] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    messageId: string | null;
    position: { x: number; y: number } | null;
  }>({
    messageId: null,
    position: null,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu({ messageId: null, position: null });
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!currentUser || !selectedUser) {
      setMessages([]);
      setUserStatus('offline');
      setLastSeen(null);
      return;
    }

    const fetchUserDetails = async () => {
      try {
        const userRef = ref(database, `users/${selectedUser.id}`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          const userData = snapshot.val();
          setUserDetails({
            designation: userData.designation || 'No designation',
            department: userData.department || 'No department',
            profileImage: userData.profileImage || '',
          });
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
        toast.error('Failed to load user details');
      }
    };

    fetchUserDetails();

    const chatId = getChatId(currentUser.id, selectedUser.id);
    const messagesRef = query(ref(database, `chats/${chatId}/messages`), orderByChild('timestamp'));

    const unsubscribeMessages = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setMessages([]);
        return;
      }

      const loadedMessages: Message[] = Object.entries(data).map(([key, val]: [string, any]) => ({
        id: key,
        senderId: val.senderId,
        receiverId: val.receiverId,
        content: val.content,
        type: val.type,
        timestamp: val.timestamp,
        status: val.status,
        mediaUrl: val.mediaUrl,
        deletedForSender: val.deletedForSender || false,
        deletedForReceiver: val.deletedForReceiver || false,
        deletedForEveryone: val.deletedForEveryone || false,
      }));

      const filteredMessages = loadedMessages.filter(msg => {
        if (msg.deletedForEveryone) return true;
        if (msg.senderId === currentUser.id && msg.deletedForSender) return false;
        if (msg.receiverId === currentUser.id && msg.deletedForReceiver) return false;
        return true;
      });

      filteredMessages.sort((a, b) => a.timestamp - b.timestamp);
      setMessages(filteredMessages);
    });

    const statusRef = ref(database, `users/${selectedUser.id}/status`);
    const lastSeenRef = ref(database, `users/${selectedUser.id}/lastActive`);

    const unsubscribeStatus = onValue(statusRef, (snapshot) => {
      const statusVal = snapshot.val();
      if (statusVal === 'active') {
        setUserStatus('online');
        setLastSeen(null);
      } else {
        setUserStatus('offline');
        get(lastSeenRef).then((snap) => {
          if (snap.exists()) {
            setLastSeen(snap.val());
          } else {
            setLastSeen(null);
          }
        });
      }
    });

    return () => {
      off(messagesRef);
      off(statusRef);
      unsubscribeMessages();
      unsubscribeStatus();
    };
  }, [currentUser, selectedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm'];
    const maxSize = 10 * 1024 * 1024;

    if (!validTypes.includes(file.type)) {
      toast.error('Please select an image (JPEG, PNG, GIF) or video (MP4, WebM) file.');
      return;
    }

    if (file.size > maxSize) {
      toast.error('File size too large. Maximum allowed size is 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (file.type.startsWith('image/')) {
        setMediaPreview({ url: event.target?.result as string, type: 'image' });
      } else if (file.type.startsWith('video/')) {
        setMediaPreview({ url: event.target?.result as string, type: 'video' });
      }
    };
    reader.onerror = () => {
      toast.error('Failed to read file');
    };
    reader.readAsDataURL(file);
  };

  const removeMediaPreview = () => {
    setMediaPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const sendMessage = async () => {
    if (!currentUser || !selectedUser || isSending) return;
    if (!newMessage.trim() && !mediaPreview) return;

    setIsSending(true);
    const chatId = getChatId(currentUser.id, selectedUser.id);
    const messagesRef = ref(database, `chats/${chatId}/messages`);
    const newMsgRef = push(messagesRef);
    const timestamp = Date.now();

    try {
      let messageData: Message;
      
      if (mediaPreview) {
        messageData = {
          id: newMsgRef.key!,
          senderId: currentUser.id,
          receiverId: selectedUser.id,
          content: mediaPreview.url,
          type: mediaPreview.type,
          timestamp,
          status: 'sent',
          mediaUrl: mediaPreview.url,
        };
      } else {
        messageData = {
          id: newMsgRef.key!,
          senderId: currentUser.id,
          receiverId: selectedUser.id,
          content: newMessage.trim(),
          type: 'text',
          timestamp,
          status: 'sent',
        };
      }

      await set(newMsgRef, messageData);
      setNewMessage('');
      setMediaPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      toast.success('Message sent');
      
      if (onMessageSent) {
        onMessageSent();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleContextMenu = (e: React.MouseEvent, message: Message) => {
    e.preventDefault();
    setContextMenu({
      messageId: message.id,
      position: { x: e.clientX, y: e.clientY },
    });
  };

  const handleDeleteForMe = async (message: Message) => {
    if (!currentUser || !selectedUser) return;
    
    try {
      const chatId = getChatId(currentUser.id, selectedUser.id);
      const messageRef = ref(database, `chats/${chatId}/messages/${message.id}`);
      
      const isSender = message.senderId === currentUser.id;
      
      await update(messageRef, {
        [isSender ? 'deletedForSender' : 'deletedForReceiver']: true,
      });
      
      toast.success('Message deleted for you');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    } finally {
      setContextMenu({ messageId: null, position: null });
    }
  };

  const handleDeleteForEveryone = async (message: Message) => {
    if (!currentUser || !selectedUser) return;
    if (message.senderId !== currentUser.id) {
      toast.error('You can only delete your own messages for everyone');
      return;
    }
    
    try {
      const chatId = getChatId(currentUser.id, selectedUser.id);
      const messageRef = ref(database, `chats/${chatId}/messages/${message.id}`);
      
      await update(messageRef, {
        deletedForEveryone: true,
        content: 'This message was deleted',
        type: 'text',
        mediaUrl: null,
      });
      
      toast.success('Message deleted for everyone');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    } finally {
      setContextMenu({ messageId: null, position: null });
    }
  };

  if (!selectedUser) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-gray-500">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <MessageCircle className="h-8 w-8 text-gray-400" />
        </div>
        <p>Select a user to start chatting</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full border rounded-lg shadow-sm">
      <div className="p-4 border-b flex items-center justify-between bg-white">
        <div className="flex items-center space-x-3">
          {userDetails.profileImage ? (
            <img
              src={userDetails.profileImage}
              alt={selectedUser.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
              {selectedUser.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="font-semibold text-gray-900">{selectedUser.name}</div>
            {/* <div className="text-xs text-gray-500">
              {userDetails.designation} • {userDetails.department}
            </div> */}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-600 hover:bg-gray-100"
            onClick={() => setIsMediaGalleryOpen(true)}
          >
            View Media
          </Button>
          <div className="text-sm text-gray-600">
            {userStatus === 'online' ? (
              <div className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                <span>Online</span>
              </div>
            ) : (
              <span></span>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <MessageCircle className="h-8 w-8" />
            </div>
            <p>No messages yet</p>
            <p className="text-sm mt-1">Start the conversation with {selectedUser.name}</p>
          </div>
        ) : (
          messages.map((msg) => {
            if (msg.deletedForEveryone) {
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex max-w-xs ${msg.senderId === currentUser?.id ? 'ml-auto justify-end' : 'mr-auto justify-start'}`}
                >
                  <div className="p-3 rounded-lg bg-gray-100 text-gray-500 italic">
                    This message was deleted
                  </div>
                </motion.div>
              );
            }

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex max-w-xs ${msg.senderId === currentUser?.id ? 'ml-auto justify-end' : 'mr-auto justify-start'}`}
                onContextMenu={(e) => handleContextMenu(e, msg)}
              >
                <div
                  className={`relative group p-3 rounded-lg ${msg.senderId === currentUser?.id
                    ? 'bg-blue-500 text-white rounded-br-none'
                    : 'bg-gray-200 text-gray-900 rounded-bl-none'
                  }`}
                >
                  {(msg.senderId === currentUser?.id || msg.receiverId === currentUser?.id) && (
                    <button
                      className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-700 text-white rounded-full p-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setContextMenu({
                          messageId: msg.id,
                          position: { x: e.clientX, y: e.clientY },
                        });
                      }}
                    >
                      <MoreVertical className="h-3 w-3" />
                    </button>
                  )}
                  
                  {msg.type === 'image' ? (
                    <img
                      src={msg.mediaUrl || msg.content}
                      alt="Shared image"
                      className="max-w-full max-h-64 rounded"
                    />
                  ) : msg.type === 'video' ? (
                    <video
                      src={msg.mediaUrl || msg.content}
                      controls
                      className="max-w-full max-h-64 rounded"
                    />
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                  <div className={`text-xs mt-1 ${msg.senderId === currentUser?.id ? 'text-blue-100' : 'text-gray-500'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {msg.status === 'read' && msg.senderId === currentUser?.id && (
                      <span className="ml-1">✓✓</span>
                    )}
                    {msg.status === 'delivered' && msg.senderId === currentUser?.id && (
                      <span className="ml-1">✓</span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {contextMenu.messageId && contextMenu.position && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 bg-white shadow-lg rounded-md border border-gray-200 py-1 w-48"
          style={{
            top: contextMenu.position.y,
            left: contextMenu.position.x,
          }}
        >
          {contextMenu.messageId && messages.find(m => m.id === contextMenu.messageId)?.senderId === currentUser?.id ? (
            <>
              <button
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center"
                onClick={() => {
                  const message = messages.find(m => m.id === contextMenu.messageId);
                  if (message) handleDeleteForMe(message);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete for me
              </button>
              <button
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center"
                onClick={() => {
                  const message = messages.find(m => m.id === contextMenu.messageId);
                  if (message) handleDeleteForEveryone(message);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete for everyone
              </button>
            </>
          ) : (
            <button
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center"
              onClick={() => {
                const message = messages.find(m => m.id === contextMenu.messageId);
                if (message) handleDeleteForMe(message);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete for me
            </button>
          )}
        </div>
      )}

      {mediaPreview && (
        <div className="relative border-t p-2 bg-gray-100">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-6 w-6"
            onClick={removeMediaPreview}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="flex items-center p-2">
            {mediaPreview.type === 'image' ? (
              <img
                src={mediaPreview.url}
                alt="Preview"
                className="h-20 w-20 object-cover rounded"
              />
            ) : (
              <video
                src={mediaPreview.url}
                className="h-20 w-20 object-cover rounded"
              />
            )}
            <div className="ml-3">
              <p className="text-sm font-medium">
                {mediaPreview.type === 'image' ? 'Image' : 'Video'} ready to send
              </p>
              <p className="text-xs text-gray-500">
                {mediaPreview.type === 'image' ? 'JPEG Image' : 'MP4 Video'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="p-3 border-t bg-white">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-500 hover:text-gray-700"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="h-5 w-5" />
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,video/*"
              className="hidden"
            />
          </div>
          <input
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <Button
            onClick={sendMessage}
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-4 py-2"
            disabled={(!newMessage.trim() && !mediaPreview) || isSending}
          >
            {isSending ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </div>

      <MediaGallery
        messages={messages}
        isOpen={isMediaGalleryOpen}
        onClose={() => setIsMediaGalleryOpen(false)}
      />
    </div>
  );
};

export default ChatWindow;