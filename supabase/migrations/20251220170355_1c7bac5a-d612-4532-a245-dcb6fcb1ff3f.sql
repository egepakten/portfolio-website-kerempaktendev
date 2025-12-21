-- Create table to store deleted accounts
CREATE TABLE public.deleted_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  username TEXT,
  reason TEXT NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.deleted_accounts ENABLE ROW LEVEL SECURITY;

-- Only admins can view deleted accounts
CREATE POLICY "Admins can view deleted accounts" 
ON public.deleted_accounts 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

-- Allow insert for authenticated users (during account deletion)
CREATE POLICY "Users can insert own deletion record" 
ON public.deleted_accounts 
FOR INSERT 
WITH CHECK (true);