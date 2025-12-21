-- ============================================================================
-- COMBINED MIGRATION SCRIPT FOR NEW SUPABASE PROJECT
-- ============================================================================
-- This file contains all migrations in order. Copy and paste into Supabase SQL Editor
-- Project URL: https://gakrmstptyljpaqwjtjj.supabase.co
-- ============================================================================

-- ============================================================================
-- MIGRATION 1: 20251219155659 - Create core tables (categories, posts, tags, subscribers)
-- ============================================================================
-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  icon TEXT DEFAULT 'folder',
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  post_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create posts table
CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT,
  cover_image TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  author TEXT DEFAULT 'Kerem Pakten',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  read_time INTEGER DEFAULT 5,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tags table
CREATE TABLE public.tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create post_tags junction table
CREATE TABLE public.post_tags (
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- Create subscribers table
CREATE TABLE public.subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Enable RLS on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Public read access for published content
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Anyone can view published posts" ON public.posts FOR SELECT USING (status = 'published');
CREATE POLICY "Anyone can view tags" ON public.tags FOR SELECT USING (true);
CREATE POLICY "Anyone can view post_tags" ON public.post_tags FOR SELECT USING (true);

-- Public insert for subscribers
CREATE POLICY "Anyone can subscribe" ON public.subscribers FOR INSERT WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- MIGRATION 2: 20251219155720 - Fix security issue on update_updated_at_column
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

-- ============================================================================
-- MIGRATION 3: 20251219161321 - Add RLS policies for post management
-- ============================================================================
-- Allow anyone to insert posts (admin panel has password protection)
CREATE POLICY "Allow insert posts" 
ON public.posts 
FOR INSERT 
WITH CHECK (true);

-- Allow anyone to update posts
CREATE POLICY "Allow update posts" 
ON public.posts 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Allow anyone to delete posts
CREATE POLICY "Allow delete posts" 
ON public.posts 
FOR DELETE 
USING (true);

-- Also need to add categories management policies
CREATE POLICY "Allow insert categories" 
ON public.categories 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow update categories" 
ON public.categories 
FOR UPDATE 
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow delete categories" 
ON public.categories 
FOR DELETE 
USING (true);

-- ============================================================================
-- MIGRATION 4: 20251219161347 - Allow viewing all posts
-- ============================================================================
DROP POLICY IF EXISTS "Anyone can view published posts" ON public.posts;

-- Allow viewing all posts (admin panel shows all, public pages filter by status in code)
CREATE POLICY "Anyone can view all posts" 
ON public.posts 
FOR SELECT 
USING (true);

-- ============================================================================
-- MIGRATION 5: 20251219165003 - Add tag management policies
-- ============================================================================
-- Allow insert tags for admin
CREATE POLICY "Allow insert tags" 
ON public.tags 
FOR INSERT 
WITH CHECK (true);

-- Allow update tags for admin
CREATE POLICY "Allow update tags" 
ON public.tags 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Allow delete tags for admin
CREATE POLICY "Allow delete tags" 
ON public.tags 
FOR DELETE 
USING (true);

-- ============================================================================
-- MIGRATION 6: 20251219170301 - Add unique constraint on subscribers email
-- ============================================================================
ALTER TABLE public.subscribers ADD CONSTRAINT subscribers_email_unique UNIQUE (email);

-- ============================================================================
-- MIGRATION 7: 20251219172238 - Create profiles, user_roles, and auth tables
-- ============================================================================
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  username TEXT NOT NULL,
  avatar_url TEXT,
  is_guest BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

-- Add color column to tags
ALTER TABLE public.tags ADD COLUMN color TEXT DEFAULT '#6366f1';

-- Create post_likes table
CREATE TABLE public.post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (post_id, user_id)
);

-- Create post_comments table
CREATE TABLE public.post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Link subscribers to user profiles (optional link)
ALTER TABLE public.subscribers ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Enable RLS on all new tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for post_likes
CREATE POLICY "Anyone can view likes" ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "Users can like posts" ON public.post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike posts" ON public.post_likes FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for post_comments
CREATE POLICY "Anyone can view comments" ON public.post_comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON public.post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON public.post_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.post_comments FOR DELETE USING (auth.uid() = user_id);

-- Trigger for profile timestamps
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for comments timestamps  
CREATE TRIGGER update_post_comments_updated_at
  BEFORE UPDATE ON public.post_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, is_guest)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'username', NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data ->> 'is_guest')::boolean, false)
  );
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Trigger on auth.users for new signups
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- MIGRATION 8: 20251219175441 - Add subscriber access policies
-- ============================================================================
-- Allow authenticated users to read their own subscription
CREATE POLICY "Users can view own subscription" 
ON public.subscribers 
FOR SELECT 
USING (auth.uid() = user_id OR auth.jwt() ->> 'email' = email);

-- Allow authenticated users to update their own subscription
CREATE POLICY "Users can update own subscription" 
ON public.subscribers 
FOR UPDATE 
USING (auth.uid() = user_id OR auth.jwt() ->> 'email' = email);

-- ============================================================================
-- MIGRATION 9: 20251219181841 - Add admin subscriber viewing policy
-- ============================================================================
-- Add policy to allow admins to view all subscribers for counting
CREATE POLICY "Admins can view all subscribers" 
ON public.subscribers 
FOR SELECT 
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- ============================================================================
-- MIGRATION 10: 20251219190829 - Fix admin subscriber policy
-- ============================================================================
DROP POLICY IF EXISTS "Admins can view all subscribers" ON public.subscribers;

-- Create a simpler policy that allows admins to view all subscribers
-- Using the has_role function that already exists
CREATE POLICY "Admins can view all subscribers" 
ON public.subscribers 
FOR SELECT 
USING (
  public.has_role(auth.uid(), 'admin')
);

-- ============================================================================
-- MIGRATION 11: 20251219232256 - Add post_tags management policies
-- ============================================================================
-- Add uniqueness to avoid duplicate tag links
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'post_tags_post_id_tag_id_key'
  ) THEN
    ALTER TABLE public.post_tags
      ADD CONSTRAINT post_tags_post_id_tag_id_key UNIQUE (post_id, tag_id);
  END IF;
END $$;

-- RLS policies: admins can manage post-tag links
DROP POLICY IF EXISTS "Admins can manage post_tags" ON public.post_tags;

CREATE POLICY "Admins can manage post_tags"
ON public.post_tags
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ============================================================================
-- MIGRATION 12: 20251220104823 - Enable realtime for subscribers
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.subscribers;

-- ============================================================================
-- MIGRATION 13: 20251220163230 - Update handle_new_user to auto-subscribe
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (user_id, username, is_guest)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'username', NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data ->> 'is_guest')::boolean, false)
  );
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  
  -- Auto-subscribe user to newsletter (if not already subscribed)
  INSERT INTO public.subscribers (email, name, user_id, is_active)
  VALUES (
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'username', NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    NEW.id,
    true
  )
  ON CONFLICT (email) DO UPDATE SET user_id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- ============================================================================
-- MIGRATION 14: 20251220165647 - Create storage bucket for avatars
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for avatar uploads
CREATE POLICY "Anyone can view avatars" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================================
-- MIGRATION 15: 20251220165850 - Add account deletion policies
-- ============================================================================
-- Allow users to delete their own profile (needed for account deletion)
CREATE POLICY "Users can delete own profile" 
ON public.profiles 
FOR DELETE 
USING (auth.uid() = user_id);

-- Allow users to delete their own subscriptions
CREATE POLICY "Users can delete own subscription" 
ON public.subscribers 
FOR DELETE 
USING (auth.uid() = user_id);

-- ============================================================================
-- MIGRATION 16: 20251220170355 - Create deleted_accounts table
-- ============================================================================
CREATE TABLE public.deleted_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  username TEXT,
  reason TEXT NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.deleted_accounts ENABLE ROW LEVEL SECURITY;

-- Only admins can view deleted accounts
CREATE POLICY "Admins can view deleted accounts" 
ON public.deleted_accounts 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

-- Allow insert for authenticated users (during account deletion)
CREATE POLICY "Users can insert own deletion record" 
ON public.deleted_accounts 
FOR INSERT 
WITH CHECK (true);

-- ============================================================================
-- MIGRATION 17: 20251220171107 - Create site_settings table
-- ============================================================================
CREATE TABLE public.site_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings
CREATE POLICY "Anyone can view site settings" 
ON public.site_settings 
FOR SELECT 
USING (true);

-- Only admins can update settings
CREATE POLICY "Admins can update site settings" 
ON public.site_settings 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert site settings" 
ON public.site_settings 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Insert default values
INSERT INTO public.site_settings (key, value) VALUES 
  ('site_name', 'Kerem Pakten'),
  ('site_description', 'Personal blog exploring software development, cloud architecture, and modern web technologies.');

-- ============================================================================
-- MIGRATION 18: 20251220171804 - Add email notification tracking
-- ============================================================================
-- Add columns to track email notifications for each post
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS last_notified_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS notified_subscriber_count integer DEFAULT 0;

-- ============================================================================
-- MIGRATION 19: 20251220172846 - Create post_notification_history table
-- ============================================================================
CREATE TABLE public.post_notification_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  recipient_count INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  is_test BOOLEAN NOT NULL DEFAULT false,
  test_email TEXT
);

-- Enable RLS
ALTER TABLE public.post_notification_history ENABLE ROW LEVEL SECURITY;

-- Admins can view all notification history
CREATE POLICY "Admins can view notification history"
ON public.post_notification_history
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow insert from edge functions (service role)
CREATE POLICY "Service role can insert notification history"
ON public.post_notification_history
FOR INSERT
WITH CHECK (true);

-- ============================================================================
-- MIGRATION 20: 20251220174137 - Add comment replies and pinning
-- ============================================================================
-- Add columns for replies and pinned comments
ALTER TABLE public.post_comments 
ADD COLUMN parent_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE,
ADD COLUMN is_pinned BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN pinned_at TIMESTAMP WITH TIME ZONE;

-- Enable realtime for comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments;

-- Create index for efficient queries
CREATE INDEX idx_post_comments_parent_id ON public.post_comments(parent_id);
CREATE INDEX idx_post_comments_pinned ON public.post_comments(is_pinned, pinned_at DESC);

-- Allow admins to pin/unpin comments
CREATE POLICY "Admins can update any comment for pinning"
ON public.post_comments
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ============================================================================
-- MIGRATION 21: 20251220180950 - Create projects and project tracking tables
-- ============================================================================
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

-- ============================================================================
-- MIGRATION 22: 20251220191437 - Add status column to projects
-- ============================================================================
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'in_progress';

-- Add a comment describing the status options
COMMENT ON COLUMN public.projects.status IS 'Project status: in_progress, testing, deployed, archived, paused';

-- ============================================================================
-- MIGRATION 23: 20251220195018 - Create daily_progress table
-- ============================================================================
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

-- ============================================================================
-- ALL MIGRATIONS COMPLETE!
-- ============================================================================
-- Your database is now fully set up. Next steps:
-- 1. Deploy Edge Functions
-- 2. Set environment variables for functions
-- 3. Test your application
-- ============================================================================

