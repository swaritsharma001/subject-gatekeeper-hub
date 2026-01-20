import { motion } from 'framer-motion';
import logo from '@/assets/logo.png';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background overflow-hidden"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 0.6, delay: 2.8 }}
      onAnimationComplete={onComplete}
    >
      {/* Background animated orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-20 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-20 -right-20 w-96 h-96 bg-secondary/20 rounded-full blur-3xl"
          animate={{
            x: [0, -50, 0],
            y: [0, -30, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        />
      </div>

      <motion.div
        className="relative flex flex-col items-center gap-6"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, type: 'spring', damping: 12 }}
      >
        {/* Logo container with multiple ring animations */}
        <div className="relative">
          {/* Outer pulse ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-primary/40"
            style={{ scale: 1.5 }}
            animate={{
              scale: [1.5, 2, 1.5],
              opacity: [0.4, 0, 0.4],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          
          {/* Middle rotating ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-dashed border-secondary/50"
            style={{ scale: 1.3 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          />

          {/* Glow effect */}
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 blur-2xl"
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.4, 0.7, 0.4],
            }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Logo with float animation */}
          <motion.img
            src={logo}
            alt="StudyX Logo"
            className="relative w-28 h-28 md:w-36 md:h-36 object-contain drop-shadow-2xl"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        {/* Brand name with letter animation */}
        <motion.div
          className="flex items-center gap-0"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          {'StudyX'.split('').map((letter, i) => (
            <motion.span
              key={i}
              className={`text-4xl md:text-5xl font-display font-bold ${
                letter === 'X' ? 'bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent' : 'text-foreground'
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.08, duration: 0.4 }}
            >
              {letter}
            </motion.span>
          ))}
        </motion.div>

        {/* Tagline with typewriter effect */}
        <motion.p
          className="text-muted-foreground text-sm md:text-base font-medium tracking-wide"
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: 'auto' }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          Learn Smarter, Grow Faster
        </motion.p>

        {/* Modern loading bar */}
        <motion.div
          className="mt-6 w-48 h-1 bg-muted rounded-full overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ delay: 1.3, duration: 1.5, ease: 'easeInOut' }}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default SplashScreen;
