// components/VideoRecorder.tsx
'use client';
import React, { useState, useRef } from 'react';
import { useVideoEditor } from '../context/VideoEditorContext';

const VideoRecorder: React.FC = () => {
  const { videoURL, canvasRef, videoRef } = useVideoEditor();
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef   = useRef<Blob[]>([]);

  const handleStart = () => {
    if (!canvasRef.current || !videoRef.current) return;
    const videoEl = videoRef.current;

    // 1) Prepare the video: seek to 0, mute, then play
    videoEl.muted = true;
    videoEl.currentTime = 0;
    videoEl.play().catch(console.error);

    // 2) Grab streams
    const canvasStream = canvasRef.current.captureStream(30);
    const audioTracks  = videoEl.captureStream().getAudioTracks();
    audioTracks.forEach(track => canvasStream.addTrack(track));

    // 3) Setup MediaRecorder (with fallback detection)
    let opts: MediaRecorderOptions = { mimeType: 'video/webm; codecs=vp9' };
    if (MediaRecorder.isTypeSupported('video/mp4; codecs="avc1.42E01E"')) {
      opts = { mimeType: 'video/mp4; codecs="avc1.42E01E"' };
    }
    const rec = new MediaRecorder(canvasStream, opts);
    chunksRef.current = [];

    rec.ondataavailable = e => {
      if (e.data.size) chunksRef.current.push(e.data);
    };
    rec.onstop = () => {
      // download
      const blob = new Blob(chunksRef.current, { type: rec.mimeType });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = 'capture.' + (rec.mimeType.includes('mp4') ? 'mp4' : 'webm');
      a.click();
      URL.revokeObjectURL(url);
      // unmute video after capture
      videoEl.muted = false;
    };

    recorderRef.current = rec;
    rec.start();

    // 4) Stop recording exactly at video end
    const onEnded = () => {
      rec.stop();
      videoEl.removeEventListener('ended', onEnded);
      setRecording(false);
    };
    videoEl.addEventListener('ended', onEnded);

    setRecording(true);
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg shadow-md flex flex-col items-center">
      <h2 className="text-xl font-semibold text-white mb-4">Record Output + Audio</h2>
      <p className="text-gray-400 text-center mb-4">
        Clicking “Record” will restart the video at time 0 (muted), record both canvas & audio, 
        and auto‑stop when it ends.
      </p>
      <button
        onClick={handleStart}
        disabled={!videoURL || recording}
        className={`px-6 py-3 rounded-lg shadow-lg transition 
          ${recording
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
            : 'bg-red-600 text-white hover:bg-red-700'
          }`}
      >
        {recording ? 'Recording…' : 'Record'}
      </button>
    </div>
  );
};

export default VideoRecorder;

