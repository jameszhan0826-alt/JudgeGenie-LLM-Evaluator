
import React, { useState, useRef, useEffect } from 'react';
import { HighlightSegment } from '../types';

interface HighlightPlayerProps {
  videoSrc: string | null;
  segments: HighlightSegment[];
  isLoading: boolean;
  onRelinkVideo?: (src: string) => void;
}

const HighlightPlayer: React.FC<HighlightPlayerProps> = ({ videoSrc, segments, isLoading, onRelinkVideo }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleRelink = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !onRelinkVideo) return;
    const url = URL.createObjectURL(file);
    onRelinkVideo(url);
  };

  useEffect(() => {
    if (!videoRef.current || segments.length === 0) return;

    const video = videoRef.current;
    const currentSegment = segments[currentSegmentIndex];

    const handleTimeUpdate = () => {
      // Update progress bar
      const duration = currentSegment.endTime - currentSegment.startTime;
      const elapsed = video.currentTime - currentSegment.startTime;
      setProgress(Math.min(100, Math.max(0, (elapsed / duration) * 100)));

      if (video.currentTime >= currentSegment.endTime) {
        if (currentSegmentIndex < segments.length - 1) {
          setCurrentSegmentIndex(prev => prev + 1);
        } else {
          setIsPlaying(false);
          video.pause();
        }
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [currentSegmentIndex, segments]);

  useEffect(() => {
    if (!videoRef.current || segments.length === 0 || !isPlaying) return;
    
    const video = videoRef.current;
    const currentSegment = segments[currentSegmentIndex];
    
    if (video.currentTime < currentSegment.startTime || video.currentTime >= currentSegment.endTime) {
      video.currentTime = currentSegment.startTime;
      video.play().catch(e => console.error("Playback prevented:", e));
    } else if (video.paused) {
      video.play().catch(e => console.error("Playback prevented:", e));
    }
  }, [currentSegmentIndex, segments, isPlaying]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      videoRef.current.play().catch(e => console.error("Playback prevented:", e));
    }
  };

  const handleNext = () => {
    if (currentSegmentIndex < segments.length - 1) {
      setCurrentSegmentIndex(prev => prev + 1);
      setIsPlaying(true);
    }
  };

  const handlePrev = () => {
    if (currentSegmentIndex > 0) {
      setCurrentSegmentIndex(prev => prev - 1);
      setIsPlaying(true);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="bg-slate-900 rounded-xl overflow-hidden aspect-video flex flex-col items-center justify-center border border-slate-800">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
        <div className="mt-6 text-center">
          <h3 className="text-white font-bold text-lg">Identifying Highlights</h3>
          <p className="text-slate-400 text-sm mt-1">Our AI is scanning the transcript for key moments...</p>
        </div>
      </div>
    );
  }

  if (segments.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 leading-none">Meeting Highlights</h2>
            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-semibold">
              {isPlaying ? 'Now Playing' : 'Paused'} • {currentSegmentIndex + 1} of {segments.length}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handlePrev} 
            disabled={currentSegmentIndex === 0}
            className="p-1.5 text-slate-400 hover:text-brand-600 disabled:opacity-30 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button 
            onClick={handleNext} 
            disabled={currentSegmentIndex === segments.length - 1}
            className="p-1.5 text-slate-400 hover:text-brand-600 disabled:opacity-30 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="relative group bg-black aspect-video flex flex-col items-center justify-center overflow-hidden">
        {videoSrc ? (
          <>
            <video 
              ref={videoRef}
              src={videoSrc}
              className="w-full h-full object-contain"
              controls={false}
              onClick={togglePlay}
              playsInline
            />
            
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/50 transition-colors cursor-pointer" onClick={togglePlay}>
                <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/20 hover:scale-110 transition-transform shadow-2xl">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white fill-current" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            )}

            {/* Progress Bar Overlay */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
              <div 
                className="h-full bg-brand-500 transition-all duration-300 ease-linear"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </>
        ) : (
          <div className="text-slate-400 text-center p-6 flex flex-col items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p className="font-medium text-white">Video source not available.</p>
            <p className="text-xs mt-2 max-w-sm mb-6 text-slate-400">
              The video file is kept locally in your browser and is not saved to history. 
              Please re-link the video to play these highlights.
            </p>
            {onRelinkVideo && (
              <label className="cursor-pointer bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-brand-900/20 active:scale-95">
                Re-link Video File
                <input 
                  type="file" 
                  accept="video/*" 
                  className="hidden" 
                  onChange={handleRelink}
                />
              </label>
            )}
          </div>
        )}
        
        <div className="absolute bottom-1 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none">
          <p className="text-white text-base font-semibold drop-shadow-lg leading-snug max-w-[90%]">
            {segments[currentSegmentIndex]?.description}
          </p>
        </div>
      </div>
      
      <div className="p-4 bg-slate-50 border-t border-slate-200">
        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar no-scrollbar">
          {segments.map((segment, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentSegmentIndex(index);
                setIsPlaying(true);
                setProgress(0);
              }}
              className={`flex-shrink-0 min-w-[80px] px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                currentSegmentIndex === index 
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-200 scale-105 z-10' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span className="opacity-60 text-[9px] uppercase tracking-tighter">Start</span>
              {formatTime(segment.startTime)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HighlightPlayer;
