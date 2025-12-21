import { useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { PostCard } from '@/components/blog/PostCard';
import { SubscribeForm } from '@/components/blog/SubscribeForm';
import { KnowledgeGraph } from '@/components/graph/KnowledgeGraph';
import { useBlogStore } from '@/store/blogStore';
import { useSiteSettingsStore } from '@/store/siteSettingsStore';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const posts = useBlogStore((state) => state.posts);
  const publishedPosts = useMemo(() => posts.filter((p) => p.status === 'published'), [posts]);
  const recentPosts = useMemo(() => publishedPosts.slice(0, 3), [publishedPosts]);
  const { subscription } = useAuth();
  const { settings, fetchSettings } = useSiteSettingsStore();
  
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);
  
  // Check if user is subscribed - either via auth context or anonymous subscription
  const isSubscribed = subscription?.is_active;

  return (
    <Layout>
      {/* Hero Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              <span>Navigate Knowledge Visually</span>
            </div>
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 text-balance">
              Welcome to <span className="text-primary">{settings.site_name}&apos;s Blog</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {settings.site_description}
            </p>
          </motion.div>

          {/* Knowledge Graph */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <KnowledgeGraph />
          </motion.div>
        </div>
      </section>

      {/* Recent Posts */}
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-serif text-3xl font-semibold mb-2">Recent Posts</h2>
              <p className="text-muted-foreground">Latest thoughts and tutorials</p>
            </div>
            <Link to="/posts">
              <Button variant="ghost" className="group">
                View all
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentPosts.map((post, index) => (
              <PostCard key={post.id} post={post} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Subscribe Section - Only show if not subscribed */}
      {!isSubscribed && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <SubscribeForm />
          </div>
        </section>
      )}
    </Layout>
  );
};

export default Index;
