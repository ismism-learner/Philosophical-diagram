import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { GeneratedResult } from '../types';

interface ResultCardProps {
  result: GeneratedResult;
  onDelete: () => void;
}

const ResultCard: React.FC<ResultCardProps> = ({ result, onDelete }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveImage = async () => {
    if (!cardRef.current || !result.imageUrl) return;
    
    setIsSaving(true);
    try {
      // 使用 html2canvas 捕捉 cardRef 元素
      const canvas = await html2canvas(cardRef.current, {
        useCORS: true, // 允许跨域图片
        scale: 2, // 提高分辨率
        backgroundColor: '#ffffff', // 确保背景为白色
        logging: false,
      });

      // 创建下载链接
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      link.download = `philo-flow-${timestamp}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error("导出图片失败:", error);
      alert("图片导出失败，请稍后重试。");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div 
      ref={cardRef}
      className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xl transition-all duration-500 hover:shadow-2xl flex flex-col md:flex-row relative group"
    >
      {/* Delete Button (Top Right of the whole card) - Ignored by html2canvas */}
      <button
        onClick={onDelete}
        data-html2canvas-ignore
        className="absolute top-2 right-2 z-30 p-2 rounded-full text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
        title="删除此卡片"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
      </button>

      {/* Image Section - Styled like a whiteboard/canvas */}
      <div className="md:w-1/2 relative min-h-[350px] bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col">
        
        {/* Save Button - Moved inside Image Section so it sits over the image */}
        {result.imageUrl && !result.isLoading && (
          <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200" data-html2canvas-ignore>
            <button
              onClick={handleSaveImage}
              disabled={isSaving}
              className="flex items-center gap-2 bg-white/90 backdrop-blur-sm hover:bg-philo-accent hover:text-white text-slate-600 border border-slate-300 font-sans text-xs font-bold py-2 px-4 rounded-full shadow-sm transition-all"
              title="将此卡片保存为图片"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>保存中...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                  <span>保存图片</span>
                </>
              )}
            </button>
          </div>
        )}

        {result.isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <div className="w-12 h-12 border-4 border-slate-300 border-t-philo-accent rounded-full animate-spin mb-4"></div>
            <p className="font-mono text-xs tracking-widest text-slate-500 uppercase animate-pulse">正在绘制图表...</p>
            <p className="text-xs mt-3 text-slate-400 font-mono max-w-xs">"{result.concept.visualPrompt.substring(0, 60)}..."</p>
          </div>
        ) : result.imageUrl ? (
          <div className="flex-grow w-full h-full p-4 flex items-center justify-center bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxwYXRoIGQ9Ik0xIDEwaDE4TTEwIDF2MTgiIHN0cm9rZT0iI2UyZThmMCIgc3Ryb2tlLXdpZHRoPSIwLjUiIGZpbGw9Im5vbmUiLz4KPC9zdmc+')]">
             <img 
              src={result.imageUrl} 
              alt={result.concept.conceptTitle}
              className="w-full h-auto max-h-[400px] object-contain rounded shadow-sm border border-slate-200 bg-white"
            />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-red-400 bg-red-50">
             图表生成失败
          </div>
        )}
        {/* Branding watermark for exported image */}
        <div className="absolute bottom-2 right-3 text-[10px] text-slate-300 font-mono font-bold select-none pointer-events-none">
          PhiloFlow Generated
        </div>
      </div>

      {/* Text Section */}
      <div className="md:w-1/2 p-8 flex flex-col justify-center bg-white">
        <div className="mb-4 pb-4 border-b border-slate-100 pr-8"> {/* pr-8 for Delete button clearance */}
            <span className="text-philo-accent text-xs font-bold tracking-widest uppercase font-mono">逻辑 / 流程</span>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{result.concept.conceptTitle}</h3>
        </div>
        
        <p className="text-slate-600 leading-relaxed mb-6 text-sm md:text-base text-justify">
          {result.concept.explanation}
        </p>

        <div className="bg-slate-50 p-4 rounded border border-slate-200">
          <p className="text-[10px] text-slate-400 font-mono uppercase mb-2">生成指令 (Prompt)</p>
          <p className="text-slate-500 text-xs font-mono leading-tight break-words">
            {result.concept.visualPrompt}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResultCard;