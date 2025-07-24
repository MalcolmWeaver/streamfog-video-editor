// components/VideoRecorder.tsx
'use client';
import React, { useState, useRef } from 'react';
import { useVideoEditor } from '../context/VideoEditorContext';
  import ModalPortal from './ModalPortal';

const VideoRecorder: React.FC = () => {
  const { videoURL, canvasRef, videoRef } = useVideoEditor();
  const [recording, setRecording] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const recorderRef    = useRef<MediaRecorder | null>(null);
  const chunksRef      = useRef<Blob[]>([]);
  const onEndedRef     = useRef<(() => void)>();
  const cancelledRef = useRef(false);

  const teardown = () => {
    // stop recorder if active
    recorderRef.current?.state !== 'inactive' && recorderRef.current?.stop();
    cancelledRef.current = true;
    recorderRef.current?.state !== 'inactive' && recorderRef.current?.stop();
    // unmute & pause video
    if (videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.pause();
      // cleanup listener
      if (onEndedRef.current) videoRef.current.removeEventListener('ended', onEndedRef.current);
    }
    setRecording(false);
    setShowModal(false);
  };

  const startRecording = () => {
    cancelledRef.current = false;
    if (!canvasRef.current || !videoRef.current) return;
    const videoEl = videoRef.current;

    // Mute, rewind & play
    videoEl.muted = true;
    videoEl.currentTime = 0;
    videoEl.play().catch(console.error);

    // Build combined stream
    const canvasStream = canvasRef.current.captureStream(30);
    const audioTracks  = videoEl.captureStream().getAudioTracks();
    audioTracks.forEach((t) => canvasStream.addTrack(t));

    // Pick MIME (MP4 if supported, else WebM)
    let opts: MediaRecorderOptions = { mimeType: 'video/webm; codecs=vp9' };
    if (MediaRecorder.isTypeSupported('video/mp4; codecs="avc1.42E01E"')) {
      opts = { mimeType: 'video/mp4; codecs="avc1.42E01E"' };
    }

    const rec = new MediaRecorder(canvasStream, opts);
    chunksRef.current = [];

    rec.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
    rec.onstop = () => {
      if (!cancelledRef.current) {
         const blob = new Blob(chunksRef.current, { type: rec.mimeType });
         const url  = URL.createObjectURL(blob);
         const a    = document.createElement('a');
         a.href     = url;
         a.download = 'capture.' + (rec.mimeType.includes('mp4') ? 'mp4' : 'webm');
         a.click();
         URL.revokeObjectURL(url);
       }
       // whether cancelled or finished, clean up
       teardown();// download file
    };

    recorderRef.current = rec;
    rec.start();
    setRecording(true);
    setShowModal(true);

    // auto‑stop on video end
    const onEnded = () => rec.stop();
    onEndedRef.current = onEnded;
    videoEl.addEventListener('ended', onEnded);
  };

  return (
    <>
      {showModal && (
        <ModalPortal>
          <div className="fixed inset-0 bg-gray-200/10 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm text-center shadow-xl space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Recording &amp; Exporting…</h3>
              <p className="text-gray-700">
                Your video is being recorded. Once it finishes, we'll prepare the download.
              </p>
              <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-8 w-8 mx-auto"></div>
              <button
                onClick={teardown}
                className="mt-4 px-4 py-2 bg-gray-700 rounded hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </ModalPortal>
      )}

      <div className="p-4 bg-gray-800 rounded-lg shadow-md flex flex-col items-center">
        <h2 className="text-xl font-semibold text-white mb-4">Record Output   Audio</h2>
        <p className="text-gray-400 text-center mb-4">
          Click “Record” to replay from the start (muted), record both canvas & audio, 
          and auto‑stop when it ends.
        </p>
        <button
          onClick={startRecording}
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
    </>
  );
};

export default VideoRecorder;

