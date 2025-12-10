
import React, { useState, useCallback, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import FileSaver from 'file-saver';
import html2canvas from 'html2canvas';
// Import Docx library
import { Document, Packer, Paragraph, TextRun, ImageRun, HeadingLevel, AlignmentType, BorderStyle } from 'docx';
import mammoth from 'mammoth';

import { chunkText, analyzeSingleChunk, generateConceptImage, loadSettings, saveSettings, preprocessOCRText } from './services/geminiService';
import { getLibrary as loadLibraryFromStorage } from './services/storageService'; 
import { GeneratedResult, AppState, AppMode, ResultStatus, Language, LibraryItem, SavedSession, AISettings, AIProvider, GenerationMode } from './types';
import { UI_TEXT, TEXT_MODEL, IMAGE_MODEL_SD, AVAILABLE_GEMINI_IMAGE_MODELS, ASPECT_RATIOS } from './constants';
import Button from './components/Button';
import ResultCard from './components/ResultCard';
import SidebarLeft from './components/SidebarLeft'; 
import SidebarRight from './components/SidebarRight'; 
import ImageLightbox from './components/ImageLightbox';
import HeaderReviewModal from './components/HeaderReviewModal'; 

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode | null>(null); // Null means Landing Screen
  const isModern = mode === AppMode.MODERN;

  const [language, setLanguage] = useState<Language>(Language.ZH);
  const t = UI_TEXT[language];
  
  const [inputText, setInputText] = useState('');
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [results, setResults] = useState<GeneratedResult[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Settings & API State
  const [settings, setSettings] = useState<AISettings>(loadSettings());
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editingSettings, setEditingSettings] = useState<AISettings>(loadSettings());
  
  // Helper for Settings UI: Detect if model is one of the presets or custom
  const getEditingImageModelValue = () => {
    const model = editingSettings.imageModel;
    if (AVAILABLE_GEMINI_IMAGE_MODELS.some(m => m.value === model)) {
        return model;
    }
    return 'custom';
  };
  const [isCustomImageModel, setIsCustomImageModel] = useState(false);

  // Sync custom state when modal opens or settings change
  useEffect(() => {
     const isPreset = AVAILABLE_GEMINI_IMAGE_MODELS.some(m => m.value === editingSettings.imageModel);
     setIsCustomImageModel(!isPreset);
  }, [editingSettings.imageModel]);

  // Rate Limit Monitor
  const [requestHistory, setRequestHistory] = useState<number[]>([]);
  const [sessionTotalRequests, setSessionTotalRequests] = useState(0);

  // OCR defaults to true
  const [isOCR, setIsOCR] = useState(true); 
  
  // Header Review State
  const [showHeaderReview, setShowHeaderReview] = useState(false);
  const [detectedHeaders, setDetectedHeaders] = useState<{index: number, text: string}[]>([]);

  const [isDownloadingBatch, setIsDownloadingBatch] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false); 
  const [hoveredSide, setHoveredSide] = useState<'classic' | 'modern' | null>(null);

  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const pausedRef = useRef(false); 

  // Lightbox State
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Library
  useEffect(() => {
    const initLib = async () => {
        try {
            const data = await loadLibraryFromStorage();
            setLibrary(data);
        } catch (e) {
            console.error("Failed to load library", e);
        }
    };
    initLib();
  }, []);

  const refreshLibrary = async () => {
    try {
        const data = await loadLibraryFromStorage();
        setLibrary(data);
    } catch (e) {
        console.error("Failed to refresh library", e);
    }
  };

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

  const toggleLanguage = () => {
    setLanguage(prev => prev === Language.ZH ? Language.EN : Language.ZH);
  };

  // --- SETTINGS HANDLERS ---
  const handleOpenSettings = () => {
    setEditingSettings(loadSettings()); // Reload from storage to get fresh defaults/updates
    setShowSettingsModal(true);
  };

  const handleSaveSettings = () => {
    setSettings(editingSettings);
    saveSettings(editingSettings);
    setShowSettingsModal(false);
  };

  const hasValidKey = () => {
     // Check if current provider has a key
     if (settings.textProvider === 'gemini') return !!settings.textApiKey;
     if (settings.textProvider === 'openai' || settings.textProvider === 'custom') return !!settings.textApiKey;
     return false;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.name.toLowerCase().endsWith('.docx')) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        try {
          const result = await mammoth.extractRawText({ arrayBuffer });
          setInputText(result.value);
        } catch (error) {
          console.error("Docx parse error", error);
          alert(isModern ? "Failed to parse DOCX file." : "解析 DOCX 文件失败。");
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setInputText(text);
      };
      reader.readAsText(file);
    }
  };

  const updateResult = (id: string, updates: Partial<GeneratedResult>) => {
    setResults(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const handleUpdatePrompt = (id: string, newPrompt: string) => {
    setResults(prev => prev.map(item => {
        if (item.id === id && item.concept) {
            return { ...item, concept: { ...item.concept, visualPrompt: newPrompt } };
        }
        return item;
    }));
  };

  const handleClearResults = () => {
      if (results.length === 0) return;
      if (window.confirm(isModern ? "Clear all results?" : "确定清空所有结果吗？")) {
          setResults([]);
          setAppState(AppState.IDLE);
      }
  };

  const togglePause = () => {
    const nextState = !isPaused;
    setIsPaused(nextState);
    pausedRef.current = nextState;
  };

  const handleLoadSession = (session: SavedSession) => {
    if (results.length > 0 && appState === AppState.PROCESSING) {
        if (!window.confirm("A queue is currently processing. Stop and load saved session?")) return;
    }
    setResults(session.results);
    setMode(session.mode);
    setAppState(AppState.IDLE);
    setIsPaused(false);
    pausedRef.current = false;
  };

  // --- GENERATION LOGIC ---
  const handleAnalyzeAndGenerate = useCallback(async () => {
    if (!inputText.trim() || !mode) return;

    // STEP A: If OCR is enabled, scan for headers first
    if (isOCR) {
        const lines = inputText.split(/\r?\n/);
        const headers: {index: number, text: string}[] = [];
        
        lines.forEach((line, idx) => {
            if (line.trim().startsWith('#')) {
                headers.push({ index: idx, text: line.trim() });
            }
        });

        // If found, pause and show modal
        if (headers.length > 0) {
            setDetectedHeaders(headers);
            setShowHeaderReview(true);
            return; 
        }
    }

    // STEP B: No headers found or OCR disabled, run directly
    runGenerationPipeline(inputText);
  }, [inputText, mode, isOCR]);


  // 2. Triggered by Header Review Modal confirmation
  const handleConfirmHeaders = (indicesToKeep: Set<number>) => {
      setShowHeaderReview(false);
      
      const lines = inputText.split(/\r?\n/);
      
      // Filter out NOISE (headers that were NOT selected)
      const detectedIndices = new Set(detectedHeaders.map(h => h.index));
      const filteredLines = lines.filter((_, idx) => {
          if (detectedIndices.has(idx)) {
              return indicesToKeep.has(idx); // Only keep if user selected it
          }
          return true; // Keep normal text
      });

      const cleanedText = filteredLines.join('\n');
      runGenerationPipeline(cleanedText);
  };


  // 3. The actual generation pipeline
  const runGenerationPipeline = useCallback(async (textSource: string) => {
    setAppState(AppState.PROCESSING);
    setErrorMsg(null);
    setResults([]);

    // Pre-process text if OCR mode is enabled
    // This runs AFTER the noise removal
    let textToProcess = textSource;
    if (isOCR) {
        textToProcess = preprocessOCRText(textSource);
    }

    let chunks = chunkText(textToProcess);
    
    // HEADER FILTERING
    if (isOCR) {
        chunks = chunks.filter(chunk => !chunk.trim().startsWith('#'));
    }
    
    if (chunks.length === 0) {
        setAppState(AppState.IDLE);
        return;
    }

    const newItems: GeneratedResult[] = chunks.map((chunk, i) => ({
      id: `res-${Date.now()}-${i}`,
      mode: mode!,
      sourceText: chunk,
      status: ResultStatus.WAITING,
      imageUrl: null
    }));

    setResults(newItems);

    const processQueue = async () => {
        let quotaExceeded = false;

        for (const item of newItems) {
            while (pausedRef.current) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            if (quotaExceeded) {
                updateResult(item.id, { 
                  status: ResultStatus.ERROR, 
                  error: "Queue paused: API Quota Exceeded" 
                });
                continue;
            }

            const error = await processSingleItem(item.id, item.sourceText, mode!);
            
            if (error) {
               const errStr = JSON.stringify(error);
               if (errStr.includes("429") || errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("quota")) {
                   quotaExceeded = true;
                   setAppState(AppState.ERROR);
                   setErrorMsg(isModern ? t.alertQuotaModern : t.alertQuota);
               }
            }
            
            // Wait a bit before next item analysis to be safe, though retry loop has its own delay
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        if (!quotaExceeded) {
            setAppState(AppState.COMPLETE);
        }
    };

    processQueue();

  }, [mode, language, settings, isOCR, isModern, t]);


  const processSingleItem = async (id: string, source: string, mode: AppMode): Promise<any | null> => {
    try {
        updateResult(id, { status: ResultStatus.ANALYZING });
        trackRequest();
        
        const concept = await analyzeSingleChunk(source, mode, language, settings);
        if (!concept) throw new Error("Concept analysis returned null");

        updateResult(id, { status: ResultStatus.GENERATING, concept });
        
        // --- RETRY LOOP FOR IMAGE GENERATION ---
        let base64Image: string | null = null;
        let attempt = 1;
        
        // Loop until success or manual pause
        while (!base64Image) {
            try {
                // 1. Check Pause Status immediately
                if (pausedRef.current) throw new Error("Queue paused.");

                // 2. Try Generation
                trackRequest();
                base64Image = await generateConceptImage(concept.visualPrompt, mode, settings);

            } catch (imgErr: any) {
                console.warn(`Image Gen Attempt ${attempt} failed:`, imgErr);
                
                // If 403 Permission Denied, DO NOT retry (it won't fix itself)
                const errStr = JSON.stringify(imgErr) + (imgErr.message || "");
                if (errStr.includes("403") || errStr.includes("PERMISSION_DENIED")) {
                     updateResult(id, { 
                         status: ResultStatus.ERROR, 
                         error: isModern 
                            ? "Permission Denied (403). Check Key/Model Access." 
                            : "权限拒绝 (403)。请检查 Key 或模型权限。" 
                     });
                     throw imgErr; // Stop this item
                }

                // If paused during catch, stop
                if (pausedRef.current) throw new Error("Queue paused.");

                // Show "Retrying..." status in UI
                const retryMsg = isModern 
                    ? `Generation failed (Attempt ${attempt}). Retrying in 30s...` 
                    : `生成失败 (第 ${attempt} 次). 30秒后自动重试...`;
                
                const detailMsg = imgErr.message || "Unknown error";
                updateResult(id, { status: ResultStatus.ERROR, error: `${retryMsg}\n[${detailMsg}]` });

                // Smart Wait: 30 seconds, but check for pause every 1 second
                // This makes the UI responsive if user clicks "Pause" during the wait
                for (let i = 0; i < 30; i++) {
                    if (pausedRef.current) throw new Error("Queue paused during wait.");
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }

                // Reset status to GENERATING to show spinner again
                updateResult(id, { status: ResultStatus.GENERATING, error: undefined });
                attempt++;
            }
        }
        // --- END RETRY LOOP ---

        updateResult(id, { status: ResultStatus.SUCCESS, imageUrl: base64Image });
        return null;

    } catch (e: any) {
        console.error(`Processing failed for item ${id}`, e);
        let errMsg = e.message || "Processing failed";
        
        updateResult(id, { status: ResultStatus.ERROR, error: errMsg });
        return e;
    }
  };

  const handleRetryGeneration = async (id: string, visualPrompt: string | undefined, cardMode: AppMode) => {
    if (!visualPrompt) return;
    updateResult(id, { status: ResultStatus.GENERATING, error: undefined });
    try {
        trackRequest();
        const base64Image = await generateConceptImage(visualPrompt, cardMode, settings);
        updateResult(id, { status: ResultStatus.SUCCESS, imageUrl: base64Image });
    } catch (err: any) {
        let errMsg = "Retry failed";
         if (JSON.stringify(err).includes("403") || err.message?.includes("403")) {
           errMsg = "Permission Denied (403)";
        }
        updateResult(id, { status: ResultStatus.ERROR, error: errMsg });
    }
  };

  const handleDeleteResult = (id: string) => {
    setResults(prev => prev.filter(item => item.id !== id));
  };

  // --- EXPORT HANDLERS ---
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
        alert("No completed images to download.");
      }
    } catch (error) {
      alert("Batch download failed.");
    } finally {
      setIsDownloadingBatch(false);
    }
  };

  const base64DataURLToUint8Array = (dataURL: string) => {
    try {
      const base64String = dataURL.includes(',') ? dataURL.split(',')[1] : dataURL;
      const binaryString = window.atob(base64String);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    } catch (e) {
      console.error("Base64 conversion failed", e);
      return null;
    }
  };

  const getImageDimensions = (base64: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => {
        resolve({ width: 500, height: 281 }); // Fallback
      };
      img.src = base64;
    });
  };

  const handleDocxExport = async () => {
    const successResults = results.filter(r => r.status === ResultStatus.SUCCESS && r.imageUrl && r.concept);
    if (successResults.length === 0) {
        alert(isModern ? "No completed items to export." : "没有可导出的完成项。");
        return;
    }

    setIsExportingDocx(true);
    
    // Yield to UI thread to ensure spinner shows before heavy calculation
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
        const docChildren: any[] = [];
        
        docChildren.push(
            new Paragraph({
                text: "PhiloFlow Report",
                heading: HeadingLevel.TITLE,
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 }
            })
        );

        for (let i = 0; i < successResults.length; i++) {
            const res = successResults[i];
            const concept = res.concept!;

            // 1. Source Text
            docChildren.push(
                new Paragraph({
                    text: `#${i + 1}: ${concept.conceptTitle || "Untitled"}`,
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 200, after: 100 }
                }),
                new Paragraph({
                    text: isModern ? "Source Text" : "【原文】",
                    heading: HeadingLevel.HEADING_3,
                    spacing: { after: 50 }
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: res.sourceText || "No text",
                            italics: true,
                        })
                    ],
                    spacing: { after: 200 },
                    border: {
                        left: {
                            color: "auto",
                            space: 10,
                            style: BorderStyle.SINGLE,
                            size: 6,
                        },
                    },
                    indent: { left: 720 }
                })
            );

            // 2. Explanation
            docChildren.push(
                new Paragraph({
                    text: isModern ? "Analysis" : "【注疏解析】",
                    heading: HeadingLevel.HEADING_3,
                    spacing: { after: 50 }
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: concept.explanation || "No explanation",
                        })
                    ],
                    spacing: { after: 200 }
                })
            );

            // 3. Image
            if (res.imageUrl) {
                try {
                    const imageBuffer = base64DataURLToUint8Array(res.imageUrl);
                    const dims = await getImageDimensions(res.imageUrl);
                    
                    if (imageBuffer) {
                        // Calculate dimensions to fit 5/6 of document width
                        // Standard printable width is ~600px. 5/6 is ~500px. 
                        // We use 520px as a safe "large but fitting" size.
                        const targetWidth = 520;
                        const aspectRatio = dims.width / dims.height;
                        const targetHeight = targetWidth / aspectRatio;

                        docChildren.push(
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: [
                                    new ImageRun({
                                        data: imageBuffer,
                                        transformation: {
                                            width: targetWidth,
                                            height: targetHeight,
                                        },
                                    }),
                                ],
                                spacing: { before: 200, after: 400 }
                            })
                        );
                    } else {
                        throw new Error("Invalid image data");
                    }
                } catch (imgErr) {
                    console.warn(`Skipping invalid image for item ${i}`, imgErr);
                    // Add placeholder for failed image
                    docChildren.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: isModern ? "[Image Export Failed]" : "[图片导出失败]",
                                    color: "FF0000",
                                    italics: true
                                })
                            ],
                            alignment: AlignmentType.CENTER,
                            spacing: { before: 100, after: 100 }
                        })
                    );
                }
            }
        }

        const doc = new Document({
            sections: [{
                properties: {},
                children: docChildren,
            }],
        });

        const blob = await Packer.toBlob(doc);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        FileSaver.saveAs(blob, `PhiloFlow_Report_${timestamp}.docx`);

    } catch (error) {
        console.error("Docx export failed", error);
        alert(isModern ? "Export failed. Check console for details." : "导出失败。请检查控制台详情。");
    } finally {
        setIsExportingDocx(false);
    }
  };

  // --- RENDER ---
  if (!mode) {
    const splitPercent = hoveredSide === 'classic' ? 70 : hoveredSide === 'modern' ? 30 : 50;
    const transitionStyle = { transition: 'width 700ms cubic-bezier(0.25, 1, 0.5, 1), left 700ms cubic-bezier(0.25, 1, 0.5, 1)' };

    return (
      <div className="h-screen w-full relative flex bg-black overflow-hidden group">
        <div className="absolute top-6 right-6 z-50">
             <button onClick={toggleLanguage} className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 flex items-center justify-center font-bold text-xs">
                {language === Language.ZH ? 'EN' : '中'}
             </button>
        </div>
        <div 
          className="relative h-full flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-paper-50 border-r border-gray-300"
          style={{ width: `${splitPercent}%`, ...transitionStyle }}
          onMouseEnter={() => setHoveredSide('classic')}
          onMouseLeave={() => setHoveredSide(null)}
          onClick={() => setMode(AppMode.CLASSIC)}
        >
          <div className="absolute inset-0 bg-paper-texture opacity-50 pointer-events-none"></div>
          <div className={`relative z-10 text-center transition-all duration-500 ${hoveredSide === 'modern' ? 'opacity-40 scale-95 blur-[1px]' : 'opacity-100 scale-100'}`}>
            <div className="w-20 h-20 mx-auto bg-cinnabar-700 text-white rounded-sm flex items-center justify-center font-calligraphy text-4xl shadow-xl mb-8 transform rotate-3">哲</div>
            <h1 className="text-6xl md:text-8xl font-serif font-black text-ink-900 tracking-wider mb-4 whitespace-nowrap">{t.landingClassicTitle}</h1>
            <div className="flex items-center justify-center gap-4 text-ink-600 font-serif italic tracking-widest whitespace-nowrap">
              <span className="w-12 h-[1px] bg-cinnabar-700"></span><span>{t.landingClassicSubtitle}</span><span className="w-12 h-[1px] bg-cinnabar-700"></span>
            </div>
          </div>
        </div>
        <div className="modern-divider-container" style={{ left: `${splitPercent}%` }}>
           <div className="modern-divider-icon"><span>vs</span></div>
        </div>
        <div 
          className="relative h-full flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-white"
          style={{ width: `${100 - splitPercent}%`, ...transitionStyle }}
          onMouseEnter={() => setHoveredSide('modern')}
          onMouseLeave={() => setHoveredSide(null)}
          onClick={() => setMode(AppMode.MODERN)}
        >
           <div className="absolute inset-0 bg-dot-grid opacity-50 pointer-events-none"></div>
           <div className={`relative z-10 text-center transition-all duration-500 ${hoveredSide === 'classic' ? 'opacity-40 scale-95 blur-[1px]' : 'opacity-100 scale-100'}`}>
              <div className="w-20 h-20 mx-auto border-2 border-modern-accent text-modern-accent rounded-full flex items-center justify-center font-modern text-4xl font-bold mb-8 shadow-sm">L</div>
              <h1 className="text-6xl md:text-8xl font-modern font-black text-modern-text tracking-tighter mb-4 whitespace-nowrap">{t.landingModernTitle}</h1>
              <div className="flex items-center justify-center gap-4 text-gray-500 font-modern text-xs tracking-[0.2em] whitespace-nowrap uppercase">
                <span>{t.landingModernSubtitle[0]}</span><span className="w-1 h-1 rounded-full bg-modern-accent"></span><span>{t.landingModernSubtitle[1]}</span><span className="w-1 h-1 rounded-full bg-modern-accent"></span><span>{t.landingModernSubtitle[2]}</span>
              </div>
           </div>
        </div>
      </div>
    );
  }

  const themeClasses = isModern ? "bg-white text-modern-text font-modern bg-dot-grid modern-scroll" : "bg-paper-50 text-ink-800 font-serif bg-paper-texture classic-scroll";
  const currentRPM = requestHistory.length;
  const isHighTraffic = currentRPM > 8;

  return (
    <div className={`h-screen flex flex-col transition-colors duration-500 ${themeClasses}`}>
      
      {/* HEADER */}
      <header className={`shrink-0 z-50 backdrop-blur-sm border-b shadow-sm ${isModern ? 'bg-white/90 border-gray-100' : 'bg-paper-50/95 border-ink-200'}`}>
        <div className="w-full px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => setMode(null)}>
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
             <button onClick={toggleLanguage} className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold transition-colors border ${isModern ? 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100' : 'bg-paper-200 border-ink-300 text-ink-800 hover:bg-paper-300'}`}>
                {language === Language.ZH ? 'EN' : '中'}
             </button>

             <div className={`flex flex-col items-end mr-2 ${isModern ? 'text-gray-500' : 'text-ink-500'}`}>
                <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isHighTraffic ? 'text-red-500 animate-pulse' : ''}`}>{isHighTraffic ? t.headerMonitorHighLoad : t.headerMonitor}</span>
                </div>
                <div className="flex gap-3 text-xs font-mono">
                    <span title="Requests Per Minute">RPM: <b className={isHighTraffic ? 'text-red-600' : ''}>{currentRPM}</b></span>
                    <span className="opacity-50">|</span>
                    <span title="Total Requests">Total: <b>{sessionTotalRequests}</b></span>
                </div>
             </div>

             <button onClick={handleOpenSettings} className={`text-xs px-3 py-1.5 rounded border transition-colors flex items-center gap-2 ${hasValidKey() ? (isModern ? 'bg-green-50 text-green-600 border-green-200' : 'bg-green-50 text-green-700 border-green-200 font-serif') : (isModern ? 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100' : 'bg-paper-200 text-ink-600 border-ink-300 hover:bg-paper-300 font-serif')}`}>
                <div className={`w-2 h-2 rounded-full ${hasValidKey() ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                {hasValidKey() ? t.headerUserKey : t.headerSetKey}
             </button>
          </div>
        </div>
      </header>

      {/* BODY GRID */}
      <div className="flex-grow flex overflow-hidden">
         {/* LEFT SIDEBAR */}
         <SidebarLeft 
            mode={mode} 
            lang={language} 
            library={library} 
            onLoadSession={handleLoadSession}
            onRefreshLibrary={refreshLibrary} 
         />

         {/* MAIN CONTENT */}
         <main className="flex-grow overflow-y-auto px-6 py-10 custom-scrollbar relative">
             <div className="max-w-4xl mx-auto">
                 {/* Input Area */}
                 <div className={`relative p-1 shadow-lg mb-12 transform transition-transform duration-500 ${isModern ? 'border border-gray-200 bg-white shadow-xl rounded-lg' : 'bg-paper-50 border border-paper-300'}`}>
                    <div className={`p-6 min-h-[200px] ${isModern ? 'bg-white rounded-lg' : 'bg-[linear-gradient(transparent_27px,#e5e5e5_28px)] bg-[length:100%_28px]'}`}>
                        <div className="flex justify-between items-center mb-6">
                            <label className={`block text-xs font-bold uppercase tracking-[0.2em] ${isModern ? 'text-gray-400 font-modern' : 'text-cinnabar-700 font-serif'}`}>{isModern ? t.inputLabelModern : t.inputLabelClassic}</label>
                            <div className="relative">
                                <input type="file" accept=".txt,.md,.docx" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                                <Button variant={isModern ? "modern-secondary" : "ghost"} onClick={() => fileInputRef.current?.click()} className="text-xs py-1 px-3" mode={mode}>{isModern ? t.importFileModern : t.importFile}</Button>
                            </div>
                        </div>
                        <textarea
                            className={`w-full h-32 bg-transparent border-none p-0 text-lg focus:ring-0 outline-none resize-y ${isModern ? 'font-modern text-gray-800 placeholder-gray-300 leading-relaxed' : 'font-serif text-ink-800 placeholder-ink-400/50 leading-[28px]'}`}
                            placeholder={isModern ? t.placeholderModern : t.placeholderClassic}
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            style={!isModern ? { lineHeight: '28px' } : {}} 
                        />
                        <div className={`mt-4 flex justify-between items-center pt-4 border-t ${isModern ? 'border-gray-100' : 'border-ink-200'}`}>
                             {/* OCR Switch & Hints */}
                             <div className="flex items-center gap-6">
                                <div className={`text-xs italic ${isModern ? 'text-gray-400 font-modern' : 'text-ink-400 font-serif'}`}>
                                    {isModern ? t.inputHintModern : t.inputHintClassic}
                                </div>
                                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsOCR(!isOCR)} title={isModern ? t.ocrHintModern : t.ocrHint}>
                                    <div className={`w-8 h-4 rounded-full transition-colors relative ${isOCR ? (isModern ? 'bg-modern-accent' : 'bg-cinnabar-700') : 'bg-gray-300'}`}>
                                        <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${isOCR ? 'translate-x-4' : ''}`}></div>
                                    </div>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isOCR ? (isModern ? 'text-modern-accent' : 'text-cinnabar-700') : 'text-gray-400'}`}>
                                        {isModern ? t.ocrLabelModern : t.ocrLabel}
                                    </span>
                                </div>
                             </div>

                             <div className="flex gap-4">
                                <Button variant={isModern ? 'modern-secondary' : 'secondary'} onClick={() => setInputText('')} disabled={!inputText} mode={mode}>{isModern ? t.clearModern : t.clear}</Button>
                                <Button variant={isModern ? 'modern-primary' : 'primary'} onClick={handleAnalyzeAndGenerate} isLoading={appState === AppState.PROCESSING} disabled={!inputText.trim()} mode={mode}>{appState === AppState.PROCESSING ? (isModern ? t.processingModern : t.processing) : (isModern ? t.generateModern : t.generate)}</Button>
                            </div>
                        </div>
                    </div>
                 </div>

                 {/* Errors */}
                 {appState === AppState.ERROR && errorMsg && (
                    <div className={`border-l-4 p-4 mb-8 shadow-sm ${isModern ? 'border-red-500 bg-red-50 text-red-700 font-modern text-sm' : 'border-cinnabar-700 bg-red-50 text-ink-800 font-serif italic'}`}>
                        <span className="font-bold mr-2">{isModern ? 'Error:' : '错误：'}</span>{errorMsg}
                    </div>
                 )}

                 {/* Results List */}
                 <div className="space-y-12">
                    {results.length > 0 && (
                        <div className={`flex items-center justify-between border-b pb-2 mb-8 ${isModern ? 'border-gray-100' : 'border-ink-200'}`}>
                            <h3 className={`text-xl font-bold tracking-widest flex items-center gap-2 ${isModern ? 'text-gray-800 font-modern' : 'text-ink-900 font-serif'}`}>
                                <span className={isModern ? 'text-modern-accent' : 'text-cinnabar-700'}>●</span> {isModern ? t.resultsTitleModern : t.resultsTitleClassic} <span className={`text-sm ml-2 opacity-50`}>({results.length})</span>
                            </h3>
                            {/* Buttons moved to Sidebar */}
                        </div>
                    )}
                    <div className="flex flex-col gap-16 pb-20">
                        {results.map((result) => (
                            <ResultCard 
                            key={result.id} 
                            result={result} 
                            onDelete={() => handleDeleteResult(result.id)}
                            onRetry={() => handleRetryGeneration(result.id, result.concept?.visualPrompt, result.mode)}
                            onUpdatePrompt={(newPrompt) => handleUpdatePrompt(result.id, newPrompt)}
                            onImageClick={(url) => setLightboxImage(url)}
                            lang={language}
                            />
                        ))}
                    </div>
                 </div>

                 {results.length === 0 && appState === AppState.IDLE && (
                    <div className="flex flex-col items-center justify-center py-20 opacity-50 select-none">
                        <div className={`w-24 h-24 border flex items-center justify-center rounded-full mb-4 ${isModern ? 'border-gray-200 text-gray-300' : 'border-ink-300 text-ink-300'}`}><span className={`text-4xl ${isModern ? 'font-modern font-light' : 'font-calligraphy'}`}>{isModern ? '+' : '空'}</span></div>
                        <p className={`tracking-widest text-sm ${isModern ? 'text-gray-400 font-modern' : 'text-ink-400 font-serif'}`}>{isModern ? t.emptyStateModern : t.emptyStateClassic}</p>
                    </div>
                 )}
             </div>
         </main>

         {/* RIGHT SIDEBAR */}
         <SidebarRight 
            mode={mode}
            lang={language}
            results={results}
            isPaused={isPaused}
            onTogglePause={togglePause}
            onClearResults={handleClearResults}
            library={library}
            onRefreshLibrary={refreshLibrary}
            onDownloadDocx={handleDocxExport}
            onDownloadZip={handleBatchDownload}
            isDownloadingDocx={isExportingDocx}
            isDownloadingZip={isDownloadingBatch}
         />
      </div>

      {/* Lightbox Overlay */}
      {lightboxImage && (
        <ImageLightbox src={lightboxImage} onClose={() => setLightboxImage(null)} />
      )}

      {/* NEW: Header Review Modal */}
      {showHeaderReview && (
          <HeaderReviewModal
            headers={detectedHeaders}
            mode={mode}
            lang={language}
            onConfirm={handleConfirmHeaders}
            onCancel={() => setShowHeaderReview(false)}
          />
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className={`w-full max-w-2xl p-8 rounded-lg shadow-2xl overflow-y-auto max-h-[90vh] ${isModern ? 'bg-white font-modern' : 'bg-paper-50 font-serif border-2 border-ink-200'}`}>
                <h3 className={`text-xl font-bold mb-4 ${isModern ? 'text-gray-900' : 'text-ink-900'}`}>{t.modalTitle}</h3>
                <p className={`text-sm mb-6 ${isModern ? 'text-gray-500' : 'text-ink-600'}`}>{t.modalDesc}</p>

                {/* TEXT SETTINGS */}
                <div className="mb-6 p-4 rounded bg-gray-50/50 border border-gray-100">
                    <h4 className="font-bold text-sm mb-4 uppercase tracking-wider text-gray-400">Text Generation</h4>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-xs font-bold mb-1">{t.settingsLabelProvider}</label>
                            <select 
                                value={editingSettings.textProvider}
                                onChange={(e) => setEditingSettings({...editingSettings, textProvider: e.target.value as AIProvider})}
                                className="w-full p-2 text-sm border rounded"
                            >
                                <option value="gemini">{t.settingsTabGemini}</option>
                                <option value="openai">OpenAI Compatible (Custom)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold mb-1">{t.settingsLabelModel}</label>
                            <input 
                                type="text" 
                                value={editingSettings.textModel}
                                onChange={(e) => setEditingSettings({...editingSettings, textModel: e.target.value})}
                                placeholder={TEXT_MODEL}
                                className="w-full p-2 text-sm border rounded"
                            />
                        </div>
                    </div>
                    {editingSettings.textProvider !== 'gemini' && (
                        <div className="mb-4">
                             <label className="block text-xs font-bold mb-1">{t.settingsLabelBaseUrl}</label>
                             <input 
                                type="text"
                                value={editingSettings.textBaseUrl || ''}
                                onChange={(e) => setEditingSettings({...editingSettings, textBaseUrl: e.target.value})}
                                placeholder="https://api.openai.com/v1"
                                className="w-full p-2 text-sm border rounded mb-1"
                             />
                        </div>
                    )}
                    <div>
                        <label className="block text-xs font-bold mb-1">{t.settingsLabelKey}</label>
                        <input 
                            type="password"
                            value={editingSettings.textApiKey || ''}
                            onChange={(e) => setEditingSettings({...editingSettings, textApiKey: e.target.value})}
                            placeholder={t.modalPlaceholder}
                            className="w-full p-2 text-sm border rounded"
                        />
                    </div>
                </div>

                {/* IMAGE SETTINGS */}
                <div className="mb-6 p-4 rounded bg-gray-50/50 border border-gray-100">
                    <h4 className="font-bold text-sm mb-4 uppercase tracking-wider text-gray-400">Image Generation</h4>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                         <div>
                            <label className="block text-xs font-bold mb-1">{t.settingsLabelProvider}</label>
                            <select 
                                value={editingSettings.imageProvider}
                                onChange={(e) => setEditingSettings({...editingSettings, imageProvider: e.target.value as AIProvider})}
                                className="w-full p-2 text-sm border rounded"
                            >
                                <option value="gemini">{t.settingsTabGemini}</option>
                                <option value="openai">OpenAI Compatible (DALL-E)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold mb-1">{t.settingsLabelModel}</label>
                            {editingSettings.imageProvider === 'gemini' ? (
                                <div className="space-y-2">
                                    <select 
                                        value={isCustomImageModel ? 'custom' : editingSettings.imageModel}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === 'custom') {
                                                setIsCustomImageModel(true);
                                                setEditingSettings({...editingSettings, imageModel: ''});
                                            } else {
                                                setIsCustomImageModel(false);
                                                setEditingSettings({...editingSettings, imageModel: val});
                                            }
                                        }}
                                        className="w-full p-2 text-sm border rounded"
                                    >
                                        {AVAILABLE_GEMINI_IMAGE_MODELS.map(m => (
                                            <option key={m.value} value={m.value}>{m.label}</option>
                                        ))}
                                        <option value="custom">{t.settingsOptionCustom}</option>
                                    </select>
                                    {isCustomImageModel && (
                                        <input 
                                            type="text" 
                                            value={editingSettings.imageModel}
                                            onChange={(e) => setEditingSettings({...editingSettings, imageModel: e.target.value})}
                                            placeholder="e.g. gemini-experimental"
                                            className="w-full p-2 text-sm border rounded bg-white"
                                            autoFocus
                                        />
                                    )}
                                </div>
                            ) : (
                                <input 
                                    type="text" 
                                    value={editingSettings.imageModel}
                                    onChange={(e) => setEditingSettings({...editingSettings, imageModel: e.target.value})}
                                    placeholder={IMAGE_MODEL_SD}
                                    className="w-full p-2 text-sm border rounded"
                                />
                            )}
                        </div>
                    </div>
                    {editingSettings.imageProvider !== 'gemini' && (
                        <div className="mb-4">
                             <label className="block text-xs font-bold mb-1">{t.settingsLabelBaseUrl}</label>
                             <input 
                                type="text"
                                value={editingSettings.imageBaseUrl || ''}
                                onChange={(e) => setEditingSettings({...editingSettings, imageBaseUrl: e.target.value})}
                                placeholder="https://api.openai.com/v1"
                                className="w-full p-2 text-sm border rounded"
                             />
                        </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                             <label className="block text-xs font-bold mb-1">{t.settingsLabelKey}</label>
                             <input 
                                 type="password"
                                 value={editingSettings.imageApiKey || ''}
                                 onChange={(e) => setEditingSettings({...editingSettings, imageApiKey: e.target.value})}
                                 placeholder={t.modalPlaceholder}
                                 className="w-full p-2 text-sm border rounded"
                             />
                        </div>
                        <div>
                             <label className="block text-xs font-bold mb-1">{t.settingsLabelRatio}</label>
                             <select 
                                 value={editingSettings.aspectRatio}
                                 onChange={(e) => setEditingSettings({...editingSettings, aspectRatio: e.target.value})}
                                 className="w-full p-2 text-sm border rounded"
                             >
                                 {ASPECT_RATIOS.map(ratio => (
                                     <option key={ratio.value} value={ratio.value}>{ratio.label}</option>
                                 ))}
                             </select>
                        </div>
                    </div>
                </div>

                {/* NEW: PROMPT STRATEGY */}
                <div className="mb-6 p-4 rounded bg-gray-50/50 border border-gray-100">
                    <label className="block text-xs font-bold mb-3 uppercase tracking-wider text-gray-400">{t.settingsLabelStrategy}</label>
                    
                    <div className="space-y-3">
                        <label className={`flex items-start gap-3 p-3 rounded border cursor-pointer transition-colors ${editingSettings.generationMode === 'auto' ? (isModern ? 'bg-blue-50 border-blue-200' : 'bg-paper-200 border-ink-400') : 'hover:bg-gray-50 border-gray-200'}`}>
                            <input 
                                type="radio" 
                                name="strategy" 
                                className="mt-1"
                                checked={editingSettings.generationMode === 'auto'}
                                onChange={() => setEditingSettings({...editingSettings, generationMode: 'auto'})}
                            />
                            <div>
                                <div className="text-sm font-bold">{t.settingsStrategyAuto}</div>
                                <div className="text-xs opacity-60 mt-0.5">{t.settingsStrategyAutoDesc}</div>
                            </div>
                        </label>

                        <label className={`flex items-start gap-3 p-3 rounded border cursor-pointer transition-colors ${editingSettings.generationMode === 'direct' ? (isModern ? 'bg-blue-50 border-blue-200' : 'bg-paper-200 border-ink-400') : 'hover:bg-gray-50 border-gray-200'}`}>
                            <input 
                                type="radio" 
                                name="strategy" 
                                className="mt-1"
                                checked={editingSettings.generationMode === 'direct'}
                                onChange={() => setEditingSettings({...editingSettings, generationMode: 'direct'})}
                            />
                            <div>
                                <div className="text-sm font-bold flex items-center gap-2">
                                    {t.settingsStrategyDirect} 
                                    <span className="bg-yellow-100 text-yellow-800 text-[9px] px-1.5 py-0.5 rounded uppercase font-extrabold tracking-wider">Nano Banana Pro</span>
                                </div>
                                <div className="text-xs opacity-60 mt-0.5">{t.settingsStrategyDirectDesc}</div>
                            </div>
                        </label>
                    </div>

                    {/* Direct Template Editor */}
                    {editingSettings.generationMode === 'direct' && (
                        <div className="mt-4 pl-8">
                            <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">{t.settingsLabelTemplate}</label>
                            <textarea 
                                className="w-full h-32 text-xs p-2 border rounded font-mono text-gray-600 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-300 outline-none"
                                value={editingSettings.directTemplate}
                                onChange={(e) => setEditingSettings({...editingSettings, directTemplate: e.target.value})}
                            />
                            <p className="text-[10px] text-gray-400 mt-1">{t.settingsHintTemplate}</p>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button onClick={() => setShowSettingsModal(false)} className={`px-4 py-2 text-sm ${isModern ? 'text-gray-500 hover:bg-gray-100 rounded' : 'text-ink-600 hover:text-cinnabar-700'}`}>{t.modalCancel}</button>
                    <button onClick={handleSaveSettings} className={`px-6 py-2 text-sm font-bold text-white rounded transition-colors ${isModern ? 'bg-modern-accent hover:bg-modern-hover' : 'bg-cinnabar-700 hover:bg-cinnabar-900'}`}>{t.modalSave}</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;
