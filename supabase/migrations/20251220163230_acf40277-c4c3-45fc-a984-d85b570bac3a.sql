-- Update handle_new_user to also add user as subscriber
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (user_id, username, is_guest)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'username', NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data ->> 'is_guest')::boolean, false)
  );
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  
  -- Auto-subscribe user to newsletter (if not already subscribed)
  INSERT INTO public.subscribers (email, name, user_id, is_active)
  VALUES (
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'username', NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    NEW.id,
    true
  )
  ON CONFLICT (email) DO UPDATE SET user_id = NEW.id;
  
  RETURN NEW;
END;
$$;