
import React from 'react';
import { TranscriptComparisonResult } from '../types';

interface TranscriptComparisonProps {
  result: TranscriptComparisonResult | null;
  isLoading: boolean;
}

const TranscriptComparison: React.FC<TranscriptComparisonProps> = ({ result, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/4 mb-4"></div>
        <div className="h-4 bg-slate-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
      </div>
    );
  }

  if (!result) return null;

  const getAccuracyColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (score >= 70) return 'text-amber-600 bg-amber-50 border-amber-100';
    return 'text-red-600 bg-red-50 border-red-100';
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'insertion': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'deletion': return 'text-red-600 bg-red-50 border-red-100';
      case 'substitution': return 'text-amber-600 bg-amber-50 border-amber-100';
      default: return 'text-slate-600 bg-slate-50 border-slate-100';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Transcript Comparison Results
        </h2>
        <div className={`px-4 py-1.5 rounded-full border font-bold text-lg ${getAccuracyColor(result.accuracyScore)}`}>
          {result.accuracyScore}% Accuracy
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Overall Feedback</h3>
          <p className="text-slate-700 leading-relaxed">{result.overallFeedback}</p>
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Key Differences Identified</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-2 font-bold text-slate-600 uppercase tracking-widest text-[10px]">Type</th>
                  <th className="px-4 py-2 font-bold text-slate-600 uppercase tracking-widest text-[10px]">Reference</th>
                  <th className="px-4 py-2 font-bold text-slate-600 uppercase tracking-widest text-[10px]">Generated</th>
                  <th className="px-4 py-2 font-bold text-slate-600 uppercase tracking-widest text-[10px]">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.differences.map((diff, index) => (
                  <tr key={index} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getTypeColor(diff.type)}`}>
                        {diff.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-mono text-xs">{diff.original}</td>
                    <td className="px-4 py-3 text-slate-700 font-mono text-xs">{diff.generated}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{diff.timestamp || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranscriptComparison;
