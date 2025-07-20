'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { bootstrapCameraKit, CameraKitSession, CameraKit, Lens } from '@snap/camera-kit';

interface CameraKitInitializerProps {
  videoElement: HTMLVideoElement | null;
  canvasElement: HTMLCanvasElement | null;
  onCameraKitReady: (session: CameraKitSession, cameraKit: CameraKit) => void;
  onCleanup: () => void; // A prop to notify parent of cleanup
}

const SNAP_CAMERA_KIT_API_TOKEN = 'eyJhbGciOiJIUzI1NiIsImtpZCI6IkNhbnZhc1MyU0hNQUNQcm9kIiwidHlwIjoiSldUIn0.eyJhdWQiOiJjYW52YXMtY2FudmFzYXBpIiwiaXNzIjoiY2FudmFzLXMyc3Rva2VuIiwibmJmIjoxNzUzMDQyMTkzLCJzdWIiOiJkMjM3MmY5Mi1lZjlkLTRkNWMtYjU0My1lNDFhOGMwOWFlMjR-U1RBR0lOR34xNTljYTVkMC00MWNmLTQzNzUtOGE1Ni03NTM4NDBmZGYxOWQifQ.Q2RTK-V3uyxQ-u_lnt-7QpIb65tYm6U5lcVEBkJFGjk'; //TODO: this is insecure on github
// TODO: REMOVE THESE ONCE WE GET CAROUSEL WORKING
const DEFAULT_LENS_ID = '40369030925';
const DEMO_LENS_GROUP_ID = 'a64ee4b4-272f-43c6-b0bc-636085bb7178';

const CameraKitInitializer: React.FC<CameraKitInitializerProps> = ({
  videoElement,
  canvasElement,
  onCameraKitReady,
  onCleanup,
}) => {
  const snapkitSessionRef = useRef<CameraKitSession | null>(null);
  const cameraKitInstanceRef = useRef<CameraKit | null>(null);

  useEffect(() => {
    const initializeKit = async () => {
      if (!canvasElement || !videoElement) {
        console.warn('Canvas or video element not ready for CameraKitInitializer.');
        return;
      }

      // Only attempt to initialize if both elements are present
      // and if we don't already have a session.
      // This useEffect runs on mount, so we can ensure cleanup of previous instances
      // happens here if a re-render or hot reload somehow misses it.

      try {
        if (snapkitSessionRef.current) {
          snapkitSessionRef.current.destroy();
          snapkitSessionRef.current = null;
          console.log('Previous Snap Camera Kit session destroyed from initializer.');
        }
        if (cameraKitInstanceRef.current) {
          cameraKitInstanceRef.current = null; // No explicit destroy for CameraKit instance itself
          console.log('Previous CameraKit instance cleared from initializer.');
        }

        const cameraKit = await bootstrapCameraKit({ apiToken: SNAP_CAMERA_KIT_API_TOKEN });
        cameraKitInstanceRef.current = cameraKit;

        const session = await cameraKit.createSession({liveRenderTarget: canvasElement});
        session.play('live'); // 'live' is the default, but being explicit is clear
        console.log('CameraKit session playback started for live target.');

        session.setSource(videoElement);

        try {
            console.log(`CameraKitInitializer: Attempting to load lenses from group ID: ${DEMO_LENS_GROUP_ID}`);
            const { lenses, errors } = await cameraKit.lensRepository.loadLensGroups([DEMO_LENS_GROUP_ID]);

            if (errors && errors.length > 0) {
                console.error('CameraKitInitializer: Errors encountered while loading lens groups:', errors);
                errors.forEach(err => console.error('  Lens Group Load Error:', err));
            }

            let defaultLens: Lens | null = null;
            if (lenses.length > 0) {
                const TARGET_LENS_ID = '49414230875';
                defaultLens = lenses.find(lens => lens.id === TARGET_LENS_ID) || null;
                console.log(`CameraKitInitializer: Found ${lenses.length} lenses. Applying first one: ${defaultLens.name || defaultLens.id}`);
            } else {
                console.warn(`CameraKitInitializer: No lenses found in group: ${DEMO_LENS_GROUP_ID}. Make sure lenses are assigned to this group in the portal.`);
            }

            if (defaultLens) {
                console.log(`CameraKitInitializer: Applying lens ${defaultLens.name || defaultLens.id}...`);
                await session.applyLens(defaultLens);
                console.log(`CameraKitInitializer: Successfully applied lens: ${defaultLens.name || defaultLens.id}`);
            } else {
                console.warn('CameraKitInitializer: No default lens to apply. Skipping lens application.');
            }
        } catch (lensError) {
            console.error('CameraKitInitializer: Unexpected error during lens loading or application:', lensError);
            if (lensError instanceof Error) {
                console.error('  Lens Error Message:', lensError.message);
                console.error('  Lens Error Stack:', lensError.stack);
            }
        }

        snapkitSessionRef.current = session;
        console.log('Snap Camera Kit initialized and session created in client component.');

        onCameraKitReady(session, cameraKit); // Notify parent that Camera Kit is ready

      } catch (error) {
        console.error('Failed to initialize Snap Camera Kit in client component:', error);
      }
    };

    initializeKit();

    // Cleanup function for useEffect
    return () => {
      if (snapkitSessionRef.current) {
        snapkitSessionRef.current.destroy();
        snapkitSessionRef.current = null;
        console.log('Snap Camera Kit session destroyed during CameraKitInitializer unmount.');
      }
      if (cameraKitInstanceRef.current) {
        cameraKitInstanceRef.current = null;
        console.log('CameraKit instance cleared during CameraKitInitializer unmount.');
      }
      onCleanup(); // Notify parent of cleanup
    };
  }, [videoElement, canvasElement, onCameraKitReady, onCleanup]); // Dependencies

  return null; // This component doesn't render any UI directly
};

export default CameraKitInitializer;
