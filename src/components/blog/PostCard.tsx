import { Link } from 'react-router-dom';
import { Clock, Hash } from 'lucide-react';
import { Post } from '@/types';
import { motion } from 'framer-motion';

interface PostCardProps {
  post: Post;
  index?: number;
}

export const PostCard = ({ post, index = 0 }: PostCardProps) => {
  const formattedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="group"
    >
      <Link to={`/posts/${post.slug}`} className="block">
        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-soft hover:shadow-medium transition-all duration-300 group-hover:-translate-y-1">
          {post.coverImage && (
            <div className="aspect-[16/9] overflow-hidden">
              <img
                src={post.coverImage}
                alt={post.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          )}
          <div className="p-6">
            {/* Category */}
            {post.category && (
              <span className="tag-pill tag-pill-blue mb-3">
                {post.category.name}
              </span>
            )}

            {/* Title */}
            <h3 className="font-serif text-xl font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
              {post.title}
            </h3>

            {/* Excerpt */}
            {post.excerpt && (
              <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                {post.excerpt}
              </p>
            )}

            {/* Meta */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{formattedDate}</span>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{post.readTime || 5} min read</span>
              </div>
            </div>

            {/* Tags - inside the card */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
                {post.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  >
                    <Hash className="h-3 w-3" />
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.article>
  );
};
