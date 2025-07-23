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

const STAGING_API_TOKEN = 'eyJhbGciOiJIUzI1NiIsImtpZCI6IkNhbnZhc1MyU0hNQUNQcm9kIiwidHlwIjoiSldUIn0.eyJhdWQiOiJjYW52YXMtY2FudmFzYXBpIiwiaXNzIjoiY2FudmFzLXMyc3Rva2VuIiwibmJmIjoxNzUzMjkzNDYyLCJzdWIiOiJkMjM3MmY5Mi1lZjlkLTRkNWMtYjU0My1lNDFhOGMwOWFlMjR-U1RBR0lOR344ZjE1ODFjZC1iYjY5LTQ3YjYtYjZmMC1mOTA3MjZlNGY2YTMifQ.P7N7-fANJmuAFahYxNImNwsdIDS2aciyECed-74pIxM';
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
    videoDuration,
  } = useVideoEditor();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraKitSessionRef = useRef<CameraKitSession | null>(null);

  // Debug: Log ref states
  useEffect(() => {
    console.log('🔍 DEBUG - Refs state:', {
      videoRef: !!videoRef.current,
      canvasRef: !!canvasRef.current,
      videoURL,
      videoElement: videoRef.current ? {
        readyState: videoRef.current.readyState,
        videoWidth: videoRef.current.videoWidth,
        videoHeight: videoRef.current.videoHeight,
        duration: videoRef.current.duration,
        currentTime: videoRef.current.currentTime,
      } : null,
      canvasElement: canvasRef.current ? {
        width: canvasRef.current.width,
        height: canvasRef.current.height,
        clientWidth: canvasRef.current.clientWidth,
        clientHeight: canvasRef.current.clientHeight,
      } : null
    });
  }, [videoURL, currentTime]);

  // Video Metadata Loading and Time Updates
  useEffect(() => {
    const videoElement = videoRef.current;
    console.log('🎥 DEBUG - Setting up video event listeners for element:', videoElement);
    
    if (videoElement) {
      const handleLoadedMetadata = () => {
        console.log('🎥 DEBUG - Video metadata loaded:', {
          duration: videoElement.duration,
          videoWidth: videoElement.videoWidth,
          videoHeight: videoElement.videoHeight,
          readyState: videoElement.readyState
        });
        setVideoDuration(videoElement.duration);
        
        // Debug: Check canvas sizing after video loads
        const canvas = canvasRef.current;
        if (canvas) {
          console.log('🎨 DEBUG - Canvas sizing after video load:', {
            canvasWidth: canvas.width,
            canvasHeight: canvas.height,
            canvasClientWidth: canvas.clientWidth,
            canvasClientHeight: canvas.clientHeight,
            videoWidth: videoElement.videoWidth,
            videoHeight: videoElement.videoHeight
          });
          
          // Ensure canvas matches video dimensions
          canvas.width = videoElement.videoWidth || 640;
          canvas.height = videoElement.videoHeight || 480;
          console.log('🎨 DEBUG - Canvas dimensions set to:', canvas.width, 'x', canvas.height);
        }
      };

      const handleTimeUpdate = () => {
        setCurrentTime(videoElement.currentTime);
      };

      const handleLoadStart = () => {
        console.log('🎥 DEBUG - Video load started');
      };

      const handleCanPlay = () => {
        console.log('🎥 DEBUG - Video can play, readyState:', videoElement.readyState);
      };

      const handleError = (e: Event) => {
        console.error('🎥 DEBUG - Video error:', e, videoElement.error);
      };

      videoElement.addEventListener('loadstart', handleLoadStart);
      videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.addEventListener('canplay', handleCanPlay);
      videoElement.addEventListener('timeupdate', handleTimeUpdate);
      videoElement.addEventListener('error', handleError);

      return () => {
        videoElement.removeEventListener('loadstart', handleLoadStart);
        videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
        videoElement.removeEventListener('canplay', handleCanPlay);
        videoElement.removeEventListener('timeupdate', handleTimeUpdate);
        videoElement.removeEventListener('error', handleError);
      };
    }
  }, [setVideoDuration, setCurrentTime]);

  // Camera Kit initialization and cleanup
  useEffect(() => {
    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;

    console.log('🚀 DEBUG - Camera Kit initialization effect triggered:', {
      videoURL,
      videoElement: !!videoElement,
      canvasElement: !!canvasElement,
      existingSession: !!cameraKitSessionRef.current
    });

    const initializeCameraKit = async () => {
      // Clean up any existing session before creating a new one
      if (cameraKitSessionRef.current) {
        console.log('🧹 DEBUG - Cleaning up existing Camera Kit session');
        cameraKitSessionRef.current.destroy();
        cameraKitSessionRef.current = null;
        setCameraKitSession(null);
        setAvailableFilters([]);
        console.log("Previous Camera Kit session destroyed.");
      }

      if (!videoURL || !videoElement || !canvasElement) {
        console.log("🚫 DEBUG - Missing requirements for Camera Kit initialization:", {
          videoURL: !!videoURL,
          videoElement: !!videoElement,
          canvasElement: !!canvasElement
        });
        return;
      }

      // Wait for video to be ready
      if (videoElement.readyState < 2) {
        console.log('⏳ DEBUG - Video not ready yet, readyState:', videoElement.readyState);
        const waitForReady = () => {
          if (videoElement.readyState >= 2) {
            console.log('✅ DEBUG - Video is now ready, continuing with Camera Kit init');
            initializeCameraKit();
          } else {
            console.log('⏳ DEBUG - Still waiting for video readyState:', videoElement.readyState);
            setTimeout(waitForReady, 100);
          }
        };
        waitForReady();
        return;
      }

      try {
        console.log("🚀 DEBUG - Starting Camera Kit initialization...");
        console.log('📊 DEBUG - Video element state:', {
          src: videoElement.src,
          readyState: videoElement.readyState,
          videoWidth: videoElement.videoWidth,
          videoHeight: videoElement.videoHeight,
          duration: videoElement.duration
        });
        console.log('🎨 DEBUG - Canvas element state:', {
          width: canvasElement.width,
          height: canvasElement.height,
          clientWidth: canvasElement.clientWidth,
          clientHeight: canvasElement.clientHeight
        });

        // Use the correct bootstrapCameraKit function
        const cameraKit = await bootstrapCameraKit({
          apiToken: STAGING_API_TOKEN,
        });
        console.log('✅ DEBUG - Camera Kit bootstrapped successfully');

        // Ensure canvas has proper dimensions
        if (videoElement.videoWidth && videoElement.videoHeight) {
          canvasElement.width = videoElement.videoWidth;
          canvasElement.height = videoElement.videoHeight;
          console.log('🎨 DEBUG - Canvas dimensions updated to match video:', canvasElement.width, 'x', canvasElement.height);
        }

        // Create session using the constructor for source and output
        console.log('🔗 DEBUG - Creating Camera Kit session...');
        const session = await cameraKit.createSession({
          liveRenderTarget: canvasElement,
        });
        console.log('✅ DEBUG - Camera Kit session created');

        console.log('📹 DEBUG - Setting video source on session...');
        session.setSource(videoElement);
        console.log('✅ DEBUG - Video source set on session');

        cameraKitSessionRef.current = session; // Store the session reference
        setCameraKitSession(session); // Update context state
        console.log('✅ DEBUG - Session stored in refs and context');

        // Load lenses from the specified group
        console.log('🔍 DEBUG - Loading lens groups...');
        const { lenses, errors} = await cameraKit.lensRepository.loadLensGroups([LENS_GROUP_ID]);
        console.warn('🔍 DEBUG - Loading lenses errors: ', errors);
        console.log('🔍 DEBUG - Loaded lenses:', lenses.length, lenses);
        
        setAvailableFilters(lenses);
        console.log("✅ DEBUG - Camera Kit session initialized and lenses fetched:", lenses.length);

        // Debug: Try to start the session
        console.log('▶️ DEBUG - Attempting to start Camera Kit session...');
        try {
          await session.play();
          console.log('✅ DEBUG - Camera Kit session started successfully');
        } catch (playError) {
          console.error('❌ DEBUG - Error starting Camera Kit session:', playError);
        }

      } catch (error) {
        console.error("❌ DEBUG - Error initializing Camera Kit:", error);
        console.error("❌ DEBUG - Error stack:", error.stack);
        setCameraKitSession(null);
        setAvailableFilters([]);
      }
    };

    // Add a small delay to ensure DOM is ready
    const timeoutId = setTimeout(initializeCameraKit, 100);

    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
      console.log("🧹 DEBUG - Running Camera Kit cleanup on unmount or videoURL change...");
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
    console.log('🎭 DEBUG - Filter application effect triggered:', {
      sessionExists: !!session,
      availableFiltersCount: availableFilters.length,
      filterTimelineCount: filterTimeline.length,
      currentTime
    });

    if (session && availableFilters.length > 0) {
      const activeFilterEntry = filterTimeline.find(
        (f) => currentTime >= f.startTime && currentTime <= f.endTime
      );

      console.log('🎭 DEBUG - Active filter check:', {
        activeFilterEntry,
        currentTime,
        filterTimeline
      });

      // Clear any previous lenses first
      session.removeLens();
      console.log('🧹 DEBUG - Previous lenses cleared');

      if (activeFilterEntry) {
        // Find the *exact* Lens object from the session's lensRepository
        const activeLens = availableFilters.find(
          (availableFilter: Filter) => availableFilter.id === activeFilterEntry.filterId
        );
        console.log('🔍 DEBUG - Looking for lens:', activeFilterEntry.filterId, 'Found:', !!activeLens, 'FROM AVAILABLE: ', availableFilters);
        
        if (activeLens) {
          console.log('🎭 DEBUG - Applying lens:', activeLens);
          try {
            session.applyLens(activeLens);
            console.log(`✅ DEBUG - Filter applied: ${activeLens.name} (${activeLens.id})`);
          } catch (lensError) {
            console.error('❌ DEBUG - Error applying lens:', lensError);
          }
        } else {
          console.warn(`⚠️ DEBUG - Lens with ID ${activeFilterEntry.filterId} not found in repository.`);
        }
      } else {
        console.log("🎭 DEBUG - No active filters at current time, lenses cleared.");
      }
    } else {
      console.log('🚫 DEBUG - Cannot apply filters:', {
        sessionExists: !!session,
        availableFiltersCount: availableFilters.length
      });
    }
  }, [currentTime, filterTimeline, availableFilters]);

  const handlePlayPause = () => {
    const videoElement = videoRef.current;
    console.log('▶️ DEBUG - Play/Pause clicked:', { isPlaying, videoElement: !!videoElement });
    
    if (videoElement) {
      if (isPlaying) {
        videoElement.pause();
        console.log('⏸️ DEBUG - Video paused');
      } else {
        videoElement.play().then(() => {
          console.log('▶️ DEBUG - Video play started successfully');
        }).catch(err => {
          console.error('❌ DEBUG - Video play failed:', err);
        });
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
          src={videoURL || undefined}
          controls={false}
          className="w-full h-auto max-h-[400px] object-contain rounded-lg"
          onEnded={() => setIsPlaying(false)}
          crossOrigin="anonymous"
          playsInline
        />
        {/* Canvas for Camera Kit output - overlays the video */}
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          style={{ 
            display: videoURL ? 'block' : 'none',
            border: '2px solid red' // Debug: Add red border to see canvas bounds
          }}
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
            {currentTime.toFixed(2)}s / {videoDuration.toFixed(2)}s
          </span>
        </div>
      )}
      
      {/* Debug Info Panel */}
      {/*<div className="mt-4 p-2 bg-gray-700 rounded text-xs text-gray-300 max-w-2xl w-full">
        <div className="font-bold mb-1">Debug Info:</div>
        <div>Video Element: {videoRef.current ? '✅ Ready' : '❌ Not ready'}</div>
        <div>Canvas Element: {canvasRef.current ? '✅ Ready' : '❌ Not ready'}</div>
        <div>Camera Kit Session: {cameraKitSessionRef.current ? '✅ Active' : '❌ Not active'}</div>
        <div>Available Filters: {availableFilters.length}</div>
        <div>Video Ready State: {videoRef.current?.readyState || 'N/A'}</div>
        <div>Video Dimensions: {videoRef.current?.videoWidth || 0} x {videoRef.current?.videoHeight || 0}</div>
        <div>Canvas Dimensions: {canvasRef.current?.width || 0} x {canvasRef.current?.height || 0}</div>
      </div>
      */}
    </div>
  );
};

export default VideoPreviewPlayer;
