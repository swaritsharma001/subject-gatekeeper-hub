import { motion } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import { useState } from 'react';

const AnnouncementBar = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -50, opacity: 0 }}
      className="relative bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_100%] animate-gradient-x py-2.5 px-4 text-center overflow-hidden"
    >
      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      />
      
      <div className="relative flex items-center justify-center gap-2">
        <motion.div
          animate={{ rotate: [0, 15, -15, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </motion.div>
        <span className="text-sm font-medium text-primary-foreground">
          🎉 New courses added weekly! Start learning today
        </span>
        <motion.div
          animate={{ rotate: [0, -15, 15, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </motion.div>
      </div>

      <button
        onClick={() => setIsVisible(false)}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/20 transition-colors"
        aria-label="Close announcement"
      >
        <X className="h-4 w-4 text-primary-foreground" />
      </button>
    </motion.div>
  );
};

export default AnnouncementBar;
