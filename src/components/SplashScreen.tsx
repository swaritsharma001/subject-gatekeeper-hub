import { motion } from 'framer-motion';
import logo from '@/assets/logo.png';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 0.5, delay: 2.5 }}
      onAnimationComplete={onComplete}
    >
      <motion.div
        className="flex flex-col items-center gap-6"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Logo with pulse animation */}
        <motion.div
          className="relative"
          animate={{ 
            scale: [1, 1.05, 1],
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <motion.div
            className="absolute inset-0 rounded-full bg-primary/20 blur-xl"
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.5, 0.8, 0.5]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <img 
            src={logo} 
            alt="StudyX Logo" 
            className="relative w-24 h-24 md:w-32 md:h-32 object-contain drop-shadow-2xl"
          />
        </motion.div>

        {/* Brand name with stagger animation */}
        <motion.div
          className="flex items-center gap-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <span className="text-4xl md:text-5xl font-display font-bold text-foreground">
            Study
          </span>
          <span className="text-4xl md:text-5xl font-display font-bold text-primary">
            X
          </span>
        </motion.div>

        {/* Tagline */}
        <motion.p
          className="text-muted-foreground text-sm md:text-base"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          Learn Smarter
        </motion.p>

        {/* Loading indicator */}
        <motion.div
          className="mt-8 flex gap-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-primary"
              animate={{ 
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ 
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
            />
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default SplashScreen;
