'use client';
import React, { useRef, useState } from 'react';

const App = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // useState to store the URL of the uploaded video
  const [videoSrc, setVideoSrc] = useState(null);

  /**
   * Handles the video file upload event.
   * Creates an object URL for the selected video file and sets it as the video source.
   * @param {Event} event - The file input change event.
   */
  const handleVideoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);

      if (videoRef.current) {
        videoRef.current.load(); // Reload the video element to pick up the new src
      }
    }
  };

  return (
    // Main container for the entire application, setting background, text color, font, and padding
    // min-h-screen ensures it takes at least the full viewport height
    <div className="min-h-screen bg-gray-900 text-white font-inter p-4 flex flex-col items-center">
      {/* Link to Inter font from Google Fonts for consistent typography */}
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />

      {/* Header section with application title and subtitle */}
      <header className="w-full max-w-6xl py-6 text-center">
        <h1 className="text-4xl font-bold text-purple-400">AR Video Editor</h1>
        <p className="text-lg text-gray-400 mt-2">Apply Snap Camera Kit Lenses to your YouTube videos</p>
      </header>

      {/* Main content area, using flexbox for layout.
          It stacks vertically on small screens (flex-col) and
          switches to horizontal on large screens (lg:flex-row). */}
      <main className="w-full max-w-6xl flex flex-col lg:flex-row gap-8 mt-8">

        {/* Left Panel: Video Upload Section */}
        <div className="flex-1 bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
          <h2 className="text-2xl font-semibold mb-4 text-purple-300">Upload Your Video</h2>
          {/* Styled area for drag-and-drop or click-to-upload */}
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-purple-500 transition-colors duration-200">
            <label htmlFor="video-upload" className="cursor-pointer text-gray-400 hover:text-purple-400">
              {/* Hidden file input element */}
              <input
                id="video-upload"
                type="file"
                accept="video/mp4" // Only accept MP4 files
                className="hidden"
                onChange={handleVideoUpload}
              />
              {/* Visuals for the upload area */}
              <div className="flex flex-col items-center justify-center">
                {/* SVG icon for upload */}
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
            {/* Display a confirmation message if a video is loaded */}
            {videoSrc && (
              <p className="mt-4 text-green-400 text-sm truncate">
                Video loaded: {videoSrc.substring(0, 50)}...
              </p>
            )}
          </div>
        </div>

        {/* Right Panel: Video Player and Canvas for AR Preview */}
        <div className="flex-2 bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 flex flex-col items-center justify-center relative">
          <h2 className="text-2xl font-semibold mb-4 text-purple-300">Preview</h2>
          {/* Container for video and canvas, maintaining a 16:9 aspect ratio */}
          <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
            {/* Video Player element */}
            <video
              ref={videoRef} // Assign ref to access video element
              src={videoSrc} // Set video source from state
              controls // Show default video controls (play, pause, seek)
              className="absolute top-0 left-0 w-full h-full object-contain" // Fill container, maintain aspect ratio
            >
              Your browser does not support the video tag.
            </video>
            {/* Canvas Overlay for AR rendering.
                It sits directly on top of the video.
                pointer-events-none ensures clicks "fall through" to the video controls below. */}
            <canvas
              ref={canvasRef} // Assign ref to access canvas element
              className="absolute top-0 left-0 w-full h-full pointer-events-none"
            ></canvas>
          </div>
          {/* Placeholder for future scrubbing and timeline controls */}
          <div className="w-full mt-6 p-4 bg-gray-700 rounded-lg text-center text-gray-400">
            <p className="text-lg font-medium">Timeline Controls (Coming Soon)</p>
            <p className="text-sm">Select time ranges and apply filters here.</p>
          </div>
        </div>
      </main>

      {/* Footer section */}
      <footer className="w-full max-w-6xl py-6 text-center text-gray-500 text-sm mt-8">
        &copy; {new Date().getFullYear()} AR Video Editor. All rights reserved.
      </footer>
    </div>
  );
};

export default App;

