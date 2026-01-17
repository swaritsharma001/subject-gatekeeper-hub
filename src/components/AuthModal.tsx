import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyRound, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const AuthModal: React.FC = () => {
  const { isAuthenticated, login } = useAuth();
  const [inputKey, setInputKey] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const success = await login(inputKey.trim());
    setIsLoading(false);

    if (!success) {
      setError('Invalid or already used auth key.');
      setInputKey('');
    }
  };

  if (isAuthenticated) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md overflow-hidden rounded-2xl bg-card shadow-modal"
        >
          {/* Gradient top border */}
          <div className="h-1.5 w-full gradient-primary" />

          <div className="p-8">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', damping: 15 }}
              className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary animate-pulse-glow"
            >
              <KeyRound className="h-8 w-8 text-primary-foreground" />
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <h2 className="font-display text-2xl font-bold text-foreground">
                Welcome to Subject Topper
              </h2>
              <p className="mt-2 text-muted-foreground">
                Enter your auth key to access the platform
              </p>
            </motion.div>

            {/* Form */}
            <motion.form
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              onSubmit={handleSubmit}
              className="mt-8 space-y-4"
            >
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Enter your auth key..."
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  className="h-12 rounded-xl border-2 border-border bg-background px-4 text-center text-lg tracking-widest transition-all focus:border-primary focus:ring-4 focus:ring-primary/20"
                  autoFocus
                />
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-center gap-2 text-sm text-destructive"
                  >
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </motion.div>
                )}
              </div>

              <Button
                type="submit"
                disabled={!inputKey.trim() || isLoading}
                className="h-12 w-full rounded-xl gradient-primary text-base font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50"
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Sparkles className="h-5 w-5" />
                  </motion.div>
                ) : (
                  'Access Platform'
                )}
              </Button>
            </motion.form>

            {/* Footer */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-6 text-center text-sm text-muted-foreground"
            >
              Don't have an auth key? Contact your administrator.
            </motion.p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AuthModal;
