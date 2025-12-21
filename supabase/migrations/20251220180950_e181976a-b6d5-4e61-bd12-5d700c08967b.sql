-- Create cache_type enum
CREATE TYPE cache_type AS ENUM ('languages', 'readme', 'projects');

-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  github_repo_id BIGINT UNIQUE,
  repo_name TEXT NOT NULL,
  repo_url TEXT NOT NULL,
  repo_owner TEXT NOT NULL,
  is_visible BOOLEAN NOT NULL DEFAULT false,
  custom_description TEXT,
  hashtags TEXT[] DEFAULT '{}',
  start_date DATE,
  is_ongoing BOOLEAN NOT NULL DEFAULT true,
  github_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project_progress table
CREATE TABLE public.project_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  issue_reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create github_cache table
CREATE TABLE public.github_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  repo_id BIGINT NOT NULL,
  cache_type cache_type NOT NULL,
  data JSONB NOT NULL,
  cached_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(repo_id, cache_type)
);

-- Enable RLS on all tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.github_cache ENABLE ROW LEVEL SECURITY;

-- Projects policies: anyone can view visible projects, admins can manage all
CREATE POLICY "Anyone can view visible projects" ON public.projects
  FOR SELECT USING (is_visible = true);

CREATE POLICY "Admins can view all projects" ON public.projects
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert projects" ON public.projects
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update projects" ON public.projects
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete projects" ON public.projects
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Project progress policies: anyone can view, admins can manage
CREATE POLICY "Anyone can view project progress" ON public.project_progress
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.projects WHERE id = project_id AND is_visible = true
  ));

CREATE POLICY "Admins can view all progress" ON public.project_progress
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert progress" ON public.project_progress
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update progress" ON public.project_progress
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete progress" ON public.project_progress
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- GitHub cache policies: anyone can read, system/admins can write
CREATE POLICY "Anyone can view github cache" ON public.github_cache
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage github cache" ON public.github_cache
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Create indexes for performance
CREATE INDEX idx_projects_visible ON public.projects(is_visible);
CREATE INDEX idx_projects_github_repo_id ON public.projects(github_repo_id);
CREATE INDEX idx_project_progress_project_id ON public.project_progress(project_id);
CREATE INDEX idx_project_progress_date ON public.project_progress(date DESC);
CREATE INDEX idx_github_cache_repo_type ON public.github_cache(repo_id, cache_type);

-- Update trigger for projects
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();