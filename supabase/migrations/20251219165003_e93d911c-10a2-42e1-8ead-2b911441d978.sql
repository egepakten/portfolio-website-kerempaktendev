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