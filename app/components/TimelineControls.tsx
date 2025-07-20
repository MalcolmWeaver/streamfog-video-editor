// src/components/TimelineControls.tsx
import React, { useState, useEffect, useRef } from 'react';

/**
 * Interface for an applied filter object.
 */
export interface AppliedFilter {
  id: string;
  start: number;
  end: number;
  label: string;
  color?: string; // Optional color for visualization
}

/**
 * Props for the TimelineControls component.
 */
interface TimelineControlsProps {
  duration: number;
  currentTime: number;
  onScrub: (time: number) => void;
  isPlaying: boolean;
  onPlayPause: () => void;
  onAddNewFilter: (filterData: AppliedFilter) => void;
  appliedFilters?: AppliedFilter[];
}

/**
 * A component to display and control the video timeline, including scrubbing and filter visualization.
 *
 * @param {TimelineControlsProps} props
 */
const TimelineControls: React.FC<TimelineControlsProps> = ({
  duration,
  currentTime,
  onScrub,
  isPlaying,
  onPlayPause,
  onAddNewFilter,
  appliedFilters = [],
}) => {
  // State for the "Add New Filter" UI
  const [isAddingFilter, setIsAddingFilter] = useState<boolean>(false);
  const [newFilterStart, setNewFilterStart] = useState<number>(0);
  const [newFilterEnd, setNewFilterEnd] = useState<number>(0);
  const [newFilterLabel, setNewFilterLabel] = useState<string>('New Filter');

  // Ref to the scrubber input element for focus management if needed
  const scrubberRef = useRef<HTMLInputElement>(null);

  // Update newFilterEnd when duration changes, if it exceeds duration
  useEffect(() => {
    if (newFilterEnd > duration) {
      setNewFilterEnd(duration);
    }
    if (newFilterStart > duration) {
      setNewFilterStart(duration);
    }
  }, [duration, newFilterEnd, newFilterStart]);

  // Helper to format time into MM:SS (or HH:MM:SS for longer videos)
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const date = new Date(null as any); // Type assertion for Date constructor
    date.setSeconds(seconds);
    const result = date.toISOString().substr(11, 8); // HH:MM:SS
    return result.startsWith('00:') ? result.substr(3) : result; // Remove HH: if zero
  };

  // Handle scrubber change
  const handleScrubberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(event.target.value);
    onScrub(newTime);
  };

  // Handle adding a new filter
  const handleAddFilter = () => {
    setIsAddingFilter(true);
    // Initialize with current time or some defaults
    setNewFilterStart(parseFloat(currentTime.toFixed(2)));
    setNewFilterEnd(parseFloat(Math.min(currentTime + 5, duration).toFixed(2))); // Default to 5s length or end of video
    setNewFilterLabel('New Filter');
  };

  // Handle saving the new filter
  const handleSaveFilter = () => {
    // Basic validation
    if (newFilterStart >= newFilterEnd) {
      // Using a simple alert for now, but replace with a custom modal UI in production
      alert('Start time must be before end time!');
      return;
    }
    if (newFilterStart < 0 || newFilterEnd > duration) {
      alert('Times are out of video bounds!');
      return;
    }

    onAddNewFilter({
      id: `filter-${Date.now()}`, // Simple unique ID
      start: newFilterStart,
      end: newFilterEnd,
      label: newFilterLabel,
      color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`, // Random color for visualization
    });
    setIsAddingFilter(false); // Hide the input form
  };

  // Handle canceling new filter addition
  const handleCancelAddFilter = () => {
    setIsAddingFilter(false);
  };

  return (
    <div className="w-full mt-6 p-4 bg-gray-700 rounded-lg flex flex-col gap-4">
      {/* Play/Pause Button and Current Time/Duration Display */}
      <div className="flex items-center justify-between text-gray-300">
        <button
          onClick={onPlayPause}
          className="p-2 rounded-full bg-purple-600 hover:bg-purple-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-75 transition-colors duration-200"
          aria-label={isPlaying ? 'Pause video' : 'Play video'}
        >
          {isPlaying ? (
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> // Pause icon
          ) : (
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> // Play icon
          )}
        </button>
        <div className="text-lg font-mono">
          <span>{formatTime(currentTime)}</span> / <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Scrubber Input */}
      <input
        ref={scrubberRef}
        type="range"
        min="0"
        max={duration}
        step="0.01" // Allow fine scrubbing
        value={currentTime}
        onChange={handleScrubberChange}
        // Custom Tailwind styling for the thumb (slider handle)
        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer
                   [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-lg
                   [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-purple-500 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:shadow-lg
                   focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-75"
        aria-label="Video scrubber"
      />

      {/* Filter/Lens Time Ranges Visualization */}
      <div className="relative w-full h-8 bg-gray-600 rounded-md overflow-hidden my-2">
        {/* Render existing applied filters */}
        {appliedFilters.map((filter) => (
          <div
            key={filter.id}
            className="absolute h-full rounded-sm opacity-75"
            style={{
              left: `${(filter.start / duration) * 100}%`,
              width: `${((filter.end - filter.start) / duration) * 100}%`,
              backgroundColor: filter.color || '#3B82F6',
            }}
            title={`${filter.label}: ${formatTime(filter.start)} - ${formatTime(filter.end)}`}
          />
        ))}
        {/* Current Playhead Indicator */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-purple-400 z-10"
          style={{ left: `${(currentTime / duration) * 100}%` }}
        ></div>
      </div>

      {/* "Add New Filter" Button / Form */}
      {!isAddingFilter ? (
        <button
          onClick={handleAddFilter}
          className="mt-4 w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
        >
          Add New Filter
        </button>
      ) : (
        <div className="mt-4 p-4 bg-gray-600 rounded-lg shadow-inner flex flex-col gap-3">
          <h3 className="text-xl font-semibold text-blue-300 mb-2">Define New Filter Slice</h3>
          {/* Label Input */}
          <div className="flex items-center gap-2">
            <label htmlFor="filter-label" className="text-gray-300 w-20">Label:</label>
            <input
              type="text"
              id="filter-label"
              value={newFilterLabel}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewFilterLabel(e.target.value)}
              className="flex-1 p-2 rounded-md bg-gray-700 border border-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 'Face Blur'"
            />
          </div>

          {/* Start Time Input */}
          <div className="flex items-center gap-2">
            <label htmlFor="start-time" className="text-gray-300 w-20">Start (s):</label>
            <input
              type="number"
              id="start-time"
              value={newFilterStart.toFixed(2)}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewFilterStart(parseFloat(e.target.value))}
              min="0"
              max={duration.toFixed(2)}
              step="0.01"
              className="flex-1 p-2 rounded-md bg-gray-700 border border-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => setNewFilterStart(parseFloat(currentTime.toFixed(2)))}
              className="px-3 py-2 bg-blue-500 hover:bg-blue-600 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              Set Current
            </button>
          </div>

          {/* End Time Input */}
          <div className="flex items-center gap-2">
            <label htmlFor="end-time" className="text-gray-300 w-20">End (s):</label>
            <input
              type="number"
              id="end-time"
              value={newFilterEnd.toFixed(2)}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewFilterEnd(parseFloat(e.target.value))}
              min="0"
              max={duration.toFixed(2)}
              step="0.01"
              className="flex-1 p-2 rounded-md bg-gray-700 border border-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => setNewFilterEnd(parseFloat(currentTime.toFixed(2)))}
              className="px-3 py-2 bg-blue-500 hover:bg-blue-600 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              Set Current
            </button>
          </div>

          {/* Action Buttons for New Filter */}
          <div className="flex justify-end gap-3 mt-3">
            <button
              onClick={handleCancelAddFilter}
              className="py-2 px-4 bg-gray-500 hover:bg-gray-600 rounded-lg text-white font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveFilter}
              className="py-2 px-4 bg-green-600 hover:bg-green-700 rounded-lg text-white font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75"
            >
              Save Filter
            </button>
          </div>
        </div>
      )}

      {/* Placeholder for Filter Options Carousel (future) */}
      {isAddingFilter && (
        <div className="w-full p-4 bg-gray-600 rounded-lg text-center text-gray-400 mt-4">
          <p>Filter Options Carousel (Coming Soon)</p>
          <p className="text-sm">This is where specific AR lens choices will appear.</p>
        </div>
      )}
    </div>
  );
};

export default TimelineControls;
