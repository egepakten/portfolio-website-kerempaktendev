import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { PostCard } from '@/components/blog/PostCard';
import { SubscribeForm } from '@/components/blog/SubscribeForm';
import { useBlogStore } from '@/store/blogStore';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, X, Hash, TrendingUp, Heart, ArrowUpDown } from 'lucide-react';

type SortOption = 'newest' | 'oldest' | 'most-liked' | 'most-commented';

const PostsPage = () => {
  const posts = useBlogStore((state) => state.posts);
  const categories = useBlogStore((state) => state.categories);
  const tags = useBlogStore((state) => state.tags);
  const publishedPosts = useMemo(() => posts.filter((p) => p.status === 'published'), [posts]);
  const { subscription } = useAuth();
  const isSubscribed = subscription?.is_active;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  const mainCategories = useMemo(() => categories.filter((c) => !c.parentId), [categories]);

  // Fetch post like counts
  const [postLikeCounts, setPostLikeCounts] = useState<Record<string, number>>({});
  
  // Fetch post comment counts
  const [postCommentCounts, setPostCommentCounts] = useState<Record<string, number>>({});
  
  useEffect(() => {
    const fetchLikeCounts = async () => {
      const { data } = await supabase
        .from('post_likes')
        .select('post_id');
      
      if (data) {
        const counts: Record<string, number> = {};
        data.forEach((like) => {
          counts[like.post_id] = (counts[like.post_id] || 0) + 1;
        });
        setPostLikeCounts(counts);
      }
    };

    const fetchCommentCounts = async () => {
      const { data } = await supabase
        .from('post_comments')
        .select('post_id');
      
      if (data) {
        const counts: Record<string, number> = {};
        data.forEach((comment) => {
          counts[comment.post_id] = (counts[comment.post_id] || 0) + 1;
        });
        setPostCommentCounts(counts);
      }
    };

    fetchLikeCounts();
    fetchCommentCounts();
  }, []);

  // Get popular tags from most-liked posts
  const popularTags = useMemo(() => {
    // Sort posts by likes and get top liked posts
    const sortedPosts = [...publishedPosts].sort((a, b) => 
      (postLikeCounts[b.id] || 0) - (postLikeCounts[a.id] || 0)
    );
    
    // Collect tags from liked posts with their total likes
    const tagLikes: Record<string, { tag: typeof tags[0], likes: number }> = {};
    
    sortedPosts.forEach((post) => {
      const postLikes = postLikeCounts[post.id] || 0;
      post.tags?.forEach((tag) => {
        if (!tagLikes[tag.id]) {
          tagLikes[tag.id] = { tag, likes: 0 };
        }
        tagLikes[tag.id].likes += postLikes;
      });
    });
    
    // Sort by total likes and return top 10
    return Object.values(tagLikes)
      .filter((item) => item.likes > 0)
      .sort((a, b) => b.likes - a.likes)
      .slice(0, 10)
      .map((item) => ({ ...item.tag, count: item.likes }));
  }, [publishedPosts, postLikeCounts, tags]);

  const filteredAndSortedPosts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    // First filter
    const filtered = publishedPosts.filter((post) => {
      const matchesSearch =
        !query ||
        post.title.toLowerCase().includes(query) ||
        post.excerpt?.toLowerCase().includes(query);

      const matchesCategory =
        !selectedCategory ||
        post.categoryId === selectedCategory ||
        categories.find((c) => c.id === post.categoryId)?.parentId === selectedCategory;

      const matchesTag = !selectedTag || post.tags?.some((t) => t.id === selectedTag);

      return matchesSearch && matchesCategory && matchesTag;
    });

    // Then sort
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime();
        case 'oldest':
          return new Date(a.publishedAt || a.createdAt).getTime() - new Date(b.publishedAt || b.createdAt).getTime();
        case 'most-liked':
          return (postLikeCounts[b.id] || 0) - (postLikeCounts[a.id] || 0);
        case 'most-commented':
          return (postCommentCounts[b.id] || 0) - (postCommentCounts[a.id] || 0);
        default:
          return 0;
      }
    });
  }, [categories, publishedPosts, searchQuery, selectedCategory, selectedTag, sortBy, postLikeCounts, postCommentCounts]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setSelectedTag(null);
  };

  const hasFilters = searchQuery || selectedCategory || selectedTag;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mb-12"
        >
          <h1 className="font-serif text-4xl font-bold mb-4">All Posts</h1>
          <p className="text-lg text-muted-foreground">
            Browse through all published articles and tutorials.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
          {/* Main Content */}
          <div>
            {/* Search & Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8 space-y-4"
            >
              {/* Search */}
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Category Filters */}
              <div className="flex flex-wrap gap-2 items-center">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground mr-2">Categories:</span>
                {mainCategories.map((cat) => (
                  <Badge
                    key={cat.id}
                    variant={selectedCategory === cat.id ? 'default' : 'secondary'}
                    className="cursor-pointer transition-colors"
                    onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                  >
                    {cat.name}
                  </Badge>
                ))}
              </div>

              {/* Sort Options */}
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Sort by:</span>
                <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="oldest">Oldest</SelectItem>
                    <SelectItem value="most-liked">Most Liked</SelectItem>
                    <SelectItem value="most-commented">Most Commented</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Clear Filters */}
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                  Clear filters
                </button>
              )}
            </motion.div>

            {/* Posts Grid */}
            {filteredAndSortedPosts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredAndSortedPosts.map((post, index) => (
                  <PostCard key={post.id} post={post} index={index} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-muted-foreground">No posts found matching your criteria.</p>
                {hasFilters && (
                  <button
                    onClick={clearFilters}
                    className="mt-4 text-primary hover:underline"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Popular Tags Widget */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Popular Tags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {popularTags.length > 0 ? (
                    <div className="space-y-1">
                      {popularTags.map((tag) => (
                        <button
                          key={tag.id}
                          className={`
                            w-full text-left px-3 py-2.5 rounded-lg
                            transition-all hover:bg-secondary/50
                            ${selectedTag === tag.id ? 'bg-secondary' : ''}
                          `}
                          onClick={() => setSelectedTag(selectedTag === tag.id ? null : tag.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Hash className="h-4 w-4 text-emerald-600" />
                              <span className="font-medium">{tag.name}</span>
                            </div>
                            <div className="flex items-center gap-1 text-emerald-600">
                              <Heart className="h-3.5 w-3.5" />
                              <span className="text-xs">{tag.count}</span>
                            </div>
                          </div>
                          <div className="mt-1.5 h-0.5 bg-gradient-to-r from-emerald-500 to-emerald-300 rounded-full" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No tags yet - add tags to posts to see popular ones here</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Subscribe Widget - Only show if not subscribed */}
            {!isSubscribed && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <SubscribeForm variant="hero" />
              </motion.div>
            )}
          </aside>
        </div>
      </div>
    </Layout>
  );
};

export default PostsPage;
