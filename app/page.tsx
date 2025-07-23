'use client';
import React from 'react';
import { VideoEditorProvider } from '../context/VideoEditorContext';
import VideoUpload from '../components/VideoUpload';
import VideoPreviewPlayer from '../components/VideoPreviewPlayer';
import TimelineControls from '../components/TimelineControls';
import VideoRecorder from '../components/VideoRecorder';

export default function App() {
  return (
    <VideoEditorProvider>
      <div className="min-h-screen bg-gray-900 text-white">
        {/* Header */}
        <header className="text-center py-8">
          <h1 className="text-4xl font-bold text-purple-400 mb-2">
            AR Video Editor
          </h1>
          <p className="text-gray-400 text-lg">
            Apply Snap Camera Kit Lenses to your videos
          </p>
        </header>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-6 pb-8">
          <div className="space-y-8">
            {/* Upload Section */}
            <VideoUpload />
            
            {/* Preview Section */}
            <VideoPreviewPlayer />
            
            {/* Timeline Controls */}
            <TimelineControls />
            
            {/* Recording Section */}
            <VideoRecorder />
          </div>
        </main>
      </div>
    </VideoEditorProvider>
  );
}
