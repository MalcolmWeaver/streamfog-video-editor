import { useRef, useState, useEffect, useCallback } from 'react';
import { CameraKitSession, Lens } from '@snap/camera-kit';
import { useCameraKit } from './CameraKitProvider';
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
        isCameraKitSessionReady,
        lensGroup 
    } = useCameraKit();

    const [currentTime, setCurrentTime] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [videoSrc, setVideoSrc] = useState<string | null>(null);
    const [appliedFilters, setAppliedFilters] = useState<AppliedFilter[]>([]);

    const currentActiveLensRef = useRef<Lens | null>(null);

    const applyLensById = useCallback(
        async (lensId: string) => {
            console.log('applyLensById: Attempting to apply lens.');
            if (!cameraKitSession || !cameraKit || !isCameraKitSessionReady) {
                console.warn('applyLensById: Camera Kit session, instance, or readiness not ready. Skipping lens application.');
                return;
            }
            if (currentActiveLensRef.current?.id === lensId) {
                console.log(`applyLensById: Lens ${lensId} is already active, no need to re-apply.`);
                return;
            }

            try {
                console.log(`applyLensById: Loading lens: ${lensId} from group: ${lensGroup}`);
                const lens = await cameraKit.lensRepository.loadLens(lensId, lensGroup);

                if (!lens) {
                    console.error(`applyLensById: loadLens returned null or undefined for lensId: ${lensId}.`);
                    setCameraKitSessionError(new Error(`Could not load lens ${lensId}.`));
                    // Attempt to remove any active lens if the new one failed to load
                    await cameraKitSession.removeLens();
                    currentActiveLensRef.current = null;
                    return;
                }
                console.log('applyLensById: Lens loaded successfully. Lens object:', lens);

                console.log(`applyLensById: Applying lens: ${lens.id} to session.`);
                await cameraKitSession.applyLens(lens);
                currentActiveLensRef.current = lens;
                console.log(`applyLensById: Successfully applied lens: ${lens.id}`);
            } catch (e) {
                console.error(`applyLensById: CRITICAL ERROR during lens application for ${lensId}:`, e);
                setCameraKitSessionError(e instanceof Error ? e : new Error(`Failed to apply lens ${lensId}: ${String(e)}`));
                try {
                    // Always try to reset the lens state on error
                    console.log('applyLensById: Attempting to remove lens after application failure.');
                    await cameraKitSession.removeLens();
                    currentActiveLensRef.current = null;
                } catch (removeErr) {
                    console.error('applyLensById: Error removing lens after failed application:', removeErr);
                }
            }
        },
        [cameraKit, cameraKitSession, isCameraKitSessionReady, lensGroup, setCameraKitSessionError]
    );

    const removeCurrentLens = useCallback(async () => {
        if (cameraKitSession && currentActiveLensRef.current && isCameraKitSessionReady) {
            console.log('removeCurrentLens: Attempting to remove current lens.');
            try {
                await cameraKitSession.removeLens(); // Explicitly apply null to remove
                currentActiveLensRef.current = null;
                console.log('removeCurrentLens: Lens removed successfully.');
            } catch (e) {
                console.error('removeCurrentLens: Error removing lens:', e);
                setCameraKitSessionError(e instanceof Error ? e : new Error('Failed to remove current lens.'));
            }
        } else {
            console.log('removeCurrentLens: No active lens or session not ready to remove.');
        }
    }, [cameraKitSession, isCameraKitSessionReady, setCameraKitSessionError]);

    const applyDynamicLens = useCallback(
        async (time: number) => {
            if (!isCameraKitSessionReady) {
                return;
            }

            const activeFilter = appliedFilters.find((filter) => time >= filter.start && time < filter.end);

            // Check if the current lens is the one that *should* be active
            if (activeFilter && currentActiveLensRef.current?.id !== activeFilter.filterId) {
                console.log(`applyDynamicLens: Active filter changed. Applying ${activeFilter.filterId}.`);
                await applyLensById(activeFilter.filterId);
            } else if (!activeFilter && currentActiveLensRef.current) {
                console.log('applyDynamicLens: No active filter at current time. Removing current lens.');
                await removeCurrentLens();
            } else {
            }
        },
        [appliedFilters, isCameraKitSessionReady, applyLensById, removeCurrentLens]
    );

    // --- Video Playback Event Handlers ---
    const handleVideoMetadataLoaded = useCallback((videoElement: HTMLVideoElement) => {
        setDuration(videoElement.duration);
        setCurrentTime(0);
        console.log('Video metadata loaded. Duration:', videoElement.duration);
    }, []);

    const handleVideoTimeUpdate = useCallback(() => {
        if (videoRef.current) {
            const newCurrentTime = videoRef.current.currentTime;
            // Only update state if time has significantly changed to avoid excessive re-renders
            if (Math.abs(newCurrentTime - currentTime) > 0.1 || (newCurrentTime === 0 && currentTime !== 0)) {
                 setCurrentTime(newCurrentTime);
            }
            applyDynamicLens(newCurrentTime);
        }
    }, [applyDynamicLens, videoRef, currentTime]); 

    useEffect(() => {
        const videoEl = videoRef.current;
        if (videoEl) {
            videoEl.addEventListener('timeupdate', handleVideoTimeUpdate);
            videoEl.addEventListener('play', () => { setIsPlaying(true); console.log('Video playing.'); });
            videoEl.addEventListener('pause', () => { setIsPlaying(false); console.log('Video paused.'); });
            videoEl.addEventListener('ended', () => { setIsPlaying(false); console.log('Video ended.'); });

            return () => {
                videoEl.removeEventListener('timeupdate', handleVideoTimeUpdate);
                videoEl.removeEventListener('play', () => { setIsPlaying(true); console.log('Video playing.'); });
                videoEl.removeEventListener('pause', () => { setIsPlaying(false); console.log('Video paused.'); });
                videoEl.removeEventListener('ended', () => { setIsPlaying(false); console.log('Video ended.'); });
            };
        }
    }, [videoRef, handleVideoTimeUpdate]); // Ensure handleVideoTimeUpdate is stable

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
                console.log('Video uploaded:', file.name);
            }
        },
        [videoSrc]
    );

    const handleScrub = useCallback(
        (newTime: number) => {
            if (videoRef.current) {
                videoRef.current.currentTime = newTime;
                setCurrentTime(newTime);
                applyDynamicLens(newTime); // Immediately apply lens for new scrub time
                console.log('Video scrubbed to:', newTime);
            }
        },
        [applyDynamicLens, videoRef]
    );

    const handlePlayPause = useCallback(() => {
        console.log('PLAY PAUSE CLICKED. Current state:', isPlaying);
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
        }
    }, [isPlaying, videoRef]);

    const handleAddNewFilter = useCallback((filterData: AppliedFilter) => {
        setAppliedFilters((prevFilters) => {
            const newFilters = [...prevFilters, filterData];
            console.log('Added new filter:', filterData, 'All filters:', newFilters);
            return newFilters;
        });
    }, []);

    const handleUpdateFilter = useCallback((updatedFilter: AppliedFilter) => {
        setAppliedFilters((prevFilters) => {
            const updated = prevFilters.map((filter) => (filter.id === updatedFilter.id ? updatedFilter : filter));
            console.log('Updated filter:', updatedFilter, 'All filters:', updated);
            return updated;
        });
    }, []);

    const handleDeleteFilter = useCallback((id: string) => {
        setAppliedFilters((prevFilters) => {
            const remaining = prevFilters.filter((filter) => filter.id !== id);
            console.log('Deleted filter with ID:', id, 'Remaining filters:', remaining);
            return remaining;
        });
    }, []);

    // Cleanup for video object URL on component unmount or videoSrc change
    useEffect(() => {
        return () => {
            if (videoSrc) {
                URL.revokeObjectURL(videoSrc);
                console.log('Previous video URL revoked on useVideoPlayer unmount or videoSrc change.');
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

