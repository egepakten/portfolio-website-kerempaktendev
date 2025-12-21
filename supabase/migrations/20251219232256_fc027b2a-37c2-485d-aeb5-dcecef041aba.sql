-- Allow assigning tags to posts (hashtags)
-- Ensure post_tags supports mutations safely

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
