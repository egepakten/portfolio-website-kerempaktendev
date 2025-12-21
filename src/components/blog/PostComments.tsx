import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, MessageCircle, Send, Trash2, Reply, Pin, PinOff, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  parent_id: string | null;
  is_pinned: boolean;
  pinned_at: string | null;
  profile?: {
    username: string;
    avatar_url: string | null;
  };
  isAdmin?: boolean;
  replies?: Comment[];
}

interface PostCommentsProps {
  postId: string;
}

export const PostComments = ({ postId }: PostCommentsProps) => {
  const { user, profile, isAdmin } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();

    // Set up realtime subscription
    const channel = supabase
      .channel('post-comments-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'post_comments',
          filter: `post_id=eq.${postId}`,
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId]);

  const fetchComments = async () => {
    // Fetch comments first
    const { data: commentsData, error } = await supabase
      .from('post_comments')
      .select('id, content, created_at, user_id, parent_id, is_pinned, pinned_at')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      setIsLoading(false);
      return;
    }

    if (!commentsData || commentsData.length === 0) {
      setComments([]);
      setIsLoading(false);
      return;
    }

    // Fetch profiles and roles separately
    const userIds = [...new Set(commentsData.map(c => c.user_id))];
    
    const [profilesResult, rolesResult] = await Promise.all([
      supabase.from('profiles').select('user_id, username, avatar_url').in('user_id', userIds),
      supabase.from('user_roles').select('user_id, role').in('user_id', userIds).eq('role', 'admin')
    ]);

    const profilesMap = new Map(
      (profilesResult.data || []).map(p => [p.user_id, { username: p.username, avatar_url: p.avatar_url }])
    );
    const adminUserIds = new Set((rolesResult.data || []).map(r => r.user_id));

    const formatted = commentsData.map(c => ({
      ...c,
      profile: profilesMap.get(c.user_id),
      isAdmin: adminUserIds.has(c.user_id),
    }));

    // Organize into parent comments and replies
    const parentComments = formatted.filter(c => !c.parent_id);
    const replies = formatted.filter(c => c.parent_id);

    // Attach replies to parent comments
    const commentsWithReplies = parentComments.map(parent => ({
      ...parent,
      replies: replies.filter(r => r.parent_id === parent.id),
    }));

    // Sort: pinned first (by pinned_at desc), then by created_at
    commentsWithReplies.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      if (a.is_pinned && b.is_pinned) {
        return new Date(b.pinned_at || 0).getTime() - new Date(a.pinned_at || 0).getTime();
      }
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    setComments(commentsWithReplies);
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to comment');
      return;
    }
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    const { error } = await supabase
      .from('post_comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        content: newComment.trim(),
        parent_id: null,
      });

    if (error) {
      toast.error('Failed to post comment');
    } else {
      setNewComment('');
      toast.success('Comment posted!');
    }
    setIsSubmitting(false);
  };

  const handleReply = async (parentId: string) => {
    if (!user) {
      toast.error('Please sign in to reply');
      return;
    }
    if (!replyContent.trim()) return;

    setIsSubmitting(true);
    const { error } = await supabase
      .from('post_comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        content: replyContent.trim(),
        parent_id: parentId,
      });

    if (error) {
      toast.error('Failed to post reply');
    } else {
      setReplyContent('');
      setReplyingTo(null);
      toast.success('Reply posted!');
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (commentId: string) => {
    const { error } = await supabase
      .from('post_comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      toast.error('Failed to delete comment');
    } else {
      toast.success('Comment deleted');
    }
  };

  const handlePin = async (commentId: string, currentlyPinned: boolean) => {
    const { error } = await supabase
      .from('post_comments')
      .update({
        is_pinned: !currentlyPinned,
        pinned_at: !currentlyPinned ? new Date().toISOString() : null,
      })
      .eq('id', commentId);

    if (error) {
      toast.error('Failed to update pin status');
    } else {
      toast.success(currentlyPinned ? 'Comment unpinned' : 'Comment pinned!');
    }
  };

  const getInitials = (username?: string) => {
    if (!username) return 'U';
    return username.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const totalComments = comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0);

  const renderComment = (comment: Comment, isReply = false) => (
    <motion.div
      key={comment.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`flex gap-3 p-4 rounded-lg ${
        comment.is_pinned 
          ? 'bg-primary/10 border border-primary/20' 
          : 'bg-muted/50'
      } ${isReply ? 'ml-8 mt-2' : ''}`}
    >
      <Avatar className="h-10 w-10">
        <AvatarImage src={comment.profile?.avatar_url || undefined} />
        <AvatarFallback className="bg-primary text-primary-foreground text-sm">
          {getInitials(comment.profile?.username)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">
              {comment.profile?.username || 'Anonymous'}
            </span>
            {comment.isAdmin && (
              <Badge variant="default" className="text-xs gap-1 px-1.5 py-0">
                <Shield className="h-3 w-3" />
                Admin
              </Badge>
            )}
            {comment.is_pinned && (
              <Badge variant="secondary" className="text-xs gap-1 px-1.5 py-0">
                <Pin className="h-3 w-3" />
                Pinned
              </Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{comment.content}</p>
        
        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-2">
          {user && !isReply && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
            >
              <Reply className="h-3 w-3 mr-1" />
              Reply
            </Button>
          )}
          {isAdmin && !isReply && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => handlePin(comment.id, comment.is_pinned)}
            >
              {comment.is_pinned ? (
                <>
                  <PinOff className="h-3 w-3 mr-1" />
                  Unpin
                </>
              ) : (
                <>
                  <Pin className="h-3 w-3 mr-1" />
                  Pin
                </>
              )}
            </Button>
          )}
        </div>

        {/* Reply form */}
        {replyingTo === comment.id && (
          <div className="mt-3 space-y-2">
            <Textarea
              placeholder={`Reply to ${comment.profile?.username || 'Anonymous'}...`}
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              rows={2}
              className="text-sm"
            />
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={() => handleReply(comment.id)}
                disabled={isSubmitting || !replyContent.trim()}
              >
                {isSubmitting ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <Send className="h-3 w-3 mr-1" />
                )}
                Reply
              </Button>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => {
                  setReplyingTo(null);
                  setReplyContent('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
      {(user?.id === comment.user_id || isAdmin) && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => handleDelete(comment.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </motion.div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5" />
        <h3 className="font-semibold text-lg">Comments ({totalComments})</h3>
      </div>

      {/* Comment Form */}
      {user ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
          />
          <Button type="submit" disabled={isSubmitting || !newComment.trim()}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Post Comment
          </Button>
        </form>
      ) : (
        <div className="bg-muted rounded-lg p-4 text-center">
          <p className="text-muted-foreground mb-2">Sign in to leave a comment</p>
          <Link to="/auth">
            <Button variant="outline" size="sm">Sign In</Button>
          </Link>
        </div>
      )}

      {/* Comments List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <AnimatePresence>
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id}>
                {renderComment(comment)}
                {/* Render replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="space-y-2">
                    {comment.replies.map((reply) => renderComment(reply, true))}
                  </div>
                )}
              </div>
            ))}
            {comments.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No comments yet. Be the first to comment!
              </p>
            )}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
};
