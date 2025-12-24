import { memo } from 'react';
import { NodeProps, NodeResizer, Handle, Position } from '@xyflow/react';
import { GripHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RoadmapNodeColor } from '@/types';

interface ContainerNodeData {
  label: string;
  description?: string;
  color: RoadmapNodeColor;
  width?: number;
  height?: number;
  readOnly?: boolean;
}

const colorStyles: Record<RoadmapNodeColor, { bg: string; border: string; text: string; header: string }> = {
  yellow: {
    bg: 'bg-yellow-50/50 dark:bg-yellow-950/20',
    border: 'border-yellow-300 dark:border-yellow-700',
    text: 'text-yellow-700 dark:text-yellow-300',
    header: 'bg-yellow-100/80 dark:bg-yellow-900/40',
  },
  purple: {
    bg: 'bg-purple-50/50 dark:bg-purple-950/20',
    border: 'border-purple-300 dark:border-purple-700',
    text: 'text-purple-700 dark:text-purple-300',
    header: 'bg-purple-100/80 dark:bg-purple-900/40',
  },
  gray: {
    bg: 'bg-gray-50/50 dark:bg-gray-900/20',
    border: 'border-gray-300 dark:border-gray-700',
    text: 'text-gray-700 dark:text-gray-300',
    header: 'bg-gray-100/80 dark:bg-gray-800/40',
  },
  green: {
    bg: 'bg-green-50/50 dark:bg-green-950/20',
    border: 'border-green-300 dark:border-green-700',
    text: 'text-green-700 dark:text-green-300',
    header: 'bg-green-100/80 dark:bg-green-900/40',
  },
  blue: {
    bg: 'bg-blue-50/50 dark:bg-blue-950/20',
    border: 'border-blue-300 dark:border-blue-700',
    text: 'text-blue-700 dark:text-blue-300',
    header: 'bg-blue-100/80 dark:bg-blue-900/40',
  },
  orange: {
    bg: 'bg-orange-50/50 dark:bg-orange-950/20',
    border: 'border-orange-300 dark:border-orange-700',
    text: 'text-orange-700 dark:text-orange-300',
    header: 'bg-orange-100/80 dark:bg-orange-900/40',
  },
};

export const ContainerNode = memo(({ data, selected }: NodeProps & { data: ContainerNodeData }) => {
  const colors = colorStyles[data.color] || colorStyles.gray;

  return (
    <div
      className={cn(
        'rounded-xl border-2 border-dashed min-w-[200px] min-h-[150px] overflow-hidden w-full h-full',
        colors.bg,
        colors.border,
        selected && 'ring-2 ring-blue-500'
      )}
    >
      <NodeResizer
        minWidth={200}
        minHeight={150}
        isVisible={selected}
        lineClassName="!border-blue-500"
        handleClassName="!w-3 !h-3 !bg-blue-500 !border-white"
      />

      {/* Connection handles - visually hidden in read-only mode but kept in DOM for edge rendering */}
      <Handle
        type="source"
        position={Position.Top}
        id="top-source"
        className={cn(
          "!w-3 !h-3 !border-2",
          data.readOnly
            ? "!opacity-0 !pointer-events-none"
            : "!bg-gray-400 dark:!bg-gray-600 !border-white dark:!border-gray-800"
        )}
      />
      <Handle
        type="target"
        position={Position.Top}
        id="top-target"
        className={cn(
          "!w-3 !h-3 !border-2",
          data.readOnly
            ? "!opacity-0 !pointer-events-none"
            : "!bg-gray-400 dark:!bg-gray-600 !border-white dark:!border-gray-800"
        )}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left-source"
        className={cn(
          "!w-3 !h-3 !border-2",
          data.readOnly
            ? "!opacity-0 !pointer-events-none"
            : "!bg-gray-400 dark:!bg-gray-600 !border-white dark:!border-gray-800"
        )}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left-target"
        className={cn(
          "!w-3 !h-3 !border-2",
          data.readOnly
            ? "!opacity-0 !pointer-events-none"
            : "!bg-gray-400 dark:!bg-gray-600 !border-white dark:!border-gray-800"
        )}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-source"
        className={cn(
          "!w-3 !h-3 !border-2",
          data.readOnly
            ? "!opacity-0 !pointer-events-none"
            : "!bg-gray-400 dark:!bg-gray-600 !border-white dark:!border-gray-800"
        )}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right-target"
        className={cn(
          "!w-3 !h-3 !border-2",
          data.readOnly
            ? "!opacity-0 !pointer-events-none"
            : "!bg-gray-400 dark:!bg-gray-600 !border-white dark:!border-gray-800"
        )}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom-source"
        className={cn(
          "!w-3 !h-3 !border-2",
          data.readOnly
            ? "!opacity-0 !pointer-events-none"
            : "!bg-gray-400 dark:!bg-gray-600 !border-white dark:!border-gray-800"
        )}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom-target"
        className={cn(
          "!w-3 !h-3 !border-2",
          data.readOnly
            ? "!opacity-0 !pointer-events-none"
            : "!bg-gray-400 dark:!bg-gray-600 !border-white dark:!border-gray-800"
        )}
      />

      {/* Drag handle header - use this class name for dragHandle */}
      <div
        className={cn(
          'drag-handle flex items-center gap-2 px-3 py-2 cursor-move rounded-t-lg',
          colors.header
        )}
      >
        <GripHorizontal className={cn('w-4 h-4 opacity-50', colors.text)} />
        <span className={cn('text-sm font-semibold', colors.text)}>
          {data.label}
        </span>
      </div>

      {/* Content area */}
      <div className="p-3">
        {data.description && (
          <div className={cn('text-xs opacity-70', colors.text)}>
            {data.description}
          </div>
        )}
      </div>
    </div>
  );
});

ContainerNode.displayName = 'ContainerNode';
