'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';

import { VideoEditorContextType, Filter, FilterTimelineEntry } from '../types';
import type { CameraKitSession } from '@snap/camera-kit';

// Create the context with a default undefined value, to be set by the Provider
const VideoEditorContext = createContext<VideoEditorContextType | undefined>(undefined);

export const VideoEditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoURL, setVideoURL] = useState<string>('');
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [cameraKitSession, setCameraKitSession] = useState<CameraKitSession | null>(null);
  const [availableFilters, setAvailableFilters] = useState<Filter[]>([]);
  const [filterTimeline, setFilterTimeline] = useState<FilterTimelineEntry[]>([]);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

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

