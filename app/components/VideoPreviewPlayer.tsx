'use client';
import React, { useRef, useEffect } from 'react';

interface VideoPreviewPlayerProps {
  videoSrc: string | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>; // Still use this ref
  onVideoMetadataLoaded: (videoElement: HTMLVideoElement) => void;
}

const VideoPreviewPlayer: React.FC<VideoPreviewPlayerProps> = ({
  videoSrc,
  videoRef,
  canvasRef, // Keep this prop
  onVideoMetadataLoaded,
}) => {
  // No changes needed here, as long as the parent re-mounts this component
  // or its key changes when the videoSrc changes, which should provide a new canvas.

  useEffect(() => {
    if (videoRef.current && videoSrc) {
      videoRef.current.src = videoSrc;
      videoRef.current.load(); // Load the new video

      const handleLoadedMetadata = () => {
        onVideoMetadataLoaded(videoRef.current!);
      };

      videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);

      return () => {
        videoRef.current?.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    }
  }, [videoSrc, onVideoMetadataLoaded, videoRef]);

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-contain"
        muted // Mute for automatic playback and to avoid audio feedback loops with Camera Kit
        loop // Loop for continuous AR effect
        playsInline // Crucial for mobile devices
        key={videoSrc || 'default-video'} // <--- Important: Add a key to force re-mount if videoSrc changes
      ></video>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        key={videoSrc ? `canvas-${videoSrc}` : 'canvas-empty'} // <--- Important: Add a key to force re-mount
      ></canvas>
      {!videoSrc && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-lg">
          No video loaded.
        </div>
      )}
    </div>
  );
};

export default VideoPreviewPlayer;
