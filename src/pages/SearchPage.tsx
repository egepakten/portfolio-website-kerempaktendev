import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { PostCard } from '@/components/blog/PostCard';
import { useBlogStore } from '@/store/blogStore';
import { Input } from '@/components/ui/input';
import { Search as SearchIcon, ArrowLeft } from 'lucide-react';

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const searchPosts = useBlogStore((state) => state.searchPosts);
  const [results, setResults] = useState(searchPosts(initialQuery));

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setResults(searchPosts(query));
      if (query) {
        setSearchParams({ q: query });
      } else {
        setSearchParams({});
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, searchPosts, setSearchParams]);

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
            Back to Home
          </Link>
        </motion.div>

        {/* Search Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mb-12"
        >
          <h1 className="font-serif text-4xl font-bold mb-4">Search</h1>
          <p className="text-lg text-muted-foreground mb-6">
            Find posts by title, content, or tags.
          </p>
          
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search posts..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-12 h-12 text-lg"
              autoFocus
            />
          </div>
        </motion.div>

        {/* Results */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {query && (
            <p className="text-muted-foreground mb-6">
              {results.length} {results.length === 1 ? 'result' : 'results'} for "{query}"
            </p>
          )}

          {results.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((post, index) => (
                <PostCard key={post.id} post={post} index={index} />
              ))}
            </div>
          ) : query ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground mb-4">
                No posts found matching "{query}"
              </p>
              <p className="text-sm text-muted-foreground">
                Try different keywords or{' '}
                <Link to="/posts" className="text-primary hover:underline">
                  browse all posts
                </Link>
              </p>
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground">
                Start typing to search for posts
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
};

export default SearchPage;
