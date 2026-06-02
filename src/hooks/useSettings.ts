import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type Settings = Record<string, string>;

export const useSettings = () => {
  return useQuery<Settings>({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('settings').select('key, value');
      if (error) {
        // Convert Supabase error object to proper Error to avoid [object Object] logs
        throw new Error(error.message || 'Failed to load settings');
      }
      return Object.fromEntries((data || []).map(s => [s.key, s.value || '']));
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
    // Return empty settings on error instead of crashing components
    placeholderData: {},
  });
};

export const useSetting = (key: string, fallback = '') => {
  const { data } = useSettings();
  return data?.[key] ?? fallback;
};
