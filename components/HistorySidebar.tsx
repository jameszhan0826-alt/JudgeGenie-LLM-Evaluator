import React, { useState } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { HistoryItem } from '../types';
import { historyService } from '../services/historyService';

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: HistoryItem) => void;
  onClear: () => void;
  currentSessionId: string;
}

interface SortableHistoryItemProps {
  item: HistoryItem;
  onSelect: (item: HistoryItem) => void;
  onClose: () => void;
  isCurrent: boolean;
}

const SortableHistoryItem: React.FC<SortableHistoryItemProps> = ({ item, onSelect, onClose, isCurrent }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="group relative">
      <div 
        {...attributes} 
        {...listeners} 
        className="absolute left-1 top-4 cursor-grab opacity-0 group-hover:opacity-100 p-1 bg-slate-100 rounded hover:bg-slate-200 transition-opacity z-10"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </div>
      <div 
        onClick={() => { onSelect(item); onClose(); }}
        className={`pl-8 p-4 border rounded-xl cursor-pointer transition-all ${isCurrent ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-brand-500 hover:bg-brand-50/30'}`}
      >
        <div className="flex justify-between items-start mb-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            {new Date(item.timestamp).toLocaleString()}
            {isCurrent && (
              <span className="text-[8px] font-bold text-brand-600 bg-brand-100 px-1.5 py-0.5 rounded uppercase">
                Last Used
              </span>
            )}
          </span>
          <div className="flex gap-1">
            {item.transcript && <span className="w-2 h-2 rounded-full bg-brand-500" title="Has Transcript"></span>}
            {item.vttTranscript && <span className="w-2 h-2 rounded-full bg-blue-500" title="Has VTT"></span>}
            {item.summary && <span className="w-2 h-2 rounded-full bg-emerald-500" title="Has Summary"></span>}
            {item.mindMapData && <span className="w-2 h-2 rounded-full bg-purple-500" title="Has Mind Map"></span>}
            {item.highlights && <span className="w-2 h-2 rounded-full bg-pink-500" title="Has Highlights"></span>}
          </div>
        </div>
        <h3 className="text-sm font-bold text-slate-800 truncate mb-2">
          {item.filename || 'Pasted Transcript'}
        </h3>
        
        <div className="flex justify-between items-center mb-3">
          <div className="flex flex-col gap-1">
            {item.generatorModel && (
              <div className="flex items-center gap-1">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Gen:</span>
                <span className="text-[9px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 truncate max-w-[120px]">
                  {item.generatorModel}
                </span>
              </div>
            )}
          </div>
        </div>

        <p className="text-xs text-slate-500 line-clamp-2 italic mb-2">
          {item.transcript.substring(0, 100)}...
        </p>
        {item.summary && item.summary.includes('**Action Items**') && (
          <div className="mt-2 p-2 bg-emerald-50 rounded-lg border border-emerald-100">
            <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-1 flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Action Items
            </p>
            <p className="text-[11px] text-emerald-800 line-clamp-2">
              {item.summary.split('**Action Items**')[1].trim().substring(0, 150)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const HistorySidebar: React.FC<HistorySidebarProps> = ({ isOpen, onClose, onSelect, onClear, currentSessionId }) => {
  const [history, setHistory] = useState(historyService.getHistory());
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor));

  function handleDragEnd(event: any) {
    const { active, over } = event;
    if (active.id !== over.id) {
      setHistory((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const newHistory = arrayMove(items, oldIndex, newIndex);
        // Note: In a real app, you'd save this new order to historyService here
        return newHistory;
      });
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="absolute inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Session History</h2>
            <p className="text-xs text-slate-500">Your recent transcription and evaluation sessions</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {history.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 bg-slate-50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-slate-500 font-medium">No history yet</p>
              <p className="text-slate-400 text-sm">Your sessions will appear here after you transcribe or generate content.</p>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={history.map(h => h.id)} strategy={verticalListSortingStrategy}>
                {history.map((item) => (
                  <SortableHistoryItem 
                    key={item.id} 
                    item={item} 
                    onSelect={onSelect} 
                    onClose={onClose} 
                    isCurrent={item.id === currentSessionId}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>

        {history.length > 0 && (
          <div className="p-4 border-t border-slate-200">
            {showClearConfirm ? (
              <div className="bg-white p-3 rounded-lg border border-red-200 shadow-sm">
                <p className="text-sm text-slate-700 mb-3 font-medium">Are you sure you want to clear all history?</p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      onClear();
                      setShowClearConfirm(false);
                    }}
                    className="flex-1 py-1.5 bg-red-600 text-white text-xs font-bold rounded hover:bg-red-700 transition"
                  >
                    Yes, Clear
                  </button>
                  <button 
                    onClick={() => setShowClearConfirm(false)}
                    className="flex-1 py-1.5 bg-slate-100 text-slate-600 text-xs font-bold rounded hover:bg-slate-200 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setShowClearConfirm(true)}
                className="w-full py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                Clear All History
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistorySidebar;
