import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Loader2, Check, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
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
  summary: string | null;
  learnings: string | null;
  questions: string | null;
  answers: string | null;
  changed_files: any[];
}

interface AdminDailyProgressFormProps {
  projectId: string;
  repoOwner: string;
  repoName: string;
  token: string;
  editingEntry?: DailyProgressEntry | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AdminDailyProgressForm({
  projectId,
  repoOwner,
  repoName,
  token,
  editingEntry,
  onSuccess,
  onCancel,
}: AdminDailyProgressFormProps) {
  const { toast } = useToast();
  const [date, setDate] = useState<Date>(editingEntry ? new Date(editingEntry.date) : new Date());
  const [branches, setBranches] = useState<{ name: string; protected: boolean }[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>(editingEntry?.branch_name || '');
  const [changedFiles, setChangedFiles] = useState<ChangedFile[]>(editingEntry?.changed_files || []);
  const [summary, setSummary] = useState(editingEntry?.summary || '');
  const [learnings, setLearnings] = useState(editingEntry?.learnings || '');
  const [questions, setQuestions] = useState(editingEntry?.questions || '');
  const [answers, setAnswers] = useState(editingEntry?.answers || '');
  
  const [isLoadingBranches, setIsLoadingBranches] = useState(true);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFilesExpanded, setIsFilesExpanded] = useState(true);

  // Fetch branches on mount
  useEffect(() => {
    const fetchBranches = async () => {
      setIsLoadingBranches(true);
      try {
        const { data, error } = await supabase.functions.invoke('github-api', {
          body: {
            action: 'get_branches',
            token,
            owner: repoOwner,
            repo: repoName,
          },
        });

        if (error) throw error;
        setBranches(data?.branches || []);
        if (data?.branches?.length > 0) {
          setSelectedBranch(data.branches[0].name);
        }
      } catch (error) {
        console.error('Error fetching branches:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch branches',
          variant: 'destructive',
        });
      }
      setIsLoadingBranches(false);
    };

    fetchBranches();
  }, [token, repoOwner, repoName]);

  // Fetch commits and files when branch or date changes
  useEffect(() => {
    if (!selectedBranch || !date) return;

    const fetchFilesForDate = async () => {
      setIsLoadingFiles(true);
      setChangedFiles([]);

      try {
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);

        // Get commits for the selected date
        const { data: commitsData, error: commitsError } = await supabase.functions.invoke('github-api', {
          body: {
            action: 'get_commits_by_date',
            token,
            owner: repoOwner,
            repo: repoName,
            branch: selectedBranch,
            since: dayStart.toISOString(),
            until: dayEnd.toISOString(),
          },
        });

        if (commitsError) throw commitsError;

        const commits = commitsData?.commits || [];
        if (commits.length === 0) {
          setIsLoadingFiles(false);
          return;
        }

        // Fetch file details for each commit
        const allFiles: ChangedFile[] = [];
        const seenFiles = new Set<string>();

        for (const commit of commits) {
          const { data: details, error: detailsError } = await supabase.functions.invoke('github-api', {
            body: {
              action: 'get_commit_details',
              token,
              owner: repoOwner,
              repo: repoName,
              sha: commit.sha,
            },
          });

          if (detailsError) continue;

          for (const file of details?.files || []) {
            if (!seenFiles.has(file.filename)) {
              seenFiles.add(file.filename);
              allFiles.push({
                filename: file.filename,
                status: file.status,
                additions: file.additions,
                deletions: file.deletions,
                patch_url: file.patch_url,
                reviewed: false,
              });
            }
          }
        }

        setChangedFiles(allFiles);
      } catch (error) {
        console.error('Error fetching files:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch file changes',
          variant: 'destructive',
        });
      }
      setIsLoadingFiles(false);
    };

    fetchFilesForDate();
  }, [selectedBranch, date, token, repoOwner, repoName]);

  const toggleFileReviewed = (filename: string) => {
    setChangedFiles(prev =>
      prev.map(f =>
        f.filename === filename ? { ...f, reviewed: !f.reviewed } : f
      )
    );
  };

  const handleSave = async () => {
    if (!summary.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a summary of changes',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        project_id: projectId,
        date: format(date, 'yyyy-MM-dd'),
        branch_name: selectedBranch,
        changed_files: JSON.parse(JSON.stringify(changedFiles)),
        summary,
        learnings,
        questions,
        answers: answers || null,
      };

      let error;
      if (editingEntry) {
        const result = await supabase
          .from('daily_progress')
          .update(payload)
          .eq('id', editingEntry.id);
        error = result.error;
      } else {
        const result = await supabase.from('daily_progress').insert([payload]);
        error = result.error;
      }

      if (error) throw error;

      toast({
        title: 'Success',
        description: editingEntry ? 'Daily progress updated' : 'Daily progress saved successfully',
      });

      onSuccess?.();
    } catch (error) {
      console.error('Error saving daily progress:', error);
      toast({
        title: 'Error',
        description: 'Failed to save daily progress',
        variant: 'destructive',
      });
    }
    setIsSaving(false);
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

  return (
    <div className="space-y-6">
        {/* Date and Branch Selection */}
        <div className="flex flex-wrap gap-4">
          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[200px] justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  disabled={(d) => d > new Date()}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Branch</Label>
            {isLoadingBranches ? (
              <div className="flex items-center gap-2 h-10">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading branches...</span>
              </div>
            ) : (
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.name} value={b.name}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Changed Files Panel */}
        <Collapsible open={isFilesExpanded} onOpenChange={setIsFilesExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
              <Label className="cursor-pointer">Changed Files ({changedFiles.length})</Label>
              {isFilesExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            {isLoadingFiles ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : changedFiles.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No file changes found for this date and branch.
              </p>
            ) : (
              <div className="border rounded-lg divide-y max-h-[300px] overflow-y-auto">
                {changedFiles.map((file) => (
                  <div
                    key={file.filename}
                    className="flex items-center justify-between p-3 hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Checkbox
                        checked={file.reviewed}
                        onCheckedChange={() => toggleFileReviewed(file.filename)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm font-mono truncate",
                          file.reviewed && "line-through text-muted-foreground"
                        )}>
                          {file.filename}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className={getStatusBadge(file.status)}>
                            {file.status}
                          </Badge>
                          <span className="text-xs text-primary">+{file.additions}</span>
                          <span className="text-xs text-destructive">-{file.deletions}</span>
                        </div>
                      </div>
                    </div>
                    {file.patch_url && (
                      <a
                        href={file.patch_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Reflection Notes */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="summary">Summary of Changes *</Label>
            <Textarea
              id="summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="What was done today?"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="learnings">What I Learned</Label>
            <Textarea
              id="learnings"
              value={learnings}
              onChange={(e) => setLearnings(e.target.value)}
              placeholder="What did you learn from these changes?"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="questions">Questions / Unclear Parts</Label>
            <Textarea
              id="questions"
              value={questions}
              onChange={(e) => setQuestions(e.target.value)}
              placeholder="Any questions or things you're unsure about?"
              rows={3}
            />
          </div>

          {editingEntry && (
            <div className="space-y-2">
              <Label htmlFor="answers">Answers (fill in when understood)</Label>
              <Textarea
                id="answers"
                value={answers}
                onChange={(e) => setAnswers(e.target.value)}
                placeholder="Add answers to your questions later..."
                rows={3}
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                {editingEntry ? 'Update Progress' : 'Save Progress'}
              </>
            )}
          </Button>
        </div>
    </div>
  );
}