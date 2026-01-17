import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Calculator, FlaskConical, Languages, BookOpenText, Play, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLectures } from '@/hooks/useLectures';
import { useSubjects } from '@/hooks/useSubjects';

const subjectIcons: Record<string, React.ElementType> = {
  hindi: Languages,
  english: BookOpenText,
  maths: Calculator,
  science: FlaskConical,
};

const Subject: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: subjects } = useSubjects();
  const { data: lectures, isLoading, error } = useLectures(slug);
  
  const subject = subjects?.find(s => s.id === slug);
  const IconComponent = subjectIcons[slug?.toLowerCase() || ''] || BookOpen;

  if (!slug) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Subject not found</p>
      </div>
    );
  }

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
              <IconComponent className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">
                {subject?.subject || slug}
              </h1>
              <p className="text-muted-foreground">All Lectures</p>
            </div>
          </div>
        </motion.div>

        {/* Count badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <span className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            {lectures?.length || 0} Lectures
          </span>
        </motion.div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Loading lectures...</span>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="mx-auto max-w-md rounded-xl bg-destructive/10 p-6 text-center">
            <p className="text-destructive">Failed to load lectures. Please try again later.</p>
          </div>
        )}

        {/* Lectures list */}
        {lectures && lectures.length > 0 && (
          <div className="mx-auto max-w-2xl space-y-4">
            {lectures.map((lecture, index) => (
              <motion.div
                key={lecture._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.08, type: 'spring', damping: 20 }}
              >
                <Link to={`/subject/${slug}/lecture/${lecture._id}`}>
                  <motion.div
                    whileHover={{ scale: 1.01, x: 8 }}
                    whileTap={{ scale: 0.99 }}
                    className="group flex items-center gap-4 rounded-xl bg-card p-4 shadow-card transition-all duration-200 hover:shadow-card-hover"
                  >
                    {/* Play button */}
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:gradient-primary">
                      <Play className="h-5 w-5 text-primary transition-colors group-hover:text-primary-foreground" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground">
                        Lecture {index + 1}
                      </p>
                      <h3 className="font-semibold text-foreground truncate">
                        {lecture.title}
                      </h3>
                    </div>

                    {/* Duration badge */}
                    <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      {lecture.duration}
                    </span>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {lectures && lectures.length === 0 && (
          <div className="mx-auto max-w-md rounded-xl bg-card p-8 text-center shadow-card">
            <Play className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">No lectures available yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Subject;
