import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, Save, Check, Loader2, BookOpen, GitCommit, FolderKanban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { useProjects, Project } from '@/hooks/useProjects';
import { useGitHubToken } from '@/hooks/useGitHubToken';
import { supabase } from '@/integrations/supabase/client';

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  owner: string;
  visibility: string;
  language: string | null;
}

const PROJECT_STATUS_OPTIONS = [
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-500/20 text-blue-700' },
  { value: 'testing', label: 'Testing', color: 'bg-yellow-500/20 text-yellow-700' },
  { value: 'deployed', label: 'Deployed', color: 'bg-primary/20 text-primary' },
  { value: 'archived', label: 'Archived', color: 'bg-muted text-muted-foreground' },
  { value: 'paused', label: 'Paused', color: 'bg-orange-500/20 text-orange-700' },
];

const PROJECT_CATEGORY_OPTIONS = [
  { value: 'mini-project', label: 'Mini Project', color: 'bg-purple-500/20 text-purple-700' },
  { value: 'full-stack', label: 'Full Stack', color: 'bg-blue-500/20 text-blue-700' },
  { value: 'university', label: 'University Project', color: 'bg-indigo-500/20 text-indigo-700' },
  { value: 'library', label: 'Library/Tool', color: 'bg-emerald-500/20 text-emerald-700' },
  { value: 'prototype', label: 'Prototype', color: 'bg-amber-500/20 text-amber-700' },
  { value: 'portfolio', label: 'Portfolio Piece', color: 'bg-pink-500/20 text-pink-700' },
];

export function AdminProjectsSection() {
  const { token, isLoading: isTokenLoading, saveToken } = useGitHubToken();
  const { projects, refetch: refetchProjects, isLoading: isProjectsLoading } = useProjects(false);
  
  const [newToken, setNewToken] = useState('');
  const [isSavingToken, setIsSavingToken] = useState(false);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [updatingOngoingId, setUpdatingOngoingId] = useState<string | null>(null);
  const [updatingCategoryId, setUpdatingCategoryId] = useState<string | null>(null);
  const [fetchingInitialCommitId, setFetchingInitialCommitId] = useState<string | null>(null);

  const handleSaveToken = async () => {
    if (!newToken.trim()) return;
    
    setIsSavingToken(true);
    const success = await saveToken(newToken.trim());
    
    if (success) {
      toast({ title: 'GitHub token saved successfully' });
      setNewToken('');
    } else {
      toast({ title: 'Failed to save token', variant: 'destructive' });
    }
    setIsSavingToken(false);
  };

  const fetchRepos = async () => {
    if (!token) return;
    
    setIsLoadingRepos(true);
    try {
      const { data, error } = await supabase.functions.invoke('github-api', {
        body: { action: 'list_repos', token },
      });

      if (error) throw error;
      setRepos(data.repos || []);
    } catch (error) {
      console.error('Error fetching repos:', error);
      toast({ title: 'Failed to fetch repositories', variant: 'destructive' });
    }
    setIsLoadingRepos(false);
  };

  useEffect(() => {
    if (token) {
      fetchRepos();
    }
  }, [token]);

  const toggleProjectVisibility = async (project: Project) => {
    setTogglingId(project.id);
    const { error } = await supabase
      .from('projects')
      .update({ is_visible: !project.is_visible })
      .eq('id', project.id);

    if (error) {
      toast({ title: 'Failed to update visibility', variant: 'destructive' });
    } else {
      await refetchProjects();
    }
    setTogglingId(null);
  };

  const updateProjectStatus = async (projectId: string, status: string) => {
    setUpdatingStatusId(projectId);
    const { error } = await supabase
      .from('projects')
      .update({ status })
      .eq('id', projectId);

    if (error) {
      toast({ title: 'Failed to update status', variant: 'destructive' });
    } else {
      await refetchProjects();
      toast({ title: 'Status updated' });
    }
    setUpdatingStatusId(null);
  };

  const toggleOngoing = async (project: Project) => {
    setUpdatingOngoingId(project.id);
    const { error } = await supabase
      .from('projects')
      .update({ is_ongoing: !project.is_ongoing })
      .eq('id', project.id);

    if (error) {
      toast({ title: 'Failed to update ongoing status', variant: 'destructive' });
    } else {
      await refetchProjects();
    }
    setUpdatingOngoingId(null);
  };

  const updateProjectCategory = async (projectId: string, category: string) => {
    setUpdatingCategoryId(projectId);
    const { error } = await supabase
      .from('projects')
      .update({ category })
      .eq('id', projectId);

    if (error) {
      toast({ title: 'Failed to update category', variant: 'destructive' });
    } else {
      await refetchProjects();
      toast({ title: 'Category updated' });
    }
    setUpdatingCategoryId(null);
  };

  const fetchInitialCommit = async (project: Project) => {
    if (!token) {
      toast({ title: 'GitHub token required', variant: 'destructive' });
      return;
    }

    setFetchingInitialCommitId(project.id);
    try {
      const { data, error } = await supabase.functions.invoke('github-api', {
        body: {
          action: 'get_initial_commit',
          token,
          owner: project.repo_owner,
          repo: project.repo_name,
        },
      });

      if (error) throw error;

      if (data?.initial_commit_date) {
        const { error: updateError } = await supabase
          .from('projects')
          .update({ initial_commit_date: data.initial_commit_date })
          .eq('id', project.id);

        if (updateError) {
          toast({ title: 'Failed to save initial commit date', variant: 'destructive' });
        } else {
          await refetchProjects();
          toast({ title: `Initial commit: ${data.initial_commit_date}` });
        }
      } else {
        toast({ title: 'Could not find initial commit', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error fetching initial commit:', error);
      toast({ title: 'Failed to fetch initial commit', variant: 'destructive' });
    }
    setFetchingInitialCommitId(null);
  };

  const importRepo = async (repo: GitHubRepo) => {
    const existing = projects.find(p => p.github_repo_id === repo.id);
    if (existing) {
      toast({ title: 'Repository already imported' });
      return;
    }

    const { error } = await supabase.from('projects').insert({
      github_repo_id: repo.id,
      repo_name: repo.name,
      repo_url: repo.html_url,
      repo_owner: repo.owner.login,
      github_description: repo.description,
      is_visible: false,
      hashtags: [],
      is_ongoing: true,
      status: 'in_progress',
    });

    if (error) {
      toast({ title: 'Failed to import repository', variant: 'destructive' });
    } else {
      toast({ title: `Imported ${repo.name}` });
      await refetchProjects();
    }
  };

  const projectRepoIds = new Set(projects.map(p => p.github_repo_id));

  const getStatusBadgeClass = (status: string) => {
    const option = PROJECT_STATUS_OPTIONS.find(o => o.value === status);
    return option?.color || 'bg-muted text-muted-foreground';
  };

  return (
    <div className="space-y-6">
      {/* GitHub Token Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">GitHub Personal Access Token</CardTitle>
          <CardDescription>
            Enter your GitHub PAT to fetch repositories. Requires 'repo' and 'read:project' scopes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isTokenLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input
                    type="password"
                    placeholder={token ? '••••••••••••••••' : 'ghp_xxxxxxxxxxxx'}
                    value={newToken}
                    onChange={(e) => setNewToken(e.target.value)}
                  />
                </div>
                <Button onClick={handleSaveToken} disabled={isSavingToken || !newToken.trim()}>
                  {isSavingToken ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </>
                  )}
                </Button>
              </div>
              {token && (
                <p className="text-sm text-muted-foreground mt-2">
                  <Check className="w-4 h-4 inline mr-1 text-primary" />
                  Token is configured
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Imported Projects */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Imported Projects</CardTitle>
          <CardDescription>
            Toggle visibility and manage project status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isProjectsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : projects.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No projects imported yet. Import repositories from GitHub below.
            </p>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="p-4 bg-secondary/30 rounded-lg space-y-3"
                >
                  {/* Top row: visibility, name, ongoing */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <Switch
                        checked={project.is_visible}
                        onCheckedChange={() => toggleProjectVisibility(project)}
                        disabled={togglingId === project.id}
                      />
                      <div className="min-w-0">
                        <p className="font-medium truncate">{project.repo_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {project.is_visible ? 'Visible' : 'Hidden'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="flex items-center gap-1.5">
                        <Switch
                          checked={project.is_ongoing}
                          onCheckedChange={() => toggleOngoing(project)}
                          disabled={updatingOngoingId === project.id}
                        />
                        <span className="text-xs text-muted-foreground">Ongoing</span>
                      </div>
                      <Link to={`/admin/projects/${project.id}/daily-progress`}>
                        <Button variant="ghost" size="sm">
                          <BookOpen className="w-4 h-4 mr-1" />
                          Daily Progress
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Bottom row: category, status, initial commit */}
                  <div className="flex items-center justify-between gap-4 pt-2 border-t border-border/50">
                    <div className="flex items-center gap-3">
                      {/* Category Selector */}
                      <div className="flex items-center gap-2">
                        <FolderKanban className="w-4 h-4 text-muted-foreground" />
                        <Select
                          value={project.category || 'full-stack'}
                          onValueChange={(value) => updateProjectCategory(project.id, value)}
                          disabled={updatingCategoryId === project.id}
                        >
                          <SelectTrigger className="w-32 h-8 text-xs">
                            {updatingCategoryId === project.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <SelectValue />
                            )}
                          </SelectTrigger>
                          <SelectContent>
                            {PROJECT_CATEGORY_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                <span className="flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full ${option.color.split(' ')[0]}`} />
                                  {option.label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Status Selector */}
                      <Select
                        value={project.status || 'in_progress'}
                        onValueChange={(value) => updateProjectStatus(project.id, value)}
                        disabled={updatingStatusId === project.id}
                      >
                        <SelectTrigger className="w-32 h-8 text-xs">
                          {updatingStatusId === project.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <SelectValue />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          {PROJECT_STATUS_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <span className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${option.color.split(' ')[0]}`} />
                                {option.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Initial Commit */}
                    <div className="flex items-center gap-2">
                      {project.initial_commit_date ? (
                        <Badge variant="outline" className="text-xs">
                          <GitCommit className="w-3 h-3 mr-1" />
                          {new Date(project.initial_commit_date).toLocaleDateString()}
                        </Badge>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchInitialCommit(project)}
                          disabled={fetchingInitialCommitId === project.id || !token}
                        >
                          {fetchingInitialCommitId === project.id ? (
                            <Loader2 className="w-3 h-3 animate-spin mr-1" />
                          ) : (
                            <GitCommit className="w-3 h-3 mr-1" />
                          )}
                          Fetch Initial Commit
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      {/* GitHub Repositories */}
      {token && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">GitHub Repositories</CardTitle>
              <CardDescription>
                Import repositories from your GitHub account.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchRepos} disabled={isLoadingRepos}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingRepos ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            {isLoadingRepos ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : repos.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No repositories found.
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {repos.map((repo) => {
                  const isImported = projectRepoIds.has(repo.id);
                  return (
                    <div
                      key={repo.id}
                      className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{repo.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {repo.description || 'No description'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {repo.language && (
                          <Badge variant="outline" className="text-xs">
                            {repo.language}
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {repo.visibility}
                        </Badge>
                        {isImported ? (
                          <Badge className="bg-primary/20 text-primary">Imported</Badge>
                        ) : (
                          <Button size="sm" onClick={() => importRepo(repo)}>
                            Import
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
