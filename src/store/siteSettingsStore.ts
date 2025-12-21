import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

interface SiteSettings {
  site_name: string;
  site_description: string;
}

interface SiteSettingsStore {
  settings: SiteSettings;
  loading: boolean;
  fetchSettings: () => Promise<void>;
  updateSettings: (settings: Partial<SiteSettings>) => Promise<{ error: Error | null }>;
}

export const useSiteSettingsStore = create<SiteSettingsStore>((set, get) => ({
  settings: {
    site_name: 'Kerem Pakten Dev',
    site_description: 'Personal blog exploring software development, cloud architecture, and modern web technologies.',
  },
  loading: true,

  fetchSettings: async () => {
    const { data, error } = await supabase
      .from('site_settings')
      .select('key, value');

    if (error) {
      console.error('Error fetching site settings:', error);
      set({ loading: false });
      return;
    }

    if (data) {
      const settingsMap: Record<string, string> = {};
      data.forEach((row: { key: string; value: string }) => {
        settingsMap[row.key] = row.value;
      });

      set({
        settings: {
          site_name: settingsMap.site_name || 'Kerem Pakten',
          site_description: settingsMap.site_description || 'Personal blog exploring software development, cloud architecture, and modern web technologies.',
        },
        loading: false,
      });
    }
  },

  updateSettings: async (newSettings: Partial<SiteSettings>) => {
    const updates = Object.entries(newSettings).map(async ([key, value]) => {
      const { error } = await supabase
        .from('site_settings')
        .update({ value, updated_at: new Date().toISOString() })
        .eq('key', key);
      
      if (error) {
        // Try insert if update fails (row might not exist)
        const { error: insertError } = await supabase
          .from('site_settings')
          .insert({ key, value });
        
        if (insertError) return insertError;
      }
      return null;
    });

    const results = await Promise.all(updates);
    const firstError = results.find((r) => r !== null);

    if (!firstError) {
      set((state) => ({
        settings: { ...state.settings, ...newSettings },
      }));
    }

    return { error: firstError || null };
  },
}));