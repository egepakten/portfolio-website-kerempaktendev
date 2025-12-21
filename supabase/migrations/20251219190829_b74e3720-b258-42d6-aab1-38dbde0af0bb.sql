-- Drop the existing policy that uses has_role function (it checks against auth.uid() which may not match the RLS correctly)
DROP POLICY IF EXISTS "Admins can view all subscribers" ON public.subscribers;

-- Create a simpler policy that allows admins to view all subscribers
-- Using the has_role function that already exists
CREATE POLICY "Admins can view all subscribers" 
ON public.subscribers 
FOR SELECT 
USING (
  public.has_role(auth.uid(), 'admin')
);