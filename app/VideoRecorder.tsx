import React, { useRef, useState, useEffect, Ref } from 'react';
import { useCameraKit } from './CameraKitProvider';

const VideoRecorder = () => {
  const { canvasRef} = useCameraKit();
  const mediaRecorderRef: Ref<MediaRecorder | null> = useRef(null);
  const recordedChunksRef = useRef([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // For the loading modal

  const startRecording = () => {
    console.log(canvasRef.current);
    //if (!canvasRef.current) {
    //  console.error("Canvas element not found.");
    //  return;
    //}
    //
    try {
      const stream = canvasRef.current.captureStream(30); // 30 FPS for recording
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });

      recordedChunksRef.current = []; // Clear previous recordings

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'snap-camera-kit-video.webm';
        document.body.appendChild(a); // Append to body to make it clickable
        a.click();
        document.body.removeChild(a); // Clean up
        URL.revokeObjectURL(url); // Free up memory

        setIsLoading(false); // Hide loading modal
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setIsLoading(true); // Show loading modal immediately upon starting recording
    } catch (error) {
      console.error("Error starting recording:", error);
      setIsLoading(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      // The loading modal will be hidden in onstop
    }
  };

  return (
    <div className="w-full mt-6 p-4 bg-gray-700 rounded-lg flex flex-col gap-4"> {/* Container styled */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={startRecording}
          disabled={isRecording}
          className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-colors duration-200
            ${isRecording
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-75'
            }`}
        >
          {isRecording ? 'Recording...' : 'Start Recording'}
        </button>
        <button
          onClick={stopRecording}
          disabled={!isRecording}
          className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-colors duration-200
            ${!isRecording
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75'
            }`}
        >
          Stop Recording & Export
        </button>
      </div>

      {isLoading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.7)', // Slightly darker overlay
          display: 'flex',
          flexDirection: 'column', // For stacking message and spinner
          justifyContent: 'center',
          alignItems: 'center',
          color: 'white',
          fontSize: '24px',
          zIndex: 1000,
          backdropFilter: 'blur(5px)', // Subtle blur behind the modal
        }}>
          <p className="mb-4 text-purple-300 font-bold">Rendering and recording video...</p>
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div> {/* Spinner */}
          <p className="mt-4 text-gray-300 text-base">Please do not close this window.</p>
        </div>
      )}
    </div> 
  );
};

export default VideoRecorder;
