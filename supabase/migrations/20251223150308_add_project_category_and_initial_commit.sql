-- Add initial_commit_date column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS initial_commit_date DATE DEFAULT NULL;

-- Add category column to projects table with predefined options
ALTER TABLE projects ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'full-stack';

-- Add comment for documentation
COMMENT ON COLUMN projects.initial_commit_date IS 'The date of the first commit in the repository';
COMMENT ON COLUMN projects.category IS 'Project category: mini-project, full-stack, library, prototype, portfolio';
