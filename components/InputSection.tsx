import React, { useState, useRef } from 'react';
import { LoadingState, GeminiModel, HistoryItem } from '../types';
import { transcribeMedia } from '../services/geminiService';
import { historyService } from '../services/historyService';

interface InputSectionProps {
  transcript: string;
  setTranscript: (text: string) => void;
  vttTranscript: string;
  setVttTranscript: (text: string) => void;
  onGenerate: () => void;
  onGenerateMindMap: () => void;
  onGenerateHighlights: () => void;
  loadingState: LoadingState;
  setLoadingState: (state: LoadingState) => void;
  setVideoSrc: (src: string | null) => void;
  model: GeminiModel;
  onSaveToHistory: (updates: Partial<HistoryItem>) => void;
  onNewSession: () => void;
  onError: (msg: string) => void;
  onCompareTranscript: (reference: string) => void;
  onAnalyzeEmotion: () => void;
  uploadedFileName: string;
  setUploadedFileName: (name: string) => void;
}

const InputSection: React.FC<InputSectionProps> = ({ 
  transcript, 
  setTranscript, 
  vttTranscript,
  setVttTranscript,
  onGenerate, 
  onGenerateMindMap,
  onGenerateHighlights,
  loadingState,
  setLoadingState,
  setVideoSrc,
  model,
  onSaveToHistory,
  onNewSession,
  onError,
  onCompareTranscript,
  onAnalyzeEmotion,
  uploadedFileName,
  setUploadedFileName
}) => {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);

  const isGenerating = loadingState === LoadingState.GENERATING_SUMMARY;
  const isBusy = loadingState !== LoadingState.IDLE;

  const handleReferenceUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      onCompareTranscript(text);
    };
    reader.readAsText(file);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    onNewSession();
    setLoadingState(LoadingState.TRANSCRIBING);
    setIsTranscribing(true);
    setUploadedFileName(file.name);
    
    // Create a local URL for the video player
    const videoUrl = URL.createObjectURL(file);
    setVideoSrc(videoUrl);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = (e.target?.result as string).split(',')[1];
        const mimeType = file.type;
        
        try {
          const result = await transcribeMedia(base64Data, mimeType, model);
          setTranscript(result.plainText);
          setVttTranscript(result.vtt);
          onSaveToHistory({ 
            transcript: result.plainText, 
            vttTranscript: result.vtt,
            filename: file.name, 
            fileSize: file.size 
          });
        } catch (err) {
          console.error("Transcription failed:", err);
          onError("Failed to transcribe media. Please ensure the file is not too large and is a supported format.");
        } finally {
          setLoadingState(LoadingState.IDLE);
          setIsTranscribing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("File reading failed:", err);
      setLoadingState(LoadingState.IDLE);
      setIsTranscribing(false);
    }
  };

  const handleDownloadVTT = () => {
    if (!vttTranscript) return;
    const blob = new Blob([vttTranscript], { type: 'text/vtt' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transcript.vtt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-full">
      <div className="mb-4 flex justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            Original Transcript
          </h2>
          {uploadedFileName ? (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-100 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                {uploadedFileName}
              </span>
            </div>
          ) : (
            <p className="text-sm text-slate-500 mt-1">Upload an MP4 or paste a transcript below.</p>
          )}
        </div>
        <div className="flex gap-2">
          {vttTranscript && (
            <button
              onClick={handleDownloadVTT}
              className="text-xs font-bold px-3 py-1.5 rounded-full bg-brand-50 text-brand-600 hover:bg-brand-100 transition flex items-center gap-1"
              title="Download VTT"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              VTT
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isBusy}
            className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg text-sm font-medium hover:bg-slate-200 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            {isTranscribing ? 'Transcribing...' : 'Upload MP4/Video'}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="video/mp4,video/*,audio/*"
            className="hidden"
          />
        </div>
      </div>
      
      <div className="flex-grow flex flex-col gap-4">
        <div className="flex-1 flex flex-col">
          <div className="flex justify-between items-center mb-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AI-Generated Transcript</label>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setFontSize(prev => Math.max(10, prev - 2))}
                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition"
                title="Decrease font size"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <span className="text-[10px] font-bold text-slate-400 w-6 text-center">{fontSize}px</span>
              <button 
                onClick={() => setFontSize(prev => Math.min(24, prev + 2))}
                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition"
                title="Increase font size"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
          <textarea
            className="flex-grow w-full p-4 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition resize-y text-slate-700 font-mono"
            style={{ fontSize: `${fontSize}px` }}
            placeholder="AI generated transcript will appear here after you upload a video..."
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            disabled={isGenerating}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 justify-end">
        {transcript.trim() && (
          <>
            <button
              onClick={() => referenceInputRef.current?.click()}
              disabled={isBusy}
              className="px-4 py-2.5 rounded-lg font-medium transition flex items-center gap-2 bg-white text-emerald-600 border border-emerald-600 hover:bg-emerald-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Compare
            </button>
            <input
              type="file"
              ref={referenceInputRef}
              onChange={handleReferenceUpload}
              accept=".txt,.vtt,.srt"
              className="hidden"
            />
            <button
              onClick={onAnalyzeEmotion}
              disabled={isBusy}
              className="px-4 py-2.5 rounded-lg font-medium transition flex items-center gap-2 bg-white text-purple-600 border border-purple-600 hover:bg-purple-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Emotion Analysis
            </button>
            <button
              onClick={onGenerateMindMap}
              disabled={isBusy}
              className="px-4 py-2.5 rounded-lg font-medium transition flex items-center gap-2 bg-white text-indigo-600 border border-indigo-600 hover:bg-indigo-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Mind Map
            </button>
            {vttTranscript.trim() && (
              <button
                onClick={onGenerateHighlights}
                disabled={isBusy}
                className="px-4 py-2.5 rounded-lg font-medium transition flex items-center gap-2 bg-white text-brand-600 border border-brand-600 hover:bg-brand-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Highlights
              </button>
            )}
          </>
        )}
        <button
          onClick={onGenerate}
          disabled={!transcript.trim() || isGenerating}
          className={`px-6 py-2.5 rounded-lg font-medium transition flex items-center gap-2 ${
            !transcript.trim() || isGenerating
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-brand-600 text-white hover:bg-brand-700 shadow-md hover:shadow-lg'
          }`}
        >
          {isGenerating ? 'Generating...' : 'Generate Notes & Actions'}
        </button>
      </div>
    </div>
  );
};

export default InputSection;
