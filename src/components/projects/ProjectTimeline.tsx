import { useState, useEffect } from 'react';
import { GitCommit, GitBranch, Calendar, ExternalLink, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useGitHubToken } from '@/hooks/useGitHubToken';

interface Commit {
  sha: string;
  message: string;
  author_date: string;
  html_url: string;
  author_name: string;
}

interface GroupedCommits {
  date: string;
  commits: Commit[];
}

interface Branch {
  name: string;
  protected: boolean;
}

interface ProjectTimelineProps {
  repoOwner: string;
  repoName: string;
  repoId: number;
}

export function ProjectTimeline({ 
  repoOwner, 
  repoName, 
  repoId,
}: ProjectTimelineProps) {
  const { token } = useGitHubToken();
  const [commits, setCommits] = useState<GroupedCommits[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('main');
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  const fetchBranches = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('github-api', {
        body: {
          action: 'get_branches',
          ...(token && { token }),
          owner: repoOwner,
          repo: repoName,
        },
      });

      if (error) throw error;

      if (data?.branches) {
        setBranches(data.branches);
        // Set default branch if main doesn't exist
        if (!data.branches.find((b: Branch) => b.name === 'main')) {
          const defaultBranch = data.branches.find((b: Branch) => b.name === 'master') || data.branches[0];
          if (defaultBranch) {
            setSelectedBranch(defaultBranch.name);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchCommits = async (forceRefresh = false) => {
    if (!repoId) {
      setIsLoading(false);
      return;
    }

    if (forceRefresh) {
      setIsSyncing(true);
    }

    try {
      const { data, error } = await supabase.functions.invoke('github-api', {
        body: {
          action: 'get_commits',
          ...(token && { token }),
          owner: repoOwner,
          repo: repoName,
          repoId,
          forceRefresh,
          branch: selectedBranch,
        },
      });

      if (error) throw error;

      if (data?.commits) {
        const grouped = groupCommitsByDate(data.commits);
        setCommits(grouped);
        
        const firstThree = grouped.slice(0, 3).map(g => g.date);
        setExpandedDates(new Set(firstThree));
      }
    } catch (error) {
      console.error('Error fetching commits:', error);
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, [repoOwner, repoName]);

  useEffect(() => {
    if (selectedBranch) {
      setIsLoading(true);
      fetchCommits();
    }
  }, [token, repoId, repoOwner, repoName, selectedBranch]);

  const groupCommitsByDate = (commits: Commit[]): GroupedCommits[] => {
    const groups: Record<string, Commit[]> = {};
    
    commits.forEach(commit => {
      const date = new Date(commit.author_date).toISOString().split('T')[0];
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(commit);
    });

    return Object.entries(groups)
      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
      .map(([date, commits]) => ({ date, commits }));
  };

  const toggleDate = (date: string) => {
    setExpandedDates(prev => {
      const next = new Set(prev);
      if (next.has(date)) {
        next.delete(date);
      } else {
        next.add(date);
      }
      return next;
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-28" />
        </div>
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-muted-foreground" />
          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select branch" />
            </SelectTrigger>
            <SelectContent>
              {branches.map(branch => (
                <SelectItem key={branch.name} value={branch.name}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => fetchCommits(true)}
          disabled={isSyncing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
          Sync Commits
        </Button>
      </div>

      {/* Timeline */}
      {commits.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">No commits found for branch "{selectedBranch}".</p>
      ) : (
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

          <div className="space-y-6">
            {commits.map((group, groupIndex) => {
              const isExpanded = expandedDates.has(group.date);
              const colors = [
                'bg-primary text-primary-foreground',
                'bg-accent text-accent-foreground',
                'bg-secondary text-secondary-foreground',
              ];
              const colorClass = colors[groupIndex % colors.length];

              return (
                <Collapsible
                  key={group.date}
                  open={isExpanded}
                  onOpenChange={() => toggleDate(group.date)}
                >
                  <div className="relative pl-14">
                    <div className={`absolute left-3 w-7 h-7 rounded-full ${colorClass} flex items-center justify-center z-10`}>
                      <Calendar className="w-4 h-4" />
                    </div>

                    <CollapsibleTrigger asChild>
                      <button className="w-full text-left group">
                        <div className={`p-4 rounded-lg border ${colorClass.includes('primary') ? 'border-primary/30 bg-primary/5' : colorClass.includes('accent') ? 'border-accent/30 bg-accent/5' : 'border-border bg-secondary/30'} hover:shadow-md transition-all`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-foreground">
                                {formatDate(group.date)}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {group.commits.length} commit{group.commits.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                <GitBranch className="w-3 h-3 mr-1" />
                                {selectedBranch}
                              </Badge>
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="mt-2 ml-4 space-y-2 border-l-2 border-dashed border-border pl-4">
                        {group.commits.map(commit => (
                          <div 
                            key={commit.sha}
                            className="p-3 bg-muted/50 rounded-md hover:bg-muted transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {commit.message.split('\n')[0]}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {commit.author_name} • {new Date(commit.author_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                              <a 
                                href={commit.html_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </div>
                            <Badge variant="outline" className="mt-2 text-xs font-mono">
                              {commit.sha.slice(0, 7)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}