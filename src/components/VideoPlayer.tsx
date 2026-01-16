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
  SkipBack,
  SkipForward,
  Check,
  PictureInPicture2,
  RectangleHorizontal,
  X
} from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  title: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, title }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const hideControlsTimeout = useRef<NodeJS.Timeout>();
  const doubleTapTimeout = useRef<NodeJS.Timeout>();
  const lastTapTime = useRef<number>(0);
  const lastTapX = useRef<number>(0);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const touchStartY = useRef<number>(0);
  
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
  const [settingsMenu, setSettingsMenu] = useState<'main' | 'quality' | 'speed'>('main');
  const [isPiP, setIsPiP] = useState(false);
  const [isTheatreMode, setIsTheatreMode] = useState(false);
  const [seekIndicator, setSeekIndicator] = useState<{ side: 'left' | 'right'; show: boolean }>({ side: 'left', show: false });

  const playbackSpeeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  // Initialize HLS
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if video player is focused or no input is focused
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
          break;
        case 'arrowright':
          e.preventDefault();
          skip(10);
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
        case 'escape':
          if (isTheatreMode) {
            setIsTheatreMode(false);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isTheatreMode]);

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
    setSettingsMenu('main');
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    const progressBar = progressRef.current;
    if (!video || !progressBar) return;

    const rect = progressBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    video.currentTime = percent * video.duration;
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

  // Handle video area click/tap - only toggle controls, NOT pause
  const handleVideoClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;

    const now = Date.now();
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isLeftSide = x < rect.width / 2;

    // Double tap/click detection
    if (now - lastTapTime.current < 300 && Math.abs(x - lastTapX.current) < 100) {
      // Double tap detected
      clearTimeout(doubleTapTimeout.current);
      
      if (isLeftSide) {
        skip(-10);
        setSeekIndicator({ side: 'left', show: true });
      } else {
        skip(10);
        setSeekIndicator({ side: 'right', show: true });
      }
      
      setTimeout(() => setSeekIndicator({ side: 'left', show: false }), 500);
      lastTapTime.current = 0;
    } else {
      // Single tap - just toggle controls
      lastTapTime.current = now;
      lastTapX.current = x;
      
      doubleTapTimeout.current = setTimeout(() => {
        // Single tap confirmed - toggle controls only
        setShowControls(prev => !prev);
        if (!showControls) {
          resetHideTimer();
        }
      }, 200);
    }
  };

  // Touch handlers for swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const deltaY = touchStartY.current - e.touches[0].clientY;
    
    if (Math.abs(deltaY) > 50) {
      if (deltaY > 0) {
        // Swipe up - show controls
        setShowControls(true);
        resetHideTimer();
      } else {
        // Swipe down - hide controls
        setShowControls(false);
        setShowSettings(false);
      }
      touchStartY.current = e.touches[0].clientY;
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
    if (isMuted || volume === 0) return <VolumeX className="h-5 w-5 sm:h-6 sm:w-6" />;
    if (volume < 0.5) return <Volume1 className="h-5 w-5 sm:h-6 sm:w-6" />;
    return <Volume2 className="h-5 w-5 sm:h-6 sm:w-6" />;
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-xl bg-black group transition-all duration-300 ${
        isTheatreMode ? 'w-full max-w-none aspect-[21/9]' : 'aspect-video w-full'
      }`}
      onMouseMove={resetHideTimer}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="h-full w-full"
        playsInline
      />

      {/* Click/Tap overlay - handles single/double tap */}
      <div 
        className="absolute inset-0 cursor-pointer"
        onClick={handleVideoClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      />

      {/* Double tap seek indicators */}
      <AnimatePresence>
        {seekIndicator.show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className={`absolute top-1/2 -translate-y-1/2 ${
              seekIndicator.side === 'left' ? 'left-12' : 'right-12'
            }`}
          >
            <div className="flex flex-col items-center gap-1 bg-black/60 rounded-full p-4">
              {seekIndicator.side === 'left' ? (
                <SkipBack className="h-8 w-8 text-white" />
              ) : (
                <SkipForward className="h-8 w-8 text-white" />
              )}
              <span className="text-white text-sm font-medium">10s</span>
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
            className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-none"
          >
            <Loader2 className="h-12 w-12 text-white animate-spin" />
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
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div 
              className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-black/70 cursor-pointer pointer-events-auto hover:bg-black/80 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
            >
              <Play className="h-7 w-7 sm:h-8 sm:w-8 text-white ml-1" fill="white" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom gradient */}
      <div 
        className={`absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`} 
      />

      {/* Title overlay */}
      <div 
        className={`absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/70 to-transparent transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <h3 className="text-white font-medium text-sm sm:text-base line-clamp-1">{title}</h3>
      </div>

      {/* Controls */}
      <div
        className={`absolute inset-x-0 bottom-0 px-3 pb-3 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Progress bar */}
        <div
          ref={progressRef}
          className="relative h-1 w-full cursor-pointer group/progress mb-3 hover:h-1.5 transition-all"
          onClick={handleProgressClick}
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
            className="absolute inset-y-0 left-0 rounded-full bg-red-600"
            style={{ width: `${progress}%` }}
          />
          
          {/* Hover indicator */}
          <div 
            className="absolute inset-y-0 left-0 rounded-full bg-white/30 opacity-0 group-hover/progress:opacity-100"
            style={{ width: `${(hoverTime ?? 0) / duration * 100}%` }}
          />
          
          {/* Scrubber dot */}
          <div
            className="absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full bg-red-600 opacity-0 group-hover/progress:opacity-100 transition-opacity shadow-lg"
            style={{ left: `${progress}%`, transform: 'translate(-50%, -50%)' }}
          />

          {/* Hover time tooltip */}
          {hoverTime !== null && (
            <div
              className="absolute -top-8 transform -translate-x-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded pointer-events-none"
              style={{ left: hoverPosition }}
            >
              {formatTime(hoverTime)}
            </div>
          )}
        </div>

        {/* Control buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="p-2 text-white hover:text-white/80 transition-colors"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5 sm:h-6 sm:w-6" fill="white" />
              ) : (
                <Play className="h-5 w-5 sm:h-6 sm:w-6" fill="white" />
              )}
            </button>

            {/* Skip buttons */}
            <button
              onClick={() => skip(-10)}
              className="p-2 text-white hover:text-white/80 transition-colors hidden sm:block"
              title="Rewind 10s (←)"
            >
              <SkipBack className="h-5 w-5" />
            </button>
            <button
              onClick={() => skip(10)}
              className="p-2 text-white hover:text-white/80 transition-colors hidden sm:block"
              title="Forward 10s (→)"
            >
              <SkipForward className="h-5 w-5" />
            </button>

            {/* Volume */}
            <div 
              className="relative flex items-center"
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
            >
              <button
                onClick={toggleMute}
                className="p-2 text-white hover:text-white/80 transition-colors"
                title="Mute (M)"
              >
                {getVolumeIcon()}
              </button>
              
              {/* Volume slider */}
              <div className={`overflow-hidden transition-all duration-200 ${showVolumeSlider ? 'w-20 opacity-100' : 'w-0 opacity-0'}`}>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-full h-1 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                />
              </div>
            </div>

            {/* Time */}
            <span className="text-white text-xs sm:text-sm ml-2 font-medium tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-0.5 sm:gap-1">
            {/* Settings (Quality & Speed) */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowSettings(!showSettings);
                  setSettingsMenu('main');
                }}
                className="p-2 text-white hover:text-white/80 transition-colors"
              >
                <Settings className={`h-5 w-5 sm:h-6 sm:w-6 transition-transform ${showSettings ? 'rotate-45' : ''}`} />
              </button>

              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-12 right-0 bg-black/95 rounded-lg overflow-hidden min-w-[200px] shadow-xl backdrop-blur-sm"
                  >
                    {settingsMenu === 'main' && (
                      <div className="py-1">
                        <button
                          onClick={() => setSettingsMenu('speed')}
                          className="w-full px-4 py-2.5 text-left text-sm flex items-center justify-between hover:bg-white/10 text-white"
                        >
                          <span>Playback speed</span>
                          <span className="text-white/60">{playbackSpeed === 1 ? 'Normal' : `${playbackSpeed}x`}</span>
                        </button>
                        <button
                          onClick={() => setSettingsMenu('quality')}
                          className="w-full px-4 py-2.5 text-left text-sm flex items-center justify-between hover:bg-white/10 text-white"
                        >
                          <span>Quality</span>
                          <span className="text-white/60">{currentQuality === -1 ? 'Auto' : getQualityLabel(currentQuality)}</span>
                        </button>
                      </div>
                    )}

                    {settingsMenu === 'speed' && (
                      <>
                        <button
                          onClick={() => setSettingsMenu('main')}
                          className="w-full px-4 py-2.5 text-white/80 text-sm font-medium border-b border-white/10 text-left hover:bg-white/5 flex items-center gap-2"
                        >
                          ← Playback speed
                        </button>
                        <div className="py-1 max-h-[240px] overflow-y-auto">
                          {playbackSpeeds.map((speed) => (
                            <button
                              key={speed}
                              onClick={() => handleSpeedChange(speed)}
                              className={`w-full px-4 py-2.5 text-left text-sm flex items-center justify-between hover:bg-white/10 ${
                                playbackSpeed === speed ? 'text-white bg-white/5' : 'text-white/70'
                              }`}
                            >
                              <span>{speed === 1 ? 'Normal' : `${speed}x`}</span>
                              {playbackSpeed === speed && <Check className="h-4 w-4 text-red-500" />}
                            </button>
                          ))}
                        </div>
                      </>
                    )}

                    {settingsMenu === 'quality' && (
                      <>
                        <button
                          onClick={() => setSettingsMenu('main')}
                          className="w-full px-4 py-2.5 text-white/80 text-sm font-medium border-b border-white/10 text-left hover:bg-white/5 flex items-center gap-2"
                        >
                          ← Quality
                        </button>
                        <div className="py-1">
                          <button
                            onClick={() => handleQualityChange(-1)}
                            className={`w-full px-4 py-2.5 text-left text-sm flex items-center justify-between hover:bg-white/10 ${
                              currentQuality === -1 ? 'text-white bg-white/5' : 'text-white/70'
                            }`}
                          >
                            <span>Auto</span>
                            {currentQuality === -1 && <Check className="h-4 w-4 text-red-500" />}
                          </button>
                          {availableQualities.map((quality) => (
                            <button
                              key={quality}
                              onClick={() => handleQualityChange(quality)}
                              className={`w-full px-4 py-2.5 text-left text-sm flex items-center justify-between hover:bg-white/10 ${
                                currentQuality === quality ? 'text-white bg-white/5' : 'text-white/70'
                              }`}
                            >
                              <span>{getQualityLabel(quality)}</span>
                              {currentQuality === quality && <Check className="h-4 w-4 text-red-500" />}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Theatre Mode */}
            <button
              onClick={() => setIsTheatreMode(!isTheatreMode)}
              className={`p-2 transition-colors hidden sm:block ${isTheatreMode ? 'text-red-500' : 'text-white hover:text-white/80'}`}
              title="Theatre mode"
            >
              {isTheatreMode ? (
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              ) : (
                <RectangleHorizontal className="h-5 w-5 sm:h-6 sm:w-6" />
              )}
            </button>

            {/* Picture in Picture */}
            {document.pictureInPictureEnabled && (
              <button
                onClick={togglePiP}
                className={`p-2 transition-colors ${isPiP ? 'text-red-500' : 'text-white hover:text-white/80'}`}
                title="Picture in Picture (P)"
              >
                <PictureInPicture2 className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            )}

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-2 text-white hover:text-white/80 transition-colors"
              title="Fullscreen (F)"
            >
              {isFullscreen ? (
                <Minimize className="h-5 w-5 sm:h-6 sm:w-6" />
              ) : (
                <Maximize className="h-5 w-5 sm:h-6 sm:w-6" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
