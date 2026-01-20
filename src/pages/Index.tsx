import React from 'react';
import { motion } from 'framer-motion';
import { BookOpenText, Calculator, FlaskConical, Languages, BookOpen, Loader2 } from 'lucide-react';
import SubjectCard from '@/components/SubjectCard';
import { useSubjects } from '@/hooks/useSubjects';
import Footer from '@/components/Footer';
import AnnouncementBar from '@/components/AnnouncementBar';
import BannerCarousel from '@/components/BannerCarousel';
import logo from '@/assets/logo.png';

// Icon mapping for subjects
const iconMap: Record<string, React.ElementType> = {
  hindi: Languages,
  english: BookOpenText,
  maths: Calculator,
  science: FlaskConical,
};

// Color mapping for subjects with new emerald/violet palette
const colorMap: Record<string, string> = {
  hindi: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
  english: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  maths: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
  science: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
};

// Default gradient for unknown subjects
const defaultColor = 'linear-gradient(135deg, #10b981 0%, #8b5cf6 100%)';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      damping: 15,
      stiffness: 100,
    },
  },
};

const Index: React.FC = () => {
  const { data: subjects, isLoading, error } = useSubjects();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Announcement Bar */}
      <AnnouncementBar />

      <div className="flex-1 gradient-hero relative overflow-hidden">
        {/* Decorative background shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl"
            animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/5 rounded-full blur-3xl"
            animate={{ scale: [1.2, 1, 1.2], rotate: [360, 180, 0] }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          />
        </div>

        <div className="container mx-auto px-4 py-12 relative z-10">
          {/* Header with Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="mb-12 text-center"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.1, type: 'spring', damping: 10, stiffness: 100 }}
              className="mx-auto mb-6 relative w-28 h-28 flex items-center justify-center"
            >
              {/* Logo glow effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-primary/30 to-secondary/30 rounded-full blur-xl"
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />
              <img 
                src={logo} 
                alt="StudyX Logo" 
                className="relative h-28 w-28 object-contain drop-shadow-2xl animate-float mx-auto rounded-full" 
              />
            </motion.div>

            <motion.h1
              className="font-display text-4xl font-bold sm:text-5xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_auto] animate-gradient-x bg-clip-text text-transparent">
                StudyX
              </span>
              <span className="text-foreground"> → All Subjects</span>
            </motion.h1>

            <motion.p
              className="mt-4 text-lg text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              Choose a subject to start your learning journey ✨
            </motion.p>
          </motion.div>

          {/* Banner Carousel */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mb-12"
          >
            <BannerCarousel />
          </motion.div>

          {/* Loading state */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center py-12"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Loader2 className="h-8 w-8 text-primary" />
              </motion.div>
              <span className="ml-3 text-muted-foreground">Loading subjects...</span>
            </motion.div>
          )}

          {/* Error state */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mx-auto max-w-md rounded-xl bg-destructive/10 p-6 text-center backdrop-blur-sm"
            >
              <p className="text-destructive">Failed to load subjects. Please try again later.</p>
            </motion.div>
          )}

          {/* Subject Grid with staggered animations */}
          {subjects && subjects.length > 0 && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-2"
            >
              {subjects.map((subject) => (
                <motion.div key={subject._id} variants={itemVariants}>
                  <SubjectCard
                    title={subject.subject}
                    icon={iconMap[subject.id.toLowerCase()] || BookOpen}
                    slug={subject.id}
                    color={colorMap[subject.id.toLowerCase()] || defaultColor}
                    totalVideos={subject.totalVideos}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Empty state */}
          {subjects && subjects.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto max-w-md rounded-xl bg-card p-8 text-center shadow-card backdrop-blur-sm"
            >
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No subjects available yet.</p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;
