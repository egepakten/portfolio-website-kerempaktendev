import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, ExternalLink, GitBranch, FileText, GitCommit, LayoutGrid, Loader2, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProject } from '@/hooks/useProjects';
import { useGitHubToken } from '@/hooks/useGitHubToken';
import { ProjectTimeline } from '@/components/projects/ProjectTimeline';
import { ProjectKanban } from '@/components/projects/ProjectKanban';
import { LanguageBar } from '@/components/projects/LanguageBar';
import { DailyProgressTimeline } from '@/components/projects/DailyProgressTimeline';
import { supabase } from '@/integrations/supabase/client';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { project, isLoading } = useProject(id!);
  const { token, isLoading: isTokenLoading } = useGitHubToken();
  
  const [readme, setReadme] = useState<string | null>(null);
  const [languages, setLanguages] = useState<Record<string, number>>({});
  const [isLoadingReadme, setIsLoadingReadme] = useState(true);
  const [isLoadingLanguages, setIsLoadingLanguages] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('readme');

  useEffect(() => {
    const fetchGitHubData = async () => {
      if (!token || !project?.github_repo_id) {
        setIsLoadingReadme(false);
        setIsLoadingLanguages(false);
        return;
      }

      try {
        const [readmeRes, langsRes] = await Promise.all([
          supabase.functions.invoke('github-api', {
            body: {
              action: 'get_readme',
              token,
              owner: project.repo_owner,
              repo: project.repo_name,
              repoId: project.github_repo_id,
            },
          }),
          supabase.functions.invoke('github-api', {
            body: {
              action: 'get_languages',
              token,
              owner: project.repo_owner,
              repo: project.repo_name,
              repoId: project.github_repo_id,
            },
          }),
        ]);

        if (readmeRes.data?.readme) {
          // Handle both string and object formats (for backward compatibility with cached data)
          const readmeContent = typeof readmeRes.data.readme === 'string' 
            ? readmeRes.data.readme 
            : readmeRes.data.readme?.content || '';
          setReadme(readmeContent);
        }
        if (langsRes.data?.languages) {
          setLanguages(langsRes.data.languages);
        }
      } catch (error) {
        console.error('Error fetching GitHub data:', error);
      }
      setIsLoadingReadme(false);
      setIsLoadingLanguages(false);
    };

    if (project) {
      fetchGitHubData();
    }
  }, [project, token]);

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-6 w-full mb-8" />
          <Skeleton className="h-96 w-full" />
        </div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-serif font-bold mb-4">Project Not Found</h1>
          <Link to="/projects">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Projects
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const description = project.custom_description || project.github_description;
  const showTokenLoading = isTokenLoading && !token;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Link to="/projects" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Projects
        </Link>

        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <h1 className="text-4xl font-serif font-bold">{project.repo_name}</h1>
            <div className="flex gap-2 flex-wrap">
              {project.status && (
                <Badge 
                  variant="secondary" 
                  className={`text-sm ${
                    project.status === 'deployed' ? 'bg-primary/20 text-primary' :
                    project.status === 'testing' ? 'bg-yellow-500/20 text-yellow-700' :
                    project.status === 'paused' ? 'bg-orange-500/20 text-orange-700' :
                    project.status === 'archived' ? 'bg-muted text-muted-foreground' :
                    'bg-blue-500/20 text-blue-700'
                  }`}
                >
                  {project.status === 'in_progress' ? 'In Progress' : 
                   project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                </Badge>
              )}
              {project.is_ongoing && (
                <Badge variant="outline" className="text-sm">
                  <Clock className="w-3 h-3 mr-1" />
                  Ongoing
                </Badge>
              )}
              <a href={project.repo_url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <GitBranch className="w-4 h-4 mr-2" />
                  View on GitHub
                  <ExternalLink className="w-3 h-3 ml-2" />
                </Button>
              </a>
            </div>
          </div>

          {description && (
            <p className="text-lg text-muted-foreground mb-4">{description}</p>
          )}

          <div className="flex flex-wrap gap-2 mb-4">
            {project.hashtags?.map((tag) => (
              <Badge key={tag} className="bg-primary/10 text-primary hover:bg-primary/20">
                #{tag}
              </Badge>
            ))}
          </div>

          {project.start_date && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="w-4 h-4 mr-2" />
              Started {new Date(project.start_date).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          )}
        </header>

        {/* Languages Bar */}
        <Card className="mb-8">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Languages</CardTitle>
          </CardHeader>
          <CardContent>
            {showTokenLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <LanguageBar languages={languages} isLoading={isLoadingLanguages} />
            )}
          </CardContent>
        </Card>

        {/* README / Timeline / Project Board Tabs */}
        <Card>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <CardHeader className="pb-0">
              <TabsList className="w-fit">
                <TabsTrigger value="readme" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  README
                </TabsTrigger>
                <TabsTrigger value="timeline" className="flex items-center gap-2">
                  <GitCommit className="w-4 h-4" />
                  Timeline
                </TabsTrigger>
                <TabsTrigger value="board" className="flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4" />
                  Project Board
                </TabsTrigger>
                <TabsTrigger value="progress" className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Daily Progress
                </TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent className="pt-6">
              <TabsContent value="readme" className="mt-0">
                {showTokenLoading || isLoadingReadme ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : readme ? (
                  <div className="prose-custom max-w-none max-h-[600px] overflow-y-auto">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {readme}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-12">No README available.</p>
                )}
              </TabsContent>
              <TabsContent value="timeline" className="mt-0">
                {showTokenLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : project.github_repo_id ? (
                  <div className="max-h-[600px] overflow-y-auto">
                    <ProjectTimeline
                      repoOwner={project.repo_owner}
                      repoName={project.repo_name}
                      repoId={project.github_repo_id}
                    />
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-12">No timeline available.</p>
                )}
              </TabsContent>
              <TabsContent value="board" className="mt-0">
                {showTokenLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <ProjectKanban
                    repoOwner={project.repo_owner}
                    repoName={project.repo_name}
                  />
                )}
              </TabsContent>
              <TabsContent value="progress" className="mt-0">
                <div className="max-h-[600px] overflow-y-auto">
                  <DailyProgressTimeline projectId={project.id} />
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </Layout>
  );
}
