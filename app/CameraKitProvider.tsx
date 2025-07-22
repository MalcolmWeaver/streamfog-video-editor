// components/CameraKitProvider.tsx
'use client';

import React, {
    createContext,
    useContext,
    useRef,
    useState,
    useEffect,
    ReactNode,
    useCallback,
} from 'react';
import { CameraKit, bootstrapCameraKit, CameraKitSession, Lens } from '@snap/camera-kit';
import {LensOption} from './types';

// TODO: This is insecure on github - ENSURE YOU MOVE THIS TO ENVIRONMENT VARIABLES IN PRODUCTION
const SNAP_CAMERA_KIT_API_TOKEN = 'eyJhbGciOiJIUzI1NiIsImtpZCI6IkNhbnZhc1MyU0hNQUNQcm9kIiwidHlwIjoiSldUIn0.eyJhdWQiOiJjYW52YXMtY2FudmFzYXBpIiwiaXNzIjoiY2FudmFzLXMyc3Rva2VuIiwibmJmIjoxNzUzMTU3NTQ1LCJzdWIiOiJkMjM3MmY5Mi1lZjlkLTRkNWMtYjU0My1lNDFhOGMwOWFlMjR-U1RBR0lOR341NTc4NjkwYy1lNWU1LTQ0NzAtYTAwMS0xOWRhNTZmZGU0ZTYifQ.OpgnY1XIIiVXItYEDDjYHs9oBLTmHY__ytVEibcA7jY'; // Ensure this is loaded securely
export const DEMO_LENS_GROUP_ID = '868e355a-1370-4232-a645-603b66cc4869'; // Your actual Lens Group ID


interface CameraKitContextType {
    videoRef: React.RefObject<HTMLVideoElement | null>,
    canvasRef: React.RefObject<HTMLCanvasElement | null>,
    cameraKit: CameraKit | null;
    cameraKitSession: CameraKitSession | null;
    availableLensOptions: Array<LensOption>;
    destroyCameraKitSession: () => void;
    isCameraKitSessionReady: boolean;
    cameraKitError: Error | null;
    cameraKitSessionError: Error | null;
    setCameraKitSessionError: React.Dispatch<React.SetStateAction<Error | null>> 
}

const CameraKitContext = createContext<CameraKitContextType | undefined>(undefined);

interface CameraKitProviderProps {
    children: ReactNode;
}

export const CameraKitProvider: React.FC<CameraKitProviderProps> = ({ children }) => {
    const [cameraKit, setCameraKit] = useState<CameraKit | null>(null);
    const [cameraKitSession, setCameraKitSession] = useState<CameraKitSession | null>(null);
    const [availableLensOptions, setAvailableLensOptions] = useState<LensOption[]>([]);
    const [isCameraKitBootstrapped, setIsCameraKitBootstrapped] = useState<boolean>(false);
    const [cameraKitError, setCameraKitError] = useState<Error | null>(null);
    const [isCameraKitSessionReady, setIsCameraKitSessionReady] = useState<boolean>(false);
    const [cameraKitSessionError, setCameraKitSessionError] = useState<Error | null>(null);

    const currentActiveLensRef = useRef<Lens | null>(null); // To track which lens is currently applied by time

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    // Initialize Camera Kit instance once
    useEffect(() => {
        const initGlobalCameraKit = async () => {
            try {
                console.log('CameraKitProvider: Attempting to bootstrap Camera Kit...');
                const ck = await bootstrapCameraKit({ apiToken: SNAP_CAMERA_KIT_API_TOKEN });
                setCameraKit(ck);
                setIsCameraKitBootstrapped(true);
                console.log('CameraKitProvider: CameraKit instance bootstrapped successfully.');

                console.log(`CameraKitProvider: Fetching lenses for group: ${DEMO_LENS_GROUP_ID}`);
                const { lenses, errors } = await ck.lensRepository.loadLensGroups([DEMO_LENS_GROUP_ID]);

                if (errors && errors.length > 0) {
                    console.error('CameraKitProvider: Errors encountered during lens fetch:', errors);
                } else {
                    const fetchedLensOptions: LensOption[] = lenses.map((lens) => ({
                        id: lens.id,
                        name: lens.name || `Lens ${lens.id.substring(0, 5)}`,
                        thumbnailUrl: lens.iconUrl,
                        color: `#${Math.floor(Math.random() * 16777215)
                            .toString(16)
                            .padStart(6, '0')}`,
                    }));
                    setAvailableLensOptions(fetchedLensOptions);
                    console.log(`CameraKitProvider: Successfully fetched ${lenses.length} lenses.`);
                }
            } catch (e) {
                console.error('CameraKitProvider: FATAL ERROR during Camera Kit bootstrap or lens fetch:', e);
                setCameraKitError(e instanceof Error ? e : new Error('Unknown Camera Kit initialization error'));
            }
        };

        if (!cameraKit && !isCameraKitBootstrapped && !cameraKitError) { // Prevent re-running if already bootstrapped or failed
            initGlobalCameraKit();
        }

    }, [cameraKit, isCameraKitBootstrapped, cameraKitError])

    const initCounter = useRef(0);

    useEffect(() => {
        // only run when refs are ready and kit is ready
        console.log('CAMERA KIT PROVIDER USE EFFECT', cameraKit, cameraKitSession);
        if (!cameraKit || !videoRef.current || !canvasRef.current) return;
        let cancelled = false;
        const thisInit = ++initCounter.current;

        const doInit = async () => {
            // destroy old session
            if (cameraKitSession) {
                try { await cameraKitSession.destroy(); }
                catch (e) { console.warn("destroy failed", e); }
                if (cancelled || thisInit !== initCounter.current) return;
                setCameraKitSession(null);
                setIsCameraKitSessionReady(false);
                setCameraKitSessionError(null);
            }

            // create new session
            try {
                if(canvasRef.current == null || videoRef == null){
                    console.error('CANNOT FIND CANVAS/VIDEO');
                    return;
                }
                const session = await cameraKit.createSession({ liveRenderTarget: canvasRef.current });
                if (cancelled || thisInit !== initCounter.current) {
                    // if this init is no longer current, clean up right away
                    await session.destroy().catch(() => {});
                    return;
                }
                if(videoRef.current == null){
                    console.warn('videoRef is null when trying to setup session')
                    return
                }
                session.setSource(videoRef.current);
                session.play("live");
                console.log('SESSION (BTW THIS SHOULD SET is isCameraKitSessionReady to true): ', session);
                setCameraKitSession(session);
                setIsCameraKitSessionReady(true);
                setCameraKitSessionError(null);
            } catch (e) {
                if (cancelled) return;
                console.error("init session error", e);
                setCameraKitSessionError(e instanceof Error ? e : new Error("Failed to create session"));
                setIsCameraKitSessionReady(false);
                setCameraKitSession(null);
            }
        };

        doInit();

        // cleanup on unmount or deps change:
        return () => {
            cancelled = true;
            // optionally: destroy current session
            cameraKitSession?.destroy().catch(() => {});
        };
    }, [cameraKit, videoRef.current, canvasRef.current]);


    // Function to destroy the CameraKitSession
    const destroyCameraKitSession = useCallback(async () => {
        if (cameraKitSession) {
            console.log('CameraKitProvider: Destroying Camera Kit session...');
            try {
                await cameraKitSession.destroy();
            } catch (e) {
                console.error('CameraKitProvider: Error destroying session:', e);
            } finally {
                setCameraKitSession(null);
                currentActiveLensRef.current = null;
                setIsCameraKitBootstrapped(false);
                setCameraKitError(null);
            }
        }
    }, [cameraKitSession]);


    const value = {
        videoRef,
        canvasRef,
        cameraKit,
        cameraKitSession,
        cameraKitError,
        isCameraKitSessionReady,
        cameraKitSessionError,
        availableLensOptions,
        destroyCameraKitSession,
        setCameraKitSessionError
    };

    return (
        <CameraKitContext.Provider 
            value={value}>{children}
        </CameraKitContext.Provider>
    );
};

// Custom hook to consume the Camera Kit context
export const useCameraKit = () => {
    const context = useContext(CameraKitContext);
    if (context === undefined) {
        throw new Error('useCameraKit must be used within a CameraKitProvider');
    }
    return context;
};
