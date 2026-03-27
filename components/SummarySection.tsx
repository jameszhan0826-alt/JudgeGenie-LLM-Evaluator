
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { LoadingState } from '../types';

interface SummarySectionProps {
  summary: string;
  setSummary: (summary: string) => void;
  loadingState: LoadingState;
  onJudgeSummary: () => void;
  onGenerate?: () => void;
  onRelink?: (text: string) => void;
}

const SummarySection: React.FC<SummarySectionProps> = ({ 
  summary, 
  setSummary,
  loadingState,
  onJudgeSummary,
  onGenerate,
  onRelink
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [copying, setCopying] = useState(false);

  const isBusy = loadingState !== LoadingState.IDLE;
  const isJudging = loadingState === LoadingState.JUDGING_SUMMARY;
  const isGenerating = loadingState === LoadingState.GENERATING_SUMMARY;

  useEffect(() => {
    if (loadingState === LoadingState.GENERATING_SUMMARY) {
      setIsEditing(false);
    }
  }, [loadingState]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopying(true);
      setTimeout(() => setCopying(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([summary], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'meeting-notes.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !onRelink) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      onRelink(text);
    };
    reader.readAsText(file);
  };

  if (!summary && !isEditing) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 h-full flex flex-col items-center justify-center text-center min-h-[300px]">
        <div className="bg-slate-100 p-4 rounded-full mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-slate-900">No Notes Yet</h3>
        <p className="text-slate-500 mt-2 max-w-xs mb-6 text-sm">Generate notes & actions from the transcript or paste your own.</p>
        
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button 
            onClick={onGenerate}
            disabled={isBusy}
            className="w-full py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition disabled:opacity-50 flex items-center justify-center gap-2 font-bold text-sm shadow-sm"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Generating...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate Notes
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsEditing(true)}
              className="flex-1 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition flex items-center justify-center gap-2 text-sm font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Manual Input
            </button>
            
            {onRelink && (
              <label className="flex-1 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition flex items-center justify-center gap-2 text-sm font-medium cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Re-import
                <input type="file" accept=".md,.txt" className="hidden" onChange={handleFileImport} />
              </label>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-full relative overflow-hidden min-h-[300px]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Notes & Actions
        </h2>
        
        <div className="flex items-center gap-2">
          {summary.trim() && !isEditing && (
            <>
              <button
                onClick={onGenerate}
                disabled={isBusy}
                className="text-[10px] font-bold px-2 py-1 text-slate-400 hover:text-brand-600 transition flex items-center gap-1 uppercase tracking-wider"
                title="Re-generate Notes"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 ${isGenerating ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {isGenerating ? 'Reloading...' : 'Reload'}
              </button>
              <button
                onClick={handleDownload}
                className="p-1.5 text-slate-400 hover:text-indigo-600 transition"
                title="Download Notes (Markdown)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
              <button
                onClick={handleCopy}
                className={`text-xs px-3 py-1 rounded-md transition border flex items-center gap-1 font-bold ${
                  copying 
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
                title="Copy Raw Markdown"
              >
                {copying ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m-7 10h7m-7-3h7" />
                    </svg>
                    Copy MD
                  </>
                )}
              </button>
              <button
                onClick={onJudgeSummary}
                disabled={isBusy}
                className="text-xs px-3 py-1 rounded-md transition border bg-white text-brand-600 border-brand-200 hover:bg-brand-50 font-bold flex items-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {isJudging ? 'Judging...' : 'Judge'}
              </button>
            </>
          )}
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className={`text-xs px-3 py-1 rounded-md transition border ${
              isEditing 
                ? 'bg-brand-50 text-brand-700 border-brand-200 font-bold' 
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {isEditing ? 'Preview' : 'Edit'}
          </button>
        </div>
      </div>

      <div className="flex-grow flex flex-col gap-4 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          {isEditing ? (
            <textarea
              className="w-full h-full p-4 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition resize-none text-slate-700 font-mono text-xs leading-relaxed"
              placeholder="**Meeting Notes**&#10;- Point 1&#10;&#10;**Action Items**&#10;- [ ] Task 1"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              spellCheck={false}
            />
          ) : (
            <div className="flex-grow overflow-y-auto custom-scrollbar markdown-body prose prose-slate prose-sm max-w-none pr-2">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SummarySection;
