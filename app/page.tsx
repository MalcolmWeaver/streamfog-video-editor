'use client';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';

import VideoPreviewPlayer from './components/VideoPreviewPlayer';
import TimelineControls, { AppliedFilter } from './components/TimelineControls';
import VideoUpload from './components/VideoUpload';

import { CameraKit, bootstrapCameraKit, CameraKitSession } from '@snap/camera-kit';

const SNAP_CAMERA_KIT_API_TOKEN = 'eyJhbGciOiJIUzI1NiIsImtpZCI6IkNhbnZhc1MyU0hNQUNQcm9kIiwidHlwIjoiSldUIn0.eyJhdWQiOiJjYW52YXMtY2FudmFzYXBpIiwiaXNzIjoiY2FudmFzLXMyc3Rva2VuIiwibmJmIjoxNzUzMDQyMTkzLCJzdWIiOiJkMjM3MmY5Mi1lZjlkLTRkNWMtYjU0My1lNDFhOGMwOWFlMjR-U1RBR0lOR34xNTljYTVkMC00MWNmLTQzNzUtOGE1Ni03NTM4NDBmZGYxOWQifQ.Q2RTK-V3uyxQ-u_lnt-7QpIb65tYm6U5lcVEBkJFGjk'; // If this goes on public github, we'll need to replace with a different one probably in environment variables 


const DynamicCameraKitInitializer = dynamic(
    () => import('./components/CameraKitInitializer'),
    {ssr: false}
);

const App: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilter[]>([]);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);

  const snapkitSessionRef = useRef<CameraKitSession | null>(null);
  const cameraKitInstanceRef = useRef<CameraKit | null>(null);


  // Callbacks to receive the session and instance from the initializer
  const handleCameraKitReady = useCallback((session: CameraKitSession, cameraKit: CameraKit) => {
    snapkitSessionRef.current = session;
    cameraKitInstanceRef.current = cameraKit;
    console.log('Camera Kit session and instance received from initializer.');
  }, []);

  const handleCameraKitCleanup = useCallback(() => {
    snapkitSessionRef.current = null;
    cameraKitInstanceRef.current = null;
    console.log('Camera Kit session and instance cleared in App component.');
  }, []);

  /**
   * Handles the video file upload event.
   * Creates an object URL for the selected video file and sets it as the video source.
   * Revokes any previously created object URL to prevent memory leaks.
   * Resets video state and filters on new upload.
   * @param {React.ChangeEvent<HTMLInputElement>} event - The file input change event.
   */
  const handleVideoUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (videoSrc) {
        URL.revokeObjectURL(videoSrc);
      }
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(false);
      setAppliedFilters([]);

      // Close existing Snap Camera Kit session if it exists from previous video
      if (snapkitSessionRef.current) {
          snapkitSessionRef.current.destroy();
          snapkitSessionRef.current = null;
          console.log('Previous Snap Camera Kit session closed.');
      }
      // Also dispose of the CameraKit instance if it exists
      if (cameraKitInstanceRef.current) {
          cameraKitInstanceRef.current.destroy();
          cameraKitInstanceRef.current = null;
          console.log('Previous CameraKit instance cleared.');
      }
    }
  }, [videoSrc]);

  /**
   * Callback from VideoPreviewPlayer when video metadata is loaded.
   * Sets initial duration and attaches time update listeners.
   * Also initializes Snap Camera Kit here.
   *
   * @param {HTMLVideoElement} videoElement
   * @returns {() => void} A cleanup function for event listeners and Snap Kit session.
   */
  const handleVideoMetadataLoaded = useCallback((videoElement: HTMLVideoElement) => {
    setDuration(videoElement.duration);
    setCurrentTime(0);

    const handleTimeUpdate = () => setCurrentTime(videoElement.currentTime);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false); // Handle video ending

    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('ended', handleEnded);


    // Return a cleanup function for event listeners AND Snap Kit session
    return () => {
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('ended', handleEnded);
    }
    }, []); 

  /**
   * Callback for scrubbing the video from TimelineControls.
   * @param {number} newTime - The new time to set the video to.
   */
  const handleScrub = useCallback((newTime: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  }, []);

  /**
   * Toggles video play/pause state.
   */
  const handlePlayPause = useCallback(() => {
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
  const handleAddNewFilter = useCallback((filterData: AppliedFilter) => {
    setAppliedFilters((prevFilters) => [...prevFilters, filterData]);
    // ⭐ Future: You'll also want to trigger an update to the AR rendering
    // engine here, possibly re-evaluating which lenses are active based on currentTime.
    // E.g., if (snapkitSessionRef.current) snapkitSessionRef.current.applyLens(newLensBasedOnFilterData);
  }, []);

  /**
   * Callback to update an existing filter in the list.
   * @param {AppliedFilter} updatedFilter - The updated filter data.
   */
  const handleUpdateFilter = useCallback((updatedFilter: AppliedFilter) => {
    setAppliedFilters((prevFilters) =>
      prevFilters.map((filter) =>
        filter.id === updatedFilter.id ? updatedFilter : filter
      )
    );
    // ⭐ Future: Trigger Snap Camera Kit to re-evaluate active lenses
  }, []);

  /**
   * Callback to delete an existing filter from the list.
   * @param {string} id - The ID of the filter to delete.
   */
  const handleDeleteFilter = useCallback((id: string) => {
    setAppliedFilters((prevFilters) => prevFilters.filter((filter) => filter.id !== id));
    // ⭐ Future: Trigger Snap Camera Kit to re-evaluate active lenses
  }, []);

  // Effect to clean up the object URL when component unmounts
  useEffect(() => {
    return () => {
      if (videoSrc) {
        URL.revokeObjectURL(videoSrc);
        console.log('Previous video URL revoked on App unmount.');
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

      <main className="w-full max-w-6xl flex flex-col gap-8 mt-8">
        {/* Video Upload Section - Now a separate component */}
        <VideoUpload onVideoUpload={handleVideoUpload} videoSrc={videoSrc} />

        {/* Video Preview and Timeline Controls Section - Now wider */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 flex flex-col items-center justify-center relative w-full">
          <h2 className="text-2xl font-semibold mb-4 text-purple-300">Preview</h2>
          <VideoPreviewPlayer
            videoSrc={videoSrc}
            videoRef={videoRef}
            canvasRef={canvasRef}
            onVideoMetadataLoaded={handleVideoMetadataLoaded}
          />
          
          {videoSrc && videoRef.current && canvasRef.current && (
            <DynamicCameraKitInitializer
              videoElement={videoRef.current}
              canvasElement={canvasRef.current}
              onCameraKitReady={handleCameraKitReady}
              onCleanup={handleCameraKitCleanup}
            />
          )}

          {videoSrc && duration > 0 ? (
            <TimelineControls
              duration={duration}
              currentTime={currentTime}
              onScrub={handleScrub}
              isPlaying={isPlaying}
              onPlayPause={handlePlayPause}
              onAddNewFilter={handleAddNewFilter}
              onUpdateFilter={handleUpdateFilter}
              onDeleteFilter={handleDeleteFilter}
              appliedFilters={appliedFilters}
            />
          ) : (
            <div className="w-full mt-6 p-4 bg-gray-700 rounded-lg text-center text-gray-400">
                <p className="text-lg font-medium">Upload a video to enable timeline controls.</p>
            </div>
          )}
        </div>
      </main>

      <footer className="w-full max-w-6xl py-6 text-center text-gray-500 text-sm mt-8">
        &copy; {new Date().getFullYear()} AR Video Editor. All rights reserved.
      </footer>
    </div>
  );
};

export default App;
