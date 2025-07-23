'use client';
import React, { useEffect, useRef } from 'react';
import { useVideoEditor } from '../context/VideoEditorContext';
import { Filter } from '../types';

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

  // Video Metadata Loading and Time Updates
  useEffect(() => {
    const videoElement = videoRef.current;
    
    if (videoElement) {
      const handleLoadedMetadata = () => {
        setVideoDuration(videoElement.duration);
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = videoElement.videoWidth || 640;
          canvas.height = videoElement.videoHeight || 480;
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
          canvasElement.width = videoElement.videoWidth;
          canvasElement.height = videoElement.videoHeight;
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

  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 flex flex-col items-center justify-center relative w-full">
      <h2 className="text-2xl font-semibold mb-4 text-purple-300">Preview</h2>
      
      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          src={videoURL || undefined}
          controls={false}
          className="absolute inset-0 w-full h-full object-contain"
          onEnded={() => setIsPlaying(false)}
          crossOrigin="anonymous"
          playsInline
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          style={{ display: videoURL ? 'block' : 'none' }}
        />
        {!videoURL && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-lg">
            No video loaded.
          </div>
        )}
      </div>

      {videoURL ? (
        <div className="w-full mt-6">
          {/* Play/Pause Controls */}
          <div className="flex items-center justify-center space-x-4 mb-4">
            <button
              onClick={handlePlayPause}
              className="flex items-center justify-center w-12 h-12 bg-purple-600 hover:bg-purple-700 rounded-full transition-colors duration-200"
            >
              {isPlaying ? (
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                </svg>
              ) : (
                <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>
            <span className="text-white text-sm font-medium">
              {Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(0).padStart(2, '0')} / {Math.floor(videoDuration / 60)}:{(videoDuration % 60).toFixed(0).padStart(2, '0')}
            </span>
          </div>

          {/* Progress Bar */}
          <div 
            className="w-full h-2 bg-gray-700 rounded-full cursor-pointer overflow-hidden"
            onClick={handleSeek}
          >
            <div 
              className="h-full bg-purple-500 transition-all duration-100 ease-linear"
              style={{ width: `${videoDuration > 0 ? (currentTime / videoDuration) * 100 : 0}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="w-full mt-6 p-4 bg-gray-700 rounded-lg text-center text-gray-400">
          <p className="text-lg font-medium">Upload a video to enable timeline controls.</p>
        </div>
      )}
    </div>
  );
};

export default VideoPreviewPlayer;
