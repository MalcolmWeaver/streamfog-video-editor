'use client';
import React, { useRef, useState, useEffect } from 'react';
import VideoPreviewPlayer from './components/VideoPreviewPlayer';
import TimelineControls, { AppliedFilter } from './components/TimelineControls'; 

const App = () => {
  // Refs to get direct access to the video and canvas DOM elements.
  // These are defined here because the parent (App) needs to pass them
  // to Snap Camera Kit for processing.
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilter[]>([]);

  // State to store the URL of the uploaded video
  const [videoSrc, setVideoSrc] = useState('');

  /**
   * Handles the video file upload event.
   * Creates an object URL for the selected video file and sets it as the video source.
   * Revokes any previously created object URL to prevent memory leaks.
   * @param {React.ChangeEvent<HTMLInputElement>} event - The file input change event.
   */
  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (videoSrc) {
        URL.revokeObjectURL(videoSrc);
      }
      const url = URL.createObjectURL(file);
      setVideoSrc(url); 
    }
  };

  /**
   * Callback from VideoPreviewPlayer when video metadata is loaded.
   * Sets initial duration and attaches time update listeners.
   * @param {HTMLVideoElement} videoElement
   */
  const handleVideoMetadataLoaded = React.useCallback((videoElement: HTMLVideoElement) => {
    
    // TODO: ⭐ IMPORTANT: This is the ideal place to initialize Snap Camera Kit.
    // You'll pass videoRef.current and canvasRef.current to it here.
    // (Example integration will come in a later response)
    
    setDuration(videoElement.duration);
    setCurrentTime(0);

    const handleTimeUpdate = () => setCurrentTime(videoElement.currentTime);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);

    // Return a cleanup function to remove event listeners
    return () => {
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
    };
  }, []);

  /**
   * Callback for scrubbing the video from TimelineControls.
   * @param {number} newTime - The new time to set the video to.
   */
  const handleScrub = React.useCallback((newTime: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  }, []);

  /**
   * Toggles video play/pause state.
   */
  const handlePlayPause = React.useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  }, [isPlaying]);

  /**
   * Callback to add a new filter to the list of applied filters.
   * @param {AppliedFilter} filterData - The data for the new filter.
   */
  const handleAddNewFilter = React.useCallback((filterData: AppliedFilter) => {
    setAppliedFilters((prevFilters) => [...prevFilters, filterData]);
    // ⭐ Future: You'll also want to trigger an update to the AR rendering
    // engine here, possibly re-evaluating which lenses are active based on currentTime.
  }, []);

  useEffect(() => {
    return () => {
      if (videoSrc) {
        URL.revokeObjectURL(videoSrc);
        console.log('Previous video URL revoked on component unmount/src change.');
      }
    };
  }, [videoSrc]);

  return (
    <div className="min-h-screen bg-gray-900 text-white font-inter p-4 flex flex-col items-center">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />

      <header className="w-full max-w-6xl py-6 text-center">
        <h1 className="text-4xl font-bold text-purple-400">AR Video Editor</h1>
        <p className="text-lg text-gray-400 mt-2">Apply Snap Camera Kit Lenses to your YouTube videos</p>
      </header>

      <main className="w-full max-w-6xl flex flex-col lg:flex-row gap-8 mt-8">

        {/* Left Panel: Video Upload Section */}
        <div className="flex-1 bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
          <h2 className="text-2xl font-semibold mb-4 text-purple-300">Upload Your Video</h2>
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-purple-500 transition-colors duration-200">
            <label htmlFor="video-upload" className="cursor-pointer text-gray-400 hover:text-purple-400">
              <input
                id="video-upload"
                type="file"
                accept="video/mp4"
                className="hidden"
                onChange={handleVideoUpload}
              />
              <div className="flex flex-col items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 mb-4 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p className="text-lg font-medium">Drag & Drop or Click to Upload MP4</p>
                <p className="text-sm text-gray-500 mt-1">Supports 720p, 1080p (up to ~20 min)</p>
              </div>
            </label>
            {videoSrc && (
              <p className="mt-4 text-green-400 text-sm truncate">
                Video loaded: {videoSrc.substring(0, 50)}...
              </p>
            )}
          </div>
        </div>

        <div className="flex-2 bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 flex flex-col items-center justify-center relative">
            <h2 className="text-2xl font-semibold mb-4 text-purple-300">Preview</h2>
            <VideoPreviewPlayer
              videoSrc={videoSrc}
              videoRef={videoRef}       // Pass the video ref down
              canvasRef={canvasRef}     // Pass the canvas ref down
              onVideoMetadataLoaded={handleVideoMetadataLoaded} // Pass the callback
            />

            {videoSrc && duration > 0 ? (
            <TimelineControls
              duration={duration}
              currentTime={currentTime}
              onScrub={handleScrub}
              isPlaying={isPlaying}
              onPlayPause={handlePlayPause}
              onAddNewFilter={handleAddNewFilter}
              appliedFilters={appliedFilters}
            />
          ) : (
            <div className="w-full mt-6 p-4 bg-gray-700 rounded-lg text-center text-gray-400">
                <p className="text-lg font-medium">Upload a video to enable timeline controls.</p>
            </div>
          )}
        </div>
      </main>

    </div>
  );
};

export default App;
