import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { PostCard } from '@/components/blog/PostCard';
import { useBlogStore } from '@/store/blogStore';
import { ArrowLeft, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TagPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const tags = useBlogStore((state) => state.tags);
  const getPostsByTag = useBlogStore((state) => state.getPostsByTag);
  
  const tag = tags.find(t => t.slug === slug);
  const posts = slug ? getPostsByTag(slug) : [];

  if (!tag) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="font-serif text-3xl font-bold mb-4">Tag Not Found</h1>
          <p className="text-muted-foreground mb-8">The tag you're looking for doesn't exist.</p>
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

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <Link
            to="/posts"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Posts
          </Link>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-muted">
              <Hash className="h-6 w-6 text-primary" />
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold">
              {tag.name}
            </h1>
          </div>
          
          <p className="text-muted-foreground">
            {posts.length} {posts.length === 1 ? 'post' : 'posts'} tagged with #{tag.name}
          </p>
        </motion.div>

        {/* Posts Grid */}
        {posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post, index) => (
              <PostCard key={post.id} post={post} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No posts found with this tag.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TagPage;
