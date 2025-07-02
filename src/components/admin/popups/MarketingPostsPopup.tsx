
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Camera, Heart, MessageCircle, Share } from 'lucide-react';

interface MarketingPost {
  id: string;
  title: string;
  content: string;
  platform: string;
  postedAt: string;
  likes: number;
  comments: number;
  shares: number;
  status: 'published' | 'scheduled' | 'draft';
}

interface MarketingPostsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  posts: MarketingPost[];
}

const MarketingPostsPopup: React.FC<MarketingPostsPopupProps> = ({
  isOpen,
  onClose,
  posts
}) => {
  const recentPosts = posts.filter(post => post.status === 'published').slice(0, 5);

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'facebook': return 'bg-blue-100 text-blue-700';
      case 'instagram': return 'bg-pink-100 text-pink-700';
      case 'twitter': return 'bg-sky-100 text-sky-700';
      case 'linkedin': return 'bg-indigo-100 text-indigo-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Recent Marketing Posts ({recentPosts.length})
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {recentPosts.map((post) => (
            <div key={post.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{post.title}</h3>
                    <Badge className={getPlatformColor(post.platform)}>
                      {post.platform}
                    </Badge>
                  </div>
                  <p className="text-gray-600 mb-3 line-clamp-2">{post.content}</p>
                  
                  <div className="flex items-center gap-4 mb-3 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Heart className="h-4 w-4" />
                      <span>{post.likes}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="h-4 w-4" />
                      <span>{post.comments}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Share className="h-4 w-4" />
                      <span>{post.shares}</span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500">
                    Posted: {new Date(post.postedAt).toLocaleDateString()} at {new Date(post.postedAt).toLocaleTimeString()}
                  </p>
                </div>
                
                <Button
                  onClick={() => window.open('#', '_blank')}
                  variant="outline"
                  className="ml-4"
                >
                  View Post
                </Button>
              </div>
            </div>
          ))}
          
          {recentPosts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No recent marketing posts
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MarketingPostsPopup;
