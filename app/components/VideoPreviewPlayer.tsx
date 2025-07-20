'use client';
import React, { useEffect } from 'react';

/**
 * Props for the VideoPreviewPlayer component.
 */
interface VideoPreviewPlayerProps {
    videoSrc: string | null;
    videoRef: React.RefObject<HTMLVideoElement|null>;
    canvasRef: React.RefObject<HTMLCanvasElement|null>;
    onVideoMetadataLoaded?: (videoElement: HTMLVideoElement) => void;
}

/**
 * A component to display the video player and an overlay canvas for AR rendering.
 *
 * @param {VideoPreviewPlayerProps} props
 */
const VideoPreviewPlayer = ({ videoSrc, videoRef, canvasRef, onVideoMetadataLoaded }: VideoPreviewPlayerProps) => {

  // Effect to handle video loading and metadata events
  useEffect(() => {
    if(videoRef == null || videoSrc == null || canvasRef == null){
        console.log("SOMETHING WENT WRONG WITH PAGE SETUP");
        return;
    }
    const videoElement = videoRef.current;
    if (videoElement && videoSrc) {
      // Set the video source. The browser will handle loading it.
      videoElement.src = videoSrc;
      // Note: We don't call videoElement.load() here. React updating the src prop
      // on the video element is often enough, and handleLoadedMetadata below ensures dimensions.

      // Callback to execute once video metadata (like dimensions, duration) is loaded
      const handleLoadedMetadata = () => {
        if (onVideoMetadataLoaded) {
          onVideoMetadataLoaded(videoElement); // Pass the video element to the parent
        }
        // Ensure canvas dimensions match video dimensions for correct rendering
        if (canvasRef.current) {
          canvasRef.current.width = videoElement.videoWidth;
          canvasRef.current.height = videoElement.videoHeight;
        }
      };

      videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);

      // Cleanup listener when component unmounts or videoSrc changes
      return () => {
        videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
        // Important: If videoSrc were created by THIS component, we'd revoke it here.
        // But App.jsx is still responsible for URL.createObjectURL and its revocation.
      };
    }
  }, [videoSrc, onVideoMetadataLoaded, videoRef, canvasRef]); // Dependencies for the effect

  return (
    // Main container for the preview section
      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
        {/* Video Player element */}
        <video
          ref={videoRef} // Assign ref passed from parent
          controls // Display native video controls (play, pause, seek)
          className="absolute top-0 left-0 w-full h-full object-contain" // Fill container, maintain aspect ratio
        >
          Your browser does not support the video tag.
        </video>
        {/* Canvas Overlay for AR rendering.
            Positioned directly over the video.
            pointer-events-none ensures clicks "fall through" to the video controls below. */}
        <canvas
          ref={canvasRef} // Assign ref passed from parent
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
        ></canvas>
      </div>
  );
};

export default VideoPreviewPlayer;
