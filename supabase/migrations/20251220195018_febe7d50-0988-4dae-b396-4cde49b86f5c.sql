-- Create daily_progress table for tracking learning progress
CREATE TABLE public.daily_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  date date NOT NULL,
  branch_name text NOT NULL,
  changed_files jsonb DEFAULT '[]'::jsonb,
  summary text,
  learnings text,
  questions text,
  answers text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.daily_progress ENABLE ROW LEVEL SECURITY;

-- Anyone can view daily progress for visible projects
CREATE POLICY "Anyone can view daily progress for visible projects"
ON public.daily_progress
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM projects 
  WHERE projects.id = daily_progress.project_id 
  AND projects.is_visible = true
));

-- Admins can view all daily progress
CREATE POLICY "Admins can view all daily progress"
ON public.daily_progress
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert daily progress
CREATE POLICY "Admins can insert daily progress"
ON public.daily_progress
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update daily progress
CREATE POLICY "Admins can update daily progress"
ON public.daily_progress
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete daily progress
CREATE POLICY "Admins can delete daily progress"
ON public.daily_progress
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for efficient queries
CREATE INDEX idx_daily_progress_project_date ON public.daily_progress(project_id, date DESC);