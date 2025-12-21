import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { PostCard } from '@/components/blog/PostCard';
import { useBlogStore } from '@/store/blogStore';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as Icons from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Monitor: Icons.Monitor,
  Server: Icons.Server,
  Settings: Icons.Settings,
  Cloud: Icons.Cloud,
  Brain: Icons.Brain,
  Atom: Icons.Atom,
  FileType: Icons.FileType,
  Hexagon: Icons.Hexagon,
  Database: Icons.Database,
};

const colorClasses: Record<string, { bg: string; text: string }> = {
  blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
  purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400' },
  amber: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' },
  rose: { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-600 dark:text-rose-400' },
  cyan: { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-600 dark:text-cyan-400' },
  sage: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' },
};

const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const getCategoryBySlug = useBlogStore((state) => state.getCategoryBySlug);
  const getPostsByCategory = useBlogStore((state) => state.getPostsByCategory);
  const categories = useBlogStore((state) => state.categories);

  const category = slug ? getCategoryBySlug(slug) : undefined;
  const posts = slug ? getPostsByCategory(slug) : [];
  const subCategories = category ? categories.filter(c => c.parentId === category.id) : [];

  if (!category) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="font-serif text-3xl font-bold mb-4">Category Not Found</h1>
          <p className="text-muted-foreground mb-8">The category you're looking for doesn't exist.</p>
          <Link to="/">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const colors = colorClasses[category.color] || colorClasses.sage;
  const IconComponent = category.icon ? iconMap[category.icon] : null;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        {/* Back Link */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Link
            to="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Knowledge Graph
          </Link>
        </motion.div>

        {/* Category Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-4 mb-4">
            {IconComponent && (
              <div className={`p-4 rounded-xl ${colors.bg}`}>
                <IconComponent className={`h-8 w-8 ${colors.text}`} />
              </div>
            )}
            <div>
              <h1 className="font-serif text-4xl font-bold">{category.name}</h1>
              {category.description && (
                <p className="text-lg text-muted-foreground mt-2">{category.description}</p>
              )}
            </div>
          </div>

          <p className="text-muted-foreground">
            {posts.length} {posts.length === 1 ? 'post' : 'posts'} in this category
          </p>
        </motion.div>

        {/* Sub Categories */}
        {subCategories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-12"
          >
            <h2 className="font-semibold mb-4">Sub-categories</h2>
            <div className="flex flex-wrap gap-3">
              {subCategories.map((subCat) => {
                const SubIcon = subCat.icon ? iconMap[subCat.icon] : null;
                const subColors = colorClasses[subCat.color] || colorClasses.sage;
                return (
                  <Link
                    key={subCat.id}
                    to={`/category/${subCat.slug}`}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${subColors.bg} hover:opacity-80 transition-opacity`}
                  >
                    {SubIcon && <SubIcon className={`h-4 w-4 ${subColors.text}`} />}
                    <span className={`font-medium ${subColors.text}`}>{subCat.name}</span>
                    <span className={`text-sm ${subColors.text} opacity-70`}>
                      ({subCat.postCount || 0})
                    </span>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Posts Grid */}
        {posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post, index) => (
              <PostCard key={post.id} post={post} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No posts in this category yet.</p>
            <Link to="/posts" className="mt-4 text-primary hover:underline inline-block">
              Browse all posts
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CategoryPage;
