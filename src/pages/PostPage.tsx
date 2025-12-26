import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { PostContent } from '@/components/blog/PostContent';
import { TableOfContents, ReadingProgress } from '@/components/blog/TableOfContents';
import { PostCard } from '@/components/blog/PostCard';
import { SubscribeForm } from '@/components/blog/SubscribeForm';
import { PostLikes } from '@/components/blog/PostLikes';
import { PostComments } from '@/components/blog/PostComments';
import { useBlogStore } from '@/store/blogStore';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Clock, Calendar, Share2, Twitter, Linkedin, Link as LinkIcon, Hash, Loader2, Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

const PostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const getPostBySlug = useBlogStore((state) => state.getPostBySlug);
  const posts = useBlogStore((state) => state.posts);
  const isLoading = useBlogStore((state) => state.isLoading);
  const { user, subscription, loading: authLoading } = useAuth();
  const isSubscribed = subscription?.is_active;
  const navigate = useNavigate();
  const post = slug ? getPostBySlug(slug) : undefined;

  // Show loading state while data is being fetched
  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="mb-8">
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-12">
            <div>
              <Skeleton className="h-6 w-24 mb-4" />
              <Skeleton className="h-12 w-full mb-4" />
              <Skeleton className="h-12 w-3/4 mb-6" />
              <Skeleton className="h-6 w-full mb-2" />
              <Skeleton className="h-6 w-2/3 mb-8" />
              <div className="flex gap-4 mb-8">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-64 w-full rounded-xl mb-12" />
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            </div>
            <aside className="hidden lg:block">
              <Skeleton className="h-4 w-24 mb-4" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </aside>
          </div>
        </div>
      </Layout>
    );
  }

  // Show not found only after loading is complete
  if (!post) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="font-serif text-3xl font-bold mb-4">Post Not Found</h1>
          <p className="text-muted-foreground mb-8">The post you're looking for doesn't exist.</p>
          <Link to="/posts">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Posts
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  // Check if this is a subscriber-only post and user doesn't have access
  const isSubscriberOnlyPost = post.isSubscriberOnly;
  const hasAccess = !isSubscriberOnlyPost || (user && isSubscribed);

  // Get related posts (same category, different post)
  const relatedPosts = posts.filter(p => 
    p.id !== post.id && 
    p.categoryId === post.categoryId && 
    p.status === 'published'
  ).slice(0, 3);

  const formattedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  const shareUrl = window.location.href;
  const shareTitle = post.title;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    toast.success('Link copied to clipboard!');
  };

  const handleShareTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`,
      '_blank'
    );
  };

  const handleShareLinkedIn = () => {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      '_blank'
    );
  };

  return (
    <Layout>
      <ReadingProgress />
      
      <article className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          {/* Back Link */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8"
          >
            <Link
              to="/posts"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Posts
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-12">
            {/* Main Content */}
            <div>
              {/* Header */}
              <motion.header
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                {/* Category */}
                {post.category && (
                  <Link to={`/category/${post.category.slug}`}>
                    <Badge className="mb-4">
                      {post.category.name}
                    </Badge>
                  </Link>
                )}

                <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-balance">
                  {post.title}
                </h1>

                {post.excerpt && (
                  <p className="text-xl text-muted-foreground mb-6">
                    {post.excerpt}
                  </p>
                )}

                {/* Meta */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{formattedDate}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{post.readTime || 5} min read</span>
                  </div>
                  <PostLikes postId={post.id} />
                </div>

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-6">
                    {post.tags.map((tag) => (
                      <Link 
                        key={tag.id} 
                        to={`/tag/${tag.slug}`}
                        className="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
                      >
                        <Hash className="h-3 w-3" />
                        {tag.name}
                      </Link>
                    ))}
                  </div>
                )}
              </motion.header>

              {/* Cover Image */}
              {post.coverImage && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="mb-12"
                >
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="w-full rounded-xl shadow-medium"
                  />
                </motion.div>
              )}

              {/* Content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="relative"
              >
                {!hasAccess ? (
                  <div className="relative min-h-[600px]">
                    {/* Blurred preview content */}
                    <div className="blur-md select-none pointer-events-none">
                      <PostContent content={post.content} />
                    </div>

                    {/* Lock overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-md">
                      <Card className="max-w-md border-2 shadow-xl">
                        <CardHeader className="text-center pb-6">
                          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4">
                            <Lock className="w-8 h-8 text-primary" />
                          </div>
                          <CardTitle className="text-2xl font-serif mb-2">
                            Subscriber-Only Content
                          </CardTitle>
                          <CardDescription className="text-base">
                            This post is exclusive to newsletter subscribers
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="bg-muted/50 rounded-lg p-4">
                            <p className="text-sm text-muted-foreground">
                              Subscribe to unlock this post and get access to all subscriber-only content,
                              plus weekly updates when new posts are published.
                            </p>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                              className="flex-1"
                              size="lg"
                              onClick={() => navigate('/auth?tab=signup')}
                            >
                              <Mail className="w-4 h-4 mr-2" />
                              Subscribe to Read
                            </Button>
                            {!user && (
                              <Button
                                variant="outline"
                                size="lg"
                                className="flex-1"
                                onClick={() => navigate('/auth?tab=login')}
                              >
                                Already Subscribed? Sign In
                              </Button>
                            )}
                          </div>

                          {user && !isSubscribed && (
                            <p className="text-sm text-center text-muted-foreground pt-2">
                              You're signed in but not subscribed. Subscribe to unlock!
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ) : (
                  <PostContent content={post.content} />
                )}
              </motion.div>

              {/* Share */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-12 pt-8 border-t border-border"
              >
                <div className="flex items-center gap-4">
                  <Share2 className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Share this post</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={handleShareTwitter}>
                      <Twitter className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleShareLinkedIn}>
                      <Linkedin className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleCopyLink}>
                      <LinkIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>

              {/* Comments Section */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-12 pt-8 border-t border-border"
              >
                <PostComments postId={post.id} />
              </motion.div>

              {/* Subscribe CTA - Only show if not subscribed */}
              {!isSubscribed && (
                <div className="mt-12">
                  <SubscribeForm variant="hero" />
                </div>
              )}

              {/* Related Posts */}
              {relatedPosts.length > 0 && (
                <div className="mt-16">
                  <h2 className="font-serif text-2xl font-semibold mb-6">Related Posts</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {relatedPosts.map((relatedPost, index) => (
                      <PostCard key={relatedPost.id} post={relatedPost} index={index} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="hidden lg:block">
              <TableOfContents content={post.content} />
            </aside>
          </div>
        </div>
      </article>
    </Layout>
  );
};

export default PostPage;
