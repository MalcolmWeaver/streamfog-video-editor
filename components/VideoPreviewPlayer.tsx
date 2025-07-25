'use client';
import React, { useEffect, useRef, useState} from 'react';
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
        canvasRef,
        videoRef,
        setCameraKitSession,
        availableFilters,
        setAvailableFilters,
        filterTimeline,
        setFilterTimeline,
        currentTime,
        setCurrentTime,
        setIsPlaying,
    } = useVideoEditor();

    const [isSessionReady, setIsSessionReady] = useState(false);


    const cameraKitSessionRef = useRef<CameraKitSession | null>(null);

    // Reset state when video changes
    useEffect(() => {
        if (videoURL) {
            // Reset video state
            setCurrentTime(0);
            setIsPlaying(false);
            setVideoDuration(0);
            setFilterTimeline([]);

            // Clear any existing Camera Kit session
            if (cameraKitSessionRef.current) {
                console.log('🧹 Cleaning up previous session for new video');
                cameraKitSessionRef.current.destroy();
                cameraKitSessionRef.current = null;
                setCameraKitSession(null);
                setAvailableFilters([]);
            }

            // Reset video element
            if(!videoRef || !('current' in videoRef) || !videoRef.current || !canvasRef || !('current' in canvasRef) || !canvasRef.current) return;
            const videoElement = videoRef.current;
            if (videoElement) {
                videoElement.currentTime = 0;
                videoElement.pause();
            }

        }
    }, [videoURL]);



    // Video Metadata Loading and Time Updates
    useEffect(() => {
        if(!videoRef || !('current' in videoRef) || !videoRef.current || !canvasRef || !('current' in canvasRef) || !canvasRef.current) return;
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
            console.log('DEBUG - Canvas Ref: ', canvasRef.current);

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
    }, [videoURL]);

    // Camera Kit initialization and cleanup
    useEffect(() => {
        if (!canvasRef || !('current' in canvasRef) || !videoRef || !('current' in videoRef) || !videoRef.current || !canvasRef.current) {
            console.error('cannot find video or canvas ref');
            return;
        }
        const videoElement = videoRef.current;
        const canvasElement = canvasRef.current;
        let canceled = false;

        const initializeCameraKit = async () => {
            if (cameraKitSessionRef.current) {
                cameraKitSessionRef.current.destroy();
                cameraKitSessionRef.current = null;
                setCameraKitSession(null);
                setAvailableFilters([]);
            }

            setIsSessionReady(false)
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
                    // Set canvas to EXACT video dimensions - no scaling
                    canvasElement.width = videoElement.videoWidth;
                    canvasElement.height = videoElement.videoHeight;

                    // Set CSS size to maintain aspect ratio while fitting container
                    const aspectRatio = videoElement.videoWidth / videoElement.videoHeight;
                    const containerWidth = canvasElement.parentElement?.clientWidth || 640;
                    const displayWidth = Math.min(containerWidth, videoElement.videoWidth);
                    const displayHeight = displayWidth / aspectRatio;

                    canvasElement.style.width = `${displayWidth}px`;
                    canvasElement.style.height = `${displayHeight}px`;

                    console.log('Canvas internal resolution:', canvasElement.width, 'x', canvasElement.height);
                    console.log('Canvas display size:', displayWidth, 'x', displayHeight);
                }

                const session = await cameraKit.createSession({
                    liveRenderTarget: canvasElement,
                    renderWhileTabHidden: true, // Want to be able to switch tabs
                });

                session.setSource(videoElement);
                cameraKitSessionRef.current = session;
                setCameraKitSession(session);

                const { lenses, errors} = await cameraKit.lensRepository.loadLensGroups([LENS_GROUP_ID]);
                console.warn('Loading lenses errors: ', errors);

                setAvailableFilters(lenses);

                try {
                    await session.play();
                    if(!canceled){ setIsSessionReady(true);}
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
            canceled = true;
            session?.destroy();
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

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
      <h2 className="text-xl font-semibold text-purple-300 mb-6 text-center">Video Preview</h2>
      
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden mb-6">
      {videoURL ? (
          <>
          {/*
            <video
              ref={videoRef}
              src={videoURL}
              className={`
                absolute inset-0 w-full h-full object-contain
                ${videoURL && isSessionReady ? 'invisible' : 'visible'}
              `}
              onEnded={() => setIsPlaying(false)}
              crossOrigin="anonymous"
              playsInline
            />

            <canvas
              ref={canvasRef}
              className={`
                absolute inset-0 w-full h-full object-contain pointer-events-none z-10
                ${videoURL && isSessionReady ? 'visible opacity-100' : 'invisible opacity-0'}
                transition-opacity duration-200 ease-in-out
              `}
            />
            */}
           <video
  ref={videoRef}
  src={videoURL || null}
  className={`
    absolute inset-0 w-full h-full object-contain
    ${isSessionReady ? 'invisible' : 'visible'}
    z-0         /* ensure video is at the back */
  `}
/>

<canvas
  ref={canvasRef}
  className={`
    absolute inset-0 w-full h-full object-contain pointer-events-none
    ${isSessionReady ? 'visible opacity-100' : 'invisible opacity-0'}
    transition-opacity duration-200 ease-in-out
    z-20        /* push canvas to the front */
  `}
/>

      </>) : null }
        {/*
        <video
          key={`video-${videoURL}`}
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
          key={`canvas-${videoURL}`}
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          style={{ 
            display: videoURL ? 'block' : 'none',
            zIndex: 10
          }}
        />*/}
        {!videoURL && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-lg">
            Upload a video to see preview
          </div>
        )}
      </div>

      {videoURL ? (
        null
      ) : (
        <div className="text-center p-6 bg-gray-700 rounded-lg">
          <p className="text-gray-400">Upload a video to enable controls</p>
        </div>
      )}
    </div>
  );
};

export default VideoPreviewPlayer;
