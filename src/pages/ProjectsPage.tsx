import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Calendar, Clock } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useProjects, Project } from '@/hooks/useProjects';
import { useGitHubToken } from '@/hooks/useGitHubToken';
import { supabase } from '@/integrations/supabase/client';

interface ProjectWithLanguages extends Project {
  languages?: Record<string, number>;
}

const ProjectCard = ({ project }: { project: ProjectWithLanguages }) => {
  const description = project.custom_description || project.github_description;
  const topLanguages = project.languages 
    ? Object.entries(project.languages)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([lang]) => lang)
    : [];

  return (
    <Link to={`/projects/${project.id}`}>
      <Card className="h-full hover:shadow-medium transition-all duration-200 group cursor-pointer">
        <CardContent className="p-6 flex flex-col h-full">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-serif text-xl font-semibold group-hover:text-primary transition-colors">
              {project.repo_name}
            </h3>
            <div className="flex gap-1 flex-wrap shrink-0 ml-2">
              {project.status && (
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${
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
                <Badge variant="outline" className="text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  Ongoing
                </Badge>
              )}
            </div>
          </div>
          
          {description && (
            <p className="text-muted-foreground text-sm mb-4 line-clamp-2 flex-grow">
              {description}
            </p>
          )}
          
          {topLanguages.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {topLanguages.map((lang) => (
                <Badge key={lang} variant="outline" className="text-xs">
                  {lang}
                </Badge>
              ))}
            </div>
          )}
          
          {project.hashtags && project.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {project.hashtags.map((tag) => (
                <Badge key={tag} className="bg-primary/10 text-primary hover:bg-primary/20 text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
          
          {project.start_date && (
            <div className="flex items-center text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
              <Calendar className="w-3 h-3 mr-1" />
              Started {new Date(project.start_date).toLocaleDateString()}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};

const ProjectCardSkeleton = () => (
  <Card className="h-full">
    <CardContent className="p-6">
      <Skeleton className="h-6 w-3/4 mb-3" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-2/3 mb-4" />
      <div className="flex gap-2 mb-3">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-20" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-5 w-14" />
        <Skeleton className="h-5 w-18" />
      </div>
    </CardContent>
  </Card>
);

export default function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { projects, isLoading } = useProjects(true);
  const { token } = useGitHubToken();
  const [projectsWithLangs, setProjectsWithLangs] = useState<ProjectWithLanguages[]>([]);

  // Fetch languages for all visible projects
  useEffect(() => {
    const fetchLanguages = async () => {
      if (!token || projects.length === 0) {
        setProjectsWithLangs(projects);
        return;
      }

      const projectsLangs = await Promise.all(
        projects.map(async (project) => {
          if (!project.github_repo_id) return project;
          
          try {
            const { data } = await supabase.functions.invoke('github-api', {
              body: {
                action: 'get_languages',
                token,
                owner: project.repo_owner,
                repo: project.repo_name,
                repoId: project.github_repo_id,
              },
            });
            return { ...project, languages: data?.languages || {} };
          } catch {
            return project;
          }
        })
      );
      
      setProjectsWithLangs(projectsLangs);
    };

    fetchLanguages();
  }, [projects, token]);

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projectsWithLangs;
    
    const query = searchQuery.toLowerCase();
    return projectsWithLangs.filter((project) => {
      const nameMatch = project.repo_name.toLowerCase().includes(query);
      const descMatch = (project.custom_description || project.github_description || '').toLowerCase().includes(query);
      const tagMatch = project.hashtags?.some(tag => tag.toLowerCase().includes(query));
      return nameMatch || descMatch || tagMatch;
    });
  }, [projectsWithLangs, searchQuery]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <header className="mb-8">
          <h1 className="text-4xl font-serif font-bold mb-2">Projects</h1>
          <p className="text-muted-foreground">
            A collection of my work and ongoing projects
          </p>
        </header>

        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search projects by name or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <ProjectCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">
              {searchQuery ? 'No projects match your search.' : 'No projects yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}