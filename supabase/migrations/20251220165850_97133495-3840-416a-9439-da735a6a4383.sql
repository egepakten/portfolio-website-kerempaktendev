-- Allow users to delete their own profile (needed for account deletion)
CREATE POLICY "Users can delete own profile" 
ON public.profiles 
FOR DELETE 
USING (auth.uid() = user_id);

-- Allow users to delete their own subscriptions
CREATE POLICY "Users can delete own subscription" 
ON public.subscribers 
FOR DELETE 
USING (auth.uid() = user_id);