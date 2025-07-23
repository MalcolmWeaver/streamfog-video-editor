import type { CameraKitSession, Lens } from '@snap/camera-kit';

export interface Filter extends Lens {}

export interface FilterTimelineEntry {
  id: number; // Unique ID for the entry in the timeline
  filterId: string;
  startTime: number;
  endTime: number;
}

// Define the shape of the context value
export interface VideoEditorContextType {
  videoFile: File | null;
  setVideoFile: React.Dispatch<React.SetStateAction<File | null>>;
  videoURL: string;
  canvasRef: React.Ref<HTMLCanvasElement | null>;
  videoRef: React.Ref<HTMLVideoElement | null>;
  setVideoURL: React.Dispatch<React.SetStateAction<string>>;
  videoDuration: number;
  setVideoDuration: React.Dispatch<React.SetStateAction<number>>;
  cameraKitSession: CameraKitSession | null; // Use the simulated session type
  setCameraKitSession: React.Dispatch<React.SetStateAction<CameraKitSession | null>>;
  availableFilters: Filter[];
  setAvailableFilters: React.Dispatch<React.SetStateAction<Filter[]>>;
  filterTimeline: FilterTimelineEntry[];
  setFilterTimeline: React.Dispatch<React.SetStateAction<FilterTimelineEntry[]>>;
  currentTime: number;
  setCurrentTime: React.Dispatch<React.SetStateAction<number>>;
  isPlaying: boolean;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
}
