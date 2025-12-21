import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Pencil, RefreshCw, Save, Check, Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
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

export default function AdminProjectsPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { token, isLoading: isTokenLoading, saveToken } = useGitHubToken();
  const { projects, refetch: refetchProjects } = useProjects(false);
  
  const [newToken, setNewToken] = useState('');
  const [isSavingToken, setIsSavingToken] = useState(false);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

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

  const importRepo = async (repo: GitHubRepo) => {
    // Check if already imported
    const existing = projects.find(p => p.github_repo_id === repo.id);
    if (existing) {
      toast({ title: 'Repository already imported' });
      return;
    }

    const { error } = await supabase.from('projects').insert({
      github_repo_id: repo.id,
      repo_name: repo.name,
      repo_url: repo.html_url,
      repo_owner: repo.owner,
      github_description: repo.description,
      is_visible: false,
      hashtags: [],
      is_ongoing: true,
    });

    if (error) {
      toast({ title: 'Failed to import repository', variant: 'destructive' });
    } else {
      toast({ title: `Imported ${repo.name}` });
      await refetchProjects();
    }
  };

  const projectRepoIds = new Set(projects.map(p => p.github_repo_id));

  if (!isAdmin) return null;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="mb-8">
          <h1 className="text-3xl font-serif font-bold mb-2">Manage Projects</h1>
          <p className="text-muted-foreground">
            Connect your GitHub account and manage which projects are visible on your site.
          </p>
        </header>

        {/* GitHub Token Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">GitHub Personal Access Token</CardTitle>
            <CardDescription>
              Enter your GitHub PAT to fetch repositories. Requires 'repo' and 'read:project' scopes.
            </CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* Imported Projects */}
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Imported Projects</CardTitle>
              <CardDescription>
                Toggle visibility to show/hide projects on the public page.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No projects imported yet. Import repositories from GitHub below.
              </p>
            ) : (
              <div className="space-y-3">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={project.is_visible}
                        onCheckedChange={() => toggleProjectVisibility(project)}
                        disabled={togglingId === project.id}
                      />
                      <div>
                        <p className="font-medium">{project.repo_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {project.is_visible ? 'Visible' : 'Hidden'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link to={`/admin/projects/${project.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Link to={`/admin/projects/${project.id}/progress`}>
                        <Button variant="ghost" size="sm">
                          Progress
                        </Button>
                      </Link>
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
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
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
                        <div>
                          <p className="font-medium">{repo.name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {repo.description || 'No description'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
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
    </Layout>
  );
}