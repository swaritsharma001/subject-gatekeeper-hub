import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen } from 'lucide-react';
import LectureCard from '@/components/LectureCard';
import { Button } from '@/components/ui/button';

const subjectTitles: Record<string, string> = {
  hindi: 'Hindi',
  english: 'English',
  maths: 'Maths',
  science: 'Science',
};

const lectures = [
  { title: 'Introduction to the Subject', duration: '15:30' },
  { title: 'Basic Concepts and Fundamentals', duration: '22:45' },
  { title: 'Advanced Topics Part 1', duration: '28:10' },
  { title: 'Advanced Topics Part 2', duration: '31:20' },
];

const Subject: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const subjectTitle = subjectTitles[slug || ''] || 'Subject';

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Back button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Link to="/">
            <Button variant="ghost" className="mb-6 gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Back to Subjects
            </Button>
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl gradient-primary">
              <BookOpen className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">
                {subjectTitle}
              </h1>
              <p className="text-muted-foreground">All Lectures</p>
            </div>
          </div>
        </motion.div>

        {/* Lecture count */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <span className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            {lectures.length} Lectures
          </span>
        </motion.div>

        {/* Lecture list */}
        <div className="mx-auto max-w-2xl space-y-4">
          {lectures.map((lecture, index) => (
            <LectureCard
              key={index}
              title={lecture.title}
              lectureNumber={index + 1}
              duration={lecture.duration}
              subjectSlug={slug || ''}
              delay={0.2 + index * 0.08}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Subject;
