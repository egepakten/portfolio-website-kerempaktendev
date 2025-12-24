import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Check, Circle, FileText, ExternalLink, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RoadmapNode, Post } from '@/types';

interface NodeDetailModalProps {
  open: boolean;
  onClose: () => void;
  node: RoadmapNode | null;
  posts: Post[];
  isCompleted: boolean;
  onToggleComplete: () => void;
}

export function NodeDetailModal({
  open,
  onClose,
  node,
  posts,
  isCompleted,
  onToggleComplete,
}: NodeDetailModalProps) {
  if (!node) return null;

  const nodeTypeLabels: Record<string, string> = {
    main: 'Main Topic',
    topic: 'Topic',
    subtopic: 'Subtopic',
    resource: 'Resource',
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl flex items-center gap-2">
                {node.title}
                {node.isRecommended && (
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                    <Star className="w-3 h-3 mr-1 fill-current" />
                    Recommended
                  </Badge>
                )}
                {node.isOptional && (
                  <Badge variant="outline" className="text-muted-foreground">
                    Optional
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {nodeTypeLabels[node.nodeType] || 'Topic'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Description */}
          {node.description && (
            <div>
              <p className="text-sm text-muted-foreground">{node.description}</p>
            </div>
          )}

          {/* Linked Posts */}
          {posts.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Related Posts ({posts.length})
              </h4>
              <ScrollArea className="h-[200px] pr-4">
                <div className="space-y-2">
                  {posts.map((post) => (
                    <Link
                      key={post.id}
                      to={`/posts/${post.slug}`}
                      className="block p-3 rounded-lg border bg-card hover:bg-accent transition-colors group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-1">
                            {post.title}
                          </h5>
                          {post.excerpt && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {post.excerpt}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            {post.readTime && <span>{post.readTime} min read</span>}
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary flex-shrink-0" />
                      </div>
                    </Link>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {posts.length === 0 && (
            <div className="py-8 text-center">
              <FileText className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                No posts linked to this topic yet.
              </p>
            </div>
          )}

          <Separator />

          {/* Mark as Complete */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium">Track Your Progress</h4>
              <p className="text-xs text-muted-foreground">
                Mark this topic as completed when you're done learning
              </p>
            </div>
            <Button
              variant={isCompleted ? 'default' : 'outline'}
              size="sm"
              onClick={onToggleComplete}
              className={cn(
                isCompleted && 'bg-green-600 hover:bg-green-700 text-white'
              )}
            >
              {isCompleted ? (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Completed
                </>
              ) : (
                <>
                  <Circle className="w-4 h-4 mr-1" />
                  Mark Complete
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
