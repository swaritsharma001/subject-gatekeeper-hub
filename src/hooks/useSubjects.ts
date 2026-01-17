import { useQuery } from '@tanstack/react-query';
import { fetchSubjects, ApiSubject } from '@/services/api';

export const useSubjects = () => {
  return useQuery<ApiSubject[]>({
    queryKey: ['subjects'],
    queryFn: fetchSubjects,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
