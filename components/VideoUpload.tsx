'use client';
import React, { useRef } from 'react';
import { useVideoEditor } from '../context/VideoEditorContext';

const VideoUpload: React.FC = () => {
  const { videoFile, setVideoFile, setVideoURL, setVideoDuration } = useVideoEditor();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; // Use optional chaining for safety
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoURL(url);

      // Reset duration until metadata is loaded by the player
      setVideoDuration(0);
    } else {
      //TODO: replace with a custom modal/toast notification
      console.error('Please select a valid video file.');
      setVideoFile(null);
      setVideoURL('');
      setVideoDuration(0);
    }
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg shadow-md flex flex-col items-center justify-center">
      <h2 className="text-xl font-semibold text-white mb-4">Upload Video</h2>
      <input
        type="file"
        accept="video/*"
        onChange={handleFileChange}
        ref={fileInputRef}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()} // Use optional chaining
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300 ease-in-out shadow-lg"
      >
        Select Video
      </button>
      {videoFile && (
        <p className="mt-2 text-gray-300 text-sm">
          Selected: {videoFile?.name}
        </p>
      )}
    </div>
  );
};

 export default VideoUpload; 
