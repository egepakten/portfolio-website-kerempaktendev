import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar, GitBranch, FileText, ChevronDown, ChevronRight, ExternalLink, Loader2, HelpCircle, Lightbulb } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface ChangedFile {
  filename: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  additions: number;
  deletions: number;
  patch_url: string;
  reviewed: boolean;
}

interface DailyProgressEntry {
  id: string;
  date: string;
  branch_name: string;
  changed_files: ChangedFile[];
  summary: string;
  learnings: string;
  questions: string;
  answers: string;
  created_at: string;
}

interface DailyProgressTimelineProps {
  projectId: string;
}

export function DailyProgressTimeline({ projectId }: DailyProgressTimelineProps) {
  const [entries, setEntries] = useState<DailyProgressEntry[]>([]);
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('daily_progress')
          .select('*')
          .eq('project_id', projectId)
          .order('date', { ascending: false });

        if (error) throw error;
        
        // Type assertion for the jsonb field
        const typedData = (data || []).map(entry => ({
          ...entry,
          changed_files: (Array.isArray(entry.changed_files) ? entry.changed_files : []) as unknown as ChangedFile[],
        }));
        
        setEntries(typedData);
      } catch (error) {
        console.error('Error fetching daily progress:', error);
      }
      setIsLoading(false);
    };

    fetchProgress();
  }, [projectId]);

  const toggleExpanded = (id: string) => {
    setExpandedEntries(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      added: 'bg-primary/20 text-primary',
      modified: 'bg-yellow-500/20 text-yellow-700',
      deleted: 'bg-destructive/20 text-destructive',
      renamed: 'bg-blue-500/20 text-blue-700',
    };
    return styles[status] || 'bg-muted text-muted-foreground';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No daily progress entries yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => {
        const isExpanded = expandedEntries.has(entry.id);
        const fileCount = entry.changed_files?.length || 0;

        return (
          <Card key={entry.id}>
            <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(entry.id)}>
              <CollapsibleTrigger asChild>
                <CardContent className="p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {format(new Date(entry.date), 'MMMM d, yyyy')}
                        </div>
                        <Badge variant="outline" className="font-mono text-xs">
                          <GitBranch className="w-3 h-3 mr-1" />
                          {entry.branch_name}
                        </Badge>
                        <Badge variant="secondary">
                          {fileCount} file{fileCount !== 1 ? 's' : ''} changed
                        </Badge>
                      </div>
                      {entry.summary && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {entry.summary}
                        </p>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" className="shrink-0">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <CardContent className="pt-0 pb-4 px-4 space-y-4">
                  {/* Full Summary */}
                  {entry.summary && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Summary</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {entry.summary}
                      </p>
                    </div>
                  )}

                  {/* Changed Files */}
                  {fileCount > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Changed Files</h4>
                      <div className="border rounded-lg divide-y max-h-[200px] overflow-y-auto">
                        {entry.changed_files.map((file, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2 text-sm hover:bg-muted/50"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className={cn(
                                "font-mono truncate",
                                file.reviewed && "line-through text-muted-foreground"
                              )}>
                                {file.filename}
                              </span>
                              <Badge variant="secondary" className={cn("text-xs shrink-0", getStatusBadge(file.status))}>
                                {file.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 ml-2">
                              <span className="text-xs text-primary">+{file.additions}</span>
                              <span className="text-xs text-destructive">-{file.deletions}</span>
                              {file.patch_url && (
                                <a
                                  href={file.patch_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-muted-foreground hover:text-foreground"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Learnings */}
                  {entry.learnings && (
                    <div>
                      <h4 className="text-sm font-medium mb-1 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-yellow-500" />
                        What I Learned
                      </h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {entry.learnings}
                      </p>
                    </div>
                  )}

                  {/* Questions & Answers */}
                  {entry.questions && (
                    <div>
                      <h4 className="text-sm font-medium mb-1 flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-blue-500" />
                        Questions
                      </h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {entry.questions}
                      </p>
                      {entry.answers && (
                        <div className="mt-2 pl-4 border-l-2 border-primary/50">
                          <p className="text-sm font-medium text-primary">Answer:</p>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {entry.answers}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        );
      })}
    </div>
  );
}