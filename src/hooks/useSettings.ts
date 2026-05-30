import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type Settings = Record<string, string>;

export const useSettings = () => {
  return useQuery<Settings>({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('settings').select('key, value');
      if (error) throw error;
      return Object.fromEntries((data || []).map(s => [s.key, s.value || '']));
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useSetting = (key: string, fallback = '') => {
  const { data } = useSettings();
  return data?.[key] ?? fallback;
};
