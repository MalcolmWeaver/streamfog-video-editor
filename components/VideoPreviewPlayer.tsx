'use client';
import React, { useEffect, useRef } from 'react';
import { useVideoEditor } from '../context/VideoEditorContext';
import { Filter } from '../types';

// Corrected Imports for Camera Kit SDK
import {
  bootstrapCameraKit,
  CameraKitSession,
  Lens,
} from '@snap/camera-kit';

const STAGING_API_TOKEN = 'eyJhbGciOiJIUzI1NiIsImtpZCI6IkNhbnZhc1MyU0hNQUNQcm9kIiwidHlwIjoiSldUIn0.eyJhdWQiOiJjYW52YXMtY2FudmFzYXBpIiwiaXNzIjoiY2FudmFzLXMyc3Rva2VuIiwibmJmIjoxNzUzMjg3NTA0LCJzdWIiOiJkMjM3MmY5Mi1lZjlkLTRkNzctOGQzYS04YjViZDU0NjVlODkifQ.6gG32g8HvZmRL1tyxidMPVmnjXgiyRCg2TD8w_S2C8';
const LENS_GROUP_ID = '868e355a-1370-4232-a645-603b66cc4869';

const VideoPreviewPlayer: React.FC = () => {
  const {
    videoURL,
    setVideoDuration,
    setCameraKitSession,
    availableFilters,
    setAvailableFilters,
    filterTimeline,
    currentTime,
    setCurrentTime,
    isPlaying,
    setIsPlaying,
  } = useVideoEditor();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraKitSessionRef = useRef<CameraKitSession | null>(null);

  // Video Metadata Loading and Time Updates
  useEffect(() => {
    const videoElement = videoRef.current;
    if (videoElement) {
      const handleLoadedMetadata = () => {
        setVideoDuration(videoElement.duration);
      };

      const handleTimeUpdate = () => {
        setCurrentTime(videoElement.currentTime);
      };

      videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.addEventListener('timeupdate', handleTimeUpdate);

      return () => {
        videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
        videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      };
    }
  }, [setVideoDuration, setCurrentTime]);

  // Camera Kit initialization and cleanup
  useEffect(() => {
    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;

    const initializeCameraKit = async () => {
      // Clean up any existing session before creating a new one
      if (cameraKitSessionRef.current) {
        cameraKitSessionRef.current.destroy();
        cameraKitSessionRef.current = null;
        setCameraKitSession(null);
        setAvailableFilters([]);
        console.log("Previous Camera Kit session destroyed.");
      }

      if (!videoURL || !videoElement || !canvasElement) {
        console.log("No video URL or DOM elements, skipping Camera Kit initialization.");
        return;
      }

      try {
        console.log("Initializing Camera Kit...");
        // Use the correct bootstrapCameraKit function
        const cameraKit = await bootstrapCameraKit({
          apiToken: STAGING_API_TOKEN,
        });

        // Create session using the constructor for source and output
        const session = await cameraKit.createSession({
          liveRenderTarget: canvasElement,
        });
        session.setSource(videoElement);
        cameraKitSessionRef.current = session; // Store the session reference
        setCameraKitSession(session); // Update context state

        // Load lenses from the specified group
        const { lenses, errors} = await cameraKit.lensRepository.loadLensGroups([LENS_GROUP_ID]);
        console.warn('Loading lenses errors: ', errors);
        const loadedLenses: Filter[] = lenses.map((lens: Lens) => ({
          id: lens.id,
          name: lens.name,
          iconUri: lens.iconUri,
        }));
        setAvailableFilters(loadedLenses);
        console.log("Camera Kit session initialized and lenses fetched:", loadedLenses.length);

      } catch (error) {
        console.error("Error initializing Camera Kit:", error);
        setCameraKitSession(null);
        setAvailableFilters([]);
      }
    };

    initializeCameraKit();

    // Cleanup function
    return () => {
      console.log("Running Camera Kit cleanup on unmount or videoURL change...");
      if (cameraKitSessionRef.current) {
        cameraKitSessionRef.current.destroy();
        cameraKitSessionRef.current = null;
      }
      setCameraKitSession(null);
      setAvailableFilters([]);
    };
  }, [videoURL, setCameraKitSession, setAvailableFilters]); // Depend on videoURL to re-initialize for new videos

  // Apply Filters Based on Timeline and Current Time
  useEffect(() => {
    const session = cameraKitSessionRef.current;
    if (session) { // Only attempt to apply filters if a session exists
      const activeFilterEntry = filterTimeline.find(
        (f) => currentTime >= f.startTime && currentTime <= f.endTime
      );

      // Clear any previous lenses first
      session.removeLens();

      if (activeFilterEntry && availableFilters) {
        // Find the *exact* Lens object from the session's lensRepository
        const activeLens = availableFilters.find(
          (availableFilter: Filter) => availableFilter.id === activeFilterEntry.filterId
        );
        if (activeLens) {
          session.applyLens(activeLens); // Correct method for applying a lens
          console.log(`Applying filter: ${activeLens.name} (${activeLens.id})`);
        } else {
          console.warn(`Lens with ID ${activeFilterEntry.filterId} not found in repository.`);
        }
      } else {
        console.log("No active filters at current time, lenses cleared.");
      }
    }
  }, [currentTime, filterTimeline, cameraKitSessionRef.current]); // Depend on session ref for re-evaluation

  const handlePlayPause = () => {
    const videoElement = videoRef.current;
    if (videoElement) {
      if (isPlaying) {
        videoElement.pause();
      } else {
        videoElement.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg shadow-md flex flex-col items-center">
      <h2 className="text-xl font-semibold text-white mb-4">Video Preview</h2>
      <div className="relative w-full max-w-2xl bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          src={videoURL}
          controls={false}
          className="w-full h-auto max-h-[400px] object-contain rounded-lg"
          onEnded={() => setIsPlaying(false)}
        />
        {/* Canvas for Camera Kit output - overlays the video */}
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          style={{ display: videoURL ? 'block' : 'none' }}
        />
        {!videoURL && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 text-white text-lg rounded-lg">
            Upload a video to preview
          </div>
        )}
      </div>

      {videoURL && (
        <div className="mt-4 flex items-center space-x-4">
          <button
            onClick={handlePlayPause}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-300 ease-in-out shadow-lg"
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <span className="text-white text-sm">
            {/* Using the destructured currentTime directly, which is already available */}
            {currentTime.toFixed(2)}s / {useVideoEditor().videoDuration.toFixed(2)}s
          </span>
        </div>
      )}
    </div>
  );
};
export default VideoPreviewPlayer;
