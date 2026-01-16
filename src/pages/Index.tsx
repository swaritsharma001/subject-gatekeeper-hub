import React from 'react';
import { motion } from 'framer-motion';
import { BookOpenText, Calculator, FlaskConical, Languages } from 'lucide-react';
import SubjectCard from '@/components/SubjectCard';

const subjects = [
  {
    title: 'Hindi',
    icon: Languages,
    slug: 'hindi',
    color: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
  },
  {
    title: 'English',
    icon: BookOpenText,
    slug: 'english',
    color: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
  },
  {
    title: 'Maths',
    icon: Calculator,
    slug: 'maths',
    color: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)',
  },
  {
    title: 'Science',
    icon: FlaskConical,
    slug: 'science',
    color: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
  },
];

const Index: React.FC = () => {
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
          <h1 className="font-display text-4xl font-bold text-foreground sm:text-5xl">
            Study → All Subjects
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Choose a subject to start your learning journey
          </p>
        </motion.div>

        {/* Subject Grid */}
        <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-2">
          {subjects.map((subject, index) => (
            <SubjectCard
              key={subject.slug}
              {...subject}
              delay={0.1 + index * 0.1}
            />
          ))}
        </div>

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
