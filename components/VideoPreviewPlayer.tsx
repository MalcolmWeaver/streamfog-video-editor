'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useVideoEditor } from '../context/VideoEditorContext';
import { Filter } from '../types';

import {
    bootstrapCameraKit,
    CameraKitSession,
    Lens,
} from '@snap/camera-kit';
import { pascalDarkColors } from '@/theme';

const STAGING_API_TOKEN = process.env.NEXT_PUBLIC_STAGING_API_TOKEN!;
const LENS_GROUP_ID     = process.env.NEXT_PUBLIC_LENS_GROUP_ID!;

const VideoPreviewPlayer: React.FC = () => {
    const {
        videoURL,
        setVideoDuration,
        availableFilters,
        setAvailableFilters,
        filterTimeline,
        currentTime,
        setCurrentTime,
        videoDuration,
        videoRef,
        canvasRef
    } = useVideoEditor();

    const cameraKitSessionRef = useRef<CameraKitSession | null>(null);
    
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [isVideoMetadataReady, setIsVideoMetadataReady] = useState(false);
    
    // Video Metadata Loading and Time Updates
    useEffect(() => {
        if (!canvasRef || !('current' in canvasRef) || !videoRef || !('current' in videoRef) || !videoRef.current || !canvasRef.current) return;
        const videoElement = videoRef.current;

        if (videoElement) {
            const handleLoadedMetadata = () => {
                setVideoDuration(videoElement.duration);
                setIsVideoMetadataReady(true);
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
    }, [videoURL]);

    // Camera Kit initialization and cleanup
    useEffect(() => {
        if (!canvasRef || !('current' in canvasRef) || !videoRef || !('current' in videoRef) || !videoRef.current || !canvasRef.current) return;

        const videoEl  = videoRef.current!;
        const canvasEl = canvasRef.current!;
        const session  = cameraKitSessionRef.current;

        // Fast‑path: reuse if dimensions match
        if (
            session &&
            videoEl.videoWidth  === canvasEl.width &&
        videoEl.videoHeight === canvasEl.height
        ) {
            session.setSource(videoEl);
            return;
        }

        // Slow‑path: full teardown & rebuild
        session?.destroy();
        cameraKitSessionRef.current = null;
        setAvailableFilters([]);

        canvasEl.width  = videoEl.videoWidth;
        canvasEl.height = videoEl.videoHeight;

        (async () => {
            const kit     = await bootstrapCameraKit({ apiToken: STAGING_API_TOKEN });
            const newSess = await kit.createSession({ liveRenderTarget: canvasEl });
            cameraKitSessionRef.current = newSess;
            newSess.setSource(videoEl);

            const { lenses } = await kit.lensRepository.loadLensGroups([LENS_GROUP_ID]);

            const lensesWithColor: Filter[] = lenses.map((lens: Lens) => ({
                ...lens,
                color: pascalDarkColors[
                    Math.floor(Math.random() * pascalDarkColors.length)
                ],
            }));
            setAvailableFilters(lensesWithColor);

            await newSess.play();
        })().catch(console.error);

    }, [videoURL, isVideoMetadataReady]);


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
                        console.log(`[Lens] applied ${activeLens.name}`);
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
          key={`canvas-${videoURL}`}
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
