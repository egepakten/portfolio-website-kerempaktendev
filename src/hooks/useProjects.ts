import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Project {
  id: string;
  github_repo_id: number | null;
  repo_name: string;
  repo_url: string;
  repo_owner: string;
  is_visible: boolean;
  custom_description: string | null;
  github_description: string | null;
  hashtags: string[];
  start_date: string | null;
  is_ongoing: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectProgress {
  id: string;
  project_id: string;
  date: string;
  title: string;
  description: string;
  issue_reference: string | null;
  created_at: string;
}

export const useProjects = (visibleOnly = true) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAdmin } = useAuth();

  const fetchProjects = async () => {
    setIsLoading(true);
    let query = supabase.from('projects').select('*').order('updated_at', { ascending: false });
    
    if (visibleOnly && !isAdmin) {
      query = query.eq('is_visible', true);
    }
    
    const { data, error } = await query;
    
    if (!error && data) {
      setProjects(data as Project[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchProjects();
  }, [visibleOnly, isAdmin]);

  return { projects, isLoading, refetch: fetchProjects };
};

export const useProject = (id: string) => {
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (!error && data) {
        setProject(data as Project);
      }
      setIsLoading(false);
    };

    if (id) {
      fetchProject();
    }
  }, [id]);

  return { project, isLoading };
};

export const useProjectProgress = (projectId: string) => {
  const [progress, setProgress] = useState<ProjectProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProgress = async () => {
    const { data, error } = await supabase
      .from('project_progress')
      .select('*')
      .eq('project_id', projectId)
      .order('date', { ascending: false });
    
    if (!error && data) {
      setProgress(data as ProjectProgress[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (projectId) {
      fetchProgress();
    }
  }, [projectId]);

  return { progress, isLoading, refetch: fetchProgress };
};