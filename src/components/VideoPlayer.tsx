import React, { useRef, useEffect, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize,
  Settings, 
  Loader2,
  SkipBack,
  SkipForward,
  Check
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

  const playbackSpeeds = [1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3];

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

  return (
    <div
      ref={containerRef}
      className="relative aspect-video w-full overflow-hidden rounded-xl bg-black group"
      onMouseMove={resetHideTimer}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        className="h-full w-full cursor-pointer"
        onClick={togglePlay}
        playsInline
      />

      {/* Loading spinner */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/50"
          >
            <Loader2 className="h-12 w-12 text-white animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Big play button (center) */}
      <AnimatePresence>
        {!isPlaying && !isLoading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 flex items-center justify-center cursor-pointer"
            onClick={togglePlay}
          >
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-black/70 hover:bg-black/80 transition-colors">
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

      {/* Controls */}
      <div
        className={`absolute inset-x-0 bottom-0 px-3 pb-3 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Progress bar */}
        <div
          ref={progressRef}
          className="relative h-1 w-full cursor-pointer group/progress mb-2"
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
            className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-red-600 opacity-0 group-hover/progress:opacity-100 transition-opacity"
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
            >
              <SkipBack className="h-5 w-5" />
            </button>
            <button
              onClick={() => skip(10)}
              className="p-2 text-white hover:text-white/80 transition-colors hidden sm:block"
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
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-5 w-5 sm:h-6 sm:w-6" />
                ) : (
                  <Volume2 className="h-5 w-5 sm:h-6 sm:w-6" />
                )}
              </button>
              
              {/* Volume slider */}
              <div className={`overflow-hidden transition-all duration-200 ${showVolumeSlider ? 'w-20 opacity-100' : 'w-0 opacity-0'}`}>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-full h-1 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                />
              </div>
            </div>

            {/* Time */}
            <span className="text-white text-xs sm:text-sm ml-2 font-medium">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Settings (Quality) */}
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
                    className="absolute bottom-12 right-0 bg-black/95 rounded-lg overflow-hidden min-w-[180px] shadow-xl"
                  >
                    {settingsMenu === 'main' && (
                      <div className="py-1">
                        <button
                          onClick={() => setSettingsMenu('speed')}
                          className="w-full px-3 py-2.5 text-left text-sm flex items-center justify-between hover:bg-white/10 text-white"
                        >
                          <span>Playback speed</span>
                          <span className="text-white/60">{playbackSpeed}x</span>
                        </button>
                        <button
                          onClick={() => setSettingsMenu('quality')}
                          className="w-full px-3 py-2.5 text-left text-sm flex items-center justify-between hover:bg-white/10 text-white"
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
                          className="w-full px-3 py-2 text-white/60 text-xs font-medium border-b border-white/10 text-left hover:bg-white/5 flex items-center gap-2"
                        >
                          ← Playback speed
                        </button>
                        <div className="py-1 max-h-[200px] overflow-y-auto">
                          {playbackSpeeds.map((speed) => (
                            <button
                              key={speed}
                              onClick={() => handleSpeedChange(speed)}
                              className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between hover:bg-white/10 ${
                                playbackSpeed === speed ? 'text-white' : 'text-white/70'
                              }`}
                            >
                              <span>{speed}x</span>
                              {playbackSpeed === speed && <Check className="h-4 w-4" />}
                            </button>
                          ))}
                        </div>
                      </>
                    )}

                    {settingsMenu === 'quality' && (
                      <>
                        <button
                          onClick={() => setSettingsMenu('main')}
                          className="w-full px-3 py-2 text-white/60 text-xs font-medium border-b border-white/10 text-left hover:bg-white/5 flex items-center gap-2"
                        >
                          ← Quality
                        </button>
                        <div className="py-1">
                          <button
                            onClick={() => handleQualityChange(-1)}
                            className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between hover:bg-white/10 ${
                              currentQuality === -1 ? 'text-white' : 'text-white/70'
                            }`}
                          >
                            <span>Auto</span>
                            {currentQuality === -1 && <Check className="h-4 w-4" />}
                          </button>
                          {availableQualities.map((quality) => (
                            <button
                              key={quality}
                              onClick={() => handleQualityChange(quality)}
                              className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between hover:bg-white/10 ${
                                currentQuality === quality ? 'text-white' : 'text-white/70'
                              }`}
                            >
                              <span>{getQualityLabel(quality)}</span>
                              {currentQuality === quality && <Check className="h-4 w-4" />}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-2 text-white hover:text-white/80 transition-colors"
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
