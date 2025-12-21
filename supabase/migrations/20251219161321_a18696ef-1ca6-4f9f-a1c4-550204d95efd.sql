-- Add RLS policies for post management
-- Note: For now, allowing all operations since we have password-based admin access
-- In production, you'd use proper auth with user roles

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