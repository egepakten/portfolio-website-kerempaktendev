import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useGitHubToken = () => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchToken();
  }, []);

  const fetchToken = async () => {
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'github_token')
      .maybeSingle();
    
    setToken(data?.value || null);
    setIsLoading(false);
  };

  const saveToken = async (newToken: string) => {
    const { error } = await supabase
      .from('site_settings')
      .upsert({ key: 'github_token', value: newToken }, { onConflict: 'key' });
    
    if (!error) {
      setToken(newToken);
    }
    return !error;
  };

  return { token, isLoading, saveToken, refetch: fetchToken };
};