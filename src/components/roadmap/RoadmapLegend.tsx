import { Check, Star, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export function RoadmapLegend() {
  const items = [
    {
      label: 'Recommended',
      icon: Star,
      className: 'bg-purple-100 dark:bg-purple-900/40 border-purple-400 ring-2 ring-purple-500',
      iconClassName: 'text-purple-600 fill-purple-600',
    },
    {
      label: 'Optional',
      icon: null,
      className: 'bg-gray-100 dark:bg-gray-800/40 border-gray-400 border-dashed opacity-80',
    },
    {
      label: 'Completed',
      icon: Check,
      className: 'bg-green-100 dark:bg-green-900/40 border-green-400',
      iconClassName: 'text-green-600',
    },
    {
      label: 'Default Path',
      icon: Minus,
      className: 'border-gray-500',
      iconClassName: 'text-gray-500',
      isLine: true,
    },
    {
      label: 'Optional Path',
      icon: Minus,
      className: 'border-gray-400 border-dashed',
      iconClassName: 'text-gray-400',
      isLine: true,
    },
  ];

  return (
    <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
      <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
        Legend
      </h4>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-xs">
            {item.isLine ? (
              <div className={cn('w-6 h-0.5 border-t-2', item.className)} />
            ) : (
              <div
                className={cn(
                  'w-6 h-6 rounded border-2 flex items-center justify-center',
                  item.className
                )}
              >
                {item.icon && <item.icon className={cn('w-3 h-3', item.iconClassName)} />}
              </div>
            )}
            <span className="text-foreground">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
