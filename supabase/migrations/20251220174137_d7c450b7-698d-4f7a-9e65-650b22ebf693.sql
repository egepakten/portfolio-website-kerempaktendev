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