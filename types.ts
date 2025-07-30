import type { CameraKitSession, Lens } from '@snap/camera-kit';


export type ValidationError = 
  | "START_NEGATIVE"
  | "END_EXCEEDS_DURATION"
  | "START_NOT_LESS_THAN_END"
  | "OVERLAPPING";


export interface Filter extends Lens {
    color: string;
}

export interface FilterTimelineEntry {
  label?: string;
  id: number; // Unique ID for the entry in the timeline
  filterId: string;
  startTime: number;
  endTime: number;
}

// Define the shape of the context value
export interface VideoEditorContextType {
  videoURL: string;
  canvasRef: React.Ref<HTMLCanvasElement | null>;
  videoRef: React.Ref<HTMLVideoElement | null>;
  setVideoURL: React.Dispatch<React.SetStateAction<string>>;
  videoDuration: number;
  setVideoDuration: React.Dispatch<React.SetStateAction<number>>;
  availableFilters: Filter[];
  setAvailableFilters: React.Dispatch<React.SetStateAction<Filter[]>>;
  filterTimeline: FilterTimelineEntry[];
  setFilterTimeline: React.Dispatch<React.SetStateAction<FilterTimelineEntry[]>>;
  currentTime: number;
  setCurrentTime: React.Dispatch<React.SetStateAction<number>>;
}
