import React, { useState, useEffect } from 'react';
import { EvaluationResult, EvaluationMetric } from '../types';

interface ScorecardProps {
  evaluation: EvaluationResult | null;
  onUpdate: (evaluation: EvaluationResult) => void;
  isLoading?: boolean;
}

interface ScoreBarProps {
  label: string;
  metric: EvaluationMetric;
  colorClass: string;
  isEditing: boolean;
  onUpdate: (metric: EvaluationMetric) => void;
  icon: React.ReactNode;
}

const ScoreBar: React.FC<ScoreBarProps> = ({ label, metric, colorClass, isEditing, onUpdate, icon }) => {
  const handleScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    onUpdate({ ...metric, score: isNaN(val) ? 0 : val });
  };

  const handleReasoningChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ ...metric, reasoning: e.target.value });
  };

  return (
    <div className="mb-4 group bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-3">
          <div className="bg-white p-2 rounded-lg shadow-sm text-slate-600 border border-slate-100">
            {icon}
          </div>
          <span className="text-sm font-bold text-slate-700">{label}</span>
        </div>

        {isEditing ? (
           <div className="flex items-center bg-white rounded-md border border-slate-200 px-2 py-1">
             <input 
               type="number" 
               min="1" 
               max="10" 
               value={metric.score} 
               onChange={handleScoreChange}
               className="w-12 text-sm text-right font-bold text-slate-900 focus:outline-none"
             />
             <span className="ml-1 text-xs font-bold text-slate-400">/10</span>
           </div>
        ) : (
           <div className="flex items-end gap-1">
              <span className={`text-xl font-bold ${colorClass.replace('bg-', 'text-')}`}>{metric.score}</span>
              <span className="text-xs text-slate-400 font-medium mb-1">/10</span>
           </div>
        )}
      </div>
      
      {!isEditing && (
        <div className="w-full bg-slate-200 rounded-full h-2.5 mb-3 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ease-out ${colorClass}`} 
            style={{ width: `${Math.min(Math.max(metric.score, 0), 10) * 10}%` }}
          ></div>
        </div>
      )}

      {isEditing ? (
        <input 
          type="text" 
          value={metric.reasoning} 
          onChange={handleReasoningChange}
          placeholder="Reasoning..."
          className="w-full text-xs text-slate-600 bg-white p-2.5 rounded border border-slate-300 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
        />
      ) : (
        <p className="text-xs text-slate-600 leading-relaxed pl-1 border-l-2 border-slate-300">
          {metric.reasoning}
        </p>
      )}
    </div>
  );
};

const ScorecardSkeleton = () => (
  <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden mt-6 animate-pulse">
    <div className="bg-slate-900 px-6 py-4 h-16 flex items-center justify-between">
      <div className="h-6 w-48 bg-slate-700 rounded"></div>
      <div className="h-6 w-24 bg-slate-700 rounded opacity-50"></div>
    </div>
    <div className="p-6">
      <div className="flex justify-center mb-10">
         <div className="flex flex-col items-center gap-2">
            <div className="h-20 w-20 bg-slate-200 rounded-full mb-1"></div>
            <div className="h-4 w-24 bg-slate-200 rounded"></div>
         </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-100 h-40">
             <div className="flex justify-between mb-3">
               <div className="h-8 w-8 bg-slate-200 rounded"></div>
               <div className="h-6 w-12 bg-slate-200 rounded"></div>
             </div>
             <div className="h-2.5 w-full bg-slate-200 rounded-full mb-3"></div>
             <div className="h-12 w-full bg-slate-200 rounded"></div>
          </div>
        ))}
      </div>
      <div className="mt-6 pt-6 border-t border-slate-100">
         <div className="h-5 w-32 bg-slate-200 rounded mb-3"></div>
         <div className="h-16 w-full bg-slate-50 rounded"></div>
      </div>
    </div>
  </div>
);

const Scorecard: React.FC<ScorecardProps> = ({ evaluation, onUpdate, isLoading = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localEval, setLocalEval] = useState<EvaluationResult | null>(null);

  useEffect(() => {
    if (evaluation) {
      setLocalEval(evaluation);
      // Reset edit mode when new external data comes in (e.g. after re-evaluation)
      setIsEditing(false);
    }
  }, [evaluation]);

  // Render skeleton for initial load (when loading and no previous data)
  if (isLoading && !localEval) {
      return <ScorecardSkeleton />;
  }

  if (!localEval) return null;

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'bg-emerald-500';
    if (score >= 5) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const handleMetricUpdate = (key: keyof Pick<EvaluationResult, 'accuracy' | 'completeness' | 'structure'>, newMetric: EvaluationMetric) => {
    setLocalEval(prev => prev ? { ...prev, [key]: newMetric } : null);
  };

  const handleOverallScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setLocalEval(prev => prev ? { ...prev, overallScore: isNaN(val) ? 0 : val } : null);
  };
  
  const handleOverallCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setLocalEval(prev => prev ? { ...prev, overallComment: val } : null);
  };

  const saveChanges = () => {
    if (localEval) {
      onUpdate(localEval);
      setIsEditing(false);
    }
  };

  const cancelChanges = () => {
    if (evaluation) {
      setLocalEval(evaluation);
    }
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden mt-6 animate-fade-in-up relative">
      
      {/* Loading Overlay for Re-evaluation */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-50 flex items-center justify-center transition-all duration-300">
           <div className="flex flex-col items-center bg-white p-6 rounded-2xl shadow-xl border border-slate-100 transform scale-100 animate-bounce-slight">
             <svg className="animate-spin h-8 w-8 text-brand-600 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
               <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
               <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
             </svg>
             <span className="text-sm font-bold text-slate-700">Updating Scorecard...</span>
           </div>
        </div>
      )}

      <div className="bg-slate-900 px-6 py-4 flex justify-between items-center">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
          </svg>
          Judge's Scorecard
        </h2>
        
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button 
                onClick={cancelChanges}
                className="text-xs text-slate-300 hover:text-white px-3 py-1 rounded border border-slate-600 hover:border-slate-400 transition"
              >
                Cancel
              </button>
              <button 
                onClick={saveChanges}
                className="text-xs bg-brand-600 text-white hover:bg-brand-500 px-3 py-1 rounded border border-brand-500 transition shadow-sm font-semibold"
              >
                Save
              </button>
            </>
          ) : (
            <>
              <span className="text-xs font-mono text-slate-400 border border-slate-700 px-2 py-1 rounded mr-2 hidden sm:inline-block">
                gemini-3-pro-preview
              </span>
              <button 
                onClick={() => setIsEditing(true)}
                className="text-xs bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white px-3 py-1 rounded border border-slate-700 transition flex items-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                Edit
              </button>
            </>
          )}
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-center justify-center mb-10">
          <div className="text-center">
            <div className={`text-6xl font-extrabold mb-2 ${getScoreColor(localEval.overallScore).replace('bg-', 'text-')}`}>
              {isEditing ? (
                <input 
                  type="number"
                  min="1"
                  max="10"
                  value={localEval.overallScore}
                  onChange={handleOverallScoreChange}
                  className="w-28 text-center border-b-4 border-slate-300 focus:border-brand-500 focus:outline-none bg-transparent"
                />
              ) : (
                localEval.overallScore
              )}
            </div>
            <div className="text-sm text-slate-400 uppercase tracking-wide font-bold">Overall Quality</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ScoreBar 
            label="Accuracy" 
            metric={localEval.accuracy} 
            colorClass={getScoreColor(localEval.accuracy.score)} 
            isEditing={isEditing}
            onUpdate={(m) => handleMetricUpdate('accuracy', m)}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <ScoreBar 
            label="Completeness" 
            metric={localEval.completeness} 
            colorClass={getScoreColor(localEval.completeness.score)} 
            isEditing={isEditing}
            onUpdate={(m) => handleMetricUpdate('completeness', m)}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            }
          />
          <ScoreBar 
            label="Structure" 
            metric={localEval.structure} 
            colorClass={getScoreColor(localEval.structure.score)} 
            isEditing={isEditing}
            onUpdate={(m) => handleMetricUpdate('structure', m)}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            }
          />
        </div>

        <div className="mt-6 pt-6 border-t border-slate-100">
          <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            Judge's Verdict
          </h3>
          {isEditing ? (
            <textarea
              value={localEval.overallComment}
              onChange={handleOverallCommentChange}
              rows={3}
              className="w-full text-sm text-slate-700 bg-white p-3 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none resize-none"
            />
          ) : (
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
               <p className="text-slate-700 text-sm leading-relaxed">
                 {localEval.overallComment}
               </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Scorecard;