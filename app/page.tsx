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
      <div className="min-h-screen bg-gray-900 text-white font-sans p-6">
        <h1 className="text-4xl font-bold text-center mb-8 text-blue-400">
          Snap Camera Kit Video Editor
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="md:col-span-1 flex flex-col space-y-6">
            <VideoUpload />
            <VideoRecorder />
          </div>

          {/* Center/Right Column for Player and Timeline */}
          <div className="md:col-span-2 flex flex-col space-y-6">
            <VideoPreviewPlayer />
            <TimelineControls />
          </div>
        </div>
      </div>
    </VideoEditorProvider>
  );
}
