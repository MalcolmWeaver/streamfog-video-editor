'use client';
import React, { useState, useEffect, useRef } from 'react';

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
interface TimelineControlsProps {
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
    onUpdateFilter,
    onDeleteFilter,
    appliedFilters = [],
        availableLensOptions = []
}: TimelineControlsProps) => {
    // State for the "Add New Filter" UI
    const [isAddingFilter, setIsAddingFilter] = useState<boolean>(false);
    const [newFilterStart, setNewFilterStart] = useState<number>(0);
    const [newFilterEnd, setNewFilterEnd] = useState<number>(0);
    const [newFilterLabel, setNewFilterLabel] = useState<string>('New Filter');

    const [selectedLensId, setSelectedLensId] = useState<string>(availableLensOptions[0]?.id || '');
    const [selectedLensColor, setSelectedLensColor] = useState<string>(availableLensOptions[0]?.color || '#3B82F6');

    // State for managing existing filters
    const [showManageFilters, setShowManageFilters] = useState<boolean>(false);
    const [editingFilterId, setEditingFilterId] = useState<string | null>(null);
    const [editFilterStart, setEditFilterStart] = useState<number>(0);
    const [editFilterEnd, setEditFilterEnd] = useState<number>(0);
    const [editFilterLabel, setEditFilterLabel] = useState<string>('');
    const [editFilterLensId, setEditFilterLensId] = useState<string>('');
    // Ref to the scrubber input element for focus management if needed
    const scrubberRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (availableLensOptions.length > 0 && !selectedLensId) {
            setSelectedLensId(availableLensOptions[0].id);
            setSelectedLensColor(availableLensOptions[0].color || '#3B82F6');
        }
    }, [availableLensOptions, selectedLensId]);

    // Update newFilterEnd when duration changes, if it exceeds duration
    useEffect(() => {
        if (newFilterEnd > duration) {
            setNewFilterEnd(duration);
        }
        if (newFilterStart > duration) {
            setNewFilterStart(duration);
        }
        if (editingFilterId && editFilterEnd > duration) {
            setEditFilterEnd(duration);
        }
        if (editingFilterId && editFilterStart > duration) {
            setEditFilterStart(duration);
        }
    }, [duration, newFilterEnd, newFilterStart, editingFilterId, editFilterEnd, editFilterStart]);


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
        if (availableLensOptions.length > 0) {
            setSelectedLensId(availableLensOptions[0].id);
            setSelectedLensColor(availableLensOptions[0].color || '#3B82F6');
        } else {
            setSelectedLensId('');
            setSelectedLensColor('#3B82F6');
        }
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
            color: selectedLensColor,//`#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`, // Random color for visualization
            filterId: selectedLensId 
        });
        setIsAddingFilter(false); // Hide the input form
    };

    // Handle canceling new filter addition
    const handleCancelAddFilter = () => {
        setIsAddingFilter(false);
    };

    const handleEditExistingFilter = (filter: AppliedFilter) => {
        setEditingFilterId(filter.id);
        setEditFilterStart(filter.start);
        setEditFilterEnd(filter.end);
        setEditFilterLabel(filter.label);
        setEditFilterLensId(filter.filterId);
        setIsAddingFilter(false); // Hide add section when managing
    };

    const handleSaveEditFilter = () => {
        if (!editingFilterId) return;

        if (editFilterStart >= editFilterEnd) {
            alert('Start time must be before end time!');
            return;
        }
        if (editFilterStart < 0 || editFilterEnd > duration) {
            alert('Times are out of video bounds!');
            return;
        }

        onUpdateFilter({
            id: editingFilterId,
            start: editFilterStart,
            end: editFilterEnd,
            label: editFilterLabel,
            color: availableLensOptions.find(l => l.id === editFilterLensId)?.color || appliedFilters.find(f => f.id === editingFilterId)?.color || '#3B82F6',
            filterId: editFilterLensId 
        });
        setEditingFilterId(null); // Exit editing mode
    };

    const handleCancelEditFilter = () => {
        setEditingFilterId(null);
    };

    const handleDeleteExistingFilter = (id: string) => {
        if (window.confirm('Are you sure you want to delete this filter?')) {
            onDeleteFilter(id);
            if (editingFilterId === id) { 
                setEditingFilterId(null);
            }
        }
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
                className="absolute h-full rounded-sm opacity-75 group cursor-pointer flex items-center justify-center text-xs font-bold text-white overflow-hidden whitespace-nowrap"
                style={{
                  left: `${(filter.start / duration) * 100}%`,
                  width: `${((filter.end - filter.start) / duration) * 100}%`,
                  backgroundColor: filter.color || '#3B82F6',
                }}
                title={`${filter.label}: ${formatTime(filter.start)} - ${formatTime(filter.end)} (Lens ID: ${filter.filterId})`}
                onClick={() => handleEditExistingFilter(filter)} // Click to edit
              >
                <span className="group-hover:block hidden px-1 py-0.5 bg-gray-900 bg-opacity-75 rounded-sm">Edit</span>
              </div>
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
              
              <div className="flex flex-col gap-2">
                <label className="text-gray-300">Select Lens:</label>
                {availableLensOptions.length > 0 ? (
                    <div className="flex overflow-x-auto gap-3 py-2 -mx-4 px-4 scrollbar-hide">
                    {availableLensOptions.map((lens) => (
                        <button
                        key={lens.id} // Use lens.id as key, assuming unique
                        onClick={() => {
                            setSelectedLensId(lens.id);
                            setSelectedLensColor(lens.color || '#3B82F6');
                        }}
                        className={`flex-shrink-0 w-24 h-24 rounded-lg flex flex-col items-center justify-center text-xs font-medium border-2 transition-all duration-200
                            ${selectedLensId === lens.id ? 'border-purple-400 ring-2 ring-purple-400' : 'border-gray-500 hover:border-purple-300'}
                            `}
                        style={{ backgroundColor: lens.color || '#3B82F6' }}
                        >
                        {lens.thumbnailUrl ? (
                            <img src={lens.thumbnailUrl} alt={lens.name} className="w-full h-full object-cover rounded-md" />
                        ) : (
                            <span className="text-white text-center p-1">{lens.name}</span>
                        )}
                        </button>
                    ))}
                    </div>
                ) : (
                    <p className="text-gray-400 text-sm">No lenses available. Check API token and group ID.</p>
                )}
                
                {selectedLensId && (
                    <p className="text-sm text-gray-400">Selected: <span className="font-semibold text-purple-300">{availableLensOptions.find(l => l.id === selectedLensId)?.name || selectedLensId}</span></p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <label htmlFor="new-filter-label" className="text-gray-300 w-20">Label:</label>
                <input
                  type="text"
                  id="new-filter-label"
                  value={newFilterLabel}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewFilterLabel(e.target.value)}
                  className="flex-1 p-2 rounded-md bg-gray-700 border border-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 'Face Blur'"
                />
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="new-start-time" className="text-gray-300 w-20">Start (s):</label>
                <input
                  type="number"
                  id="new-start-time"
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
              <div className="flex items-center gap-2">
                <label htmlFor="new-end-time" className="text-gray-300 w-20">End (s):</label>
                <input
                  type="number"
                  id="new-end-time"
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

          {/* Expandable Section for Managing Existing Filters */}
          {appliedFilters.length > 0 && ( // Only show if there are filters to manage
            <div className="w-full mt-4">
              <button
                onClick={() => setShowManageFilters(!showManageFilters)}
                className="w-full py-2 px-4 bg-gray-600 hover:bg-gray-700 rounded-lg text-white font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-75 flex justify-between items-center"
              >
                <span>Manage Existing Filters ({appliedFilters.length})</span>
                <span>{showManageFilters ? '▲' : '▼'}</span>
              </button>

              {showManageFilters && (
                <div className="bg-gray-800 p-4 rounded-lg mt-2 max-h-60 overflow-y-auto">
                  {appliedFilters.map((filter) => (
                    <div key={filter.id} className="flex flex-col md:flex-row items-center justify-between bg-gray-700 p-3 rounded-md mb-2 last:mb-0">
                      {editingFilterId === filter.id ? (
                        // Edit Form for individual filter
                        <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-2 items-center text-sm">
                            <input
                                type="text"
                                value={editFilterLabel}
                                onChange={(e) => setEditFilterLabel(e.target.value)}
                                className="p-1 rounded-md bg-gray-600 border border-gray-500 text-white w-full"
                            />
                            <input
                                type="number"
                                value={editFilterStart.toFixed(2)}
                                onChange={(e) => setEditFilterStart(parseFloat(e.target.value))}
                                min="0"
                                max={duration.toFixed(2)}
                                step="0.01"
                                className="p-1 rounded-md bg-gray-600 border border-gray-500 text-white w-full"
                            />
                            <input
                                type="number"
                                value={editFilterEnd.toFixed(2)}
                                onChange={(e) => setEditFilterEnd(parseFloat(e.target.value))}
                                min="0"
                                max={duration.toFixed(2)}
                                step="0.01"
                                className="p-1 rounded-md bg-gray-600 border border-gray-500 text-white w-full"
                            />
                            <div className="col-span-full md:col-span-1">
                                <label htmlFor={`edit-lens-${filter.id}`} className="sr-only">Edit Lens</label>
                                <select
                                    id={`edit-lens-${filter.id}`}
                                    value={editFilterLensId}
                                    onChange={(e) => setEditFilterLensId(e.target.value)}
                                    className="p-1 rounded-md bg-gray-600 border border-gray-500 text-white w-full"
                                >
                                    {availableLensOptions.length > 0 ? (
                                        availableLensOptions.map((lens) => (
                                            <option key={lens.id} value={lens.id}>{lens.name}</option>
                                        ))
                                    ) : (
                                        <option value="">No lenses available</option>
                                    )}
                                </select>
                            </div>
                        </div>
                      ) : (
                        // Display mode for individual filter
                        <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-2 items-center text-sm">
                          <span className="text-purple-300 font-semibold truncate">{filter.label}</span>
                          <span className="text-gray-300">Start: {formatTime(filter.start)}</span>
                          <span className="text-gray-300">End: {formatTime(filter.end)}</span>
                          <span className="text-gray-300 text-right">Lens: {availableLensOptions.find(l => l.id === filter.filterId)?.name || 'Unknown'}</span> {/* Display Lens Name */}
                        </div>
                      )}
                      <div className="flex gap-2 mt-2 md:mt-0">
                        {editingFilterId === filter.id ? (
                          <>
                            <button
                              onClick={handleSaveEditFilter}
                              className="py-1 px-2 bg-green-600 hover:bg-green-700 rounded-md text-xs text-white"
                              title="Save Changes"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancelEditFilter}
                              className="py-1 px-2 bg-gray-500 hover:bg-gray-600 rounded-md text-xs text-white"
                              title="Cancel Editing"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleEditExistingFilter(filter)}
                            className="py-1 px-2 bg-blue-600 hover:bg-blue-700 rounded-md text-xs text-white"
                            title="Edit Filter"
                          >
                            Edit
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteExistingFilter(filter.id)}
                          className="py-1 px-2 bg-red-600 hover:bg-red-700 rounded-md text-xs text-white"
                          title="Delete Filter"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      );
    };

export default TimelineControls;
