'use client';
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

import { VideoEditorContextType, Filter, FilterTimelineEntry } from '../types';
import type { CameraKitSession } from '@snap/camera-kit';

// Create the context with a default undefined value, to be set by the Provider
const VideoEditorContext = createContext<VideoEditorContextType | undefined>(undefined);

export const VideoEditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoURL, setVideoURL] = useState<string>('');
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [cameraKitSession, setCameraKitSession] = useState<CameraKitSession | null>(null);
  const [availableFilters, setAvailableFilters] = useState<Filter[]>([]);
  const [filterTimeline, setFilterTimeline] = useState<FilterTimelineEntry[]>([]);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  
  const handlePlayPause = () => {
    if (!videoRef) {
        console.error('TRYING TO PLAY/PAUSE WHEN VIDEO ELEMENT REF IS NOT DEFINED');
        return;
    }
    const videoElement = videoRef.current;
    if (videoElement) {
      if (videoElement.paused) {
        videoElement.play().catch(err => console.error("Play failed", err));
        setIsPlaying(true);
      } else {
        videoElement.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleScrub = (newTime: number) => {
    if (!videoRef) {
        console.error('TRYING TO SCRUB WHEN VIDEO ELEMENT REF IS NOT DEFINED');
        return;
    }
    const videoElement = videoRef.current;
    const time = Math.max(0, Math.min(newTime, videoDuration));
    if (videoElement && isFinite(time)) {
      videoElement.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Effect to clean up video URL when component unmounts or video changes
  useEffect(() => {
    return () => {
      if (videoURL) {
        URL.revokeObjectURL(videoURL);
      }
    };
  }, [videoURL]);

  // The value object that will be provided to consumers
  const value: VideoEditorContextType = {
    videoFile,
    setVideoFile,
    canvasRef,
    videoRef,
    videoURL,
    setVideoURL,
    videoDuration,
    setVideoDuration,
    cameraKitSession,
    setCameraKitSession,
    availableFilters,
    setAvailableFilters,
    filterTimeline,
    setFilterTimeline,
    currentTime,
    setCurrentTime,
    isPlaying,
    setIsPlaying,
    handlePlayPause,
    handleScrub
  };

  return (
    <VideoEditorContext.Provider value={value}>
      {children}
    </VideoEditorContext.Provider>
  );
};

export const useVideoEditor = () => {
  const context = useContext(VideoEditorContext);
  if (context === undefined) {
    throw new Error('useVideoEditor must be used within a VideoEditorProvider');
  }
  return context;
};

