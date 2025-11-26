import React from 'react';
import { LoadingState } from '../types';

interface InputSectionProps {
  transcript: string;
  setTranscript: (text: string) => void;
  onGenerate: () => void;
  loadingState: LoadingState;
}

const InputSection: React.FC<InputSectionProps> = ({ 
  transcript, 
  setTranscript, 
  onGenerate, 
  loadingState 
}) => {
  const isGenerating = loadingState === LoadingState.GENERATING_SUMMARY;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-full">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          Original Transcript
        </h2>
        <p className="text-sm text-slate-500 mt-1">Paste your meeting notes or transcript here.</p>
      </div>
      
      <textarea
        className="flex-grow w-full p-4 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition resize-none text-slate-700 font-mono text-sm"
        placeholder="Speaker A: Let's discuss the project timeline..."
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        disabled={isGenerating}
      />

      <div className="mt-4 flex justify-end">
        <button
          onClick={onGenerate}
          disabled={!transcript.trim() || isGenerating}
          className={`px-6 py-2.5 rounded-lg font-medium transition flex items-center gap-2 ${
            !transcript.trim() || isGenerating
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-brand-600 text-white hover:bg-brand-700 shadow-md hover:shadow-lg'
          }`}
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </>
          ) : (
            <>
              Generate Notes & Actions
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default InputSection;
