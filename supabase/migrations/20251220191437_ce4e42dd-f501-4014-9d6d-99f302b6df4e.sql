-- Add status column to projects table with default options
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'in_progress';

-- Add a comment describing the status options
COMMENT ON COLUMN public.projects.status IS 'Project status: in_progress, testing, deployed, archived, paused';