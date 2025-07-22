// app/page.tsx or App.tsx (AppContent renamed)
'use client';

import React from 'react';

import VideoPreviewPlayer from './VideoPreviewPlayer';
import TimelineControls from './TimelineControls';
import VideoUpload from './VideoUpload';
import { CameraKitProvider, useCameraKit } from './CameraKitProvider';
import { useVideoPlayer } from './useVideoPlayer';
import VideoRecorder from './VideoRecorder';

// Main App component that wraps everything with CameraKitProvider
const AppContent: React.FC = () => {
  const {
    currentTime,
    duration,
    isPlaying,
    videoSrc,
    appliedFilters,
    handleVideoUpload,
    handleScrub,
    handlePlayPause,
    handleVideoMetadataLoaded,
    handleAddNewFilter,
    handleUpdateFilter,
    handleDeleteFilter,
    availableLensOptions,
  } = useVideoPlayer();

  const { isCameraKitSessionReady, cameraKitError, cameraKitSessionError} = useCameraKit();
  return (
    <div className="min-h-screen bg-gray-900 text-white font-inter p-4 flex flex-col items-center">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />

      <header className="w-full max-w-6xl py-6 text-center">
        <h1 className="text-4xl font-bold text-purple-400">AR Video Editor</h1>
        <p className="text-lg text-gray-400 mt-2">Apply Snap Camera Kit Lenses to your videos</p>
        {cameraKitError && (
          <p className="text-red-500 mt-2">Error initializing Camera Kit (Global): {cameraKitError.message}</p>
        )}
        {cameraKitSessionError && (
          <p className="text-red-500 mt-2">Error with Camera Kit Session: {cameraKitSessionError.message}</p>
        )}
        {!isCameraKitSessionReady && videoSrc && (
          <p className="text-yellow-400 mt-2">Camera Kit Session not yet ready...</p>
        )}
      </header>

      <main className="w-full max-w-6xl flex flex-col gap-8 mt-8">
        <VideoUpload onVideoUpload={handleVideoUpload} videoSrc={videoSrc} />

        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 flex flex-col items-center justify-center relative w-full">
          <h2 className="text-2xl font-semibold mb-4 text-purple-300">Preview</h2>
          <VideoPreviewPlayer
            key={videoSrc || 'no-video'} // IMPORTANT: Keep this key prop!
            videoSrc={videoSrc}
          />

          {videoSrc && duration > 0 ? (
            <>
            <TimelineControls
              duration={duration}
              currentTime={currentTime}
              onScrub={handleScrub}
              isPlaying={isPlaying}
              onPlayPause={handlePlayPause}
              onAddNewFilter={handleAddNewFilter}
              onUpdateFilter={handleUpdateFilter}
              onDeleteFilter={handleDeleteFilter}
              appliedFilters={appliedFilters}
              availableLensOptions={availableLensOptions}
            />
            <VideoRecorder/>
            </>
          ) : (
            <div className="w-full mt-6 p-4 bg-gray-700 rounded-lg text-center text-gray-400">
              <p className="text-lg font-medium">Upload a video to enable timeline controls.</p>
            </div>
          )}
        </div>
      </main>

      <footer className="w-full max-w-6xl py-6 text-center text-gray-500 text-sm mt-8">
        &copy; {new Date().getFullYear()} AR Video Editor. All rights reserved.
      </footer>
    </div>
  );
};

// Wrap the AppContent with the CameraKitProvider
const App: React.FC = () => {
  return (
    <CameraKitProvider>
      <AppContent />
    </CameraKitProvider>
  );
};

export default App;
