import { useQuery } from '@tanstack/react-query';
import { fetchLecturesBySubject, ApiLecture } from '@/services/api';

export const useLectures = (subjectId: string | undefined) => {
  return useQuery<ApiLecture[]>({
    queryKey: ['lectures', subjectId],
    queryFn: () => fetchLecturesBySubject(subjectId!),
    enabled: !!subjectId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
