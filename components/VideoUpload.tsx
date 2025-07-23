'use client';
import React, { useRef } from 'react';
import { useVideoEditor } from '../context/VideoEditorContext';

const VideoUpload: React.FC = () => {
  const { videoFile, setVideoFile, setVideoURL, setVideoDuration } = useVideoEditor();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoURL(url);
      setVideoDuration(0);
    } else {
      console.error('Please select a valid video file.');
      setVideoFile(null);
      setVideoURL('');
      setVideoDuration(0);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('video/')) {
        setVideoFile(file);
        const url = URL.createObjectURL(file);
        setVideoURL(url);
        setVideoDuration(0);
      }
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 w-full">
      <h2 className="text-2xl font-semibold mb-4 text-purple-300">Upload Your Video</h2>
      
      <div 
        className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-purple-500 transition-colors duration-200"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          ref={fileInputRef}
          className="hidden"
          id="video-upload"
        />
        <label htmlFor="video-upload" className="cursor-pointer text-gray-400 hover:text-purple-400">
          <div className="flex flex-col items-center justify-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-16 w-16 mb-4 text-gray-500" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
              />
            </svg>
            <p className="text-lg font-medium">
              {videoFile ? `Selected: ${videoFile.name}` : 'Drag & Drop or Click to Upload Video'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Supports MP4, WebM, MOV (up to ~20 min)
            </p>
          </div>
        </label>
      </div>
    </div>
  );
};

export default VideoUpload;
