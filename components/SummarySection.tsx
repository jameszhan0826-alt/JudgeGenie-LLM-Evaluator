
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { LoadingState } from '../types';

interface SummarySectionProps {
  summary: string;
  setSummary: (summary: string) => void;
  loadingState: LoadingState;
  onJudgeSummary: () => void;
}

const SummarySection: React.FC<SummarySectionProps> = ({ 
  summary, 
  setSummary,
  loadingState,
  onJudgeSummary
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [copying, setCopying] = useState(false);

  const isBusy = loadingState !== LoadingState.IDLE;
  const isJudging = loadingState === LoadingState.JUDGING_SUMMARY;

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
        
        <button 
          onClick={() => setIsEditing(true)}
          className="text-brand-600 font-medium hover:text-brand-700 flex items-center gap-1 text-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Manually input notes
        </button>
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
