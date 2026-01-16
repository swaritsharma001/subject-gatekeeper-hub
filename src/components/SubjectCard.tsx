import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface SubjectCardProps {
  title: string;
  icon: LucideIcon;
  slug: string;
  color: string;
  delay?: number;
}

const SubjectCard: React.FC<SubjectCardProps> = ({ title, icon: Icon, slug, color, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', damping: 20 }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
    >
      <Link to={`/subject/${slug}`}>
        <div className="group relative overflow-hidden rounded-2xl bg-card p-6 shadow-card transition-all duration-300 hover:shadow-card-hover">
          {/* Background gradient on hover */}
          <div
            className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-10"
            style={{ background: color }}
          />

          {/* Icon */}
          <motion.div
            whileHover={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 0.5 }}
            className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl"
            style={{ background: color }}
          >
            <Icon className="h-7 w-7 text-primary-foreground" />
          </motion.div>

          {/* Title */}
          <h3 className="font-display text-xl font-bold text-foreground">
            {title}
          </h3>

          {/* Arrow indicator */}
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground transition-colors group-hover:text-primary">
            <span>Start Learning</span>
            <motion.span
              initial={{ x: 0 }}
              whileHover={{ x: 5 }}
              className="text-lg"
            >
              →
            </motion.span>
          </div>

          {/* Corner decoration */}
          <div
            className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full opacity-10"
            style={{ background: color }}
          />
        </div>
      </Link>
    </motion.div>
  );
};

export default SubjectCard;
