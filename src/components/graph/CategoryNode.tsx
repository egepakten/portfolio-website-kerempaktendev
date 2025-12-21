import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { motion } from 'framer-motion';
import {
  Monitor,
  Server,
  Settings,
  Cloud,
  Brain,
  Atom,
  FileType,
  Hexagon,
  Database,
  LucideIcon,
  ChevronDown,
} from 'lucide-react';

interface CategoryNodeData {
  label: string;
  description?: string;
  color: string;
  icon?: string;
  postCount: number;
  slug: string;
  isExpanded?: boolean;
}

interface CategoryNodeProps {
  data: CategoryNodeData;
}

const iconMap: Record<string, LucideIcon> = {
  Monitor,
  Server,
  Settings,
  Cloud,
  Brain,
  Atom,
  FileType,
  Hexagon,
  Database,
};

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
};

export const CategoryNode = memo(({ data }: CategoryNodeProps) => {
  const colors = colorClasses[data.color] || colorClasses.sage;
  const IconComponent = data.icon ? iconMap[data.icon] : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`
        px-6 py-4 rounded-xl border-2 cursor-pointer
        ${colors.bg} ${colors.border}
        shadow-soft hover:shadow-medium transition-all duration-200
        hover:-translate-y-0.5
        min-w-[160px] text-center
      `}
    >
      <Handle type="target" position={Position.Top} className="!bg-border" />

      <div className="flex flex-col items-center gap-2">
        {IconComponent && (
          <div className={`p-2 rounded-lg ${colors.bg} ${colors.text}`}>
            <IconComponent className="h-5 w-5" />
          </div>
        )}
        <div>
          <h3 className="font-semibold text-foreground text-sm">{data.label}</h3>
          <div className="flex items-center justify-center gap-1 mt-1">
            <p className={`text-xs ${colors.text}`}>
              {data.postCount} {data.postCount === 1 ? 'post' : 'posts'}
            </p>
            <motion.div
              animate={{ rotate: data.isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className={`h-3 w-3 ${colors.text}`} />
            </motion.div>
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-border" />
    </motion.div>
  );
});

CategoryNode.displayName = 'CategoryNode';
