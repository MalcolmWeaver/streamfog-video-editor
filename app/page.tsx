'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
// Import CameraKit directly here
import { CameraKit, bootstrapCameraKit, CameraKitSession, Lens } from '@snap/camera-kit';

import VideoPreviewPlayer from './components/VideoPreviewPlayer';
import TimelineControls, { AppliedFilter, LensOption } from './components/TimelineControls';
import VideoUpload from './components/VideoUpload';

// TODO: This is insecure on github - ENSURE YOU MOVE THIS TO ENVIRONMENT VARIABLES IN PRODUCTION
const SNAP_CAMERA_KIT_API_TOKEN = 'eyJhbGciOiJIUzI1NiIsImtpZCI6IkNhbnZhc1MyU0hNQUNQcm9kIiwidHlwIjoiSldUIn0.eyJhdWQiOiJjYW52YXMtY2FudmFzYXBpIiwiaXNzIjoiY2FudmFzLXMyc3Rva2VuIiwibmJmIjoxNzUzMDU0Nzk4LCJzdWIiOiJkMjM3MmY5Mi1lZjlkLTRkNWMtYjU0My1lNDFhOGMwOWFlMjR-U1RBR0lOR343OGExNjRmYy0yOTc3LTQ4NzgtYWM1Ny1mNjg5ZjhjNDY0OGQifQ.xPJ36DJ5D4ICdLOLm2J1z-FXSMidmsZ3YrQt8QHlZcQ';
const DEMO_LENS_GROUP_ID = 'a64ee4b4-272f-43c6-b0bc-636085bb7178'; // Your actual Lens Group ID

const App: React.FC = () => {

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [appliedFilters, setAppliedFilters] = useState<AppliedFilter[]>([]);
    const [videoSrc, setVideoSrc] = useState<string | null>(null);
    const [availableLensOptions, setAvailableLensOptions] = useState<LensOption[]>([]);

    const snapkitSessionRef = useRef<CameraKitSession | null>(null);
    const cameraKitInstanceRef = useRef<CameraKit | null>(null);
    const currentActiveLensRef = useRef<Lens | null>(null); // To track which lens is currently applied by time

    // --- Camera Kit Initialization & Cleanup Effect ---
    useEffect(() => {
        const videoEl = videoRef.current;
        const canvasEl = canvasRef.current;

        const initCameraKit = async () => {
            console.log('App: useEffect (init) - Attempting to initialize Camera Kit...');
            if (!videoEl || !canvasEl) {
                console.warn('App: useEffect (init) - Video or canvas element not available. Skipping Camera Kit init.');
                return;
            }
            // Prevent re-initialization if already active for the current video/canvas.
            // The key={videoSrc} on VideoPreviewPlayer ensures fresh elements for new videos.
            if (snapkitSessionRef.current && cameraKitInstanceRef.current) {
                console.log('App: useEffect (init) - Camera Kit already initialized. Skipping.');
                return;
            }

            console.log('App: useEffect (init) - Proceeding with Camera Kit bootstrap.');
            try {
                const cameraKit = await bootstrapCameraKit({ apiToken: SNAP_CAMERA_KIT_API_TOKEN });
                cameraKitInstanceRef.current = cameraKit;
                console.log('App: CameraKit instance bootstrapped successfully.');

                const session = await cameraKit.createSession({ liveRenderTarget: canvasEl });
                session.setSource(videoEl);
                session.play('live'); // Start processing the video stream
                snapkitSessionRef.current = session;
                console.log('App: Camera Kit session created and set with video source.');

                try {
                    console.log(`App: Fetching lenses for group: ${DEMO_LENS_GROUP_ID}`);
                    const { lenses, errors } = await cameraKit.lensRepository.loadLensGroups([DEMO_LENS_GROUP_ID]);

                    if (errors && errors.length > 0) {
                        console.error('App: Errors encountered during lens fetch:', errors);
                    } else {
                        console.log(`App: Successfully fetched ${lenses.length} lenses for group: ${DEMO_LENS_GROUP_ID}`);
                        // Map fetched lenses to LensOption format for the carousel
                        const fetchedLensOptions: LensOption[] = lenses.map(lens => ({
                            id: lens.id,
                            name: lens.name || `Lens ${lens.id.substring(0, 5)}`, // Use name if available, else part of ID
                            // You might need to add logic here to assign colors or fetch thumbnails if available in Lens metadata
                            color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}` // Assign random color for now
                        }));
                        setAvailableLensOptions(fetchedLensOptions); // Update state with fetched lenses
                    }
                } catch (lensLoadError) {
                    console.error('App: Unexpected error during lens fetching:', lensLoadError);
                }

            } catch (error) {
                console.error('App: FATAL ERROR during Camera Kit initialization in useEffect:', error);
                if (error instanceof Error) {
                    console.error('  Error Message:', error.message);
                    console.error('  Error Stack:', error.stack);
                }
                // Ensure refs are cleared on failure
                if (snapkitSessionRef.current) {
                    try { snapkitSessionRef.current.destroy(); } catch (e) { /* ignore */ }
                    snapkitSessionRef.current = null;
                }
                cameraKitInstanceRef.current = null;
                setAvailableLensOptions([]); // Clear lens options on init failure
            }
        };

        // Trigger initialization when videoSrc exists and refs are available
        if (videoSrc && videoEl && canvasEl) {
            initCameraKit();
        } else {
            // If videoSrc is null (or elements not ready), ensure Camera Kit is cleaned up
            if (snapkitSessionRef.current) {
                console.log('App: VideoSrc changed to null or elements not ready. Destroying existing Camera Kit session.');
                try { snapkitSessionRef.current.destroy(); } catch (e) { /* ignore */ }
                snapkitSessionRef.current = null;
            }
            cameraKitInstanceRef.current = null;
            currentActiveLensRef.current = null;
            setAvailableLensOptions([]); // Clear lens options when video is removed
        }

        // Cleanup function for useEffect (runs on unmount or before dependencies change)
        return () => {
            console.log('App: Running useEffect (init) cleanup for Camera Kit.');
            if (snapkitSessionRef.current) {
                console.log('App: Destroying Camera Kit session during cleanup.');
                try {
                    snapkitSessionRef.current.destroy();
                } catch (e) {
                    console.error('App: Error destroying session during cleanup:', e);
                } finally {
                    snapkitSessionRef.current = null;
                }
            } else {
                console.log('App: No Camera Kit session to destroy during cleanup.');
            }
            cameraKitInstanceRef.current = null;
            currentActiveLensRef.current = null;
            setAvailableLensOptions([]); // Clear lens options on component unmount
        };
    }, [videoSrc]);


    /**
     * Applies the correct Snap Camera Kit lens based on the current video time.
     */
    const applyDynamicLens = useCallback(async (time: number) => {
        const session = snapkitSessionRef.current;
        const cameraKit = cameraKitInstanceRef.current;

        if (!session || !cameraKit) {
            console.warn('applyDynamicLens: Camera Kit not ready for dynamic lens application.');
            return;
        }

        let newLensToApply: Lens | null = null;


        // Filter to find the active lens for the current time
        const activeFilter = appliedFilters.find(
            (filter) => time >= filter.start && time < filter.end
        );

        if (activeFilter) {
            if (currentActiveLensRef.current?.id === activeFilter.id) {
                console.log('applyDynamicLens: Same lens already active. Skipping re-application.');
                return; // Same lens is already active, no need to re-apply
            }

            try {
                // Load the specific lens using its filterId from the applied filter
                newLensToApply = await cameraKit.lensRepository.loadLens(activeFilter.filterId, DEMO_LENS_GROUP_ID);
            } catch (error) {
                console.error(`applyDynamicLens: Failed to load lens ${activeFilter.filterId}:`, error);
                newLensToApply = null; // Don't try to apply if loading failed
            }
        }

        if (newLensToApply) {
            try {
                await session.applyLens(newLensToApply);
                currentActiveLensRef.current = newLensToApply;
            } catch (applyError) {
                console.error(`applyDynamicLens: Error applying lens ${newLensToApply.id}:`, applyError);
                await session.removeLens(); // Attempt to remove lens if applying fails
                currentActiveLensRef.current = null;
            }
        } else if (currentActiveLensRef.current) { // Only remove if a lens was active and no new filter is active
            try {
                await session.removeLens(); // Remove any active lens
                currentActiveLensRef.current = null;
            } catch (removeError) {
                console.error('applyDynamicLens: Error removing lens:', removeError);
            }
        } 
    }, [JSON.stringify(appliedFilters)]); // Dependencies: None, as refs are stable and CAMERA_KIT_CONFIG is constant

    useEffect(() => {
        if (videoSrc && snapkitSessionRef.current) {
            applyDynamicLens(currentTime);
        }
    }, [JSON.stringify(appliedFilters), currentTime, videoSrc, applyDynamicLens]);

    // --- Video Event Handlers ---
    const handleVideoMetadataLoaded = useCallback((videoElement: HTMLVideoElement) => {
        setDuration(videoElement.duration);
        setCurrentTime(0); // Reset current time when new video loads

        // No need to call initializeSnapCameraKit directly here anymore.
        // The useEffect above handles the initialization based on videoSrc and refs.
    }, []);

    const handleVideoTimeUpdate = useCallback(() => {
        if (videoRef.current) {
            const newCurrentTime = videoRef.current.currentTime;
            setCurrentTime(newCurrentTime);
            applyDynamicLens(newCurrentTime); // Apply lens based on current time
        }
    }, [applyDynamicLens]); // No dependencies for this simple time update handler

    // --- Core Playback Controls ---
    useEffect(() => {
        const videoEl = videoRef.current;
        if (videoEl) {
            // Attach listeners
            videoEl.addEventListener('timeupdate', handleVideoTimeUpdate);
            videoEl.addEventListener('play', () => setIsPlaying(true));
            videoEl.addEventListener('pause', () => setIsPlaying(false));
            videoEl.addEventListener('ended', () => setIsPlaying(false));

            // Cleanup listeners
            return () => {
                videoEl.removeEventListener('timeupdate', handleVideoTimeUpdate);
                videoEl.removeEventListener('play', () => setIsPlaying(true));
                videoEl.removeEventListener('pause', () => setIsPlaying(false));
                videoEl.removeEventListener('ended', () => setIsPlaying(false));
            };
        }
    }, [videoSrc, handleVideoTimeUpdate]); // Re-attach when videoSrc changes

    const handleVideoUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
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
            setAppliedFilters([]); // Reset user-defined filters
        }
    }, [videoSrc]);

    const handleScrub = useCallback((newTime: number) => {
        if (videoRef.current) {
            videoRef.current.currentTime = newTime;
            setCurrentTime(newTime);
            applyDynamicLens(newTime); // Re-evaluate lens on scrub
        }
    }, [applyDynamicLens]);

    const handlePlayPause = useCallback(() => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
        }
    }, [isPlaying]);

    const handleAddNewFilter = useCallback((filterData: AppliedFilter) => {
        console.log('ADDING A NEW FILTER');
        setAppliedFilters((prevFilters) => [...prevFilters, filterData]);
    }, []);

    const handleUpdateFilter = useCallback((updatedFilter: AppliedFilter) => {
        setAppliedFilters((prevFilters) =>
                          prevFilters.map((filter) =>
                                          filter.id === updatedFilter.id ? updatedFilter : filter
                                         )
                         );
    }, []);

    const handleDeleteFilter = useCallback((id: string) => {
        setAppliedFilters((prevFilters) => prevFilters.filter((filter) => filter.id !== id));
    }, []);

    // Effect to clean up the object URL when component unmounts
    useEffect(() => {
        return () => {
            if (videoSrc) {
                URL.revokeObjectURL(videoSrc);
                console.log('Previous video URL revoked on App unmount.');
            }
            // Ensure Camera Kit is destroyed on full App unmount as well
            if (snapkitSessionRef.current) {
                snapkitSessionRef.current.destroy();
                snapkitSessionRef.current = null;
                console.log('Snap Camera Kit session destroyed on App unmount.');
            }
            cameraKitInstanceRef.current = null;
            currentActiveLensRef.current = null;
        };
    }, [videoSrc]);

    return (
        <div className="min-h-screen bg-gray-900 text-white font-inter p-4 flex flex-col items-center">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />

        <header className="w-full max-w-6xl py-6 text-center">
        <h1 className="text-4xl font-bold text-purple-400">AR Video Editor</h1>
        <p className="text-lg text-gray-400 mt-2">Apply Snap Camera Kit Lenses to your videos</p>
        </header>

        <main className="w-full max-w-6xl flex flex-col gap-8 mt-8">
        <VideoUpload onVideoUpload={handleVideoUpload} videoSrc={videoSrc} />

        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 flex flex-col items-center justify-center relative w-full">
        <h2 className="text-2xl font-semibold mb-4 text-purple-300">Preview</h2>
        <VideoPreviewPlayer
        videoSrc={videoSrc}
        videoRef={videoRef}
        canvasRef={canvasRef}
        onVideoMetadataLoaded={handleVideoMetadataLoaded}
        />

        {/* CameraKitInitializer component is removed from here */}

        {videoSrc && duration > 0 ? (
            <TimelineControls
            duration={duration}
            currentTime={currentTime}
            onScrub={handleScrub}
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            onAddNewFilter={handleAddNewFilter}
            onUpdateFilter={handleUpdateFilter}
            onDeleteFilter={handleDeleteFilter}
            appliedFilters={appliedFilters} // These are your UI-specific filters, not necessarily the Camera Kit ones
            availableLensOptions={availableLensOptions}
            />
        ) : (
        <div className="w-full mt-6 p-4 bg-gray-700 rounded-lg text-center text-gray-400">
        <p className="text-lg font-medium">Upload a video to enable timeline controls.</p>
        </div>
        )}
        </div>
        </main>

        <footer className="w-full max-w-6xl py-6 text-center text-gray-500 text-sm mt-8">
        &copy; {new Date().getFullYear()} AR Video Editor. All rights reserved.
            </footer>
        </div>
    );
};

export default App;
