-- Create email notification history table
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