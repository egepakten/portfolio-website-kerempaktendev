import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Search, Calendar, Clock, GitCommit, FolderKanban, X } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProjects, Project } from '@/hooks/useProjects';
import { useGitHubToken } from '@/hooks/useGitHubToken';
import { supabase } from '@/integrations/supabase/client';

const CATEGORY_FILTERS = [
  { value: 'mini-project', label: 'Mini Project', color: 'bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-500/30' },
  { value: 'full-stack', label: 'Full Stack', color: 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30' },
  { value: 'university', label: 'University', color: 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border-indigo-500/30' },
  { value: 'prototype', label: 'Prototype', color: 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30' },
  { value: 'portfolio', label: 'Portfolio', color: 'bg-pink-500/20 text-pink-700 dark:text-pink-400 border-pink-500/30' },
];

const STATUS_FILTERS = [
  { value: 'ongoing', label: 'Ongoing', color: 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 border-cyan-500/30' },
  { value: 'deployed', label: 'Deployed', color: 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30' },
  { value: 'testing', label: 'Testing', color: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30' },
  { value: 'paused', label: 'Paused', color: 'bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500/30' },
  { value: 'archived', label: 'Archived', color: 'bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-500/30' },
];

interface ProjectWithLanguages extends Project {
  languages?: Record<string, number>;
}

const getCategoryLabel = (category: string | null) => {
  const categories: Record<string, string> = {
    'mini-project': 'Mini Project',
    'full-stack': 'Full Stack',
    'university': 'University Project',
    'prototype': 'Prototype',
    'portfolio': 'Portfolio Piece',
  };
  return categories[category || 'full-stack'] || 'Full Stack';
};

const getCategoryColor = (category: string | null) => {
  const colors: Record<string, string> = {
    'mini-project': 'bg-purple-500/20 text-purple-700 dark:text-purple-400',
    'full-stack': 'bg-blue-500/20 text-blue-700 dark:text-blue-400',
    'university': 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-400',
    'prototype': 'bg-amber-500/20 text-amber-700 dark:text-amber-400',
    'portfolio': 'bg-pink-500/20 text-pink-700 dark:text-pink-400',
  };
  return colors[category || 'full-stack'] || 'bg-blue-500/20 text-blue-700 dark:text-blue-400';
};

const getFilterColor = (value: string, type: 'category' | 'status') => {
  const filters = type === 'category' ? CATEGORY_FILTERS : STATUS_FILTERS;
  const filter = filters.find(f => f.value === value);
  return filter?.color || 'bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-500/30';
};

const getFilterLabel = (value: string, type: 'category' | 'status') => {
  const filters = type === 'category' ? CATEGORY_FILTERS : STATUS_FILTERS;
  const filter = filters.find(f => f.value === value);
  return filter?.label || value;
};

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

          {/* Category Badge */}
          {project.category && (
            <div className="mb-3">
              <Badge className={`text-xs ${getCategoryColor(project.category)}`}>
                <FolderKanban className="w-3 h-3 mr-1" />
                {getCategoryLabel(project.category)}
              </Badge>
            </div>
          )}

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

          {/* Footer with dates */}
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
            {project.initial_commit_date ? (
              <div className="flex items-center">
                <GitCommit className="w-3 h-3 mr-1" />
                {new Date(project.initial_commit_date).toLocaleDateString()}
              </div>
            ) : project.start_date ? (
              <div className="flex items-center">
                <Calendar className="w-3 h-3 mr-1" />
                Started {new Date(project.start_date).toLocaleDateString()}
              </div>
            ) : (
              <div />
            )}
          </div>
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
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const { projects, isLoading } = useProjects(true);
  const { token } = useGitHubToken();
  const [projectsWithLangs, setProjectsWithLangs] = useState<ProjectWithLanguages[]>([]);

  // Fetch languages for all visible projects
  useEffect(() => {
    const fetchLanguages = async () => {
      // Immediately show projects without languages while loading
      if (projects.length === 0) {
        setProjectsWithLangs([]);
        return;
      }

      // Set projects immediately so they appear right away
      setProjectsWithLangs(projects);

      // Then fetch languages in the background if we have a token
      if (!token) return;

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

    // Only fetch when projects are loaded
    if (!isLoading) {
      fetchLanguages();
    }
  }, [projects, token, isLoading]);

  const filteredProjects = useMemo(() => {
    let filtered = projectsWithLangs;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((project) => {
        const nameMatch = project.repo_name.toLowerCase().includes(query);
        const descMatch = (project.custom_description || project.github_description || '').toLowerCase().includes(query);
        const tagMatch = project.hashtags?.some(tag => tag.toLowerCase().includes(query));
        return nameMatch || descMatch || tagMatch;
      });
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((project) => project.category === categoryFilter);
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'ongoing') {
        filtered = filtered.filter((project) => project.is_ongoing);
      } else {
        filtered = filtered.filter((project) => project.status === statusFilter);
      }
    }

    // Sort: Ongoing projects first (by timeline/initial_commit_date), then rest by newest to oldest
    return filtered.sort((a, b) => {
      // Ongoing projects come first
      if (a.is_ongoing && !b.is_ongoing) return -1;
      if (!a.is_ongoing && b.is_ongoing) return 1;

      // If both are ongoing, sort by timeline (initial_commit_date or start_date, oldest first = longer timeline)
      if (a.is_ongoing && b.is_ongoing) {
        const dateA = a.initial_commit_date || a.start_date || a.created_at;
        const dateB = b.initial_commit_date || b.start_date || b.created_at;
        return new Date(dateA).getTime() - new Date(dateB).getTime();
      }

      // For non-ongoing projects, sort by newest to oldest (updated_at)
      const dateA = a.updated_at || a.created_at;
      const dateB = b.updated_at || b.created_at;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  }, [projectsWithLangs, searchQuery, categoryFilter, statusFilter]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-serif font-bold mb-2">Projects</h1>
          <p className="text-muted-foreground">
            A collection of my work and ongoing projects
          </p>
        </motion.header>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative mb-4"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search projects by name or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-8 space-y-4"
        >
          {/* Filter Dropdowns */}
          <div className="flex flex-wrap gap-3 items-center">
            {/* Category Dropdown */}
            <Select
              value={categoryFilter}
              onValueChange={setCategoryFilter}
            >
              <SelectTrigger className="w-[160px]">
                <FolderKanban className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORY_FILTERS.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Dropdown */}
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-[160px]">
                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {STATUS_FILTERS.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Results count */}
            <span className="text-sm text-muted-foreground ml-auto">
              {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Active Filter Tags */}
          {(categoryFilter !== 'all' || statusFilter !== 'all') && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-muted-foreground">Active filters:</span>

              {categoryFilter !== 'all' && (
                <Badge
                  className={`${getFilterColor(categoryFilter, 'category')} border cursor-pointer hover:opacity-80 transition-opacity`}
                  onClick={() => setCategoryFilter('all')}
                >
                  {getFilterLabel(categoryFilter, 'category')}
                  <X className="h-3 w-3 ml-1.5" />
                </Badge>
              )}

              {statusFilter !== 'all' && (
                <Badge
                  className={`${getFilterColor(statusFilter, 'status')} border cursor-pointer hover:opacity-80 transition-opacity`}
                  onClick={() => setStatusFilter('all')}
                >
                  {getFilterLabel(statusFilter, 'status')}
                  <X className="h-3 w-3 ml-1.5" />
                </Badge>
              )}
            </div>
          )}
        </motion.div>

        {isLoading || (projectsWithLangs.length === 0 && projects.length === 0 && !searchQuery) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <ProjectCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center py-16"
          >
            <p className="text-muted-foreground">
              {searchQuery || categoryFilter !== 'all' || statusFilter !== 'all'
                ? 'No projects match your filters.'
                : 'No projects yet.'}
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <ProjectCard project={project} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </Layout>
  );
}