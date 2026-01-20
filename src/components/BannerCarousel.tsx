import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import banner1 from '@/assets/banner-1.jpg';
import banner2 from '@/assets/banner-2.jpg';
import banner3 from '@/assets/banner-3.jpg';

const banners = [
  {
    id: 1,
    image: banner1,
    title: 'Learn from Next Topper',
    subtitle: 'and become a Topper',
    cta: 'Start Learning',
  },
  {
    id: 2,
    image: banner2,
    title: 'Become a Topper',
    subtitle: 'With our expert-curated courses',
    cta: 'Explore Courses',
  },
  {
    id: 3,
    image: banner3,
    title: 'All Subjects Available',
    subtitle: 'Hindi, English, Maths, Science & more',
    cta: 'Browse Subjects',
  },
];

const BannerCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide]);

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl shadow-card-hover"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Banner slides */}
      <div className="relative aspect-[21/9] sm:aspect-[16/6] md:aspect-[21/8]">
        <AnimatePresence mode="wait">
          <motion.div
            key={banners[currentIndex].id}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            {/* Background image */}
            <img
              src={banners[currentIndex].image}
              alt={banners[currentIndex].title}
              className="w-full h-full object-cover"
            />

            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />

            {/* Content */}
            <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-10 md:px-16">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="max-w-lg"
              >
                <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
                  {banners[currentIndex].title}
                </h2>
                <p className="mt-2 text-lg sm:text-xl md:text-2xl text-white/90 font-medium">
                  {banners[currentIndex].subtitle}
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="mt-4 md:mt-6 px-6 py-2.5 md:px-8 md:py-3 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-shadow"
                >
                  {banners[currentIndex].cta}
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-5 w-5 md:h-6 md:w-6 text-white" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
        aria-label="Next slide"
      >
        <ChevronRight className="h-5 w-5 md:h-6 md:w-6 text-white" />
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'w-8 bg-white'
                : 'w-2 bg-white/50 hover:bg-white/70'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
        <motion.div
          key={currentIndex}
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 5, ease: 'linear' }}
          className="h-full bg-gradient-to-r from-primary to-secondary"
          style={{ animationPlayState: isPaused ? 'paused' : 'running' }}
        />
      </div>
    </div>
  );
};

export default BannerCarousel;
