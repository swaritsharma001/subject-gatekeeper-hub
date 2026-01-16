import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Clock } from 'lucide-react';

interface LectureCardProps {
  title: string;
  lectureNumber: number;
  duration: string;
  subjectSlug: string;
  delay?: number;
}

const LectureCard: React.FC<LectureCardProps> = ({
  title,
  lectureNumber,
  duration,
  subjectSlug,
  delay = 0,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, type: 'spring', damping: 20 }}
    >
      <Link to={`/subject/${subjectSlug}/lecture/${lectureNumber}`}>
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
              Lecture {lectureNumber}
            </p>
            <h3 className="font-semibold text-foreground truncate">
              {title}
            </h3>
          </div>

          {/* Duration */}
          <div className="flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{duration}</span>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
};

export default LectureCard;
