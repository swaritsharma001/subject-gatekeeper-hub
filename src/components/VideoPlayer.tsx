import React, { useRef, useEffect, useState } from 'react';
import Hls from 'hls.js';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, Loader2 } from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  title: string;
}

const qualityLabels: Record<number, string> = {
  240: '240p',
  360: '360p',
  480: '480p',
  720: '720p',
  1080: '1080p',
};

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, title }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [currentQuality, setCurrentQuality] = useState<number>(-1);
  const [availableQualities, setAvailableQualities] = useState<number[]>([]);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported()) {
      const hls = new Hls({
        autoStartLoad: true,
        startLevel: -1,
      });
      
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        const qualities = data.levels.map((level) => level.height).filter(Boolean);
        setAvailableQualities([...new Set(qualities)].sort((a, b) => b - a));
        setIsLoading(false);
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        const level = hls.levels[data.level];
        if (level) {
          setCurrentQuality(level.height);
        }
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        console.error('HLS Error:', data);
        setIsLoading(false);
      });

      return () => {
        hls.destroy();
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      video.addEventListener('loadedmetadata', () => setIsLoading(false));
    }
  }, [src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setProgress((video.currentTime / video.duration) * 100);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      container.requestFullscreen();
    }
  };

  const handleQualityChange = (height: number) => {
    const hls = hlsRef.current;
    if (!hls) return;

    if (height === -1) {
      hls.currentLevel = -1; // Auto
    } else {
      const levelIndex = hls.levels.findIndex((level) => level.height === height);
      if (levelIndex !== -1) {
        hls.currentLevel = levelIndex;
      }
    }
    setCurrentQuality(height);
    setShowQualityMenu(false);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    video.currentTime = percent * video.duration;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="relative aspect-video w-full overflow-hidden rounded-2xl bg-foreground shadow-modal"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => !showQualityMenu && setShowControls(false)}
    >
      <video
        ref={videoRef}
        className="h-full w-full cursor-pointer"
        onClick={togglePlay}
        playsInline
      />

      {/* Loading overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-foreground/80"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Loader2 className="h-12 w-12 text-primary" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Play button overlay */}
      <AnimatePresence>
        {!isPlaying && !isLoading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 flex items-center justify-center"
            onClick={togglePlay}
          >
            <div className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-full gradient-primary shadow-lg transition-transform hover:scale-110">
              <Play className="h-8 w-8 text-primary-foreground ml-1" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/90 to-transparent p-4 pt-16"
          >
            {/* Progress bar */}
            <div
              className="mb-4 h-1.5 cursor-pointer rounded-full bg-primary-foreground/30"
              onClick={handleSeek}
            >
              <motion.div
                className="h-full rounded-full gradient-primary"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Control buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/20 text-primary-foreground transition-colors hover:bg-primary-foreground/30"
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                </button>

                <button
                  onClick={toggleMute}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/20 text-primary-foreground transition-colors hover:bg-primary-foreground/30"
                >
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </button>

                <span className="text-sm text-primary-foreground">
                  {formatTime(progress * duration / 100)} / {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* Quality selector */}
                <div className="relative">
                  <button
                    onClick={() => setShowQualityMenu(!showQualityMenu)}
                    className="flex h-10 items-center gap-2 rounded-lg bg-primary-foreground/20 px-3 text-sm text-primary-foreground transition-colors hover:bg-primary-foreground/30"
                  >
                    <Settings className="h-4 w-4" />
                    <span>{currentQuality === -1 ? 'Auto' : qualityLabels[currentQuality] || `${currentQuality}p`}</span>
                  </button>

                  <AnimatePresence>
                    {showQualityMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-12 right-0 min-w-[120px] overflow-hidden rounded-xl bg-card shadow-modal"
                      >
                        <button
                          onClick={() => handleQualityChange(-1)}
                          className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-muted ${
                            currentQuality === -1 ? 'bg-primary/10 text-primary' : 'text-foreground'
                          }`}
                        >
                          Auto
                        </button>
                        {availableQualities.map((quality) => (
                          <button
                            key={quality}
                            onClick={() => handleQualityChange(quality)}
                            className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-muted ${
                              currentQuality === quality ? 'bg-primary/10 text-primary' : 'text-foreground'
                            }`}
                          >
                            {qualityLabels[quality] || `${quality}p`}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  onClick={toggleFullscreen}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/20 text-primary-foreground transition-colors hover:bg-primary-foreground/30"
                >
                  <Maximize className="h-5 w-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default VideoPlayer;
