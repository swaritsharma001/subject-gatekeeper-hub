import React from 'react';
import { motion } from 'framer-motion';
import { BookOpenText, Calculator, FlaskConical, Languages, BookOpen, Loader2 } from 'lucide-react';
import SubjectCard from '@/components/SubjectCard';
import { useSubjects } from '@/hooks/useSubjects';

// Icon mapping for subjects
const iconMap: Record<string, React.ElementType> = {
  hindi: Languages,
  english: BookOpenText,
  maths: Calculator,
  science: FlaskConical,
};

// Color mapping for subjects
const colorMap: Record<string, string> = {
  hindi: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
  english: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
  maths: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)',
  science: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
};

// Default gradient for unknown subjects
const defaultColor = 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)';

const Index: React.FC = () => {
  const { data: subjects, isLoading, error } = useSubjects();

  return (
    <div className="min-h-screen gradient-hero">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <h1 className="font-display text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent sm:text-5xl">
            StudyX → All Subjects
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Choose a subject to start your learning journey
          </p>
        </motion.div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Loading subjects...</span>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="mx-auto max-w-md rounded-xl bg-destructive/10 p-6 text-center">
            <p className="text-destructive">Failed to load subjects. Please try again later.</p>
          </div>
        )}

        {/* Subject Grid */}
        {subjects && subjects.length > 0 && (
          <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-2">
            {subjects.map((subject, index) => (
              <SubjectCard
                key={subject._id}
                title={subject.subject}
                icon={iconMap[subject.id.toLowerCase()] || BookOpen}
                slug={subject.id}
                color={colorMap[subject.id.toLowerCase()] || defaultColor}
                totalVideos={subject.totalVideos}
                delay={0.1 + index * 0.1}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {subjects && subjects.length === 0 && (
          <div className="mx-auto max-w-md rounded-xl bg-card p-8 text-center shadow-card">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">No subjects available yet.</p>
          </div>
        )}

        {/* Footer decoration */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-16 text-center"
        >
          <p className="text-sm text-muted-foreground">
            🎯 Learn smarter, not harder
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Index;
