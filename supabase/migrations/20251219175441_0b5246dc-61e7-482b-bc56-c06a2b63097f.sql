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