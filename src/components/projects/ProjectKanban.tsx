import { useState, useEffect } from 'react';
import { RefreshCw, ExternalLink, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useGitHubToken } from '@/hooks/useGitHubToken';
import { supabase } from '@/integrations/supabase/client';

interface KanbanItem {
  id: string;
  status: string;
  priority?: string;
  estimate?: number;
  content: {
    id: string;
    number: number;
    title: string;
    state: string;
    url: string;
    labels?: { nodes: { name: string; color: string }[] };
    assignees?: { nodes: { login: string; avatarUrl: string }[] };
  } | null;
}

interface KanbanColumn {
  id: string;
  name: string;
  color: string;
  items: KanbanItem[];
}

interface KanbanBoard {
  title: string;
  columns: KanbanColumn[];
}

interface ProjectKanbanProps {
  repoOwner: string;
  repoName: string;
}

const COLUMN_COLORS: Record<string, string> = {
  GRAY: 'bg-muted',
  RED: 'bg-destructive/20',
  ORANGE: 'bg-orange-500/20',
  YELLOW: 'bg-yellow-500/20',
  GREEN: 'bg-primary/20',
  BLUE: 'bg-blue-500/20',
  PURPLE: 'bg-purple-500/20',
  PINK: 'bg-pink-500/20',
};

const PRIORITY_COLORS: Record<string, string> = {
  P0: 'bg-destructive text-destructive-foreground',
  P1: 'bg-orange-500 text-white',
  P2: 'bg-yellow-500 text-black',
  P3: 'bg-muted text-muted-foreground',
};

export function ProjectKanban({ repoOwner, repoName }: ProjectKanbanProps) {
  const { token } = useGitHubToken();
  const [board, setBoard] = useState<KanbanBoard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBoard = async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase.functions.invoke('github-api', {
        body: {
          action: 'get_project_board',
          token,
          owner: repoOwner,
          repo: repoName,
        },
      });

      if (fetchError) {
        console.error('Error fetching board:', fetchError);
        setError('Failed to fetch project board');
      } else if (data?.error) {
        setError(data.error);
      } else {
        setBoard(data?.board || null);
        setError(null);
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to fetch project board');
    }
    setIsLoading(false);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    await fetchBoard();
    setIsSyncing(false);
  };

  useEffect(() => {
    fetchBoard();
  }, [token, repoOwner, repoName]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-2">Could not load project board</p>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <Button variant="outline" size="sm" onClick={handleSync}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No GitHub Project found for this repository.</p>
        <p className="text-sm text-muted-foreground mt-2">
          Create a Project V2 in GitHub to see your kanban board here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-lg">{board.title}</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSync}
          disabled={isSyncing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
          Sync Board
        </Button>
      </div>

      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-4 pb-4">
          {board.columns.map((column) => (
            <div
              key={column.id}
              className="flex-shrink-0 w-72 rounded-lg border bg-card"
            >
              <div className={`px-3 py-2 border-b rounded-t-lg ${COLUMN_COLORS[column.color] || 'bg-muted'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{column.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {column.items.length}
                  </Badge>
                </div>
              </div>
              <div className="p-2 space-y-2 max-h-[500px] overflow-y-auto">
                {column.items.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No items
                  </p>
                ) : (
                  column.items.map((item) => (
                    <KanbanCard key={item.id} item={item} repoName={repoName} />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}

function KanbanCard({ item, repoName }: { item: KanbanItem; repoName: string }) {
  if (!item.content) return null;

  const { content, priority, estimate } = item;

  return (
    <a
      href={content.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-3 rounded-md border bg-background hover:bg-accent/50 transition-colors group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-xs text-muted-foreground">
          {repoName} #{content.number}
        </span>
        <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <p className="text-sm font-medium line-clamp-2 mb-2 whitespace-normal">
        {content.title}
      </p>
      <div className="flex flex-wrap gap-1">
        {priority && (
          <Badge className={`text-xs ${PRIORITY_COLORS[priority] || 'bg-muted'}`}>
            {priority}
          </Badge>
        )}
        {estimate !== undefined && (
          <Badge variant="outline" className="text-xs">
            {estimate}
          </Badge>
        )}
        {content.labels?.nodes.slice(0, 2).map((label) => (
          <Badge
            key={label.name}
            variant="outline"
            className="text-xs"
            style={{ borderColor: `#${label.color}`, color: `#${label.color}` }}
          >
            {label.name.length > 10 ? label.name.substring(0, 10) + '...' : label.name}
          </Badge>
        ))}
      </div>
      {content.assignees?.nodes && content.assignees.nodes.length > 0 && (
        <div className="flex mt-2 -space-x-1">
          {content.assignees.nodes.map((assignee) => (
            <img
              key={assignee.login}
              src={assignee.avatarUrl}
              alt={assignee.login}
              className="w-5 h-5 rounded-full border border-background"
              title={assignee.login}
            />
          ))}
        </div>
      )}
    </a>
  );
}
