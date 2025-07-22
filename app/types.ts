
/**
 * Interface for an applied filter object.
 */
export interface AppliedFilter {
    id: string;
    start: number;
    end: number;
    label: string;
    color: string;
    filterId: string;
}

export interface LensOption {
    id: string; // The actual Camera Kit Lens ID
    name: string;
    thumbnailUrl?: string; // Optional: URL to a thumbnail image for the lens
    color?: string; // Optional: A default color for visualization if no thumbnail
}

/**
 * Props for the TimelineControls component.
 */
export interface TimelineControlsProps {
    duration: number;
    currentTime: number;
    onScrub: (time: number) => void;
    isPlaying: boolean;
    onPlayPause: () => void;
    onAddNewFilter: (filterData: AppliedFilter) => void;
    onUpdateFilter: (filterData: AppliedFilter) => void;
    onDeleteFilter: (id: string) => void;
    appliedFilters?: AppliedFilter[];
    availableLensOptions: LensOption[];
}
