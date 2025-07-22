import { useRef, useState, useEffect, useCallback } from 'react';
import { CameraKitSession, Lens } from '@snap/camera-kit';
import { DEMO_LENS_GROUP_ID, useCameraKit } from './CameraKitProvider'; // Corrected path assuming it's sibling or parent
import { AppliedFilter, LensOption } from './types';

interface UseVideoPlayerResult {
    currentTime: number;
    duration: number;
    isPlaying: boolean;
    videoSrc: string | null;
    appliedFilters: AppliedFilter[];
    handleVideoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleScrub: (newTime: number) => void;
    handlePlayPause: () => void;
    handleVideoMetadataLoaded: (videoElement: HTMLVideoElement) => void;
    handleAddNewFilter: (filterData: AppliedFilter) => void;
    handleUpdateFilter: (updatedFilter: AppliedFilter) => void;
    handleDeleteFilter: (id: string) => void;
    setAppliedFilters: React.Dispatch<React.SetStateAction<AppliedFilter[]>>;
    availableLensOptions: LensOption[];
}

export const useVideoPlayer = (): UseVideoPlayerResult => {

    const {
        videoRef,
        canvasRef,
        availableLensOptions,
        cameraKit,
        cameraKitSession, 
        setCameraKitSessionError,
        isCameraKitSessionReady
    } = useCameraKit();

    const [currentTime, setCurrentTime] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [videoSrc, setVideoSrc] = useState<string | null>(null);
    const [appliedFilters, setAppliedFilters] = useState<AppliedFilter[]>([]);

    const currentActiveLensRef = useRef<Lens | null>(null);

    // This ref helps prevent race conditions when effects run out of order or multiple times
    const currentSessionRef = useRef<CameraKitSession | null>(null);

    const applyLensById = useCallback(
        async (lensId: string) => {
            console.log('CALLING APPLY LENS');
            if (!cameraKitSession || !cameraKit) {
                console.warn('applyLensById: Camera Kit session or instance not ready.');
                return;
            }
            if (currentActiveLensRef.current?.id === lensId) {
                console.log(`applyLensById: Lens ${lensId} is already active.`);
                return;
            }

            try {
                console.log(`applyLensById: Loading and applying lens: ${lensId}, from ${DEMO_LENS_GROUP_ID}`);
                const lens = await cameraKit.lensRepository.loadLens(lensId, DEMO_LENS_GROUP_ID);
                await cameraKitSession.applyLens(lens);
                currentActiveLensRef.current = lens;
            } catch (e) {
                console.error(`applyLensById: Failed to apply lens ${lensId}:`, e);
                setCameraKitSessionError(e instanceof Error ? e : new Error(`Failed to apply lens ${lensId}.`));
                try {
                    await cameraKitSession.removeLens();
                    currentActiveLensRef.current = null;
                } catch (removeErr) {
                    console.error('applyLensById: Error removing lens after failed application:', removeErr);
                }
            }
        },
        [cameraKit, cameraKitSession]
    );

    const removeCurrentLens = useCallback(async () => {
        if (cameraKitSession && currentActiveLensRef.current) {
            console.log('removeCurrentLens: Removing current lens.');
            try {
                await cameraKitSession.removeLens();
                currentActiveLensRef.current = null;
            } catch (e) {
                console.error('removeCurrentLens: Error removing lens:', e);
                setCameraKitSessionError(e instanceof Error ? e : new Error('Failed to remove current lens.'));
            }
        }
    }, [cameraKitSession]);

    const applyDynamicLens = useCallback(
        async (time: number) => {
            console.log('CALLING APPLY DYNAMIC LENS');

            if (!isCameraKitSessionReady) {
                console.log('IS CAMERA KIT SESSION IS NOT READY');
                return;
            }

            const activeFilter = appliedFilters.find((filter) => time >= filter.start && time < filter.end);

            if (activeFilter) {
                await applyLensById(activeFilter.filterId);
            } else {
                await removeCurrentLens();
            }
        },
        [appliedFilters, isCameraKitSessionReady, applyLensById, removeCurrentLens]
    );

    // --- Video Playback Event Handlers ---
    const handleVideoMetadataLoaded = useCallback((videoElement: HTMLVideoElement) => {
        setDuration(videoElement.duration);
        setCurrentTime(0);
    }, []);

    const handleVideoTimeUpdate = useCallback(() => {
        if (videoRef.current) {
            const newCurrentTime = videoRef.current.currentTime;
            setCurrentTime(newCurrentTime);
            applyDynamicLens(newCurrentTime);
        }
    }, [applyDynamicLens, videoRef]);

    useEffect(() => {
        const videoEl = videoRef.current;
        if (videoEl) {
            videoEl.addEventListener('timeupdate', handleVideoTimeUpdate);
            videoEl.addEventListener('play', () => setIsPlaying(true));
            videoEl.addEventListener('pause', () => setIsPlaying(false));
            videoEl.addEventListener('ended', () => setIsPlaying(false));

            return () => {
                videoEl.removeEventListener('timeupdate', handleVideoTimeUpdate);
                videoEl.removeEventListener('play', () => setIsPlaying(true));
                videoEl.removeEventListener('pause', () => setIsPlaying(false));
                videoEl.removeEventListener('ended', () => setIsPlaying(false));
            };
        }
    }, [videoRef, handleVideoTimeUpdate]);

    // --- User Interaction Handlers ---
    const handleVideoUpload = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            if (file) {
                if (videoSrc) {
                    URL.revokeObjectURL(videoSrc);
                }
                const url = URL.createObjectURL(file);
                setVideoSrc(url);
                setCurrentTime(0);
                setDuration(0);
                setIsPlaying(false);
                setAppliedFilters([]);
            }
        },
        [videoSrc]
    );

    const handleScrub = useCallback(
        (newTime: number) => {
            if (videoRef.current) {
                videoRef.current.currentTime = newTime;
                setCurrentTime(newTime);
                applyDynamicLens(newTime);
            }
        },
        [applyDynamicLens, videoRef]
    );

    const handlePlayPause = useCallback(() => {
        console.log('PLAY PAUSE CLICKED. REFS: ', videoRef.current, canvasRef.current);
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
        }
    }, [isPlaying, videoRef]);

    const handleAddNewFilter = useCallback((filterData: AppliedFilter) => {
        setAppliedFilters((prevFilters) => [...prevFilters, filterData]);
    }, []);

    const handleUpdateFilter = useCallback((updatedFilter: AppliedFilter) => {
        setAppliedFilters((prevFilters) =>
            prevFilters.map((filter) => (filter.id === updatedFilter.id ? updatedFilter : filter))
        );
    }, []);

    const handleDeleteFilter = useCallback((id: string) => {
        setAppliedFilters((prevFilters) => prevFilters.filter((filter) => filter.id !== id));
    }, []);

    // Cleanup for video object URL
    useEffect(() => {
        return () => {
            if (videoSrc) {
                URL.revokeObjectURL(videoSrc);
                console.log('Previous video URL revoked on useVideoPlayer unmount.');
            }
        };
    }, [videoSrc]);

    return {
        currentTime,
        duration,
        isPlaying,
        videoSrc,
        appliedFilters,
        handleVideoUpload,
        handleScrub,
        handlePlayPause,
        handleVideoMetadataLoaded,
        handleAddNewFilter,
        handleUpdateFilter,
        handleDeleteFilter,
        setAppliedFilters,
        availableLensOptions,
    };
};
