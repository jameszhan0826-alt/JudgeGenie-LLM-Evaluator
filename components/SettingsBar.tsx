
import React from 'react';
import { GeminiModel } from '../types';

interface SettingsBarProps {
  generatorModel: GeminiModel;
  setGeneratorModel: (m: GeminiModel) => void;
  optimizePrompt: boolean;
  setOptimizePrompt: (b: boolean) => void;
  disabled: boolean;
}

const SettingsBar: React.FC<SettingsBarProps> = ({
  generatorModel,
  setGeneratorModel,
  optimizePrompt,
  setOptimizePrompt,
  disabled
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-8 flex flex-col lg:flex-row items-stretch gap-6">
      {/* Generator Section */}
      <div className="flex items-start gap-3 flex-1 p-2 rounded-lg hover:bg-slate-50 transition-colors">
        <div className="bg-brand-100 p-2.5 rounded-xl mt-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-600" viewBox="0 0 20 20" fill="currentColor">
            <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
            <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="flex-1">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">AI Engine Model</label>
          <select 
            value={generatorModel}
            onChange={(e) => setGeneratorModel(e.target.value as GeminiModel)}
            disabled={disabled}
            className="w-full bg-transparent text-sm font-bold text-slate-800 focus:outline-none cursor-pointer disabled:opacity-50 appearance-none"
          >
            <option value="gemini-flash-lite-latest">Gemini 2.5 Flash Lite (Mini-tier / Efficient)</option>
            <option value="gemini-3.1-flash-lite-preview">Gemini 3.1 Flash Lite (Mini-tier / Efficient)</option>
            <option value="gemini-3-flash-preview">Gemini 3.0 Flash (Balanced Tier)</option>
            <option value="gemini-3-pro-preview">Gemini 3.0 Pro (Intelligence Tier)</option>
            <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Intelligence Tier)</option>
          </select>
          <p className="text-[10px] text-slate-400 mt-1 italic">
            {(generatorModel === 'gemini-flash-lite-latest' || generatorModel === 'gemini-3.1-flash-lite-preview') && "Lowest latency, similar to 4o-mini."}
            {generatorModel === 'gemini-3-flash-preview' && "Great for complex meeting transcripts."}
            {(generatorModel === 'gemini-3-pro-preview' || generatorModel === 'gemini-3.1-pro-preview') && "Highest creative quality & recall."}
          </p>
          
          <div className="mt-3 flex items-center gap-2">
            <input 
              type="checkbox"
              id="optimizePrompt"
              checked={optimizePrompt}
              onChange={(e) => setOptimizePrompt(e.target.checked)}
              disabled={disabled}
              className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300 rounded"
            />
            <label htmlFor="optimizePrompt" className="text-xs text-slate-600 font-medium">Optimize Prompt</label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsBar;
