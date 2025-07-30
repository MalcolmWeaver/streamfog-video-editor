'use client';
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

import { VideoEditorContextType, Filter, FilterTimelineEntry } from '../types';
import type { CameraKitSession } from '@snap/camera-kit';

// Create the context with a default undefined value, to be set by the Provider
const VideoEditorContext = createContext<VideoEditorContextType | undefined>(undefined);

export const VideoEditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoURL, setVideoURL] = useState<string>('');
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [availableFilters, setAvailableFilters] = useState<Filter[]>([]);
  const [filterTimeline, setFilterTimeline] = useState<FilterTimelineEntry[]>([]);
  const [currentTime, setCurrentTime] = useState<number>(0);
  

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
    canvasRef,
    videoRef,
    videoURL,
    setVideoURL,
    videoDuration,
    setVideoDuration,
    availableFilters,
    setAvailableFilters,
    filterTimeline,
    setFilterTimeline,
    currentTime,
    setCurrentTime,
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

