import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Heart, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PostLikesProps {
  postId: string;
}

export const PostLikes = ({ postId }: PostLikesProps) => {
  const { user } = useAuth();
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    fetchLikes();
  }, [postId, user]);

  const fetchLikes = async () => {
    // Get total likes
    const { count } = await supabase
      .from('post_likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    setLikeCount(count || 0);

    // Check if current user liked
    if (user) {
      const { data } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();
      setIsLiked(!!data);
    }
    setIsLoading(false);
  };

  const handleToggleLike = async () => {
    if (!user) {
      toast.error('Please sign in to like posts');
      return;
    }

    setIsToggling(true);

    if (isLiked) {
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);

      if (!error) {
        setIsLiked(false);
        setLikeCount(prev => prev - 1);
      }
    } else {
      const { error } = await supabase
        .from('post_likes')
        .insert({ post_id: postId, user_id: user.id });

      if (!error) {
        setIsLiked(true);
        setLikeCount(prev => prev + 1);
      }
    }

    setIsToggling(false);
  };

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Loading...
      </Button>
    );
  }

  if (!user) {
    return (
      <Link to="/auth">
        <Button variant="outline" size="sm">
          <Heart className="h-4 w-4 mr-2" />
          {likeCount} {likeCount === 1 ? 'Like' : 'Likes'}
        </Button>
      </Link>
    );
  }

  return (
    <Button
      variant={isLiked ? 'default' : 'outline'}
      size="sm"
      onClick={handleToggleLike}
      disabled={isToggling}
      className="group"
    >
      <motion.div
        animate={isLiked ? { scale: [1, 1.3, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        <Heart
          className={`h-4 w-4 mr-2 transition-colors ${
            isLiked ? 'fill-current' : 'group-hover:text-destructive'
          }`}
        />
      </motion.div>
      {likeCount} {likeCount === 1 ? 'Like' : 'Likes'}
    </Button>
  );
};
