-- Add unique constraint on subscribers email
ALTER TABLE public.subscribers ADD CONSTRAINT subscribers_email_unique UNIQUE (email);