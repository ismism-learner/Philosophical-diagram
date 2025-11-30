
import React, { useState, useCallback, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import FileSaver from 'file-saver';
import html2canvas from 'html2canvas';
import { chunkText, analyzeSingleChunk, generateConceptImage, setApiKey, initApiKey, hasUserApiKey } from './services/geminiService';
import { GeneratedResult, AppState, AppMode, ResultStatus, Language } from './types';
import { UI_TEXT } from './constants';
import Button from './components/Button';
import ResultCard from './components/ResultCard';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode | null>(null); // Null means Landing Screen
  const [language, setLanguage] = useState<Language>(Language.ZH);
  const t = UI_TEXT[language];
  
  const [inputText, setInputText] = useState('');
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [results, setResults] = useState<GeneratedResult[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [hasApiKey, setHasApiKey] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [rememberKey, setRememberKey] = useState(false);
  
  // Rate Limit Monitor
  const [requestHistory, setRequestHistory] = useState<number[]>([]);
  const [sessionTotalRequests, setSessionTotalRequests] = useState(0);

  // Default to SD (Flash Image) for free quota usage
  const [isHD, setIsHD] = useState(false);
  const [isDownloadingBatch, setIsDownloadingBatch] = useState(false);

  // Landing Page Hover State
  const [hoveredSide, setHoveredSide] = useState<'classic' | 'modern' | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // 1. Initialize Saved Key
    const loaded = initApiKey();
    if (loaded) {
        setHasApiKey(true);
    }

    // 2. Check Built-in Key (if using AI Studio environment)
    const checkAIStudioKey = async () => {
      try {
        const keyExists = await (window as any).aistudio.hasSelectedApiKey();
        if (keyExists) setHasApiKey(true);
      } catch (e) {
        // console.error("Failed to check API key:", e);
      }
    };
    checkAIStudioKey();
  }, []);

  // Monitor Cleanup: Remove timestamps older than 60s to keep RPM accurate
  useEffect(() => {
    const interval = setInterval(() => {
        const now = Date.now();
        setRequestHistory(prev => prev.filter(t => now - t < 60000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const trackRequest = () => {
    const now = Date.now();
    setRequestHistory(prev => [...prev, now]);
    setSessionTotalRequests(prev => prev + 1);
  };

  // Set default text when mode changes
  useEffect(() => {
    if (mode === AppMode.CLASSIC && !inputText) setInputText('');
    if (mode === AppMode.MODERN && !inputText) setInputText('');
  }, [mode]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === Language.ZH ? Language.EN : Language.ZH);
  };

  const handleSaveApiKey = () => {
    if (apiKeyInput.trim()) {
      setApiKey(apiKeyInput.trim(), rememberKey);
      setHasApiKey(true);
      setShowApiKeyModal(false);
      setApiKeyInput('');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setInputText(text);
    };
    reader.readAsText(file);
  };

  // Helper to update a specific result
  const updateResult = (id: string, updates: Partial<GeneratedResult>) => {
    setResults(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const handleAnalyzeAndGenerate = useCallback(async () => {
    if (!inputText.trim() || !mode) return;

    if (isHD && !hasApiKey) {
      const confirmed = window.confirm(t.alertHDConfirm);
      if (confirmed) {
         setShowApiKeyModal(true);
         return;
      } else {
        setIsHD(false); 
      }
    }

    setAppState(AppState.PROCESSING);
    setErrorMsg(null);

    // 1. Immediate Population: Chunk Text and Show "Waiting" Cards
    const chunks = chunkText(inputText);
    const newItems: GeneratedResult[] = chunks.map((chunk, i) => ({
      id: `res-${Date.now()}-${i}`,
      mode: mode,
      sourceText: chunk,
      status: ResultStatus.WAITING,
      imageUrl: null
    }));

    // Prepend new items to the list
    setResults(prev => [...newItems, ...prev]);

    // 2. Sequential Processing Queue
    const processQueue = async () => {
        let quotaExceeded = false;

        for (const item of newItems) {
            // Stop processing if we hit a quota limit previously
            if (quotaExceeded) {
                updateResult(item.id, { 
                  status: ResultStatus.ERROR, 
                  error: "Queue paused: API Quota Exceeded" 
                });
                continue;
            }

            // Process item and capture error if critical
            const error = await processSingleItem(item.id, item.sourceText, mode);
            
            if (error) {
               // Check for rate limit / quota strings
               const errStr = JSON.stringify(error);
               if (errStr.includes("429") || errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("quota")) {
                   // With infinite retry logic in service, we might rarely reach here unless max retries logic changes.
                   // But if we do, pause.
                   quotaExceeded = true;
                   setAppState(AppState.ERROR);
                   setErrorMsg(isModern ? t.alertQuotaModern : t.alertQuota);
                   // Note: service now has infinite retry, so processSingleItem might take a long time but eventually succeed.
               }
            }
            
            // Rate Limit Enforcement:
            // Free Tier Limit: ~10-15 RPM.
            // Increase delay to 10000ms (10s) to be very safe against 429s.
            await new Promise(resolve => setTimeout(resolve, 10000));
        }
        
        if (!quotaExceeded) {
            setAppState(AppState.COMPLETE);
        }
    };

    processQueue();

  }, [inputText, isHD, hasApiKey, mode, language]); // Added language to dependency if it affects processing (it doesn't directly but good for re-render)

  // Returns error object if failed, null if success
  const processSingleItem = async (id: string, source: string, mode: AppMode): Promise<any | null> => {
    try {
        // Step A: Analyze Text
        updateResult(id, { status: ResultStatus.ANALYZING });
        trackRequest(); // Monitor Request
        
        // Pass current language to analysis service
        const concept = await analyzeSingleChunk(source, mode, language);
        if (!concept) throw new Error("Concept analysis returned null");

        // Step B: Generate Image
        updateResult(id, { status: ResultStatus.GENERATING, concept });
        trackRequest(); // Monitor Request
        
        const currentBatchIsHD = isHD && hasApiKey;
        const base64Image = await generateConceptImage(concept.visualPrompt, mode, currentBatchIsHD);

        // Step C: Success
        updateResult(id, { status: ResultStatus.SUCCESS, imageUrl: base64Image });
        return null;

    } catch (e: any) {
        console.error(`Processing failed for item ${id}`, e);
        const errMsg = e.message || "Processing failed";
        updateResult(id, { status: ResultStatus.ERROR, error: errMsg });
        return e;
    }
  };

  const handleRetryGeneration = async (id: string, visualPrompt: string | undefined, cardMode: AppMode) => {
    if (!visualPrompt) return;
    const currentBatchIsHD = isHD && hasApiKey;
    
    updateResult(id, { status: ResultStatus.GENERATING, error: undefined });

    try {
        trackRequest(); // Monitor Request
        const base64Image = await generateConceptImage(visualPrompt, cardMode, currentBatchIsHD);
        updateResult(id, { status: ResultStatus.SUCCESS, imageUrl: base64Image });
    } catch (err: any) {
        updateResult(id, { status: ResultStatus.ERROR, error: "Retry failed" });
    }
  };

  const handleDeleteResult = (id: string) => {
    setResults(prev => prev.filter(item => item.id !== id));
  };

  const handleBatchDownload = async () => {
    if (results.length === 0) return;
    setIsDownloadingBatch(true);
    const zip = new JSZip();
    const folder = zip.folder("philo-flow-assets");
    let count = 0;

    try {
      for (const res of results) {
        if (!res.imageUrl || res.status !== ResultStatus.SUCCESS) continue;
        const elementId = `result-card-${res.id}`;
        const element = document.getElementById(elementId);
        if (element) {
            try {
                const canvas = await html2canvas(element, {
                    useCORS: true,
                    scale: 2,
                    backgroundColor: res.mode === AppMode.MODERN ? '#ffffff' : '#fdfbf7',
                    logging: false,
                });
                const dataUrl = canvas.toDataURL('image/png');
                const base64Data = dataUrl.split(',')[1];
                const title = res.concept?.conceptTitle || "untitled";
                const safeTitle = title.replace(/[^a-z0-9\u4e00-\u9fa5]/gi, '_').substring(0, 30);
                folder?.file(`${safeTitle}_${res.id.slice(-6)}.png`, base64Data, { base64: true });
                count++;
            } catch (err) { console.error(err); }
        }
      }
      if (count > 0) {
        const content = await zip.generateAsync({ type: "blob" });
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        FileSaver.saveAs(content, `PhiloFlow_Export_${timestamp}.zip`);
      } else {
        alert("暂无已完成的图例可供下载。");
      }
    } catch (error) {
      alert("批量下载失败。");
    } finally {
      setIsDownloadingBatch(false);
    }
  };

  // --- RENDERING ---

  // 1. LANDING SCREEN (Split Design)
  if (!mode) {
    const splitPercent = hoveredSide === 'classic' ? 70 : hoveredSide === 'modern' ? 30 : 50;
    const transitionStyle = { transition: 'width 700ms cubic-bezier(0.25, 1, 0.5, 1), left 700ms cubic-bezier(0.25, 1, 0.5, 1)' };

    return (
      <div className="h-screen w-full relative flex bg-black overflow-hidden group">
        {/* Absolute Toggle Button for Landing */}
        <div className="absolute top-6 right-6 z-50">
             <button 
                onClick={toggleLanguage}
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 flex items-center justify-center font-bold text-xs"
             >
                {language === Language.ZH ? 'EN' : '中'}
             </button>
        </div>
        
        {/* LEFT PANEL: CLASSIC */}
        <div 
          className="relative h-full flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-paper-50 border-r border-gray-300"
          style={{ width: `${splitPercent}%`, ...transitionStyle }}
          onMouseEnter={() => setHoveredSide('classic')}
          onMouseLeave={() => setHoveredSide(null)}
          onClick={() => setMode(AppMode.CLASSIC)}
        >
          <div className="absolute inset-0 bg-paper-texture opacity-50 pointer-events-none"></div>
          
          <div className={`relative z-10 text-center transition-all duration-500 ${hoveredSide === 'modern' ? 'opacity-40 scale-95 blur-[1px]' : 'opacity-100 scale-100'}`}>
            <div className="w-20 h-20 mx-auto bg-cinnabar-700 text-white rounded-sm flex items-center justify-center font-calligraphy text-4xl shadow-xl mb-8 transform rotate-3">
              哲
            </div>
            <h1 className="text-6xl md:text-8xl font-serif font-black text-ink-900 tracking-wider mb-4 whitespace-nowrap">
              {t.landingClassicTitle}
            </h1>
            <div className="flex items-center justify-center gap-4 text-ink-600 font-serif italic tracking-widest whitespace-nowrap">
              <span className="w-12 h-[1px] bg-cinnabar-700"></span>
              <span>{t.landingClassicSubtitle}</span>
              <span className="w-12 h-[1px] bg-cinnabar-700"></span>
            </div>
          </div>
        </div>

        {/* DIVIDER */}
        <div 
            className="modern-divider-container"
            style={{ left: `${splitPercent}%` }}
        >
           <div className="modern-divider-icon">
              <span>vs</span>
           </div>
        </div>

        {/* RIGHT PANEL: MODERN */}
        <div 
          className="relative h-full flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-white"
          style={{ width: `${100 - splitPercent}%`, ...transitionStyle }}
          onMouseEnter={() => setHoveredSide('modern')}
          onMouseLeave={() => setHoveredSide(null)}
          onClick={() => setMode(AppMode.MODERN)}
        >
           {/* Modern Background */}
           <div className="absolute inset-0 bg-dot-grid opacity-50 pointer-events-none"></div>
           
           <div className={`relative z-10 text-center transition-all duration-500 ${hoveredSide === 'classic' ? 'opacity-40 scale-95 blur-[1px]' : 'opacity-100 scale-100'}`}>
              <div className="w-20 h-20 mx-auto border-2 border-modern-accent text-modern-accent rounded-full flex items-center justify-center font-modern text-4xl font-bold mb-8 shadow-sm">
                L
              </div>
              <h1 className="text-6xl md:text-8xl font-modern font-black text-modern-text tracking-tighter mb-4 whitespace-nowrap">
                {t.landingModernTitle}
              </h1>
              <div className="flex items-center justify-center gap-4 text-gray-500 font-modern text-xs tracking-[0.2em] whitespace-nowrap uppercase">
                <span>{t.landingModernSubtitle[0]}</span>
                <span className="w-1 h-1 rounded-full bg-modern-accent"></span>
                <span>{t.landingModernSubtitle[1]}</span>
                <span className="w-1 h-1 rounded-full bg-modern-accent"></span>
                <span>{t.landingModernSubtitle[2]}</span>
              </div>
           </div>
        </div>

      </div>
    );
  }

  // 2. MAIN APP
  const isModern = mode === AppMode.MODERN;
  const themeClasses = isModern 
    ? "bg-white text-modern-text font-modern bg-dot-grid modern-scroll" 
    : "bg-paper-50 text-ink-800 font-serif bg-paper-texture classic-scroll";

  // Calculate RPM for Monitor
  const currentRPM = requestHistory.length;
  // Free Tier limits: Text 15 RPM, Image 10 RPM.
  // Warning threshold: > 8 RPM (to be safe)
  const isHighTraffic = currentRPM > 8;

  return (
    <div className={`min-h-screen pb-20 transition-colors duration-500 ${themeClasses}`}>
      
      {/* Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-sm border-b shadow-sm ${isModern ? 'bg-white/90 border-gray-100' : 'bg-paper-50/95 border-ink-200'}`}>
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div 
             className="flex items-center gap-3 cursor-pointer select-none"
             onClick={() => setMode(null)} // Go back to landing
          >
            {isModern ? (
              <div className="w-8 h-8 bg-modern-accent text-white flex items-center justify-center font-modern font-bold rounded-full">P</div>
            ) : (
              <div className="w-8 h-8 bg-cinnabar-700 text-paper-50 flex items-center justify-center font-calligraphy text-lg shadow-sm rounded-sm">哲</div>
            )}
            <h1 className={`text-xl font-bold tracking-widest hidden sm:block ${isModern ? 'font-modern text-modern-text' : 'font-serif text-ink-900'}`}>
              Philo<span className={isModern ? 'text-modern-accent' : 'text-cinnabar-700'}>Flow</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
             {/* Language Toggle */}
             <button 
                onClick={toggleLanguage}
                className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold transition-colors border ${
                    isModern 
                    ? 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100' 
                    : 'bg-paper-200 border-ink-300 text-ink-800 hover:bg-paper-300'
                }`}
                title="Switch Language"
             >
                {language === Language.ZH ? 'EN' : '中'}
             </button>

             {/* Rate Monitor Widget */}
             <div className={`flex flex-col items-end mr-2 ${isModern ? 'text-gray-500' : 'text-ink-500'}`}>
                <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isHighTraffic ? 'text-red-500 animate-pulse' : ''}`}>
                        {isHighTraffic ? t.headerMonitorHighLoad : t.headerMonitor}
                    </span>
                </div>
                <div className="flex gap-3 text-xs font-mono">
                    <span title="Requests Per Minute (Last 60s)">
                        RPM: <b className={isHighTraffic ? 'text-red-600' : ''}>{currentRPM}</b>
                    </span>
                    <span className="opacity-50">|</span>
                    <span title="Total Requests this Session">
                        Total: <b>{sessionTotalRequests}</b>
                    </span>
                </div>
             </div>

             {/* API Key Button */}
             <button 
                onClick={() => setShowApiKeyModal(true)}
                className={`text-xs px-3 py-1.5 rounded border transition-colors flex items-center gap-2 ${
                    hasApiKey 
                    ? (isModern ? 'bg-green-50 text-green-600 border-green-200' : 'bg-green-50 text-green-700 border-green-200 font-serif')
                    : (isModern ? 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100' : 'bg-paper-200 text-ink-600 border-ink-300 hover:bg-paper-300 font-serif')
                }`}
             >
                <div className={`w-2 h-2 rounded-full ${hasApiKey ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                {hasApiKey 
                    ? (hasUserApiKey() ? t.headerUserKey : t.headerSessionKey) 
                    : t.headerSetKey}
             </button>

             {/* Quality Toggle */}
             <div className={`flex items-center gap-2 p-1 rounded border ${isModern ? 'bg-gray-50 border-gray-200' : 'bg-paper-200/50 border-paper-300'}`}>
                <button 
                    onClick={() => setIsHD(false)}
                    className={`px-3 py-1 text-xs font-bold transition-all rounded-sm ${!isHD ? (isModern ? 'bg-white text-gray-800 shadow-sm' : 'bg-white text-ink-900 shadow-sm') : 'opacity-50'}`}
                >
                    {t.headerQualitySD}
                </button>
                <button 
                    onClick={() => setIsHD(true)}
                    className={`px-3 py-1 text-xs font-bold transition-all flex items-center gap-1 rounded-sm ${isHD ? (isModern ? 'bg-modern-accent text-white shadow-sm' : 'bg-cinnabar-700 text-white shadow-sm') : 'opacity-50'}`}
                >
                    <span>{t.headerQualityHD}</span>
                </button>
            </div>
          </div>
        </div>
      </header>

      {/* API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className={`w-full max-w-md p-8 rounded-lg shadow-2xl ${isModern ? 'bg-white font-modern' : 'bg-paper-50 font-serif border-2 border-ink-200'}`}>
                <h3 className={`text-xl font-bold mb-4 ${isModern ? 'text-gray-900' : 'text-ink-900'}`}>
                    {t.modalTitle}
                </h3>
                <p className={`text-sm mb-4 ${isModern ? 'text-gray-500' : 'text-ink-600'}`}>
                    {t.modalDesc}
                    <br/>
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-500 underline">{t.modalGetKey}</a>
                </p>
                <input 
                    type="password" 
                    placeholder={t.modalPlaceholder}
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    className={`w-full p-3 mb-4 border rounded outline-none focus:ring-2 ${isModern ? 'border-gray-300 focus:ring-blue-100' : 'bg-paper-100 border-ink-300 focus:ring-cinnabar-700/20'}`}
                />
                
                <div className="flex items-center gap-2 mb-6">
                    <input 
                        type="checkbox" 
                        id="rememberKey"
                        checked={rememberKey}
                        onChange={(e) => setRememberKey(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="rememberKey" className={`text-sm cursor-pointer select-none ${isModern ? 'text-gray-600' : 'text-ink-700'}`}>
                        {t.modalRemember}
                    </label>
                </div>

                <div className="flex justify-end gap-3">
                    <button 
                        onClick={() => setShowApiKeyModal(false)}
                        className={`px-4 py-2 text-sm ${isModern ? 'text-gray-500 hover:bg-gray-100 rounded' : 'text-ink-600 hover:text-cinnabar-700'}`}
                    >
                        {t.modalCancel}
                    </button>
                    <button 
                        onClick={handleSaveApiKey}
                        disabled={!apiKeyInput.trim()}
                        className={`px-6 py-2 text-sm font-bold text-white rounded transition-colors ${
                            isModern 
                            ? 'bg-modern-accent hover:bg-modern-hover disabled:opacity-50' 
                            : 'bg-cinnabar-700 hover:bg-cinnabar-900 disabled:opacity-50'
                        }`}
                    >
                        {t.modalSave}
                    </button>
                </div>
            </div>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-6 py-10">
        
        {/* Input Section */}
        <div className={`relative p-1 shadow-lg mb-16 transform transition-transform duration-500 ${isModern ? 'border border-gray-200 bg-white shadow-xl rounded-lg' : 'bg-paper-50 border border-paper-300 rotate-[0.5deg] hover:rotate-0'}`}>
          
          <div className={`p-6 min-h-[250px] ${isModern ? 'bg-white rounded-lg' : 'bg-[linear-gradient(transparent_27px,#e5e5e5_28px)] bg-[length:100%_28px]'}`}>
            <div className="flex justify-between items-center mb-6">
              <label className={`block text-xs font-bold uppercase tracking-[0.2em] ${isModern ? 'text-gray-400 font-modern' : 'text-cinnabar-700 font-serif'}`}>
                 {isModern ? t.inputLabelModern : t.inputLabelClassic}
              </label>
              
              <div className="relative">
                <input 
                  type="file" 
                  accept=".txt,.md" 
                  ref={fileInputRef}
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
                <Button 
                  variant={isModern ? "modern-secondary" : "ghost"}
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs py-1 px-3"
                  mode={mode}
                >
                  {isModern ? t.importFileModern : t.importFile}
                </Button>
              </div>
            </div>

            <textarea
              className={`w-full h-48 bg-transparent border-none p-0 text-lg focus:ring-0 outline-none resize-y ${
                isModern 
                  ? 'font-modern text-gray-800 placeholder-gray-300 leading-relaxed' 
                  : 'font-serif text-ink-800 placeholder-ink-400/50 leading-[28px]'
              }`}
              placeholder={isModern ? t.placeholderModern : t.placeholderClassic}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              style={!isModern ? { lineHeight: '28px' } : {}} 
            />
            
            <div className={`mt-8 flex flex-col sm:flex-row justify-between items-end gap-6 pt-6 border-t ${isModern ? 'border-gray-100' : 'border-ink-200'}`}>
               <div className={`text-xs italic ${isModern ? 'text-gray-400 font-modern' : 'text-ink-400 font-serif'}`}>
                  {isModern ? t.inputHintModern : t.inputHintClassic}
               </div>
              <div className="flex gap-4 w-full sm:w-auto">
                  <Button 
                      variant={isModern ? 'modern-secondary' : 'secondary'}
                      onClick={() => setInputText('')}
                      className="w-full sm:w-auto"
                      disabled={!inputText}
                      mode={mode}
                  >
                      {isModern ? t.clearModern : t.clear}
                  </Button>
                  <Button 
                      variant={isModern ? 'modern-primary' : 'primary'}
                      onClick={handleAnalyzeAndGenerate} 
                      isLoading={appState === AppState.PROCESSING}
                      className="w-full sm:w-auto min-w-[140px]"
                      disabled={!inputText.trim()}
                      mode={mode}
                  >
                      {appState === AppState.PROCESSING 
                        ? (isModern ? t.processingModern : t.processing) 
                        : (isModern ? t.generateModern : t.generate)}
                  </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {appState === AppState.ERROR && errorMsg && (
          <div className={`border-l-4 p-4 mb-8 shadow-sm ${isModern ? 'border-red-500 bg-red-50 text-red-700 font-modern text-sm' : 'border-cinnabar-700 bg-red-50 text-ink-800 font-serif italic'}`}>
            <span className="font-bold mr-2">{isModern ? 'Error:' : '错误：'}</span>{errorMsg}
          </div>
        )}

        {/* Results Section */}
        <div className="space-y-12">
           {results.length > 0 && (
               <div className={`flex items-center justify-between border-b pb-2 mb-8 ${isModern ? 'border-gray-100' : 'border-ink-200'}`}>
                   <h3 className={`text-xl font-bold tracking-widest flex items-center gap-2 ${isModern ? 'text-gray-800 font-modern' : 'text-ink-900 font-serif'}`}>
                     <span className={isModern ? 'text-modern-accent' : 'text-cinnabar-700'}>●</span> 
                     {isModern ? t.resultsTitleModern : t.resultsTitleClassic}
                     <span className={`text-sm ml-2 ${isModern ? 'text-gray-400 font-normal' : 'text-ink-400 font-normal'}`}>({results.length})</span>
                   </h3>
                   
                   <Button 
                      variant="ghost"
                      onClick={handleBatchDownload}
                      isLoading={isDownloadingBatch}
                      disabled={isDownloadingBatch || !results.some(r => r.status === ResultStatus.SUCCESS)}
                      className={`text-xs ${isModern ? 'text-modern-accent hover:text-modern-hover' : ''}`}
                      mode={mode}
                   >
                     {isDownloadingBatch 
                        ? (isModern ? t.downloadingModern : t.downloading) 
                        : (isModern ? t.downloadBatchModern : t.downloadBatch)}
                   </Button>
               </div>
           )}

           <div className="flex flex-col gap-16">
            {results.map((result) => (
                <ResultCard 
                  key={result.id} 
                  result={result} 
                  onDelete={() => handleDeleteResult(result.id)}
                  onRetry={() => handleRetryGeneration(result.id, result.concept?.visualPrompt, result.mode)}
                  lang={language}
                />
            ))}
           </div>
        </div>

        {/* Empty State */}
        {results.length === 0 && appState === AppState.IDLE && (
            <div className="flex flex-col items-center justify-center py-20 opacity-50 select-none">
                <div className={`w-24 h-24 border flex items-center justify-center rounded-full mb-4 ${isModern ? 'border-gray-200 text-gray-300' : 'border-ink-300 text-ink-300'}`}>
                   <span className={`text-4xl ${isModern ? 'font-modern font-light' : 'font-calligraphy'}`}>
                     {isModern ? '+' : '空'}
                   </span>
                </div>
                <p className={`tracking-widest text-sm ${isModern ? 'text-gray-400 font-modern' : 'text-ink-400 font-serif'}`}>
                  {isModern ? t.emptyStateModern : t.emptyStateClassic}
                </p>
            </div>
        )}

      </main>
    </div>
  );
};

export default App;
