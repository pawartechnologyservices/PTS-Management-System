
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, ExternalLink, Image as ImageIcon, Video } from 'lucide-react';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent } from '../ui/dialog';
import { Message } from '../../store/chatStore';

interface MediaGalleryProps {
  messages: Message[];
  isOpen: boolean;
  onClose: () => void;
}

const MediaGallery: React.FC<MediaGalleryProps> = ({ messages, isOpen, onClose }) => {
  const [selectedMedia, setSelectedMedia] = useState<Message | null>(null);

  const images = messages.filter(msg => msg.type === 'image' && !msg.deleted);
  const videos = messages.filter(msg => msg.type === 'video' && !msg.deleted);
  const links = messages.filter(msg => msg.type === 'link' && !msg.deleted);

  const formatDate = (timestamp: Date) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const downloadMedia = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] p-0">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Shared Media</h2>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              <Tabs defaultValue="images" className="h-full">
                <TabsList className="w-full justify-start border-b rounded-none bg-transparent">
                  <TabsTrigger value="images" className="data-[state=active]:bg-blue-50">
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Images ({images.length})
                  </TabsTrigger>
                  <TabsTrigger value="videos" className="data-[state=active]:bg-blue-50">
                    <Video className="h-4 w-4 mr-2" />
                    Videos ({videos.length})
                  </TabsTrigger>
                  <TabsTrigger value="links" className="data-[state=active]:bg-blue-50">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Links ({links.length})
                  </TabsTrigger>
                </TabsList>

                {/* Images Tab */}
                <TabsContent value="images" className="m-0 h-full overflow-y-auto p-4">
                  {images.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <ImageIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>No images shared yet</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {images.map((message) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer"
                          onClick={() => setSelectedMedia(message)}
                        >
                          <img
                            src={message.mediaUrl || message.content}
                            alt="Shared image"
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs bg-black/50 rounded px-2 py-1">
                              {formatDate(message.timestamp)}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Videos Tab */}
                <TabsContent value="videos" className="m-0 h-full overflow-y-auto p-4">
                  {videos.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <Video className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>No videos shared yet</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {videos.map((message) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="group bg-gray-50 rounded-lg overflow-hidden"
                        >
                          <video
                            src={message.mediaUrl || message.content}
                            className="w-full aspect-video object-cover"
                            controls
                          />
                          <div className="p-3">
                            <p className="text-sm text-gray-600">{formatDate(message.timestamp)}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Links Tab */}
                <TabsContent value="links" className="m-0 h-full overflow-y-auto p-4">
                  {links.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <ExternalLink className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>No links shared yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {links.map((message) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <ExternalLink className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 truncate">
                                {message.linkPreview?.title || 'Link'}
                              </h4>
                              <p className="text-sm text-gray-600 truncate">
                                {message.linkPreview?.description || message.content}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatDate(message.timestamp)}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(message.content, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Viewer Modal */}
      <AnimatePresence>
        {selectedMedia && (
          <Dialog open={!!selectedMedia} onOpenChange={() => setSelectedMedia(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-black">
              <div className="relative h-full">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedMedia(null)}
                  className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
                >
                  <X className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => downloadMedia(
                    selectedMedia.mediaUrl || selectedMedia.content,
                    `image_${selectedMedia.id}.jpg`
                  )}
                  className="absolute top-4 right-16 z-10 text-white hover:bg-white/20"
                >
                  <Download className="h-5 w-5" />
                </Button>
                <img
                  src={selectedMedia.mediaUrl || selectedMedia.content}
                  alt="Full size"
                  className="w-full h-full object-contain"
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </>
  );
};

export default MediaGallery;
