import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen } from 'lucide-react';
import VideoPlayer from '@/components/VideoPlayer';
import { Button } from '@/components/ui/button';

const subjectTitles: Record<string, string> = {
  hindi: 'Hindi',
  english: 'English',
  maths: 'Maths',
  science: 'Science',
};

const lectureTitles = [
  'Introduction to the Subject',
  'Basic Concepts and Fundamentals',
  'Advanced Topics Part 1',
  'Advanced Topics Part 2',
];

const Lecture: React.FC = () => {
  const { slug, lectureId } = useParams<{ slug: string; lectureId: string }>();
  const subjectTitle = subjectTitles[slug || ''] || 'Subject';
  const lectureNum = parseInt(lectureId || '1', 10);
  const lectureTitle = lectureTitles[lectureNum - 1] || `Lecture ${lectureNum}`;

  const videoSrc = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Back button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Link to={`/subject/${slug}`}>
            <Button variant="ghost" className="mb-6 gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Back to {subjectTitle}
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
            <span>{subjectTitle}</span>
            <span>•</span>
            <span>Lecture {lectureNum}</span>
          </div>
          <h1 className="mt-2 font-display text-2xl font-bold text-foreground sm:text-3xl">
            {lectureTitle}
          </h1>
        </motion.div>

        {/* Video Player */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mx-auto max-w-4xl"
        >
          <VideoPlayer src={videoSrc} title={lectureTitle} />
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
            This lecture covers important concepts and fundamentals that will help you master {subjectTitle}. 
            Take notes and practice the exercises to reinforce your learning.
          </p>

          {/* Navigation buttons */}
          <div className="mt-6 flex flex-wrap gap-3">
            {lectureNum > 1 && (
              <Link to={`/subject/${slug}/lecture/${lectureNum - 1}`}>
                <Button variant="outline" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Previous Lecture
                </Button>
              </Link>
            )}
            {lectureNum < 4 && (
              <Link to={`/subject/${slug}/lecture/${lectureNum + 1}`}>
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
