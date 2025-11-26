import React, { useState } from 'react';
import InputSection from './components/InputSection';
import SummarySection from './components/SummarySection';
import Scorecard from './components/Scorecard';
import { generateMeetingSummary, evaluateSummaryQuality } from './services/geminiService';
import { EvaluationResult, LoadingState } from './types';

// Default example transcript to help user get started quickly
const DEFAULT_TRANSCRIPT = `Speaker 1: Alright, let's get started. The main goal today is to finalize the launch date for the mobile app.
Speaker 2: I've spoken with the dev team. They still need about two weeks to clear the critical bugs in the login module.
Speaker 1: Two weeks? That pushes us past our Q3 deadline.
Speaker 2: Yes, but if we launch now, user retention will suffer. It's better to delay.
Speaker 3: Marketing is ready to go, but we can pause the ad spend. I agree, quality first.
Speaker 1: Okay. Let's officially move the launch date to October 15th.
Speaker 2: I'll notify the engineering team.
Speaker 3: I will update the social media calendar.
Speaker 1: Great. Also, we need to hire a new QA lead by next Friday.
Speaker 2: Agreed. I'll post the job listing tomorrow.`;

const App: React.FC = () => {
  const [transcript, setTranscript] = useState<string>(DEFAULT_TRANSCRIPT);
  const [summary, setSummary] = useState<string>('');
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateSummary = async () => {
    setError(null);
    setLoadingState(LoadingState.GENERATING_SUMMARY);
    setEvaluation(null); // Reset evaluation when new summary is generated
    
    try {
      const generatedSummary = await generateMeetingSummary(transcript);
      setSummary(generatedSummary);
    } catch (err) {
      setError("Failed to generate summary. Please try again.");
    } finally {
      setLoadingState(LoadingState.IDLE);
    }
  };

  const handleEvaluateSummary = async () => {
    if (!summary || !transcript) return;
    
    setError(null);
    setLoadingState(LoadingState.EVALUATING);

    try {
      const result = await evaluateSummaryQuality(transcript, summary);
      setEvaluation(result);
    } catch (err) {
      setError("Failed to evaluate the summary. Please try again.");
    } finally {
      setLoadingState(LoadingState.IDLE);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl mb-2">
            Judge<span className="text-brand-600">Genie</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            LLM-as-a-Judge framework for meeting summaries. 
            <br />
            <span className="text-sm text-slate-500">
              Generate with <b>Flash 2.5</b> • Critique with <b>Pro 3.0</b>
            </span>
          </p>
        </header>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
          <InputSection 
            transcript={transcript} 
            setTranscript={setTranscript} 
            onGenerate={handleGenerateSummary}
            loadingState={loadingState}
          />
          <SummarySection 
            summary={summary}
            setSummary={setSummary}
            onEvaluate={handleEvaluateSummary}
            loadingState={loadingState}
            hasEvaluated={!!evaluation}
          />
        </div>

        {/* Scorecard Results (Full Width) */}
        {evaluation && (
          <div id="scorecard-section">
            <Scorecard 
              evaluation={evaluation} 
              onUpdate={setEvaluation}
            />
          </div>
        )}

      </div>
    </div>
  );
};

export default App;