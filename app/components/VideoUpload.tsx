'use client';
import React from 'react';

/**
 * Props for the VideoUpload component.
 */
interface VideoUploadProps {
  onVideoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  videoSrc: string | null;
}

/**
 * A component for handling video file uploads with a drag-and-drop interface.
 * @param {VideoUploadProps} props
 */
const VideoUpload: React.FC<VideoUploadProps> = ({ onVideoUpload, videoSrc }: VideoUploadProps) => {
  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 w-full">
      <h2 className="text-2xl font-semibold mb-4 text-purple-300">Upload Your Video</h2>
      <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-purple-500 transition-colors duration-200">
        <label htmlFor="video-upload" className="cursor-pointer text-gray-400 hover:text-purple-400">
          <input
            id="video-upload"
            type="file"
            accept="video/mp4"
            className="hidden"
            onChange={onVideoUpload}
          />
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
            <p className="text-lg font-medium">Drag & Drop or Click to Upload MP4</p>
            <p className="text-sm text-gray-500 mt-1">Supports 720p, 1080p (up to ~20 min)</p>
          </div>
        </label>
        {videoSrc && (
          <p className="mt-4 text-green-400 text-sm truncate">
            Video loaded: {videoSrc.substring(0, 50)}...
          </p>
        )}
      </div>
    </div>
  );
};

export default VideoUpload;
