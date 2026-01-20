import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, ChevronLeft, ChevronRight, Zap, Gift, Rocket, Star } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

type AnnouncementType = 'new' | 'sale' | 'referral' | 'content' | 'social';

const announcements = [
  { id: 1, icon: '🎉', text: 'New courses added weekly! Start learning today', emoji: Sparkles, type: 'new' as AnnouncementType },
  { id: 2, icon: '🔥', text: 'Limited time: Get 50% off premium access', emoji: Zap, type: 'sale' as AnnouncementType },
  { id: 3, icon: '🎁', text: 'Refer a friend and earn free study credits', emoji: Gift, type: 'referral' as AnnouncementType },
  { id: 4, icon: '🚀', text: 'New Science & Math modules now available', emoji: Rocket, type: 'content' as AnnouncementType },
  { id: 5, icon: '⭐', text: 'Join 50+ students already learning', emoji: Star, type: 'social' as AnnouncementType },
];

const themeColors: Record<AnnouncementType, string> = {
  new: 'from-emerald-500 via-teal-500 to-emerald-500',
  sale: 'from-rose-500 via-orange-500 to-rose-500',
  referral: 'from-violet-500 via-purple-500 to-violet-500',
  content: 'from-blue-500 via-indigo-500 to-blue-500',
  social: 'from-amber-500 via-yellow-500 to-amber-500',
};

const AnnouncementBar = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextAnnouncement = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % announcements.length);
  }, []);

  const prevAnnouncement = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length);
  }, []);

  // Auto-cycle through announcements
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(nextAnnouncement, 4000);
    return () => clearInterval(interval);
  }, [isPaused, nextAnnouncement]);

  if (!isVisible) return null;

  const current = announcements[currentIndex];
  const IconComponent = current.emoji;

  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -50, opacity: 0 }}
      className={`relative bg-gradient-to-r ${themeColors[current.type]} bg-[length:200%_100%] animate-gradient-x py-2.5 px-4 text-center overflow-hidden transition-colors duration-500`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      />

      {/* Navigation arrows - Left */}
      <button
        onClick={prevAnnouncement}
        className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/20 transition-colors z-10 hidden sm:block"
        aria-label="Previous announcement"
      >
        <ChevronLeft className="h-4 w-4 text-primary-foreground" />
      </button>

      {/* Carousel content */}
      <div className="relative flex items-center justify-center gap-2 mx-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2"
          >
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <IconComponent className="h-4 w-4 text-primary-foreground" />
            </motion.div>
            <span className="text-sm font-medium text-primary-foreground">
              {current.icon} {current.text}
            </span>
            <motion.div
              animate={{ rotate: [0, -15, 15, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <IconComponent className="h-4 w-4 text-primary-foreground" />
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress indicators */}
      <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-1">
        {announcements.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-1 rounded-full transition-all duration-300 ${
              index === currentIndex 
                ? 'w-4 bg-white' 
                : 'w-1 bg-white/40 hover:bg-white/60'
            }`}
            aria-label={`Go to announcement ${index + 1}`}
          />
        ))}
      </div>

      {/* Navigation arrows - Right */}
      <button
        onClick={nextAnnouncement}
        className="absolute right-10 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/20 transition-colors z-10 hidden sm:block"
        aria-label="Next announcement"
      >
        <ChevronRight className="h-4 w-4 text-primary-foreground" />
      </button>

      {/* Close button */}
      <button
        onClick={() => setIsVisible(false)}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/20 transition-colors z-10"
        aria-label="Close announcement"
      >
        <X className="h-4 w-4 text-primary-foreground" />
      </button>
    </motion.div>
  );
};

export default AnnouncementBar;
