import React, { useState, useEffect } from 'react';
import { LoadingState } from '../types';
import ReactMarkdown from 'react-markdown';

interface SummarySectionProps {
  summary: string;
  setSummary: (summary: string) => void;
  onEvaluate: () => void;
  loadingState: LoadingState;
  hasEvaluated: boolean;
}

const SummarySection: React.FC<SummarySectionProps> = ({ 
  summary, 
  setSummary,
  onEvaluate, 
  loadingState,
  hasEvaluated
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const isEvaluating = loadingState === LoadingState.EVALUATING;

  // Automatically exit edit mode when a new summary is generated via loading state change
  useEffect(() => {
    if (loadingState === LoadingState.GENERATING_SUMMARY) {
      setIsEditing(false);
    }
  }, [loadingState]);

  // If no summary and not editing, show empty state
  if (!summary && !isEditing) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 h-full flex flex-col items-center justify-center text-center">
        <div className="bg-slate-100 p-4 rounded-full mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-slate-900">No Summary Yet</h3>
        <p className="text-slate-500 mt-2 max-w-xs mb-6">Generate a summary from the transcript or paste your own notes to enable the AI Judge.</p>
        
        <button 
          onClick={() => setIsEditing(true)}
          className="text-brand-600 font-medium hover:text-brand-700 flex items-center gap-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Write/Paste Notes manually
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-full relative overflow-hidden">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Notes & Actions
        </h2>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className={`text-xs px-3 py-1 rounded-md transition border ${
              isEditing 
                ? 'bg-brand-50 text-brand-700 border-brand-200' 
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {isEditing ? 'Preview' : 'Edit'}
          </button>
          {!isEditing && (
            <span className="text-xs font-semibold px-2 py-1 bg-indigo-100 text-indigo-700 rounded border border-indigo-200">
              gemini-2.5-flash
            </span>
          )}
        </div>
      </div>

      <div className="flex-grow overflow-y-auto custom-scrollbar">
        {isEditing ? (
          <textarea
            className="w-full h-full p-4 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition resize-none text-slate-700 font-mono text-sm leading-relaxed"
            placeholder="**Meeting Notes**&#10;- Point 1&#10;&#10;**Action Items**&#10;- [ ] Task 1"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            spellCheck={false}
          />
        ) : (
          <div className="prose prose-slate prose-sm max-w-none pr-2">
            <ReactMarkdown>{summary}</ReactMarkdown>
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
         <p className="text-xs text-slate-400">
            Review the notes before running the judge.
         </p>
         <button
            onClick={onEvaluate}
            disabled={isEvaluating || !summary.trim()}
            className={`px-5 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
              isEvaluating || !summary.trim()
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg'
            }`}
         >
            {isEvaluating ? (
               <>
                 <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
                 Judging...
               </>
            ) : hasEvaluated ? (
               <>
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                 </svg>
                 Re-evaluate
               </>
            ) : (
               <>
                 Quality Check
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                 </svg>
               </>
            )}
         </button>
      </div>
    </div>
  );
};

export default SummarySection;