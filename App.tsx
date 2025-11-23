import React, { useState, useCallback } from 'react';
import { analyzePhilosophyText, generateConceptImage } from './services/geminiService';
import { VisualConcept, GeneratedResult, AppState } from './types';
import { PLACEHOLDER_TEXT } from './constants';
import Button from './components/Button';
import ResultCard from './components/ResultCard';

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [results, setResults] = useState<GeneratedResult[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAnalyzeAndGenerate = useCallback(async () => {
    if (!inputText.trim()) return;

    setAppState(AppState.ANALYZING);
    setErrorMsg(null);

    try {
      // 1. Analyze text to get structural concepts
      const concepts = await analyzePhilosophyText(inputText);
      
      // Initialize new results with loading state
      const newResults: GeneratedResult[] = concepts.map((concept, index) => ({
        id: `res-${Date.now()}-${index}`,
        concept,
        imageUrl: null,
        isLoading: true
      }));

      // Prepend new results to the existing list (keep history)
      setResults(prev => [...newResults, ...prev]);
      setAppState(AppState.GENERATING);

      // 2. Generate diagram images for each NEW concept in parallel
      const imagePromises = newResults.map(async (res) => {
        try {
          const base64Image = await generateConceptImage(res.concept.visualPrompt);
          
          setResults(prev => prev.map(item => 
            item.id === res.id 
              ? { ...item, imageUrl: base64Image, isLoading: false } 
              : item
          ));
        } catch (err) {
          console.error(`Failed to generate image for ${res.concept.conceptTitle}`, err);
          setResults(prev => prev.map(item => 
             item.id === res.id 
               ? { ...item, isLoading: false, error: "Generation failed" } 
               : item
          ));
        }
      });

      await Promise.all(imagePromises);
      setAppState(AppState.COMPLETE);

    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || "分析过程中发生意外错误。");
      setAppState(AppState.ERROR);
    }
  }, [inputText]);

  const handleDeleteResult = (id: string) => {
    setResults(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-20">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
                <div className="w-3 h-6 bg-philo-accent rounded-sm"></div>
                <div className="w-3 h-4 bg-slate-300 rounded-sm self-end"></div>
                <div className="w-3 h-8 bg-slate-800 rounded-sm self-center"></div>
            </div>
            <h1 className="font-sans text-xl font-bold tracking-tight text-slate-900">
              Philo<span className="text-philo-accent">Flow</span> <span className="text-slate-400 font-normal ml-2 text-sm">哲学图解</span>
            </h1>
          </div>
          <div className="hidden sm:flex gap-4 text-xs font-medium text-slate-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Gemini 3 Pro (逻辑)</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Nano Banana (绘图)</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        
        {/* Intro */}
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            结构分析与图表生成
          </h2>
          <p className="text-slate-500 max-w-3xl text-lg">
            将复杂的哲学文本转化为清晰的示意图和流程图。我们使用 Gemini 解析逻辑，并使用 Nano Banana 绘制图表。
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm mb-12">
          <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
            输入文本 / 逻辑描述
          </label>
          <textarea
            className="w-full h-40 bg-slate-50 border border-slate-200 rounded-lg p-4 text-base font-mono text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-philo-accent/20 focus:border-philo-accent outline-none transition-all resize-y"
            placeholder={PLACEHOLDER_TEXT}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          
          <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
             <div className="text-slate-400 text-xs flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                适用于：复杂过程、逻辑链、层级结构
             </div>
            <div className="flex gap-3 w-full sm:w-auto">
                <Button 
                    variant="secondary" 
                    onClick={() => setInputText(PLACEHOLDER_TEXT)}
                    className="w-full sm:w-auto"
                    disabled={appState === AppState.ANALYZING} // Allow clicking even if generating images
                >
                    加载示例
                </Button>
                <Button 
                    onClick={handleAnalyzeAndGenerate} 
                    isLoading={appState === AppState.ANALYZING}
                    className="w-full sm:w-auto min-w-[180px]"
                    disabled={!inputText.trim()}
                >
                    {appState === AppState.ANALYZING ? '正在分析结构...' : '生成图解'}
                </Button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {appState === AppState.ERROR && errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-8 text-sm font-medium flex items-center gap-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            {errorMsg}
          </div>
        )}

        {/* Results Section */}
        <div className="space-y-8">
           {results.length > 0 && (
               <div className="flex items-center gap-4">
                   <h3 className="font-bold text-slate-900 text-lg">图表库 ({results.length})</h3>
                   <div className="h-px bg-slate-200 flex-grow"></div>
               </div>
           )}

           <div className="grid grid-cols-1 gap-8">
            {results.map((result) => (
                <ResultCard 
                  key={result.id} 
                  result={result} 
                  onDelete={() => handleDeleteResult(result.id)}
                />
            ))}
           </div>
        </div>

        {/* Empty State */}
        {results.length === 0 && appState === AppState.IDLE && (
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-16 text-center">
                <div className="w-16 h-16 bg-slate-100 text-slate-300 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                </div>
                <h3 className="text-slate-900 font-medium mb-1">尚未生成图表</h3>
                <p className="text-slate-500 text-sm">在上方输入文本以使其逻辑可视化。</p>
            </div>
        )}

      </main>
    </div>
  );
};

export default App;