import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Loader2 } from 'lucide-react';
import VideoPlayer from '@/components/VideoPlayer';
import YouTubePlayer from '@/components/YouTubePlayer';
import { Button } from '@/components/ui/button';
import { useLectures } from '@/hooks/useLectures';
import { useSubjects } from '@/hooks/useSubjects';

// Helper to detect video type from URL
const getVideoType = (url: string): 'youtube' | 'hls' => {
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'youtube';
  }
  return 'hls';
};

const Lecture: React.FC = () => {
  const { slug, lectureId } = useParams<{ 
    slug: string; 
    lectureId: string;
  }>();
  
  const { data: subjects } = useSubjects();
  const { data: lectures, isLoading, error } = useLectures(slug);
  
  const subject = subjects?.find(s => s.id === slug);
  const lecture = lectures?.find(l => l._id === lectureId);
  const lectureIndex = lectures?.findIndex(l => l._id === lectureId) ?? -1;
  
  // Get prev/next lectures
  const prevLecture = lectureIndex > 0 ? lectures?.[lectureIndex - 1] : null;
  const nextLecture = lectures && lectureIndex < lectures.length - 1 ? lectures[lectureIndex + 1] : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Loading lecture...</span>
      </div>
    );
  }

  if (error || !lecture) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Lecture not found</p>
      </div>
    );
  }

  const videoType = getVideoType(lecture.link);
  const backUrl = `/subject/${slug}`;
  const backText = subject?.subject || slug || 'Subjects';

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Back button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Link to={backUrl}>
            <Button variant="ghost" className="mb-6 gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Back to {backText}
            </Button>
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            <span>{subject?.subject || slug}</span>
            <span>•</span>
            <span>Lecture {lectureIndex + 1}</span>
          </div>
          <h1 className="mt-2 font-display text-2xl font-bold text-foreground sm:text-3xl">
            {lecture.title}
          </h1>
        </motion.div>

        {/* Video Player */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mx-auto max-w-4xl"
        >
          {videoType === 'youtube' ? (
            <YouTubePlayer url={lecture.link} title={lecture.title} />
          ) : (
            <VideoPlayer src={lecture.link} title={lecture.title} />
          )}
        </motion.div>

        {/* Lecture info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mx-auto mt-8 max-w-4xl rounded-xl bg-card p-6 shadow-card"
        >
          <h2 className="font-display text-lg font-semibold text-foreground">
            About this Lecture
          </h2>
          <p className="mt-2 text-muted-foreground">
            This lecture covers important concepts in {subject?.subject || 'this subject'}. 
            Duration: {lecture.duration}. Take notes and practice the exercises to reinforce your learning.
          </p>

          {/* Navigation buttons */}
          <div className="mt-6 flex flex-wrap gap-3">
            {prevLecture && (
              <Link to={`/subject/${slug}/lecture/${prevLecture._id}`}>
                <Button variant="outline" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Previous Lecture
                </Button>
              </Link>
            )}
            {nextLecture && (
              <Link to={`/subject/${slug}/lecture/${nextLecture._id}`}>
                <Button className="gap-2 gradient-primary text-primary-foreground hover:opacity-90">
                  Next Lecture
                  <span>→</span>
                </Button>
              </Link>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Lecture;
