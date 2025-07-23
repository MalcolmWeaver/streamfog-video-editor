'use client';
import React, { useState, useEffect } from 'react';
import { useVideoEditor } from '../context/VideoEditorContext';
import { FilterTimelineEntry } from '../types';

const TimelineControls: React.FC = () => {
  const { availableFilters, filterTimeline, setFilterTimeline, videoDuration, currentTime } = useVideoEditor();
  const [selectedFilterId, setSelectedFilterId] = useState<string>('');
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(0);

  useEffect(() => {
    // Update end time when video duration changes
    setEndTime(videoDuration);
  }, [videoDuration]);

  const handleAddFilter = () => {
    if (selectedFilterId && startTime >= 0 && endTime <= videoDuration && startTime < endTime) {
      const newFilterEntry: FilterTimelineEntry = {
        id: Date.now(), // Unique ID for the entry
        filterId: selectedFilterId,
        startTime: parseFloat(startTime.toString()), // Ensure number type
        endTime: parseFloat(endTime.toString()),     // Ensure number type
      };
      setFilterTimeline((prev) => [...prev, newFilterEntry]);
      // Reset form
      setSelectedFilterId('');
      setStartTime(0);
      setEndTime(videoDuration);
    } else {
      // TODO: replace with a custom modal/toast notification
      console.error('Please select a filter and ensure valid start/end times.');
    }
  };

  const handleDeleteFilter = (id: number) => {
    setFilterTimeline((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-white mb-4">Timeline Controls</h2>

      <div className="mb-6">
        <h3 className="text-lg font-medium text-white mb-2">Add Filter to Timeline</h3>
        <div className="flex flex-wrap items-end gap-4 mb-4">
          <div className="flex flex-col">
            <label htmlFor="filter-select" className="text-gray-300 text-sm mb-1">Filter:</label>
            <select
              id="filter-select"
              value={selectedFilterId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedFilterId(e.target.value)}
              className="p-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:ring-blue-500 focus:border-blue-500"
              disabled={availableFilters.length === 0}
            >
              <option value="">Select a filter</option>
              {availableFilters.map((filter) => (
                <option key={filter.id} value={filter.id}>
                  {filter.name}
                </option>
              ))}
            </select>
            {availableFilters.length === 0 && (
              <p className="text-red-400 text-xs mt-1">No filters available. Load a video first.</p>
            )}
          </div>
          <div className="flex flex-col">
            <label htmlFor="start-time" className="text-gray-300 text-sm mb-1">Start Time (s):</label>
            <input
              type="number"
              id="start-time"
              value={startTime}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartTime(parseFloat(e.target.value))}
              min="0"
              max={videoDuration}
              step="0.1"
              className="p-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:ring-blue-500 focus:border-blue-500 w-24"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="end-time" className="text-gray-300 text-sm mb-1">End Time (s):</label>
            <input
              type="number"
              id="end-time"
              value={endTime}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndTime(parseFloat(e.target.value))}
              min="0"
              max={videoDuration}
              step="0.1"
              className="p-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:ring-blue-500 focus:border-blue-500 w-24"
            />
          </div>
          <button
            onClick={handleAddFilter}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition duration-300 ease-in-out shadow-lg"
            disabled={!selectedFilterId || videoDuration === 0}
          >
            Add Filter
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-white mb-2">Applied Filters</h3>
        {filterTimeline.length === 0 ? (
          <p className="text-gray-400">No filters applied yet.</p>
        ) : (
          <ul className="space-y-2">
            {filterTimeline.map((entry) => (
              <li
                key={entry.id}
                className={`flex justify-between items-center p-3 rounded-md border ${
                  currentTime >= entry.startTime && currentTime <= entry.endTime
                    ? 'border-green-500 bg-green-900 bg-opacity-20'
                    : 'border-gray-700 bg-gray-700'
                }`}
              >
                <span className="text-white">
                  {availableFilters.find(f => f.id === entry.filterId)?.name || 'Unknown Filter'}
                  : {entry.startTime.toFixed(1)}s - {entry.endTime.toFixed(1)}s
                </span>
                <button
                  onClick={() => handleDeleteFilter(entry.id)}
                  className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-300 ease-in-out text-sm"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default TimelineControls;
