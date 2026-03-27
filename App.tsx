
import React, { useState, useRef } from 'react';
import { FileText, CheckSquare, Scale, Share2, BarChart3, Film, Mic, Smile } from 'lucide-react';
import InputSection from './components/InputSection';
import SummarySection from './components/SummarySection';
import SettingsBar from './components/SettingsBar';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableSection } from './components/SortableSection';
import AudioRecap from './components/AudioRecap';
import Infographic from './components/Infographic';
import EmotionAnalysis from './components/EmotionAnalysis';
import { LoadingState, GeminiModel, HistoryItem, MindMapNode, HighlightResult, SummaryJudgeResult, TranscriptComparisonResult, InfographicData, EmotionAnalysisResult } from './types';
import { generateMeetingSummary, generateMindMap, identifyVideoHighlights, judgeSummary, compareTranscripts, generateAudioRecap, generateInfographicData, analyzeMeetingEmotion } from './services/geminiService';
import { changeLogService, ChangeLogEntry } from './services/changeLogService';
import { historyService } from './services/historyService';
import HistorySidebar from './components/HistorySidebar';
import ChangeLog from './components/ChangeLog';
import MindMap from './components/MindMap';
import HighlightPlayer from './components/HighlightPlayer';
import SummaryJudge from './components/SummaryJudge';
import TranscriptComparison from './components/TranscriptComparison';

const App: React.FC = () => {
  const [transcript, setTranscript] = useState<string>('');
  const [vttTranscript, setVttTranscript] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<ChangeLogEntry[]>([]);
  const [mindMapData, setMindMapData] = useState<MindMapNode | null>(null);
  const [highlights, setHighlights] = useState<HighlightResult | null>(null);
  const [summaryJudge, setSummaryJudge] = useState<SummaryJudgeResult | null>(null);
  const [transcriptComparison, setTranscriptComparison] = useState<TranscriptComparisonResult | null>(null);
  const [audioRecap, setAudioRecap] = useState<string | undefined>(undefined);
  const [infographicData, setInfographicData] = useState<InfographicData | undefined>(undefined);
  const [emotionData, setEmotionData] = useState<EmotionAnalysisResult | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string>(Date.now().toString());
  const [sectionOrder, setSectionOrder] = useState(['input', 'summary', 'mindmap', 'infographic', 'emotion', 'player', 'judge', 'comparison', 'recap']);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  function handleDragEnd(event: any) {
    const { active, over } = event;
    if (active.id !== over.id) {
      setSectionOrder((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }
  const sessionIdRef = useRef<string>(Date.now().toString());

  const saveToHistory = (updates: Partial<HistoryItem>) => {
    const item: HistoryItem = {
      id: sessionIdRef.current,
      timestamp: Date.now(),
      transcript,
      vttTranscript,
      summary,
      mindMapData: mindMapData || undefined,
      highlights: highlights || undefined,
      summaryJudge: summaryJudge || undefined,
      transcriptComparison: transcriptComparison || undefined,
      audioRecap: audioRecap || undefined,
      infographicData: infographicData || undefined,
      emotionData: emotionData || undefined,
      generatorModel,
      filename: uploadedFileName || undefined,
      ...updates
    };
    historyService.saveItem(item);
  };

  const handleLoadFromHistory = (item: HistoryItem) => {
    setError(null);
    sessionIdRef.current = item.id;
    setCurrentSessionId(item.id);
    setTranscript(item.transcript);
    setVttTranscript(item.vttTranscript || '');
    setSummary(item.summary || '');
    setMindMapData(item.mindMapData || null);
    setHighlights(item.highlights || null);
    setSummaryJudge(item.summaryJudge || null);
    setTranscriptComparison(item.transcriptComparison || null);
    setAudioRecap(item.audioRecap || undefined);
    setInfographicData(item.infographicData || undefined);
    setEmotionData(item.emotionData || null);
    setUploadedFileName(item.filename || '');
    setVideoSrc(null); // Reset video source since it's local
    if (item.generatorModel) setGeneratorModel(item.generatorModel);
    changeLogService.addLog('Session Loaded', `From History: ${item.filename || 'Pasted Transcript'}`);
    setLogs(changeLogService.getLogs());
  };

  // Model Selection State
  const [generatorModel, setGeneratorModel] = useState<GeminiModel>('gemini-3-flash-preview');
  const [optimizePrompt, setOptimizePrompt] = useState<boolean>(false);

  const handleNewSession = () => {
    const newId = Date.now().toString();
    sessionIdRef.current = newId;
    setCurrentSessionId(newId);
    setTranscript('');
    setVttTranscript('');
    setSummary('');
    setMindMapData(null);
    setHighlights(null);
    setSummaryJudge(null);
    setTranscriptComparison(null);
    setAudioRecap(undefined);
    setInfographicData(undefined);
    setUploadedFileName('');
    setVideoSrc(null);
  };

  const handleGenerateSummary = async () => {
    setError(null);
    setLoadingState(LoadingState.GENERATING_SUMMARY);
    
    try {
      const generatedSummary = await generateMeetingSummary(transcript, generatorModel, optimizePrompt, uploadedFileName);
      setSummary(generatedSummary);
      saveToHistory({ summary: generatedSummary });
      changeLogService.addLog('Notes & Actions Generated', `Model: ${generatorModel}, Optimize: ${optimizePrompt}`);
      setLogs(changeLogService.getLogs());
      
      // Auto-generate infographic
      await handleGenerateInfographic();
    } catch (err) {
      console.error("Summary/Infographic Generation Error:", err);
    } finally {
      setLoadingState(LoadingState.IDLE);
    }
  };

  const handleGenerateAudioRecap = async () => {
    if (!highlights) return;
    setError(null);
    setLoadingState(LoadingState.GENERATING_AUDIO_RECAP);
    try {
      const audio = await generateAudioRecap(highlights);
      setAudioRecap(audio);
      saveToHistory({ audioRecap: audio });
      changeLogService.addLog('Audio Recap Generated', 'Using gemini-2.5-flash-preview-tts');
      setLogs(changeLogService.getLogs());
    } catch (err) {
      console.error("Audio Recap Error:", err);
    } finally {
      setLoadingState(LoadingState.IDLE);
    }
  };

  const handleGenerateInfographic = async () => {
    if (!transcript) return;
    setError(null);
    setLoadingState(LoadingState.GENERATING_INFOGRAPHIC);
    try {
      const data = await generateInfographicData(transcript, generatorModel);
      setInfographicData(data);
      saveToHistory({ infographicData: data });
      changeLogService.addLog('Visual Infographic Generated', `Model: ${generatorModel}`);
      setLogs(changeLogService.getLogs());
    } catch (err) {
      console.error("Infographic Error:", err);
    } finally {
      setLoadingState(LoadingState.IDLE);
    }
  };

  const handleAnalyzeEmotion = async () => {
    if (!transcript) return;
    setError(null);
    setLoadingState(LoadingState.ANALYZING_EMOTION);
    try {
      const data = await analyzeMeetingEmotion(transcript, generatorModel);
      setEmotionData(data);
      saveToHistory({ emotionData: data });
      changeLogService.addLog('Emotion Analyzed', 'AI Host Report Generated');
      setLogs(changeLogService.getLogs());
    } catch (err) {
      console.error("Emotion Analysis Error:", err);
    } finally {
      setLoadingState(LoadingState.IDLE);
    }
  };

  const handleGenerateMindMap = async () => {
    if (!transcript) return;
    setError(null);
    setLoadingState(LoadingState.GENERATING_MINDMAP);
    try {
      const data = await generateMindMap(transcript, generatorModel);
      setMindMapData(data);
      saveToHistory({ mindMapData: data });
      changeLogService.addLog('Mind Map Generated', `Model: ${generatorModel}`);
      setLogs(changeLogService.getLogs());
      setTimeout(() => {
        document.getElementById('mindmap-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      console.error("Mind Map Error:", err);
    } finally {
      setLoadingState(LoadingState.IDLE);
    }
  };

  const handleGenerateHighlights = async () => {
    if (!vttTranscript) {
      setError("Highlights require a transcript with timestamps (VTT). Please upload a video to generate one.");
      return;
    }
    setError(null);
    setLoadingState(LoadingState.GENERATING_HIGHLIGHTS);
    try {
      const result = await identifyVideoHighlights(vttTranscript, generatorModel);
      setHighlights(result);
      saveToHistory({ highlights: result });
      changeLogService.addLog('Highlights Identified', `Model: ${generatorModel}, Segments: ${result.segments.length}`);
      setLogs(changeLogService.getLogs());
      setTimeout(() => {
        document.getElementById('highlights-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      console.error("Highlights Error:", err);
    } finally {
      setLoadingState(LoadingState.IDLE);
    }
  };

  const handleJudgeSummary = async () => {
    if (!transcript || !summary) return;
    setError(null);
    setLoadingState(LoadingState.JUDGING_SUMMARY);
    try {
      const result = await judgeSummary(transcript, summary, generatorModel);
      setSummaryJudge(result);
      saveToHistory({ summaryJudge: result });
      changeLogService.addLog('Summary Judged', `Score: ${result.score}/10`);
      setLogs(changeLogService.getLogs());
    } catch (err) {
      console.error("Summary Judge Error:", err);
    } finally {
      setLoadingState(LoadingState.IDLE);
    }
  };

  const handleCompareTranscript = async (reference: string) => {
    if (!transcript) return;
    setError(null);
    setLoadingState(LoadingState.COMPARING_TRANSCRIPT);
    try {
      const result = await compareTranscripts(reference, transcript, generatorModel);
      setTranscriptComparison(result);
      saveToHistory({ transcriptComparison: result });
      changeLogService.addLog('Transcript Compared', `Accuracy: ${result.accuracyScore}%`);
      setLogs(changeLogService.getLogs());
    } catch (err) {
      console.error("Transcript Comparison Error:", err);
    } finally {
      setLoadingState(LoadingState.IDLE);
    }
  };

  const sections: { [key: string]: React.ReactNode } = {
    input: <InputSection 
      transcript={transcript} 
      setTranscript={setTranscript} 
      vttTranscript={vttTranscript}
      setVttTranscript={setVttTranscript}
      onGenerate={handleGenerateSummary}
      onGenerateMindMap={handleGenerateMindMap}
      onGenerateHighlights={handleGenerateHighlights}
      loadingState={loadingState}
      setLoadingState={setLoadingState}
      setVideoSrc={setVideoSrc}
      model={generatorModel}
      onSaveToHistory={saveToHistory}
      onNewSession={handleNewSession}
      onError={setError}
      onCompareTranscript={handleCompareTranscript}
      onAnalyzeEmotion={handleAnalyzeEmotion}
      uploadedFileName={uploadedFileName}
      setUploadedFileName={setUploadedFileName}
    />,
    summary: <SummarySection 
      summary={summary} 
      setSummary={setSummary} 
      loadingState={loadingState} 
      onJudgeSummary={handleJudgeSummary}
    />,
    mindmap: (mindMapData || loadingState === LoadingState.GENERATING_MINDMAP) && (
      <div id="mindmap-section">
        <MindMap 
          data={mindMapData}
          isLoading={loadingState === LoadingState.GENERATING_MINDMAP}
        />
      </div>
    ),
    infographic: (infographicData || loadingState === LoadingState.GENERATING_INFOGRAPHIC) && (
      <div id="infographic-section">
        <Infographic 
          data={infographicData}
          onGenerate={handleGenerateInfographic}
          loadingState={loadingState}
        />
      </div>
    ),
    emotion: (emotionData || loadingState === LoadingState.ANALYZING_EMOTION) && (
      <div id="emotion-section">
        <EmotionAnalysis 
          data={emotionData}
          isLoading={loadingState === LoadingState.ANALYZING_EMOTION}
        />
      </div>
    ),
    player: (highlights || loadingState === LoadingState.GENERATING_HIGHLIGHTS) && (
      <div id="player-section">
        <HighlightPlayer 
          videoSrc={videoSrc}
          segments={highlights?.segments || []}
          isLoading={loadingState === LoadingState.GENERATING_HIGHLIGHTS}
          onRelinkVideo={setVideoSrc}
        />
      </div>
    ),
    judge: (summaryJudge || loadingState === LoadingState.JUDGING_SUMMARY) && (
      <SummaryJudge 
        result={summaryJudge}
        isLoading={loadingState === LoadingState.JUDGING_SUMMARY}
      />
    ),
    comparison: (transcriptComparison || loadingState === LoadingState.COMPARING_TRANSCRIPT) && (
      <TranscriptComparison 
        result={transcriptComparison}
        isLoading={loadingState === LoadingState.COMPARING_TRANSCRIPT}
      />
    ),
    recap: (audioRecap || loadingState === LoadingState.GENERATING_AUDIO_RECAP) && (
      <AudioRecap 
        audioBase64={audioRecap}
        onGenerate={handleGenerateAudioRecap}
        loadingState={loadingState}
        onRelink={(base64) => {
          setAudioRecap(base64);
          saveToHistory({ audioRecap: base64 });
          changeLogService.addLog('Audio Recap Relinked', 'Manual upload');
          setLogs(changeLogService.getLogs());
        }}
      />
    )
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-6">
          <div className="text-left">
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl mb-2">
              Idea<span className="text-brand-600">Spark</span> <span className="text-2xl sm:text-3xl text-slate-500 font-medium tracking-normal">for Content</span>
            </h1>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              {[
                { name: 'Transcript', icon: FileText },
                { name: 'Notes & Actions', icon: CheckSquare },
                { name: 'Compare & Judge', icon: Scale },
                { name: 'Mindmap', icon: Share2 },
                { name: 'Infographic', icon: BarChart3 },
                { name: 'Video Highlights', icon: Film },
                { name: 'Audio Recap', icon: Mic },
                { name: 'Emotion (Upcoming)', icon: Smile },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm text-sm font-medium text-slate-700 hover:border-brand-300 transition">
                  <item.icon className="w-4 h-4 text-brand-600" />
                  {item.name}
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleNewSession}
              className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition text-slate-600 flex items-center gap-2 font-bold text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New
            </button>
            <button 
              onClick={() => setIsHistoryOpen(true)}
              className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition text-slate-600 flex items-center gap-2 font-bold text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              History
            </button>
          </div>
        </header>

        <HistorySidebar 
          isOpen={isHistoryOpen} 
          onClose={() => setIsHistoryOpen(false)} 
          onSelect={handleLoadFromHistory}
          onClear={() => { historyService.clearHistory(); setLogs([]); }}
          currentSessionId={currentSessionId}
        />

        {/* Configuration Bar */}
        <SettingsBar 
          generatorModel={generatorModel} 
          setGeneratorModel={setGeneratorModel}
          optimizePrompt={optimizePrompt}
          setOptimizePrompt={setOptimizePrompt}
          disabled={loadingState !== LoadingState.IDLE}
        />

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sectionOrder} strategy={verticalListSortingStrategy}>
            {sectionOrder.map((id) => (
              <SortableSection key={id} id={id}>
                {sections[id]}
              </SortableSection>
            ))}
          </SortableContext>
        </DndContext>

        {/* Comparison Result */}
        {/* Comparison Result is now handled by the sections object */}

        {/* Summary Judge Result */}
        {/* Summary Judge Result is now handled by the sections object */}

        {/* Highlights Player & Side Assets */}
        {/* Highlights Player & Side Assets are now handled by the sections object */}

        {/* Mind Map & Infographic Row */}
        {/* Mind Map & Infographic Row are now handled by the sections object */}

        {/* Change Log */}
        <ChangeLog logs={logs} />

      </div>

      {/* Global Loading Overlay */}
      {loadingState !== LoadingState.IDLE && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-brand-50 rounded-xl">
                {loadingState === LoadingState.TRANSCRIBING ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                ) : loadingState === LoadingState.GENERATING_SUMMARY ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {loadingState === LoadingState.TRANSCRIBING ? 'Transcribing Media' : 
                   loadingState === LoadingState.GENERATING_SUMMARY ? 'Generating Notes & Actions' : 
                   loadingState === LoadingState.GENERATING_MINDMAP ? 'Creating Mind Map' :
                   loadingState === LoadingState.GENERATING_HIGHLIGHTS ? 'Identifying Highlights' :
                   loadingState === LoadingState.JUDGING_SUMMARY ? 'Judging Summary' :
                   loadingState === LoadingState.COMPARING_TRANSCRIPT ? 'Comparing Transcripts' :
                   'Processing...'}
                 </h3>
                <p className="text-sm text-slate-500">
                  {loadingState === LoadingState.TRANSCRIBING ? 'Processing audio...' : 
                   loadingState === LoadingState.GENERATING_SUMMARY ? 'Synthesizing notes...' : 
                   loadingState === LoadingState.GENERATING_MINDMAP ? 'Structuring themes...' :
                   loadingState === LoadingState.GENERATING_HIGHLIGHTS ? 'Finding key moments...' :
                   loadingState === LoadingState.JUDGING_SUMMARY ? 'Evaluating quality...' :
                   loadingState === LoadingState.COMPARING_TRANSCRIPT ? 'Analyzing differences...' :
                   loadingState === LoadingState.GENERATING_AUDIO_RECAP ? 'Synthesizing voice...' :
                   loadingState === LoadingState.GENERATING_INFOGRAPHIC ? 'Designing layout...' :
                   'Working...'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-brand-600 transition-all duration-500 ease-out rounded-full"
                  style={{ 
                    width: loadingState === LoadingState.TRANSCRIBING ? '20%' : 
                           loadingState === LoadingState.GENERATING_SUMMARY ? '40%' : 
                           loadingState === LoadingState.GENERATING_MINDMAP ? '60%' :
                           loadingState === LoadingState.GENERATING_HIGHLIGHTS ? '80%' : '100%' 
                  }}
                ></div>
              </div>
              <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <span className={loadingState === LoadingState.TRANSCRIBING ? 'text-brand-600' : ''}>Transcribe</span>
                <span className={loadingState === LoadingState.GENERATING_SUMMARY ? 'text-brand-600' : ''}>Notes</span>
                <span className={loadingState === LoadingState.GENERATING_MINDMAP ? 'text-brand-600' : ''}>MindMap</span>
                <span className={loadingState === LoadingState.GENERATING_HIGHLIGHTS ? 'text-brand-600' : ''}>Highlights</span>
                <span className={(loadingState === LoadingState.GENERATING_AUDIO_RECAP || loadingState === LoadingState.GENERATING_INFOGRAPHIC) ? 'text-brand-600' : ''}>Assets</span>
              </div>
            </div>

            <p className="text-slate-600 text-sm leading-relaxed">
              {loadingState === LoadingState.TRANSCRIBING 
                ? 'Our AI is listening to your recording and converting it to text. This may take a moment depending on the file size.'
                : 'Processing your request with Gemini. We are refining the content and ensuring high quality results.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
