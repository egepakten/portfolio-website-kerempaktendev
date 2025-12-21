import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, Plus, Pencil, Trash2, Loader2, Calendar, GitBranch, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useGitHubToken } from '@/hooks/useGitHubToken';
import { AdminDailyProgressForm } from '@/components/admin/AdminDailyProgressForm';
import { Layout } from '@/components/layout/Layout';

interface DailyProgress {
  id: string;
  date: string;
  branch_name: string;
  summary: string | null;
  learnings: string | null;
  questions: string | null;
  answers: string | null;
  changed_files: any[];
  created_at: string;
}

interface Project {
  id: string;
  repo_name: string;
  repo_owner: string;
}

export default function AdminDailyProgressPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useGitHubToken();
  
  const [project, setProject] = useState<Project | null>(null);
  const [entries, setEntries] = useState<DailyProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DailyProgress | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<DailyProgress | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    if (!id) return;
    setIsLoading(true);
    
    const [projectResult, entriesResult] = await Promise.all([
      supabase.from('projects').select('id, repo_name, repo_owner').eq('id', id).single(),
      supabase.from('daily_progress').select('*').eq('project_id', id).order('date', { ascending: false }),
    ]);

    if (projectResult.data) {
      setProject(projectResult.data);
    }
    
    if (entriesResult.data) {
      setEntries(entriesResult.data.map(e => ({
        ...e,
        changed_files: Array.isArray(e.changed_files) ? e.changed_files : [],
      })));
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleDelete = async () => {
    if (!deletingEntry) return;
    setIsDeleting(true);
    
    const { error } = await supabase
      .from('daily_progress')
      .delete()
      .eq('id', deletingEntry.id);

    if (error) {
      toast({ title: 'Failed to delete entry', variant: 'destructive' });
    } else {
      toast({ title: 'Entry deleted' });
      fetchData();
    }
    
    setIsDeleting(false);
    setDeletingEntry(null);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingEntry(null);
    fetchData();
    toast({ title: editingEntry ? 'Entry updated' : 'Entry created' });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Project not found</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Daily Progress</h1>
              <p className="text-muted-foreground">{project.repo_name}</p>
            </div>
          </div>
          {!showForm && !editingEntry && (
            <Button onClick={() => { setShowForm(true); setEditingEntry(null); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Entry
            </Button>
          )}
        </div>

        {(showForm || editingEntry) && token && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{editingEntry ? 'Edit Entry' : 'New Daily Progress'}</CardTitle>
              <CardDescription>
                {editingEntry ? `Editing entry from ${format(new Date(editingEntry.date), 'PPP')}` : 'Track your learning progress'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdminDailyProgressForm
                projectId={project.id}
                repoOwner={project.repo_owner}
                repoName={project.repo_name}
                token={token}
                editingEntry={editingEntry}
                onSuccess={handleFormSuccess}
                onCancel={() => { setShowForm(false); setEditingEntry(null); }}
              />
            </CardContent>
          </Card>
        )}

        {!showForm && !editingEntry && (
          <div className="space-y-4">
            {entries.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No daily progress entries yet. Click "Add Entry" to create one.
                </CardContent>
              </Card>
            ) : (
              entries.map((entry) => (
                <Card key={entry.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex items-center gap-1.5 text-sm">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{format(new Date(entry.date), 'PPP')}</span>
                          </div>
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <GitBranch className="w-3 h-3" />
                            {entry.branch_name}
                          </Badge>
                          {entry.changed_files.length > 0 && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              {entry.changed_files.length} files
                            </Badge>
                          )}
                        </div>
                        {entry.summary && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {entry.summary}
                          </p>
                        )}
                        {entry.learnings && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            <span className="font-medium">Learned:</span> {entry.learnings}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { setEditingEntry(entry); setShowForm(false); }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingEntry(entry)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        <AlertDialog open={!!deletingEntry} onOpenChange={() => setDeletingEntry(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Entry</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the entry from{' '}
                {deletingEntry && format(new Date(deletingEntry.date), 'PPP')}? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}
