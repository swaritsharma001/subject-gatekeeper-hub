import React, { useRef, useEffect, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Volume1,
  Maximize, 
  Minimize,
  Settings, 
  Loader2,
  Check,
  PictureInPicture2,
  ChevronRight,
  Subtitles,
  Gauge,
  Layers
} from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  title: string;
}

interface SubtitleTrack {
  label: string;
  srclang: string;
  src: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, title }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const hideControlsTimeout = useRef<NodeJS.Timeout>();
  const doubleTapTimeout = useRef<NodeJS.Timeout>();
  const longPressTimeout = useRef<NodeJS.Timeout>();
  const lastTapTime = useRef<number>(0);
  const lastTapX = useRef<number>(0);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const touchStartY = useRef<number>(0);
  const touchStartX = useRef<number>(0);
  const isLongPress = useRef<boolean>(false);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [currentQuality, setCurrentQuality] = useState<number>(-1);
  const [availableQualities, setAvailableQualities] = useState<number[]>([]);
  const [progress, setProgress] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [settingsMenu, setSettingsMenu] = useState<'main' | 'quality' | 'speed' | 'subtitles'>('main');
  const [isPiP, setIsPiP] = useState(false);
  const [seekIndicator, setSeekIndicator] = useState<{ side: 'left' | 'right'; show: boolean; seconds: number }>({ side: 'left', show: false, seconds: 10 });
  const [showSpeedOverlay, setShowSpeedOverlay] = useState(false);
  const [currentSubtitle, setCurrentSubtitle] = useState<string>('off');
  const [availableSubtitles] = useState<SubtitleTrack[]>([
    { label: 'English', srclang: 'en', src: '' },
    { label: 'Hindi', srclang: 'hi', src: '' },
    { label: 'Spanish', srclang: 'es', src: '' },
  ]);

  const playbackSpeeds = [1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3];

  // Initialize HLS
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Prevent default video click behavior
    video.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

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

  // Video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      setProgress((video.currentTime / video.duration) * 100);
    };

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        setBuffered((bufferedEnd / video.duration) * 100);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('progress', handleProgress);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('progress', handleProgress);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, []);

  // Fullscreen listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // PiP listener
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleEnterPiP = () => setIsPiP(true);
    const handleLeavePiP = () => setIsPiP(false);

    video.addEventListener('enterpictureinpicture', handleEnterPiP);
    video.addEventListener('leavepictureinpicture', handleLeavePiP);

    return () => {
      video.removeEventListener('enterpictureinpicture', handleEnterPiP);
      video.removeEventListener('leavepictureinpicture', handleLeavePiP);
    };
  }, []);

  // Screen Wake Lock for mobile
  useEffect(() => {
    const requestWakeLock = async () => {
      if ('wakeLock' in navigator && isPlaying) {
        try {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
        } catch (err) {
          console.log('Wake Lock error:', err);
        }
      }
    };

    const releaseWakeLock = async () => {
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    };

    if (isPlaying) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }

    return () => {
      releaseWakeLock();
    };
  }, [isPlaying]);

  // Keyboard shortcuts (desktop)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      if (activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA') return;

      const video = videoRef.current;
      if (!video) return;

      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'arrowleft':
          e.preventDefault();
          skip(-10);
          showSeekIndicator('left', 10);
          break;
        case 'arrowright':
          e.preventDefault();
          skip(10);
          showSeekIndicator('right', 10);
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'p':
          e.preventDefault();
          togglePiP();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying]);

  // Auto-hide controls
  const resetHideTimer = useCallback(() => {
    if (hideControlsTimeout.current) {
      clearTimeout(hideControlsTimeout.current);
    }
    setShowControls(true);
    if (isPlaying) {
      hideControlsTimeout.current = setTimeout(() => {
        setShowControls(false);
        setShowSettings(false);
        setShowVolumeSlider(false);
        setShowSpeedOverlay(false);
      }, 3000);
    }
  }, [isPlaying]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
    resetHideTimer();
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
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

  const togglePiP = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture();
      }
    } catch (err) {
      console.error('PiP error:', err);
    }
  };

  const handleQualityChange = (height: number) => {
    const hls = hlsRef.current;
    if (!hls) return;

    if (height === -1) {
      hls.currentLevel = -1;
    } else {
      const levelIndex = hls.levels.findIndex((level) => level.height === height);
      if (levelIndex !== -1) {
        hls.currentLevel = levelIndex;
      }
    }
    setCurrentQuality(height);
    setShowSettings(false);
    setSettingsMenu('main');
  };

  const handleSpeedChange = (speed: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = speed;
    setPlaybackSpeed(speed);
    setShowSettings(false);
    setShowSpeedOverlay(false);
    setSettingsMenu('main');
  };

  const handleSubtitleChange = (lang: string) => {
    setCurrentSubtitle(lang);
    setShowSettings(false);
    setSettingsMenu('main');
    // Here you would actually enable/disable subtitle tracks
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    const progressBar = progressRef.current;
    if (!video || !progressBar) return;

    const rect = progressBar.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const percent = (clientX - rect.left) / rect.width;
    video.currentTime = Math.max(0, Math.min(duration, percent * video.duration));
  };

  const handleProgressHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const progressBar = progressRef.current;
    if (!progressBar || !duration) return;

    const rect = progressBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    setHoverTime(percent * duration);
    setHoverPosition(e.clientX - rect.left);
  };

  const skip = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
  };

  const showSeekIndicator = (side: 'left' | 'right', seconds: number) => {
    setSeekIndicator({ side, show: true, seconds });
    setTimeout(() => setSeekIndicator(prev => ({ ...prev, show: false })), 600);
  };

  // Handle video area tap - NEVER pause, only toggle controls or seek
  const handleVideoTap = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const container = containerRef.current;
    if (!container) return;

    const now = Date.now();
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isLeftSide = x < rect.width / 3;
    const isRightSide = x > (rect.width * 2) / 3;

    // Double tap detection
    if (now - lastTapTime.current < 300 && Math.abs(x - lastTapX.current) < 100) {
      clearTimeout(doubleTapTimeout.current);
      
      if (isLeftSide) {
        skip(-10);
        showSeekIndicator('left', 10);
      } else if (isRightSide) {
        skip(10);
        showSeekIndicator('right', 10);
      }
      
      lastTapTime.current = 0;
    } else {
      lastTapTime.current = now;
      lastTapX.current = x;
      
      doubleTapTimeout.current = setTimeout(() => {
        // Single tap - toggle controls only, NEVER pause
        if (showControls) {
          setShowControls(false);
          setShowSettings(false);
        } else {
          setShowControls(true);
          resetHideTimer();
        }
      }, 250);
    }
  };

  // Touch handlers for mobile gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
    isLongPress.current = false;

    // Long press detection for speed menu
    longPressTimeout.current = setTimeout(() => {
      isLongPress.current = true;
      setShowSpeedOverlay(true);
      setShowControls(true);
    }, 500);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    clearTimeout(longPressTimeout.current);
    
    const deltaY = touchStartY.current - e.touches[0].clientY;
    const deltaX = e.touches[0].clientX - touchStartX.current;
    
    // Vertical swipe
    if (Math.abs(deltaY) > 50 && Math.abs(deltaY) > Math.abs(deltaX)) {
      if (deltaY > 0) {
        setShowControls(true);
        resetHideTimer();
      } else {
        setShowControls(false);
        setShowSettings(false);
      }
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchEnd = () => {
    clearTimeout(longPressTimeout.current);
    if (isLongPress.current) {
      // Long press ended, hide speed overlay after selection
      setTimeout(() => setShowSpeedOverlay(false), 3000);
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getQualityLabel = (height: number) => {
    if (height === -1) return 'Auto';
    if (height >= 1080) return '1080p';
    if (height >= 720) return '720p';
    if (height >= 480) return '480p';
    if (height >= 360) return '360p';
    if (height >= 240) return '240p';
    return `${height}p`;
  };

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return <VolumeX className="h-6 w-6 sm:h-7 sm:w-7" />;
    if (volume < 0.5) return <Volume1 className="h-6 w-6 sm:h-7 sm:w-7" />;
    return <Volume2 className="h-6 w-6 sm:h-7 sm:w-7" />;
  };

  return (
    <div
      ref={containerRef}
      className="relative aspect-video w-full overflow-hidden rounded-xl bg-black select-none"
      onMouseMove={resetHideTimer}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Video Element - click disabled */}
      <video
        ref={videoRef}
        className="h-full w-full pointer-events-none"
        playsInline
        webkit-playsinline="true"
      />

      {/* Tap/Click overlay - handles all interactions */}
      <div 
        className="absolute inset-0 z-10"
        onClick={handleVideoTap}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      {/* Double tap seek indicators */}
      <AnimatePresence>
        {seekIndicator.show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className={`absolute top-1/2 -translate-y-1/2 z-20 ${
              seekIndicator.side === 'left' ? 'left-8 sm:left-16' : 'right-8 sm:right-16'
            }`}
          >
            <div className="flex flex-col items-center gap-2 bg-black/70 rounded-full p-5 backdrop-blur-sm">
              <div className="flex items-center gap-1">
                {seekIndicator.side === 'left' ? (
                  <>
                    <div className="w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-r-[12px] border-r-white" />
                    <div className="w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-r-[12px] border-r-white" />
                  </>
                ) : (
                  <>
                    <div className="w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[12px] border-l-white" />
                    <div className="w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[12px] border-l-white" />
                  </>
                )}
              </div>
              <span className="text-white text-sm font-semibold">{seekIndicator.seconds} seconds</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Speed overlay (long press) */}
      <AnimatePresence>
        {showSpeedOverlay && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 bg-black/90 rounded-2xl p-4 backdrop-blur-sm"
          >
            <p className="text-white/70 text-xs text-center mb-3 font-medium">Playback Speed</p>
            <div className="flex gap-2 flex-wrap justify-center max-w-[280px]">
              {playbackSpeeds.map((speed) => (
                <button
                  key={speed}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSpeedChange(speed);
                  }}
                  className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                    playbackSpeed === speed 
                      ? 'bg-white text-black' 
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading spinner */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/40 z-20 pointer-events-none"
          >
            <Loader2 className="h-14 w-14 text-white animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Big center play button (only when paused) */}
      <AnimatePresence>
        {!isPlaying && !isLoading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
          >
            <button 
              className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm pointer-events-auto hover:bg-black/70 active:scale-95 transition-all shadow-2xl"
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
            >
              <Play className="h-10 w-10 sm:h-12 sm:w-12 text-white ml-1.5" fill="white" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Title overlay */}
      <motion.div 
        initial={false}
        animate={{ opacity: showControls ? 1 : 0 }}
        className="absolute top-0 inset-x-0 p-4 sm:p-5 bg-gradient-to-b from-black/80 via-black/40 to-transparent z-20 pointer-events-none"
      >
        <h3 className="text-white font-semibold text-base sm:text-lg line-clamp-1 drop-shadow-lg">{title}</h3>
      </motion.div>

      {/* Bottom gradient */}
      <motion.div 
        initial={false}
        animate={{ opacity: showControls ? 1 : 0 }}
        className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none z-15"
      />

      {/* Controls */}
      <motion.div
        initial={false}
        animate={{ opacity: showControls ? 1 : 0 }}
        className={`absolute inset-x-0 bottom-0 px-3 sm:px-4 pb-3 sm:pb-4 z-30 ${showControls ? '' : 'pointer-events-none'}`}
      >
        {/* Progress bar - bigger for touch */}
        <div
          ref={progressRef}
          className="relative h-2 sm:h-1.5 w-full cursor-pointer group/progress mb-4 touch-none"
          onClick={handleProgressClick}
          onTouchStart={handleProgressClick}
          onMouseMove={handleProgressHover}
          onMouseLeave={() => setHoverTime(null)}
        >
          {/* Background */}
          <div className="absolute inset-0 rounded-full bg-white/30" />
          
          {/* Buffered */}
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-white/50"
            style={{ width: `${buffered}%` }}
          />
          
          {/* Progress */}
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-red-500"
            style={{ width: `${progress}%` }}
          />
          
          {/* Scrubber dot - bigger for touch */}
          <div
            className="absolute top-1/2 -translate-y-1/2 h-5 w-5 sm:h-4 sm:w-4 rounded-full bg-red-500 shadow-lg transition-transform active:scale-125"
            style={{ left: `${progress}%`, transform: 'translate(-50%, -50%)' }}
          />

          {/* Hover time tooltip */}
          {hoverTime !== null && (
            <div
              className="absolute -top-10 transform -translate-x-1/2 bg-black/90 text-white text-xs px-3 py-1.5 rounded-lg pointer-events-none font-medium"
              style={{ left: hoverPosition }}
            >
              {formatTime(hoverTime)}
            </div>
          )}
        </div>

        {/* Control buttons - bigger for mobile */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Play/Pause - large touch target */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              className="p-3 sm:p-2.5 text-white hover:text-white/80 active:scale-90 transition-all rounded-full hover:bg-white/10"
            >
              {isPlaying ? (
                <Pause className="h-7 w-7 sm:h-6 sm:w-6" fill="white" />
              ) : (
                <Play className="h-7 w-7 sm:h-6 sm:w-6" fill="white" />
              )}
            </button>

            {/* Volume - desktop only */}
            <div 
              className="relative items-center hidden sm:flex"
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMute();
                }}
                className="p-2.5 text-white hover:text-white/80 transition-colors rounded-full hover:bg-white/10"
              >
                {getVolumeIcon()}
              </button>
              
              <div className={`overflow-hidden transition-all duration-200 ${showVolumeSlider ? 'w-24 opacity-100' : 'w-0 opacity-0'}`}>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full h-1 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                />
              </div>
            </div>

            {/* Time display */}
            <span className="text-white text-xs sm:text-sm font-medium tabular-nums ml-1">
              {formatTime(currentTime)} <span className="text-white/60">/</span> {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-0.5 sm:gap-1">
            {/* Subtitles */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowSettings(true);
                setSettingsMenu('subtitles');
              }}
              className={`p-3 sm:p-2.5 transition-all rounded-full hover:bg-white/10 ${
                currentSubtitle !== 'off' ? 'text-red-500' : 'text-white hover:text-white/80'
              }`}
            >
              <Subtitles className="h-6 w-6 sm:h-5 sm:w-5" />
            </button>

            {/* Settings */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSettings(!showSettings);
                  setSettingsMenu('main');
                }}
                className="p-3 sm:p-2.5 text-white hover:text-white/80 transition-all rounded-full hover:bg-white/10"
              >
                <Settings className={`h-6 w-6 sm:h-5 sm:w-5 transition-transform ${showSettings ? 'rotate-45' : ''}`} />
              </button>

              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute bottom-14 right-0 bg-black/95 rounded-xl overflow-hidden min-w-[260px] shadow-2xl backdrop-blur-md border border-white/10"
                  >
                    {settingsMenu === 'main' && (
                      <div className="py-2">
                        <button
                          onClick={() => setSettingsMenu('speed')}
                          className="w-full px-4 py-3.5 text-left text-sm flex items-center justify-between hover:bg-white/10 text-white active:bg-white/20"
                        >
                          <div className="flex items-center gap-3">
                            <Gauge className="h-5 w-5 text-white/70" />
                            <span>Playback speed</span>
                          </div>
                          <div className="flex items-center gap-1 text-white/60">
                            <span>{playbackSpeed === 1 ? 'Normal' : `${playbackSpeed}x`}</span>
                            <ChevronRight className="h-4 w-4" />
                          </div>
                        </button>
                        <button
                          onClick={() => setSettingsMenu('quality')}
                          className="w-full px-4 py-3.5 text-left text-sm flex items-center justify-between hover:bg-white/10 text-white active:bg-white/20"
                        >
                          <div className="flex items-center gap-3">
                            <Layers className="h-5 w-5 text-white/70" />
                            <span>Quality</span>
                          </div>
                          <div className="flex items-center gap-1 text-white/60">
                            <span>{currentQuality === -1 ? 'Auto' : getQualityLabel(currentQuality)}</span>
                            <ChevronRight className="h-4 w-4" />
                          </div>
                        </button>
                        <button
                          onClick={() => setSettingsMenu('subtitles')}
                          className="w-full px-4 py-3.5 text-left text-sm flex items-center justify-between hover:bg-white/10 text-white active:bg-white/20"
                        >
                          <div className="flex items-center gap-3">
                            <Subtitles className="h-5 w-5 text-white/70" />
                            <span>Subtitles</span>
                          </div>
                          <div className="flex items-center gap-1 text-white/60">
                            <span>{currentSubtitle === 'off' ? 'Off' : availableSubtitles.find(s => s.srclang === currentSubtitle)?.label}</span>
                            <ChevronRight className="h-4 w-4" />
                          </div>
                        </button>
                      </div>
                    )}

                    {settingsMenu === 'speed' && (
                      <>
                        <button
                          onClick={() => setSettingsMenu('main')}
                          className="w-full px-4 py-3 text-white/80 text-sm font-medium border-b border-white/10 text-left hover:bg-white/5 flex items-center gap-2"
                        >
                          ← Playback speed
                        </button>
                        <div className="py-1 max-h-[360px] overflow-y-auto">
                          {playbackSpeeds.map((speed) => (
                            <button
                              key={speed}
                              onClick={() => handleSpeedChange(speed)}
                              className={`w-full px-4 py-3 text-left text-sm flex items-center justify-between hover:bg-white/10 active:bg-white/20 ${
                                playbackSpeed === speed ? 'text-white bg-white/5' : 'text-white/70'
                              }`}
                            >
                              <span>{speed === 1 ? 'Normal' : `${speed}x`}</span>
                              {playbackSpeed === speed && <Check className="h-5 w-5 text-red-500" />}
                            </button>
                          ))}
                        </div>
                      </>
                    )}

                    {settingsMenu === 'quality' && (
                      <>
                        <button
                          onClick={() => setSettingsMenu('main')}
                          className="w-full px-4 py-3 text-white/80 text-sm font-medium border-b border-white/10 text-left hover:bg-white/5 flex items-center gap-2"
                        >
                          ← Quality
                        </button>
                        <div className="py-1">
                          <button
                            onClick={() => handleQualityChange(-1)}
                            className={`w-full px-4 py-3 text-left text-sm flex items-center justify-between hover:bg-white/10 active:bg-white/20 ${
                              currentQuality === -1 ? 'text-white bg-white/5' : 'text-white/70'
                            }`}
                          >
                            <span>Auto</span>
                            {currentQuality === -1 && <Check className="h-5 w-5 text-red-500" />}
                          </button>
                          {availableQualities.map((quality) => (
                            <button
                              key={quality}
                              onClick={() => handleQualityChange(quality)}
                              className={`w-full px-4 py-3 text-left text-sm flex items-center justify-between hover:bg-white/10 active:bg-white/20 ${
                                currentQuality === quality ? 'text-white bg-white/5' : 'text-white/70'
                              }`}
                            >
                              <span>{getQualityLabel(quality)}</span>
                              {currentQuality === quality && <Check className="h-5 w-5 text-red-500" />}
                            </button>
                          ))}
                        </div>
                      </>
                    )}

                    {settingsMenu === 'subtitles' && (
                      <>
                        <button
                          onClick={() => setSettingsMenu('main')}
                          className="w-full px-4 py-3 text-white/80 text-sm font-medium border-b border-white/10 text-left hover:bg-white/5 flex items-center gap-2"
                        >
                          ← Subtitles
                        </button>
                        <div className="py-1">
                          <button
                            onClick={() => handleSubtitleChange('off')}
                            className={`w-full px-4 py-3 text-left text-sm flex items-center justify-between hover:bg-white/10 active:bg-white/20 ${
                              currentSubtitle === 'off' ? 'text-white bg-white/5' : 'text-white/70'
                            }`}
                          >
                            <span>Off</span>
                            {currentSubtitle === 'off' && <Check className="h-5 w-5 text-red-500" />}
                          </button>
                          {availableSubtitles.map((sub) => (
                            <button
                              key={sub.srclang}
                              onClick={() => handleSubtitleChange(sub.srclang)}
                              className={`w-full px-4 py-3 text-left text-sm flex items-center justify-between hover:bg-white/10 active:bg-white/20 ${
                                currentSubtitle === sub.srclang ? 'text-white bg-white/5' : 'text-white/70'
                              }`}
                            >
                              <span>{sub.label}</span>
                              {currentSubtitle === sub.srclang && <Check className="h-5 w-5 text-red-500" />}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Picture in Picture */}
            {document.pictureInPictureEnabled && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePiP();
                }}
                className={`p-3 sm:p-2.5 transition-all rounded-full hover:bg-white/10 ${isPiP ? 'text-red-500' : 'text-white hover:text-white/80'}`}
              >
                <PictureInPicture2 className="h-6 w-6 sm:h-5 sm:w-5" />
              </button>
            )}

            {/* Fullscreen */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFullscreen();
              }}
              className="p-3 sm:p-2.5 text-white hover:text-white/80 transition-all rounded-full hover:bg-white/10"
            >
              {isFullscreen ? (
                <Minimize className="h-6 w-6 sm:h-5 sm:w-5" />
              ) : (
                <Maximize className="h-6 w-6 sm:h-5 sm:w-5" />
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default VideoPlayer;
