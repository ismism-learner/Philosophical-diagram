
import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { GeneratedResult, AppMode, ResultStatus, Language } from '../types';
import { UI_TEXT } from '../constants';

interface ResultCardProps {
  result: GeneratedResult;
  onDelete: () => void;
  onRetry: () => void;
  onUpdatePrompt: (newPrompt: string) => void;
  onImageClick: (url: string) => void; // New prop for lightbox
  lang: Language;
}

const ResultCard: React.FC<ResultCardProps> = ({ result, onDelete, onRetry, onUpdatePrompt, onImageClick, lang }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(result.concept?.visualPrompt || '');

  const isModern = result.mode === AppMode.MODERN;
  const t = UI_TEXT[lang];

  const handleSaveImage = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening lightbox
    if (!cardRef.current || !result.imageUrl) return;
    
    setIsSaving(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        scale: 2,
        backgroundColor: isModern ? '#ffffff' : '#fdfbf7',
        logging: false,
      });

      const link = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      link.download = `philo-flow-${timestamp}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyPrompt = () => {
    if (result.concept?.visualPrompt) {
        navigator.clipboard.writeText(result.concept.visualPrompt);
    }
  };

  const handleSaveEdit = () => {
      if (editValue.trim()) {
          onUpdatePrompt(editValue);
          setIsEditing(false);
          setTimeout(onRetry, 100);
      }
  };

  const startEditing = () => {
      setEditValue(result.concept?.visualPrompt || '');
      setIsEditing(true);
  };

  const getStatusDisplay = () => {
    switch(result.status) {
        case ResultStatus.WAITING: return isModern ? t.statusWaitingModern : t.statusWaiting;
        case ResultStatus.ANALYZING: return isModern ? t.statusAnalyzingModern : t.statusAnalyzing;
        case ResultStatus.GENERATING: return isModern ? t.statusGeneratingModern : t.statusGenerating;
        default: return '';
    }
  };

  const isLoading = result.status === ResultStatus.WAITING || result.status === ResultStatus.ANALYZING || result.status === ResultStatus.GENERATING;

  // ================= MODERN THEME =================
  if (isModern) {
    return (
      <div id={`result-card-${result.id}`} className="relative group mb-12">
        <button
          onClick={onDelete}
          data-html2canvas-ignore
          className="absolute -top-3 -right-3 z-30 bg-white border border-gray-200 text-gray-400 w-8 h-8 rounded-full shadow-sm flex items-center justify-center hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors"
        >
          <span className="text-sm font-bold">✕</span>
        </button>

        <div 
          ref={cardRef}
          className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row relative rounded-lg overflow-hidden min-h-[450px]"
        >
          {/* Source Text */}
          <div className="md:w-1/4 bg-gray-50 border-r border-gray-200 p-6 flex flex-col">
            <div className="mb-4">
               <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">{t.cardSourceTextModern}</span>
            </div>
            <div className="flex-grow overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
               <p className="font-mono text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">
                 {result.sourceText}
               </p>
            </div>
          </div>

          {/* Diagram Visual */}
          <div className="md:w-2/5 bg-white relative flex items-center justify-center border-r border-gray-100 p-8">
             <div className="w-full h-full relative flex items-center justify-center">
                <div className="absolute top-0 right-0 z-20 flex gap-2" data-html2canvas-ignore>
                   {result.concept && (
                       <button
                         onClick={onRetry}
                         className="text-xs bg-white text-gray-500 border border-gray-200 w-8 h-8 flex items-center justify-center rounded hover:border-modern-accent hover:text-modern-accent transition-colors shadow-sm"
                         title={t.cardRegenerateModern}
                       >
                         ↻
                       </button>
                   )}
                   {result.imageUrl && result.status === ResultStatus.SUCCESS && (
                    <button
                      onClick={handleSaveImage}
                      disabled={isSaving}
                      className="text-xs bg-white text-gray-500 border border-gray-200 px-2 py-1 rounded hover:border-modern-accent hover:text-modern-accent transition-colors shadow-sm"
                    >
                      {isSaving ? t.cardSavingModern : t.cardSaveModern}
                    </button>
                  )}
                </div>

                {isLoading ? (
                  <div className="flex flex-col items-center justify-center">
                    {result.status !== ResultStatus.WAITING && (
                        <div className="w-10 h-10 border-2 border-gray-200 border-t-modern-accent rounded-full animate-spin mb-4"></div>
                    )}
                    <p className="font-modern text-gray-400 text-[10px] tracking-wider animate-pulse">{getStatusDisplay()}</p>
                  </div>
                ) : result.status === ResultStatus.ERROR ? (
                  <div className="flex flex-col items-center justify-center text-gray-500 p-4 text-center z-20">
                    <span className="font-modern text-[10px] tracking-widest mb-2 font-bold text-red-500">{t.statusError}</span>
                    <p className="text-[10px] mb-4 opacity-70">{result.error}</p>
                    {onRetry && (
                      <button 
                        onClick={onRetry}
                        className="border border-gray-300 bg-white text-gray-600 px-3 py-1 rounded text-xs hover:border-gray-400 transition-colors"
                      >
                        {t.cardRetryModern}
                      </button>
                    )}
                  </div>
                ) : result.imageUrl ? (
                  <img 
                    src={result.imageUrl} 
                    className="w-full h-auto object-contain max-h-[350px] cursor-zoom-in hover:opacity-95 transition-opacity" 
                    alt="Diagram"
                    onClick={() => onImageClick(result.imageUrl!)} 
                  />
                ) : (
                   <span className="text-gray-300 font-medium text-xs">{t.statusNoVisualModern}</span>
                )}
             </div>
          </div>

          {/* Analysis */}
          <div className="md:w-[35%] p-8 flex flex-col bg-white relative">
             <div className="mb-2">
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 uppercase tracking-wide">
                  {t.cardAnalysisModern}
                </span>
             </div>
             
             {result.concept ? (
                 <>
                    <h3 className="text-gray-900 font-modern font-bold text-lg mb-4 leading-tight">
                    {result.concept.conceptTitle}
                    </h3>
                    
                    <div className="flex-grow">
                    <p className="text-gray-600 font-modern text-sm leading-relaxed text-justify">
                        {result.concept.explanation}
                    </p>
                    </div>

                    <div className="mt-8 pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-2 mb-1 justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase">{t.cardPromptModern}</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={startEditing}
                                    className="text-gray-400 hover:text-modern-accent text-[10px] uppercase font-bold"
                                    data-html2canvas-ignore
                                >
                                    [{t.cardEditModern}]
                                </button>
                                <button 
                                    onClick={handleCopyPrompt} 
                                    className="text-gray-300 hover:text-modern-accent text-[10px]"
                                    data-html2canvas-ignore
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        
                        {isEditing ? (
                             <div className="relative" data-html2canvas-ignore>
                                <textarea
                                    className="w-full text-[10px] p-2 border border-blue-200 bg-blue-50 text-gray-700 font-mono rounded h-24 focus:ring-1 focus:ring-blue-300 outline-none resize-none"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                />
                                <div className="flex justify-end gap-2 mt-2">
                                    <button onClick={() => setIsEditing(false)} className="text-[10px] text-gray-500 hover:text-gray-700">{t.cardCancelEditModern}</button>
                                    <button onClick={handleSaveEdit} className="text-[10px] bg-modern-accent text-white px-2 py-1 rounded hover:bg-modern-hover">{t.cardSaveEditModern}</button>
                                </div>
                             </div>
                        ) : (
                             <p className="text-gray-400 text-[10px] font-mono leading-tight bg-gray-50 p-2 rounded border border-gray-100 truncate cursor-text hover:bg-gray-100" onClick={startEditing} title="Click to edit">
                                {result.concept.visualPrompt}
                            </p>
                        )}
                    </div>
                 </>
             ) : (
                 <div className="flex-grow flex items-center justify-center text-gray-300 text-xs italic">
                     {getStatusDisplay()}
                 </div>
             )}
          </div>
        </div>
      </div>
    );
  }

  // ================= CLASSIC THEME =================
  return (
    <div id={`result-card-${result.id}`} className="relative group mb-12">
      <button
        onClick={onDelete}
        data-html2canvas-ignore
        className="absolute -top-3 -right-2 z-30 bg-cinnabar-700 text-white w-8 h-10 shadow-md flex items-end justify-center pb-2 hover:h-12 transition-all duration-300 font-serif"
        style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 50% 80%, 0% 100%)' }}
      >
        <span className="text-xs">✕</span>
      </button>

      <div 
        ref={cardRef}
        className="bg-paper-50 text-ink-800 shadow-2xl overflow-hidden flex flex-col md:flex-row border border-paper-300 relative"
        style={{ boxShadow: '10px 10px 20px rgba(0,0,0,0.1)' }}
      >
        {/* Source Text */}
        <div className="md:w-1/4 bg-paper-200/50 p-6 border-r border-paper-300 flex flex-col">
           <div className="mb-4 border-b border-paper-300 pb-2">
              <span className="font-serif text-xs font-bold text-ink-600 tracking-widest">{t.cardSourceText}</span>
           </div>
           <div className="font-serif text-ink-900 text-sm leading-8 italic opacity-90 overflow-y-auto max-h-[400px] pr-2 classic-scroll">
              “{result.sourceText}”
           </div>
        </div>

        {/* Illustration */}
        <div className="md:w-2/5 p-6 bg-paper-100 border-r border-paper-300 relative flex flex-col justify-center items-center min-h-[400px]">
          <div className="w-full h-full border-4 double border-ink-600/20 p-2 bg-white relative shadow-inner">
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-ink-800"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-ink-800"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-ink-800"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-ink-800"></div>

            <div className="absolute top-4 right-4 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300" data-html2canvas-ignore>
                 {result.concept && (
                     <button
                        onClick={onRetry}
                        className="bg-paper-50/90 text-ink-800 border border-ink-800 w-6 h-6 flex items-center justify-center text-xs font-serif hover:bg-ink-800 hover:text-white transition-colors shadow-sm"
                        title={t.cardRegenerate}
                     >
                        ↻
                     </button>
                 )}
                {result.imageUrl && result.status === ResultStatus.SUCCESS && (
                    <button
                    onClick={handleSaveImage}
                    disabled={isSaving}
                    className="bg-paper-50/90 text-ink-800 border border-ink-800 px-3 py-1 text-xs font-serif hover:bg-cinnabar-700 hover:text-white transition-colors shadow-sm"
                    >
                    {isSaving ? t.cardSaving : t.cardSave}
                    </button>
                )}
            </div>

            {isLoading ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-paper-50 opacity-80">
                {result.status !== ResultStatus.WAITING && (
                    <div className="w-12 h-12 border-4 border-ink-400 border-t-cinnabar-700 rounded-full animate-spin mb-6"></div>
                )}
                <p className="font-serif text-ink-600 text-xs tracking-widest animate-pulse">{getStatusDisplay()}</p>
              </div>
            ) : result.status === ResultStatus.ERROR ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-paper-50 p-6 text-center">
                <div className="text-cinnabar-700 font-bold mb-2 text-sm">{t.statusError}</div>
                <div className="text-[10px] text-ink-600 mb-4">{result.error}</div>
                {onRetry && (
                  <button 
                    onClick={onRetry}
                    className="border border-cinnabar-700 text-cinnabar-700 px-3 py-1 text-xs hover:bg-cinnabar-700 hover:text-white transition-colors"
                  >
                    {t.cardRetry}
                  </button>
                )}
              </div>
            ) : result.imageUrl ? (
              <img 
                src={result.imageUrl} 
                className="w-full h-full object-contain filter sepia-[0.2] contrast-[1.05] cursor-zoom-in" 
                alt="Art" 
                onClick={() => onImageClick(result.imageUrl!)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-cinnabar-700 font-serif text-sm">{t.statusNoVisual}</div>
            )}
          </div>
        </div>

        {/* Analysis */}
        <div className="md:w-[35%] p-8 flex flex-col bg-paper-50 relative">
          <div className="w-8 h-1 bg-cinnabar-700 mb-6"></div>
          <div className="mb-2">
            <span className="text-cinnabar-700 text-[10px] font-bold tracking-widest uppercase font-serif border border-cinnabar-700 px-1 py-0.5">
              {t.cardAnalysis}
            </span>
          </div>
          {result.concept ? (
              <>
                <h3 className="text-xl font-serif font-bold text-ink-900 mb-6 leading-tight">
                    {result.concept.conceptTitle}
                </h3>
                <div className="flex-grow">
                    <p className="text-ink-800 font-serif text-sm leading-7 text-justify indent-8">
                    {result.concept.explanation}
                    </p>
                </div>
                <div className="mt-8 pt-4 border-t border-ink-200/50">
                    <div className="flex items-center gap-2 mb-1 justify-between">
                         <p className="text-[10px] text-ink-400 font-serif uppercase tracking-widest mb-1">{t.cardPrompt}</p>
                         <div className="flex gap-2" data-html2canvas-ignore>
                            <button
                                onClick={startEditing}
                                className="text-ink-500 hover:text-cinnabar-700 text-[10px] uppercase font-bold"
                            >
                                [{t.cardEdit}]
                            </button>
                            <button 
                                onClick={handleCopyPrompt} 
                                className="text-ink-400 hover:text-cinnabar-700 text-[10px]"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            </button>
                         </div>
                    </div>
                    {isEditing ? (
                         <div className="relative" data-html2canvas-ignore>
                            <textarea
                                className="w-full text-[10px] p-2 border border-ink-300 bg-paper-100 text-ink-800 font-mono h-24 focus:ring-1 focus:ring-cinnabar-700 outline-none resize-none"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                            />
                            <div className="flex justify-end gap-2 mt-2">
                                <button onClick={() => setIsEditing(false)} className="text-[10px] text-ink-500 hover:text-ink-800">{t.cardCancelEdit}</button>
                                <button onClick={handleSaveEdit} className="text-[10px] bg-cinnabar-700 text-white px-2 py-1 hover:bg-cinnabar-900">{t.cardSaveEdit}</button>
                            </div>
                         </div>
                    ) : (
                        <p className="text-ink-600 text-[10px] font-mono leading-tight opacity-60 italic truncate cursor-text hover:opacity-100" onClick={startEditing}>
                            {result.concept.visualPrompt}
                        </p>
                    )}
                </div>
              </>
          ) : (
            <div className="flex-grow flex items-center justify-center text-ink-400 text-xs italic font-serif">
                {getStatusDisplay()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultCard;