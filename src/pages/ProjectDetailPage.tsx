import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, ExternalLink, GitBranch, FileText, GitCommit, LayoutGrid, Loader2, BookOpen, Lock, RefreshCw, List } from 'lucide-react';
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
import { useAuth } from '@/contexts/AuthContext';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { subscription } = useAuth();
  const { project, isLoading } = useProject(id!);
  const { token } = useGitHubToken();

  const [readme, setReadme] = useState<string | null>(null);
  const [languages, setLanguages] = useState<Record<string, number>>({});
  const [isLoadingReadme, setIsLoadingReadme] = useState(true);
  const [isLoadingLanguages, setIsLoadingLanguages] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('readme');
  const [isSyncingReadme, setIsSyncingReadme] = useState(false);

  const isSubscribed = subscription?.is_active;

  // Extract headers from README for table of contents (skipping code blocks)
  const readmeHeaders = useMemo(() => {
    if (!readme) return [];

    // Remove code blocks before parsing headers to avoid picking up # in code
    const codeBlockRegex = /```[\s\S]*?```|`[^`\n]+`/g;
    const readmeWithoutCode = readme.replace(codeBlockRegex, '');

    const headerRegex = /^(#{1,6})\s+(.+)$/gm;
    const headers: { level: number; text: string; id: string }[] = [];
    let match;
    while ((match = headerRegex.exec(readmeWithoutCode)) !== null) {
      const level = match[1].length;
      const text = match[2].replace(/[*_`~\[\]]/g, '').trim();
      // Skip empty headers or headers that look like code comments
      if (!text || text.startsWith('//') || text.startsWith('/*')) continue;
      const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
      headers.push({ level, text, id });
    }
    return headers;
  }, [readme]);

  // Scroll to header in README (within the README container, not the whole page)
  const scrollToHeader = useCallback((headerId: string) => {
    const container = document.getElementById('readme-content');
    const element = document.getElementById(headerId);
    if (container && element) {
      const containerRect = container.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      const offsetTop = elementRect.top - containerRect.top + container.scrollTop;
      container.scrollTo({ top: offsetTop - 16, behavior: 'smooth' });
    }
  }, []);

  // Helper function to call github-api edge function
  const callGitHubApi = useCallback(async (body: Record<string, unknown>) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    const response = await fetch(`${supabaseUrl}/functions/v1/github-api`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return { data: await response.json() };
  }, []);

  // Sync README from GitHub (bypassing cache)
  const syncReadme = useCallback(async () => {
    if (!project?.github_repo_id) return;

    setIsSyncingReadme(true);
    try {
      console.log('Syncing README with forceRefresh=true for:', project.repo_name);

      const readmeRes = await callGitHubApi({
        action: 'get_readme',
        ...(token && { token }),
        owner: project.repo_owner,
        repo: project.repo_name,
        repoId: project.github_repo_id,
        forceRefresh: true,
        // Add timestamp to ensure no HTTP caching
        _t: Date.now(),
      });

      console.log('README sync response:', readmeRes);

      if (readmeRes.data?.readme) {
        const readmeContent = typeof readmeRes.data.readme === 'string'
          ? readmeRes.data.readme
          : readmeRes.data.readme?.content || '';
        console.log('Updated README content length:', readmeContent.length);
        setReadme(readmeContent);
      } else {
        console.warn('No README content in response');
      }
    } catch (error) {
      console.error('Error syncing README:', error);
    }
    setIsSyncingReadme(false);
  }, [project, token, callGitHubApi]);

  useEffect(() => {
    const fetchGitHubData = async () => {
      // Only check for project, NOT for token
      // The edge function will use server-side GITHUB_TOKEN
      if (!project?.github_repo_id) {
        setIsLoadingReadme(false);
        setIsLoadingLanguages(false);
        return;
      }

      try {
        const [readmeRes, langsRes] = await Promise.all([
          callGitHubApi({
            action: 'get_readme',
            ...(token && { token }),
            owner: project.repo_owner,
            repo: project.repo_name,
            repoId: project.github_repo_id,
          }),
          callGitHubApi({
            action: 'get_languages',
            ...(token && { token }),
            owner: project.repo_owner,
            repo: project.repo_name,
            repoId: project.github_repo_id,
          }),
        ]);

        if (readmeRes.data?.readme) {
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
  }, [project, token, callGitHubApi]);

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
            <LanguageBar languages={languages} isLoading={isLoadingLanguages} />
          </CardContent>
        </Card>

        {/* README / Timeline / Project Board Tabs - Two Column Layout */}
        <div className="flex gap-6">
          {/* Main Content Card */}
          <Card className="flex-1 min-w-0">
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
                  {isSubscribed ? (
                    <TabsTrigger value="progress" className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Daily Progress
                    </TabsTrigger>
                  ) : (
                    <button
                      onClick={() => navigate('/auth')}
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Lock className="w-4 h-4" />
                      Daily Progress
                    </button>
                  )}
                </TabsList>
              </CardHeader>
              <CardContent className="pt-6">
                <TabsContent value="readme" className="mt-0">
                  {isLoadingReadme ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : readme ? (
                    <div>
                      {/* Sync Button */}
                      <div className="flex justify-end mb-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={syncReadme}
                          disabled={isSyncingReadme}
                        >
                          <RefreshCw className={`w-4 h-4 mr-2 ${isSyncingReadme ? 'animate-spin' : ''}`} />
                          {isSyncingReadme ? 'Syncing...' : 'Sync README'}
                        </Button>
                      </div>
                      <div className="prose-custom max-w-none max-h-[600px] overflow-y-auto" id="readme-content">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            h1: ({ children, ...props }) => {
                              const text = String(children).replace(/[*_`~\[\]]/g, '').trim();
                              const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
                              return <h1 id={id} {...props}>{children}</h1>;
                            },
                            h2: ({ children, ...props }) => {
                              const text = String(children).replace(/[*_`~\[\]]/g, '').trim();
                              const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
                              return <h2 id={id} {...props}>{children}</h2>;
                            },
                            h3: ({ children, ...props }) => {
                              const text = String(children).replace(/[*_`~\[\]]/g, '').trim();
                              const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
                              return <h3 id={id} {...props}>{children}</h3>;
                            },
                            h4: ({ children, ...props }) => {
                              const text = String(children).replace(/[*_`~\[\]]/g, '').trim();
                              const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
                              return <h4 id={id} {...props}>{children}</h4>;
                            },
                            h5: ({ children, ...props }) => {
                              const text = String(children).replace(/[*_`~\[\]]/g, '').trim();
                              const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
                              return <h5 id={id} {...props}>{children}</h5>;
                            },
                            h6: ({ children, ...props }) => {
                              const text = String(children).replace(/[*_`~\[\]]/g, '').trim();
                              const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
                              return <h6 id={id} {...props}>{children}</h6>;
                            },
                          }}
                        >
                          {readme}
                        </ReactMarkdown>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-12">No README available.</p>
                  )}
                </TabsContent>
                <TabsContent value="timeline" className="mt-0">
                  {project.github_repo_id ? (
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
                  <ProjectKanban
                    repoOwner={project.repo_owner}
                    repoName={project.repo_name}
                  />
                </TabsContent>
                <TabsContent value="progress" className="mt-0">
                  <div className="max-h-[600px] overflow-y-auto">
                    <DailyProgressTimeline projectId={project.id} />
                  </div>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>

          {/* Table of Contents Card - Separate Box */}
          {activeTab === 'readme' && readmeHeaders.length > 0 && (
            <Card className="hidden lg:block w-64 flex-shrink-0 h-fit sticky top-8">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <List className="w-5 h-5" />
                  On this page
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <nav className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                  {readmeHeaders.map((header, index) => (
                    <button
                      key={index}
                      onClick={() => scrollToHeader(header.id)}
                      className={`block w-full text-left transition-colors hover:text-primary py-1 ${
                        header.level === 1 ? 'font-semibold text-foreground text-base' :
                        header.level === 2 ? 'pl-3 text-muted-foreground text-sm hover:text-foreground' :
                        header.level === 3 ? 'pl-6 text-muted-foreground text-sm' :
                        'pl-9 text-muted-foreground text-xs'
                      }`}
                      title={header.text}
                    >
                      {header.text}
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
