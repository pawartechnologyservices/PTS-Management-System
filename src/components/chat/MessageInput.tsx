
import React, { useState, useRef } from 'react';
import { Send, Image, Video, Smile, Paperclip, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

interface MessageInputProps {
  onSendMessage: (content: string, type?: 'text' | 'image' | 'video') => void;
  onTyping: (isTyping: boolean) => void;
  disabled?: boolean;
  placeholder?: string;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onTyping,
  disabled = false,
  placeholder = "Type a message..."
}) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<{ type: 'image' | 'video'; url: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const handleSendMessage = () => {
    if (message.trim() || mediaPreview) {
      if (mediaPreview) {
        onSendMessage(mediaPreview.url, mediaPreview.type);
        setMediaPreview(null);
      } else {
        onSendMessage(message.trim());
      }
      setMessage('');
      onTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    
    // Typing indicator
    onTyping(true);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false);
    }, 1000);
  };

  const handleEmojiSelect = (emoji: any) => {
    setMessage(prev => prev + emoji.native);
    setShowEmojiPicker(false);
  };

  const handleFileUpload = (type: 'image' | 'video') => {
    const input = type === 'image' ? fileInputRef.current : videoInputRef.current;
    if (input) {
      input.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setMediaPreview({
          type,
          url: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const clearMediaPreview = () => {
    setMediaPreview(null);
  };

  return (
    <div className="p-4 bg-white border-t border-gray-200">
      {/* Media Preview */}
      {mediaPreview && (
        <div className="mb-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              {mediaPreview.type === 'image' ? 'Image Preview' : 'Video Preview'}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearMediaPreview}
              className="h-6 w-6 p-0 hover:bg-gray-200"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {mediaPreview.type === 'image' ? (
            <img 
              src={mediaPreview.url} 
              alt="Preview" 
              className="max-w-32 max-h-24 rounded object-cover"
            />
          ) : (
            <video 
              src={mediaPreview.url} 
              className="max-w-32 max-h-24 rounded"
              controls
            />
          )}
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Attachment Options */}
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleFileUpload('image')}
            className="h-10 w-10 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
            disabled={disabled}
          >
            <Image className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleFileUpload('video')}
            className="h-10 w-10 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
            disabled={disabled}
          >
            <Video className="h-5 w-5" />
          </Button>
        </div>

        {/* Message Input */}
        <div className="flex-1 relative">
          <Input
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            className="pr-12 py-3 rounded-full border-gray-300 focus:border-blue-500"
          />
          
          {/* Emoji Picker */}
          <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 text-gray-500 hover:text-blue-600"
                disabled={disabled}
              >
                <Smile className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 border-0 shadow-lg">
              <Picker 
                data={data} 
                onEmojiSelect={handleEmojiSelect}
                theme="light"
                previewPosition="none"
                skinTonePosition="none"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Send Button */}
        <Button
          onClick={handleSendMessage}
          disabled={disabled || (!message.trim() && !mediaPreview)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full h-10 w-10 p-0"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif"
        onChange={(e) => handleFileChange(e, 'image')}
        className="hidden"
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/mp4,video/webm"
        onChange={(e) => handleFileChange(e, 'video')}
        className="hidden"
      />
    </div>
  );
};

export default MessageInput;
