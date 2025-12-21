-- Drop existing SELECT policy and create a new one that allows seeing all posts
DROP POLICY IF EXISTS "Anyone can view published posts" ON public.posts;

-- Allow viewing all posts (admin panel shows all, public pages filter by status in code)
CREATE POLICY "Anyone can view all posts" 
ON public.posts 
FOR SELECT 
USING (true);