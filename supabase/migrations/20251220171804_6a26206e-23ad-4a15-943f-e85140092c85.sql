-- Add columns to track email notifications for each post
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS last_notified_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS notified_subscriber_count integer DEFAULT 0;