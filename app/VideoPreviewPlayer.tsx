'use client';
import React, { useEffect } from 'react';
import { useCameraKit } from './CameraKitProvider';

interface VideoPreviewPlayerProps {
  videoSrc: string | null;
  onVideoMetadataLoaded: (videoElement: HTMLVideoElement) => void;
}

const VideoPreviewPlayer: React.FC<VideoPreviewPlayerProps> = ({
  videoSrc,
  onVideoMetadataLoaded,
}) => {
  const { videoRef, canvasRef } = useCameraKit();
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
    <div> {/*className="relative w-full aspect-video bg-black rounded-lg overflow-hidden"> */}
      <video
        ref={videoRef}
        className="iabsolute iinset-0 w-full h-full object-contain z-0"
        muted 
        playsInline // Crucial for mobile devices
        key={videoSrc || 'default-video'} // <--- Important: Add a key to force re-mount if videoSrc changes
      ></video>
      <canvas
        ref={canvasRef}
        className="iabsolute iinset-0 w-full h-full object-contain pointer-events-none z-10"
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
