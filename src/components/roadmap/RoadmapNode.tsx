import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Check, Star, FileText, Box, Circle, Square, Triangle, Hexagon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { RoadmapNodeColor, RoadmapNodeType } from '@/types';

interface RoadmapNodeData {
  label: string;
  description?: string;
  nodeType: RoadmapNodeType;
  color: RoadmapNodeColor;
  icon?: string;
  isOptional: boolean;
  isRecommended: boolean;
  isContainer: boolean;
  isCompleted?: boolean;
  postCount?: number;
  width?: number;
  height?: number;
}

const colorStyles: Record<RoadmapNodeColor, { bg: string; border: string; text: string; hover: string }> = {
  yellow: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/40',
    border: 'border-yellow-400 dark:border-yellow-600',
    text: 'text-yellow-800 dark:text-yellow-200',
    hover: 'hover:bg-yellow-200 dark:hover:bg-yellow-900/60',
  },
  purple: {
    bg: 'bg-purple-100 dark:bg-purple-900/40',
    border: 'border-purple-400 dark:border-purple-600',
    text: 'text-purple-800 dark:text-purple-200',
    hover: 'hover:bg-purple-200 dark:hover:bg-purple-900/60',
  },
  gray: {
    bg: 'bg-gray-100 dark:bg-gray-800/40',
    border: 'border-gray-400 dark:border-gray-600',
    text: 'text-gray-700 dark:text-gray-300',
    hover: 'hover:bg-gray-200 dark:hover:bg-gray-800/60',
  },
  green: {
    bg: 'bg-green-100 dark:bg-green-900/40',
    border: 'border-green-400 dark:border-green-600',
    text: 'text-green-800 dark:text-green-200',
    hover: 'hover:bg-green-200 dark:hover:bg-green-900/60',
  },
  blue: {
    bg: 'bg-blue-100 dark:bg-blue-900/40',
    border: 'border-blue-400 dark:border-blue-600',
    text: 'text-blue-800 dark:text-blue-200',
    hover: 'hover:bg-blue-200 dark:hover:bg-blue-900/60',
  },
  orange: {
    bg: 'bg-orange-100 dark:bg-orange-900/40',
    border: 'border-orange-400 dark:border-orange-600',
    text: 'text-orange-800 dark:text-orange-200',
    hover: 'hover:bg-orange-200 dark:hover:bg-orange-900/60',
  },
};

const nodeTypeStyles: Record<RoadmapNodeType, string> = {
  main: 'text-base font-bold px-6 py-4',
  topic: 'text-sm font-semibold px-4 py-3',
  subtopic: 'text-sm font-medium px-4 py-2',
  resource: 'text-xs font-normal px-3 py-2',
};

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  box: Box,
  circle: Circle,
  square: Square,
  triangle: Triangle,
  hexagon: Hexagon,
  file: FileText,
};

export const RoadmapNode = memo(({ data, selected }: NodeProps & { data: RoadmapNodeData }) => {
  const colors = colorStyles[data.color] || colorStyles.yellow;
  const typeStyle = nodeTypeStyles[data.nodeType] || nodeTypeStyles.topic;
  const IconComponent = data.icon ? iconMap[data.icon] || FileText : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'rounded-lg border-2 cursor-pointer transition-all duration-200',
        'min-w-[120px] max-w-[220px] text-center relative',
        colors.bg,
        colors.border,
        colors.hover,
        typeStyle,
        data.isOptional && 'border-dashed opacity-80',
        data.isRecommended && 'ring-2 ring-purple-500 ring-offset-2 dark:ring-offset-gray-900',
        selected && 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900',
        data.isCompleted && 'ring-2 ring-green-500'
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-gray-400 dark:!bg-gray-600 !border-2 !border-white dark:!border-gray-800"
      />

      {/* Completed Badge */}
      {data.isCompleted && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-md z-10"
        >
          <Check className="w-4 h-4 text-white" />
        </motion.div>
      )}

      {/* Recommended Badge */}
      {data.isRecommended && !data.isCompleted && (
        <div className="absolute -top-2 -left-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center shadow-md z-10">
          <Star className="w-3 h-3 text-white fill-white" />
        </div>
      )}

      <div className="flex items-center justify-center gap-2">
        {IconComponent && (
          <IconComponent className={cn('flex-shrink-0', colors.text, data.nodeType === 'main' ? 'w-5 h-5' : 'w-4 h-4')} />
        )}
        <span className={cn('line-clamp-2', colors.text)}>{data.label}</span>
      </div>

      {data.postCount !== undefined && data.postCount > 0 && (
        <div className={cn('mt-1 text-xs opacity-70 flex items-center justify-center gap-1', colors.text)}>
          <FileText className="w-3 h-3" />
          <span>{data.postCount} post{data.postCount > 1 ? 's' : ''}</span>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-gray-400 dark:!bg-gray-600 !border-2 !border-white dark:!border-gray-800"
      />
    </motion.div>
  );
});

RoadmapNode.displayName = 'RoadmapNode';
