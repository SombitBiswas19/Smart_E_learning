import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Volume2, Maximize, SkipBack, SkipForward } from "lucide-react";
import type { Lesson } from "@shared/schema";

interface VideoPlayerProps {
  lesson: Lesson;
  onProgress?: (watchTime: number) => void;
  onComplete?: (watchTime: number) => void;
}

export default function VideoPlayer({ lesson, onProgress, onComplete }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const time = video.currentTime;
      setCurrentTime(time);
      
      if (hasStarted && onProgress) {
        onProgress(Math.floor(time));
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      if (onComplete) {
        onComplete(Math.floor(duration));
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
    };
  }, [hasStarted, onProgress, onComplete, duration]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
      setHasStarted(true);
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;

    const newTime = (value[0] / 100) * duration;
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = value[0] / 100;
    video.volume = newVolume;
    setVolume(newVolume);
  };

  const skipTime = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = Math.max(0, Math.min(video.currentTime + seconds, duration));
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      video.requestFullscreen();
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div 
      className="relative bg-black rounded-lg overflow-hidden video-container group"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {lesson.videoUrl ? (
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          src={lesson.videoUrl}
          poster={`https://via.placeholder.com/800x450/1f2937/ffffff?text=${encodeURIComponent(lesson.title)}`}
        />
      ) : (
        <div className="w-full h-96 flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <Play className="w-16 h-16 text-white mx-auto mb-4" />
            <p className="text-white text-lg">{lesson.title}</p>
            <p className="text-gray-300 text-sm">Duration: {lesson.duration || 0} minutes</p>
          </div>
        </div>
      )}

      {/* Video Controls */}
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Progress Bar */}
        <div className="mb-4">
          <Slider
            value={[progress]}
            max={100}
            step={0.1}
            onValueChange={handleSeek}
            className="w-full"
          />
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePlay}
              className="text-white hover:text-gray-300"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => skipTime(-10)}
              className="text-white hover:text-gray-300"
            >
              <SkipBack className="w-5 h-5" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => skipTime(10)}
              className="text-white hover:text-gray-300"
            >
              <SkipForward className="w-5 h-5" />
            </Button>

            <span className="text-white text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <Volume2 className="w-5 h-5 text-white" />
            <Slider
              value={[volume * 100]}
              max={100}
              step={1}
              onValueChange={handleVolumeChange}
              className="w-20"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="text-white hover:text-gray-300"
            >
              <Maximize className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
