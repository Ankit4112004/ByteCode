import { useState, useRef, useEffect } from 'react';
import { Pause, Play, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';



const Editorial = ({ secureUrl, thumbnailUrl, duration, editorialText, timeComplexity, spaceComplexity }) => {


  const videoRef = useRef(null);
  const playerContainerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      playerContainerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setShowSpeedMenu(false);
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      videoRef.current.muted = newVolume === 0;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMutedState = !isMuted;
      videoRef.current.muted = newMutedState;
      setIsMuted(newMutedState);
      if (!newMutedState && volume === 0) {
        setVolume(1);
        videoRef.current.volume = 1;
      }
    }
  };

  // Format seconds to MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Update current time during playback
  useEffect(() => {
    const video = videoRef.current;
    
    const handleTimeUpdate = () => {
      if (video) setCurrentTime(video.currentTime);
    };
    
    if (video) {
      video.addEventListener('timeupdate', handleTimeUpdate);
      return () => video.removeEventListener('timeupdate', handleTimeUpdate);
    }
  }, []);

  return (
    <div 
      className="relative w-full max-w-2xl mx-auto rounded-xl overflow-hidden shadow-lg"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="relative group" ref={playerContainerRef}>
        {/* Video Element */}
        <video
          ref={videoRef}
          src={secureUrl}
          poster={thumbnailUrl}
          onClick={togglePlayPause}
          muted={isMuted}
          className="w-full aspect-video bg-black cursor-pointer"
        />
        
        {/* Video Controls Overlay */}
        <div 
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 transition-opacity ${
            isHovering || !isPlaying ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="flex items-center gap-4">
            {/* Play/Pause Button */}
            <button
              onClick={togglePlayPause}
              className="btn btn-circle btn-primary btn-sm"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause size={16} />
              ) : (
                <Play size={16} />
              )}
            </button>
            
            {/* Volume Control */}
            <div className="flex items-center gap-2 group/volume">
              <button onClick={toggleMute} className="text-white hover:text-primary transition-colors">
                {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-0 opacity-0 overflow-hidden transition-all duration-300 ease-in-out group-hover/volume:w-20 group-hover/volume:opacity-100 range range-primary range-xs"
              />
            </div>
            
            {/* Progress Bar */}
            <div className="flex items-center flex-1 gap-2">
              <span className="text-white text-xs">
                {formatTime(currentTime)}
              </span>
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={(e) => {
                  if (videoRef.current) {
                    videoRef.current.currentTime = Number(e.target.value);
                  }
                }}
                className="range range-primary range-xs flex-1"
              />
              <span className="text-white text-xs">
                {formatTime(duration || 0)}
              </span>
            </div>

            {/* Speed Control */}
            <div className="relative">
              <button 
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="text-white hover:text-primary transition-colors text-sm font-semibold w-10 text-center"
              >
                {playbackSpeed}x
              </button>
              
              {showSpeedMenu && (
                <div className="absolute bottom-full right-0 mb-2 bg-[#2a2a2a] rounded shadow-lg overflow-hidden flex flex-col z-50">
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                    <button
                      key={speed}
                      onClick={() => handleSpeedChange(speed)}
                      className={`px-4 py-2 text-xs text-left hover:bg-white/10 transition-colors ${playbackSpeed === speed ? 'text-primary font-bold' : 'text-white'}`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Fullscreen Button */}
            <button onClick={toggleFullscreen} className="text-white hover:text-primary transition-colors ml-1">
              {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Textual Editorial Section */}
      {(editorialText || timeComplexity || spaceComplexity) && (
        <div className="bg-[#1a1a1a] p-6 border-t border-white/10">
          {editorialText && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white mb-2">Approach Explanation</h3>
              <p className="text-gray-300 text-sm leading-relaxed">{editorialText}</p>
            </div>
          )}
          
          {(timeComplexity || spaceComplexity) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {timeComplexity && (
                <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Time Complexity</div>
                  <div className="text-indigo-400 font-mono text-sm">{timeComplexity}</div>
                </div>
              )}
              {spaceComplexity && (
                <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Space Complexity</div>
                  <div className="text-emerald-400 font-mono text-sm">{spaceComplexity}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};


export default Editorial;