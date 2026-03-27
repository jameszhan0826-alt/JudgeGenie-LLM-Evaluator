import React from 'react';
import { EmotionAnalysisResult } from '../types';

interface EmotionAnalysisProps {
  data: EmotionAnalysisResult | null;
  isLoading: boolean;
}

const EmotionAnalysis: React.FC<EmotionAnalysisProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-600 font-medium">AI Host is analyzing meeting emotions...</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
      <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        AI Host Emotion Report
      </h2>

      <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 italic text-slate-700 text-sm">
        "{data.aiHostReport}"
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="text-xs text-slate-500 uppercase tracking-wider font-bold">Conflict</div>
          <div className={`text-lg font-bold ${data.conflictDetected ? 'text-red-600' : 'text-emerald-600'}`}>
            {data.conflictDetected ? 'Detected' : 'None'}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="text-xs text-slate-500 uppercase tracking-wider font-bold">Consensus</div>
          <div className={`text-lg font-bold ${data.consensusReached ? 'text-emerald-600' : 'text-amber-600'}`}>
            {data.consensusReached ? 'Reached' : 'Pending'}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-700 mb-3">Participant Dynamics</h3>
        <div className="space-y-3">
          {data.participants.map((p, i) => (
            <div key={i} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
              <span className="font-medium text-slate-800">{p.name}</span>
              <span className="text-xs px-2 py-1 bg-white rounded-full border border-slate-200 capitalize">
                {p.dominantEmotion}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmotionAnalysis;
