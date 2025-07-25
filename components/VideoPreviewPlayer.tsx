'use client';
import React, { useEffect, useRef } from 'react';
import { useVideoEditor } from '../context/VideoEditorContext';
import { Filter } from '../types';

import {
  bootstrapCameraKit,
  CameraKitSession,
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

  // Video Metadata Loading and Time Updates
  useEffect(() => {
    const videoElement = videoRef.current;
    
    if (videoElement) {
      const handleLoadedMetadata = () => {
        setVideoDuration(videoElement.duration);
        const canvas = canvasRef.current;
        if (canvas && videoElement.videoWidth && videoElement.videoHeight) {
          // Ensure canvas matches video dimensions exactly
          canvas.width = videoElement.videoWidth;
          canvas.height = videoElement.videoHeight;
          console.log('Video metadata loaded - Canvas sized to:', canvas.width, 'x', canvas.height);
        }
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
      if (cameraKitSessionRef.current) {
        cameraKitSessionRef.current.destroy();
        cameraKitSessionRef.current = null;
        setCameraKitSession(null);
        setAvailableFilters([]);
      }

      if (!videoURL || !videoElement || !canvasElement) {
        return;
      }

      if (videoElement.readyState < 2) {
        const waitForReady = () => {
          if (videoElement.readyState >= 2) {
            initializeCameraKit();
          } else {
            setTimeout(waitForReady, 100);
          }
        };
        waitForReady();
        return;
      }

      try {
        const cameraKit = await bootstrapCameraKit({
          apiToken: STAGING_API_TOKEN,
        });

        if (videoElement.videoWidth && videoElement.videoHeight) {
          // Set canvas to exact video dimensions
          canvasElement.width = videoElement.videoWidth;
          canvasElement.height = videoElement.videoHeight;
          console.log('Canvas dimensions set to:', canvasElement.width, 'x', canvasElement.height);
        } else {
          // Fallback dimensions
          canvasElement.width = 640;
          canvasElement.height = 480;
        }

        const session = await cameraKit.createSession({
          liveRenderTarget: canvasElement,
        });

        session.setSource(videoElement);
        cameraKitSessionRef.current = session;
        setCameraKitSession(session);

        const { lenses, errors} = await cameraKit.lensRepository.loadLensGroups([LENS_GROUP_ID]);
        console.warn('Loading lenses errors: ', errors);
        
        setAvailableFilters(lenses);

        try {
          await session.play();
          console.log('Camera Kit session started successfully');
          
          // Force a render to ensure canvas is displaying
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (playError) {
          console.error('Error starting Camera Kit session:', playError);
        }

      } catch (error) {
        console.error("Error initializing Camera Kit:", error);
        setCameraKitSession(null);
        setAvailableFilters([]);
      }
    };

    const timeoutId = setTimeout(initializeCameraKit, 100);

    return () => {
      clearTimeout(timeoutId);
      if (cameraKitSessionRef.current) {
        cameraKitSessionRef.current.destroy();
        cameraKitSessionRef.current = null;
      }
      setCameraKitSession(null);
      setAvailableFilters([]);
    };
  }, [videoURL, setCameraKitSession, setAvailableFilters]);

  // Apply Filters Based on Timeline and Current Time
  useEffect(() => {
    const session = cameraKitSessionRef.current;

    if (session && availableFilters.length > 0) {
      const activeFilterEntry = filterTimeline.find(
        (f) => currentTime >= f.startTime && currentTime <= f.endTime
      );

      session.removeLens();

      if (activeFilterEntry) {
        const activeLens = availableFilters.find(
          (availableFilter: Filter) => availableFilter.id === activeFilterEntry.filterId
        );
        
        if (activeLens) {
          try {
            session.applyLens(activeLens);
          } catch (lensError) {
            console.error('Error applying lens:', lensError);
          }
        }
      }
    }
  }, [currentTime, filterTimeline, availableFilters]);

  const handlePlayPause = () => {
    const videoElement = videoRef.current;
    
    if (videoElement) {
      if (isPlaying) {
        videoElement.pause();
      } else {
        videoElement.play().catch(err => {
          console.error('Video play failed:', err);
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const videoElement = videoRef.current;
    if (!videoElement || videoDuration === 0) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * videoDuration;
    
    videoElement.currentTime = newTime;
    setCurrentTime(newTime);
  };
  const handleScrub = (newTime: number) => {
    const videoElement = videoRef.current;
    // Clamp the time to be within the video's duration
    const time = Math.max(0, Math.min(newTime, videoDuration));
    if (videoElement && isFinite(time)) {
      videoElement.currentTime = time;
      setCurrentTime(time);
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
      <h2 className="text-xl font-semibold text-purple-300 mb-6 text-center">Video Preview</h2>
      
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden mb-6">
        <video
          ref={videoRef}
          src={videoURL || undefined}
          controls={false}
          className="absolute inset-0 w-full h-full object-contain"
          onEnded={() => setIsPlaying(false)}
          crossOrigin="anonymous"
          playsInline
          style={{ 
            visibility: videoURL && cameraKitSessionRef.current ? 'hidden' : 'visible'
          }}
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          style={{ 
            display: videoURL ? 'block' : 'none',
            zIndex: 10
          }}
        />
        {!videoURL && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-lg">
            Upload a video to see preview
          </div>
        )}
      </div>

      {videoURL ? (
          <div className="w-full mt-6 p-4 bg-gray-800 rounded-lg flex flex-col gap-4 shadow-xl">
              {/* Play/Pause & Time Display */}
              <div className="flex items-center justify-between text-gray-300">
                <button
                  onClick={handlePlayPause}
                  className="p-2 rounded-full bg-purple-600 hover:bg-purple-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? (
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                  ) : (
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  )}
                </button>
                <div className="text-lg font-mono tracking-wider">
                  <span>{(currentTime)}</span> / <span>{(videoDuration)}</span>
                </div>
              </div>

              {/* Timeline Scrubber */}
              <input
                type="range"
                min="0"
                max={videoDuration}
                value={currentTime}
                onChange={(e) => handleScrub(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-thumb"
                aria-label="Video scrubber"
                disabled={videoDuration === 0}
              />

          {/* Time Display */}
          <div className="text-center">
            <span className="text-white text-sm font-medium">
              {Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(0).padStart(2, '0')} / {Math.floor(videoDuration / 60)}:{(videoDuration % 60).toFixed(0).padStart(2, '0')}
            </span>
          </div>

          {/* Progress Bar */}
        </div>
      ) : (
        <div className="text-center p-6 bg-gray-700 rounded-lg">
          <p className="text-gray-400">Upload a video to enable controls</p>
        </div>
      )}
    </div>
  );
};

export default VideoPreviewPlayer;
