
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'link';
  timestamp: Date;
  edited?: boolean;
  deleted?: boolean;
  status: 'sent' | 'delivered' | 'read';
  mediaUrl?: string;
  linkPreview?: {
    title: string;
    description: string;
    image: string;
    url: string;
  };
}

export interface ChatState {
  messages: Record<string, Message[]>; // chatId -> messages
  onlineUsers: string[];
  typingUsers: Record<string, string[]>; // chatId -> userIds
  unreadCounts: Record<string, number>; // chatId -> count
  currentChat: string | null;
  searchTerm: string;
  
  // Actions
  addMessage: (chatId: string, message: Message) => void;
  editMessage: (chatId: string, messageId: string, newContent: string) => void;
  deleteMessage: (chatId: string, messageId: string, deleteForEveryone?: boolean) => void;
  setOnlineUsers: (users: string[]) => void;
  setTypingUser: (chatId: string, userId: string, isTyping: boolean) => void;
  markAsRead: (chatId: string, userId: string) => void;
  setCurrentChat: (chatId: string | null) => void;
  setSearchTerm: (term: string) => void;
  getMediaMessages: (chatId: string) => Message[];
  getChatId: (user1: string, user2: string) => string;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: {},
      onlineUsers: [],
      typingUsers: {},
      unreadCounts: {},
      currentChat: null,
      searchTerm: '',

      addMessage: (chatId: string, message: Message) => {
        set((state) => ({
          messages: {
            ...state.messages,
            [chatId]: [...(state.messages[chatId] || []), message]
          },
          unreadCounts: {
            ...state.unreadCounts,
            [chatId]: state.currentChat === chatId ? 0 : (state.unreadCounts[chatId] || 0) + 1
          }
        }));
      },

      editMessage: (chatId: string, messageId: string, newContent: string) => {
        set((state) => ({
          messages: {
            ...state.messages,
            [chatId]: state.messages[chatId]?.map(msg =>
              msg.id === messageId ? { ...msg, content: newContent, edited: true } : msg
            ) || []
          }
        }));
      },

      deleteMessage: (chatId: string, messageId: string, deleteForEveryone = false) => {
        set((state) => ({
          messages: {
            ...state.messages,
            [chatId]: state.messages[chatId]?.map(msg =>
              msg.id === messageId 
                ? { ...msg, deleted: true, content: deleteForEveryone ? 'This message was deleted' : '' }
                : msg
            ) || []
          }
        }));
      },

      setOnlineUsers: (users: string[]) => {
        set({ onlineUsers: users });
      },

      setTypingUser: (chatId: string, userId: string, isTyping: boolean) => {
        set((state) => {
          const currentTyping = state.typingUsers[chatId] || [];
          const newTyping = isTyping
            ? [...currentTyping.filter(id => id !== userId), userId]
            : currentTyping.filter(id => id !== userId);
          
          return {
            typingUsers: {
              ...state.typingUsers,
              [chatId]: newTyping
            }
          };
        });
      },

      markAsRead: (chatId: string, userId: string) => {
        set((state) => ({
          unreadCounts: {
            ...state.unreadCounts,
            [chatId]: 0
          },
          messages: {
            ...state.messages,
            [chatId]: state.messages[chatId]?.map(msg =>
              msg.receiverId === userId ? { ...msg, status: 'read' as const } : msg
            ) || []
          }
        }));
      },

      setCurrentChat: (chatId: string | null) => {
        set({ currentChat: chatId });
        if (chatId) {
          get().markAsRead(chatId, 'current-user-id');
        }
      },

      setSearchTerm: (term: string) => {
        set({ searchTerm: term });
      },

      getMediaMessages: (chatId: string) => {
        const messages = get().messages[chatId] || [];
        return messages.filter(msg => msg.type === 'image' || msg.type === 'video' || msg.type === 'link');
      },

      getChatId: (user1: string, user2: string) => {
        return [user1, user2].sort().join('_');
      }
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({ 
        messages: state.messages,
        unreadCounts: state.unreadCounts 
      }),
    }
  )
);
