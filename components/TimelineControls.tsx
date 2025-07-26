'use client';
import React, { useState, useEffect } from 'react';
import { useVideoEditor } from '../context/VideoEditorContext';
import { FilterTimelineEntry, ValidationError} from '../types';
import { validateEntry } from "../validation";

const errorMessages: Record<ValidationError, string> = {
    START_NEGATIVE:         "Start time can’t be negative.",
    END_EXCEEDS_DURATION:   "End time can’t exceed video length.",
    START_NOT_LESS_THAN_END:"Start must be before end.",
    OVERLAPPING:            "This time range overlaps another filter.",
};

const TimelineControls: React.FC = () => {
    const { 
        availableFilters, 
        filterTimeline, 
        setFilterTimeline, 
        videoDuration, 
        currentTime 
    } = useVideoEditor();

    // -- Local UI State
    const [isAddingFilter, setIsAddingFilter] = useState<boolean>(false);
    const [showManageFilters, setShowManageFilters] = useState<boolean>(false);
    const [editingFilterId, setEditingFilterId] = useState<number | null>(null);

    // -- State for "Add New Filter" form --
    const [newFilterLabel, setNewFilterLabel] = useState<string>('New Filter');
    const [newFilterStartTime, setNewFilterStartTime] = useState<number>(0) 
    const [rawStart, setRawStart] = useState<string>("");


    const [newFilterEndTime, setNewFilterEndTime] = useState<number>(0);
    const [rawEnd, setRawEnd] = useState<string>("");

    const [selectedLensId, setSelectedLensId] = useState<string>('');

    const [editState, setEditState] = useState<FilterTimelineEntry | null>(null);
    // Errors
    const [editErrors, setEditErrors]          = useState<ValidationError[]>([]);
    const [newErrors, setNewErrors]                   = useState<ValidationError[]>([]);

    // Syncing UI state with context
    useEffect(() => {
        // When a video loads, pre-select the first available filter
        if (availableFilters.length > 0 && !selectedLensId) {
            setSelectedLensId(availableFilters[0].id);
        }
    }, [availableFilters, selectedLensId]);

    const formatTime = (seconds: number): string => {
        if (isNaN(seconds) || seconds < 0) return '00:00';
        return new Date(seconds * 1000).toISOString().substr(14, 5);
    };

    // EVENT HANDLERS
    const handleStartAddNewFilter = () => {
        setShowManageFilters(false);
        setRawEnd('0.00');
        setRawStart('0.00');
        setIsAddingFilter(true);
        const start = parseFloat(currentTime.toFixed(2));
        const end = parseFloat(Math.min(currentTime + 5, videoDuration).toFixed(2));
        setNewFilterStartTime(start);
        setNewFilterEndTime(end);
        setNewFilterLabel('New Filter');
        if (!selectedLensId && availableFilters.length > 0) {
            setSelectedLensId(availableFilters[0].id);
        }
    };

    const handleSaveNewFilter = () => {
        const candidate: FilterTimelineEntry = {
            id: Date.now(),
            filterId: selectedLensId,
            label: "New Filter",
            startTime: newFilterStartTime,
            endTime: newFilterEndTime,
        };
        const errs = validateEntry(candidate, filterTimeline, videoDuration);
        setNewErrors(errs);
        if (errs.length) return;

        setFilterTimeline((prev) => [...prev, candidate]);
        setNewErrors([]); 
        setIsAddingFilter(false);
    };

    const handleStartEditing = (filter: FilterTimelineEntry) => {
        setEditingFilterId(filter.id);
        setEditState(filter);
        setRawStart(`${filter.startTime}`);
        setRawEnd(`${filter.endTime}`);
    };

    const handleDeleteFilter = (id: number) => {
        if (window.confirm('Are you sure you want to delete this filter?')) {
            setFilterTimeline((prev) => prev.filter((f) => f.id !== id));
            if (editingFilterId === id) {
                setEditingFilterId(null);
            }
        }
    };


    const handleSaveEdit = () => {
        if (!editState || editingFilterId === null) return;
        const errs = validateEntry(editState, filterTimeline, videoDuration);
        setEditErrors(errs);
        if (errs.length) return;

        setFilterTimeline((prev) =>
                          prev.map((f) => (f.id === editingFilterId ? editState : f))
                         );
                         setEditErrors([]);
                         setEditingFilterId(null);
    };

    return (
    <div className="w-full mt-6 p-4 bg-gray-800 rounded-lg flex flex-col gap-4 shadow-xl">
      {/* Filter Visualization Bar */}
      <div className="relative w-full h-8 bg-gray-700 rounded-md overflow-hidden my-2 border border-gray-900">
        {filterTimeline.map((filter) => {
            const filterInfo = availableFilters.find(f => f.id === filter.filterId);
            return (
                <div
                    key={filter.id}
                    className="absolute h-full opacity-80 group cursor-pointer flex items-center justify-center text-xs font-bold text-white overflow-hidden"
                    style={{
                        left: `${(filter.startTime / videoDuration) * 100}%`,
                        width: `${((filter.endTime - filter.startTime) / videoDuration) * 100}%`,
                        backgroundColor: filterInfo?.color || '#3B82F6',
                    }}
                    title={`${filter.label}: ${formatTime(filter.startTime)} - ${formatTime(filter.endTime)}`}
                    onClick={() => handleStartEditing(filter)}
                >
                    <span className="truncate px-2">{filter.label}</span>
                </div>
            )
        })}
        <div
          className="absolute top-0 bottom-0 w-1 bg-purple-400 z-10 pointer-events-none"
          style={{ left: `${(currentTime / videoDuration) * 100}%` }}
        />
      </div>

      {/* --- Add New Filter UI --- */}
      {!isAddingFilter ? (
        <button
          onClick={handleStartAddNewFilter}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
          disabled={videoDuration === 0}
        >
          + Add New Filter Slice
        </button>
      ) : (
        <div className="p-4 bg-gray-900 rounded-lg shadow-inner flex flex-col gap-4 border border-gray-700">
          <h3 className="text-xl font-bold text-purple-300">Define New Filter</h3>
          
          {/* Lens/Filter Carousel */}
          <div className="flex flex-col gap-2 p-3 bg-gray-800 rounded-lg border border-gray-600">
            <label className="text-gray-300 font-medium text-lg">Select a Lens</label>
             {availableFilters.length > 0 ? (
                <div className="custom-scrollbar flex overflow-x-auto gap-4 py-2 px-1">
                    {availableFilters.map((lens) => (
                        <button
                            key={lens.id}
                            onClick={() => setSelectedLensId(lens.id)}
                            className={`flex-shrink-0 w-28 h-28 rounded-xl flex flex-col items-center justify-center text-center text-sm font-medium border-2 transition-all duration-200 relative overflow-hidden shadow-md ${selectedLensId === lens.id ? 'border-purple-400 ring-2 ring-purple-400' : 'border-gray-600 hover:border-purple-300'}`}
                            style={{ backgroundColor: lens.color || '#3B82F6' }}
                        >
                           {lens.iconUrl ? (
                              <>
                                <img src={lens.iconUrl} alt={lens.name} className="absolute inset-0 w-full h-full object-cover" />
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/60 to-transparent p-2 text-white font-semibold text-xs">{lens.name}</div>
                              </>
                           ) : (
                              <span className="text-white font-semibold px-1">{lens.name}</span>
                           )}
                           {selectedLensId === lens.id && (
                             <div className="absolute inset-0 bg-purple-500/70 flex items-center justify-center pointer-events-none">
                               <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                             </div>
                           )}
                        </button>
                    ))}
                </div>
            ) : <p className="text-gray-400">No filters available.</p>}
          </div>

          {/* Time & Label Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
             <div className="flex flex-col gap-1 col-span-full">
                <label htmlFor="new-filter-label" className="text-gray-300 text-sm">Label:</label>
                <input
                    type="text"
                    id="new-filter-label"
                    value={newFilterLabel}
                    onChange={(e) => setNewFilterLabel(e.target.value)}
                    className="p-2 rounded-md bg-gray-700 border border-gray-600 text-white w-full"
                />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="new-start-time" className="text-gray-300 text-sm">Start Time (s):</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={rawStart}
                  onChange={(e) => setRawStart(e.target.value)}
                  onBlur={() => {
                    let v = parseFloat(rawStart);
                    if (isNaN(v)) v = 0;
                    v = Math.max(0, Math.min(videoDuration, v));
                    setNewFilterStartTime(v);
                    setRawStart(v.toFixed(2)); // show the clamped number
                  }}
                  placeholder="0.00"
                  className="p-2 rounded-md bg-gray-700 border border-gray-600 text-white w-full"
                />
 
                <button 
                    onClick={() => { 
                        setRawStart(currentTime.toFixed(2)); 
                        setNewFilterStartTime(currentTime);
                    }}
                    className="px-3 py-1 bg-blue-500 hover:bg-blue-600 rounded-md text-sm text-white"
                >Set</button>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="new-end-time" className="text-gray-300 text-sm">End Time (s):</label>
               <div className="flex gap-2">
                <input
                  type="number"
                  value={rawEnd}
                  onChange={(e) => setRawEnd(e.target.value)}
                  onBlur={() => {
                    let v = parseFloat(rawEnd);
                    if (isNaN(v)) v = 0;
                    v = Math.max(0, Math.min(videoDuration, v));
                    setNewFilterEndTime(v);
                    setRawEnd(v.toFixed(2)); // show the clamped number
                  }}
                  placeholder="0.00"
                  className="p-2 rounded-md bg-gray-700 border border-gray-600 text-white w-full"
                />
                <button 
                    onClick={() => {
                        setRawEnd(currentTime.toFixed(2));
                        setNewFilterEndTime(currentTime);
                    }}
                    className="px-3 py-1 bg-blue-500 hover:bg-blue-600 rounded-md text-sm text-white"
                >Set</button>
              </div>
            </div>
          </div>
          {newErrors.length > 0 && (
            <ul className="text-red-400 list-disc list-inside">
              {newErrors.map((code) => (
                <li key={code}>{errorMessages[code]}</li>
              ))}
            </ul>
          )}
          <div className="flex justify-end gap-3 mt-3">
            <button onClick={() => setIsAddingFilter(false)} className="py-2 px-4 bg-gray-600 hover:bg-gray-700 rounded-lg text-white font-semibold">Cancel</button>
            <button onClick={handleSaveNewFilter} className="py-2 px-4 bg-green-600 hover:bg-green-700 rounded-lg text-white font-semibold">Save Filter</button>
          </div>
        </div>
      )}

      {/* --- Manage Existing Filters UI --- */}
      {filterTimeline.length > 0 && (
        <div className="w-full mt-4">
          <button 
            onClick={() => { 
                setIsAddingFilter(false);
                setShowManageFilters(!showManageFilters);
            }} 
            className="w-full p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-semibold flex justify-between items-center">
            <span>Manage Applied Filters ({filterTimeline.length})</span>
            <span className="transition-transform" style={{ transform: showManageFilters ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
          </button>

          {showManageFilters && (
            <div className="bg-gray-900/50 p-2 rounded-lg mt-2 space-y-3">
              {filterTimeline.map((filter) => (
                <div key={filter.id} className="bg-gray-800 p-3 rounded-lg shadow-md border border-gray-700">
                  {editingFilterId === filter.id && editState ? (
                    // -- EDITING VIEW --
                    <div className="flex flex-col gap-4">
                        <input
                            type="text"
                            value={editState.label}
                            onChange={(e) => setEditState({...editState, label: e.target.value})}
                            className="p-2 rounded-md bg-gray-700 border border-gray-600 text-white text-lg font-semibold"
                        />
                        <select
                          value={editState.filterId}
                          onChange={(e) => {
                            setEditState(prev => prev && { ...prev, filterId: e.target.value });
                            // Also re-validate overlap etc:
                            setEditErrors(validateEntry(
                              { ...editState!, filterId: e.target.value },
                              filterTimeline,
                              videoDuration
                            ));
                          }}
                          className="p-2 rounded-md bg-gray-700 border border-gray-600 text-white"
                        >
                          {availableFilters.map(lens => (
                            <option key={lens.id} value={lens.id}>
                              {lens.name}
                            </option>
                          ))}
                        </select>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <div className="flex flex-col gap-1">
                                <label className="text-gray-400 text-xs">Start (s)</label>
                                <div className="flex gap-2">
                                    <input
                                      type="number"
                                      value={rawStart}
                                      onChange={(e) => setRawStart(e.target.value)}
                                      onBlur={() => {
                                        let v = parseFloat(rawStart);
                                        if (isNaN(v)) v = 0;
                                        v = Math.max(0, Math.min(videoDuration, v));
                                        const existingState = editState;
                                        setEditState({...existingState, startTime: v});
                                        setRawStart(v.toFixed(2)); // show the clamped number
                                      }}
                                      className="p-2 rounded-md bg-gray-700 border border-gray-600 text-white w-full"
                                    />
                                    <button onClick={() => setEditState({...editState, startTime: currentTime})} className="px-3 py-1 bg-blue-500 hover:bg-blue-600 rounded-md text-sm text-white">Set</button>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-gray-400 text-xs">End (s)</label>
                                <div className="flex gap-2">
                                    <input
                                      type="number"
                                      value={rawEnd}
                                      onChange={(e) => setRawEnd(e.target.value)}
                                      onBlur={() => {
                                        let v = parseFloat(rawEnd);
                                        if (isNaN(v)) v = 0;
                                        v = Math.max(0, Math.min(videoDuration, v));
                                        const existingState = editState;
                                        setEditState({...existingState, startTime: v});
                                        setRawEnd(v.toFixed(2)); // show the clamped number
                                      }}
                                      className="p-2 rounded-md bg-gray-700 border border-gray-600 text-white w-full"
                                    />

                                    <button onClick={() => setEditState({...editState, endTime: currentTime})} className="px-3 py-1 bg-blue-500 hover:bg-blue-600 rounded-md text-sm text-white">Set</button>
                                </div>
                            </div>
                        </div>
                        {editErrors.length > 0 && (
                            <ul className="text-red-400 list-disc list-inside">
                              {editErrors.map((code) => (
                                <li key={code}>{errorMessages[code]}</li>
                              ))}
                            </ul>
                          )}
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setEditingFilterId(null)} className="px-3 py-1 bg-gray-600 rounded-md text-sm">Cancel</button>
                            <button onClick={handleSaveEdit} className="px-3 py-1 bg-green-600 rounded-md text-sm">Save</button>
                        </div>
                    </div>
                  ) : (
                    // -- DEFAULT VIEW --
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-bold text-white">{filter.label}</span>
                        <span className="text-gray-400 text-sm ml-3">
                            ({availableFilters.find(f => f.id === filter.filterId)?.name || 'Unknown'})
                        </span>
                        <p className="text-purple-300 font-mono text-sm">{filter.startTime.toFixed(1)}s - {filter.endTime.toFixed(1)}s</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0 ml-4">
                        <button onClick={() => handleStartEditing(filter)} className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">Edit</button>
                        <button onClick={() => handleDeleteFilter(filter.id)} className="px-3 py-1 bg-red-600 text-white rounded-md text-sm hover:bg-red-700">Delete</button>
                      </div>
                    </div>
                  )}
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
