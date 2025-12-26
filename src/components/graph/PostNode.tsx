import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { FileText, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

interface PostNodeData {
  label: string;
  slug: string;
  color: string;
  isSubscriberOnly?: boolean;
}

interface PostNodeProps {
  data: PostNodeData;
}

const colorClasses: Record<string, { bg: string; border: string; text: string }> = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-600 dark:text-blue-400',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    border: 'border-purple-200 dark:border-purple-800',
    text: 'text-purple-600 dark:text-purple-400',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-600 dark:text-amber-400',
  },
  rose: {
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    border: 'border-rose-200 dark:border-rose-800',
    text: 'text-rose-600 dark:text-rose-400',
  },
  cyan: {
    bg: 'bg-cyan-50 dark:bg-cyan-950/30',
    border: 'border-cyan-200 dark:border-cyan-800',
    text: 'text-cyan-600 dark:text-cyan-400',
  },
  sage: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  // Hex color fallbacks
  '#3b82f6': {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-600 dark:text-blue-400',
  },
  '#8b5cf6': {
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    border: 'border-purple-200 dark:border-purple-800',
    text: 'text-purple-600 dark:text-purple-400',
  },
  '#10b981': {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
};

export const PostNode = memo(({ data }: PostNodeProps) => {
  const colors = colorClasses[data.color] || colorClasses.sage;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: -20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -20 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`
        px-4 py-3 rounded-lg border cursor-pointer
        ${colors.bg} ${colors.border}
        shadow-soft hover:shadow-medium transition-all duration-200
        hover:-translate-y-0.5
        max-w-[180px] text-center relative
      `}
    >
      <Handle type="target" position={Position.Top} className="!bg-border" />

      {data.isSubscriberOnly && (
        <div className="flex items-center justify-center gap-1 mb-2">
          <Lock className="h-3 w-3 text-muted-foreground" />
          <span className="text-[10px] font-medium text-muted-foreground uppercase">Subscriber Only</span>
        </div>
      )}

      <div className="flex items-center gap-2">
        {data.isSubscriberOnly ? (
          <Lock className={`h-4 w-4 flex-shrink-0 ${colors.text}`} />
        ) : (
          <FileText className={`h-4 w-4 flex-shrink-0 ${colors.text}`} />
        )}
        <span className="text-xs font-medium text-foreground line-clamp-2 text-left">
          {data.label}
        </span>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-border" />
    </motion.div>
  );
});

PostNode.displayName = 'PostNode';
