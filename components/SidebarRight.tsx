
import React, { useState } from 'react';
import { AppMode, GeneratedResult, LibraryItem, ResultStatus, Language } from '../types';
import { UI_TEXT } from '../constants';
import { saveSessionToFolder } from '../services/storageService';

interface SidebarRightProps {
  mode: AppMode;
  lang: Language;
  results: GeneratedResult[];
  isPaused: boolean;
  onTogglePause: () => void;
  onClearResults: () => void;
  library: LibraryItem[];
  onRefreshLibrary: () => void;
  onDownloadZip: () => void; // Passed from App
  onDownloadDocx: () => void; // Passed from App
  isDownloadingZip: boolean;
  isDownloadingDocx: boolean;
}

const SidebarRight: React.FC<SidebarRightProps> = ({ 
  mode, 
  lang,
  results, 
  isPaused, 
  onTogglePause,
  onClearResults,
  library,
  onRefreshLibrary,
  onDownloadZip,
  onDownloadDocx,
  isDownloadingZip,
  isDownloadingDocx
}) => {
  const isModern = mode === AppMode.MODERN;
  const t = UI_TEXT[lang];

  // Save Session State
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [sessionName, setSessionName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const total = results.length;
  const processed = results.filter(r => r.status === ResultStatus.SUCCESS || r.status === ResultStatus.ERROR).length;
  const remaining = total - processed;
  const percent = total > 0 ? Math.round((processed / total) * 100) : 0;
  const hasSuccess = results.some(r => r.status === ResultStatus.SUCCESS);

  const handleSaveSession = async () => {
    if (!selectedFolderId || !sessionName.trim()) {
      alert("Please select a folder and enter a name.");
      return;
    }
    
    setIsSaving(true);
    try {
      const sessionData = {
        id: `session-${Date.now()}`,
        name: sessionName,
        timestamp: Date.now(),
        results: results,
        mode: mode
      };

      await saveSessionToFolder(selectedFolderId, sessionName, sessionData);
      onRefreshLibrary();
      setSessionName('');
      alert("Session Saved!");
    } catch (e: any) {
      console.error(e);
      alert("Failed to save session: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const baseClasses = isModern 
    ? "bg-gray-50 border-l border-gray-200 text-gray-700 font-modern" 
    : "bg-paper-100 border-l border-paper-300 text-ink-800 font-serif";

  const buttonBase = "w-full py-2 mb-2 text-xs font-bold rounded shadow-sm transition-all flex items-center justify-center gap-2";
  const pauseBtn = isModern
    ? (isPaused ? "bg-green-500 text-white hover:bg-green-600" : "bg-yellow-500 text-white hover:bg-yellow-600")
    : (isPaused ? "bg-ink-600 text-paper-50 hover:bg-ink-800" : "bg-cinnabar-700 text-paper-50 hover:bg-cinnabar-900");

  const saveBtn = isModern
    ? "bg-blue-600 text-white hover:bg-blue-700"
    : "bg-ink-800 text-paper-50 hover:bg-black";

  return (
    <aside className={`h-full w-64 flex flex-col p-4 transition-colors duration-300 ${baseClasses}`}>
      
      {/* 1. Console Header */}
      <h2 className="text-sm font-bold tracking-widest uppercase mb-6 border-b pb-2 border-current opacity-70">
        {isModern ? t.consoleTitleModern : t.consoleTitleClassic}
      </h2>

      {/* 2. Queue Control */}
      <div className="mb-6">
        <label className="text-[10px] uppercase font-bold opacity-50 mb-2 block">
            {isModern ? t.consoleStatusModern : t.consoleStatus}
        </label>
        
        {total > 0 && remaining > 0 ? (
          <button onClick={onTogglePause} className={`${buttonBase} ${pauseBtn}`}>
            {isPaused 
                ? (isModern ? t.consoleResumeModern : t.consoleResume) 
                : (isModern ? t.consolePauseModern : t.consolePause)}
          </button>
        ) : (
          <div className="text-xs opacity-50 italic mb-2">Queue Idle</div>
        )}
        
        {/* Progress Bar */}
        <div className="mt-4 mb-4">
            <div className="flex justify-between text-[10px] mb-1">
                <span>{isModern ? t.consoleProgressModern : t.consoleProgress}</span>
                <span>{percent}%</span>
            </div>
            <div className={`h-2 w-full rounded-full overflow-hidden ${isModern ? 'bg-gray-200' : 'bg-ink-200'}`}>
                <div 
                    className={`h-full transition-all duration-500 ${isModern ? 'bg-blue-500' : 'bg-cinnabar-700'}`}
                    style={{ width: `${percent}%` }}
                ></div>
            </div>
            <div className="text-[10px] mt-1 text-right opacity-60">
                {remaining} {isModern ? t.consoleRemainingModern : t.consoleRemaining}
            </div>
        </div>

        {/* Clear Button */}
        <button 
            onClick={onClearResults}
            disabled={total === 0}
            className={`w-full py-2 text-xs font-bold rounded shadow-sm transition-all border disabled:opacity-50 ${
                isModern 
                ? 'border-red-200 text-red-500 hover:bg-red-50 bg-white' 
                : 'border-cinnabar-700 text-cinnabar-700 hover:bg-paper-200 bg-paper-50'
            }`}
        >
            {isModern ? t.consoleClearModern : t.consoleClear}
        </button>
      </div>

      {/* 3. Export Buttons (New Location) */}
      <div className="mb-8">
         <label className="text-[10px] uppercase font-bold opacity-50 mb-2 block">
            {isModern ? t.consoleExportTitleModern : t.consoleExportTitle}
         </label>
         <button 
           onClick={onDownloadDocx}
           disabled={!hasSuccess || isDownloadingDocx}
           className={`${buttonBase} ${isModern ? 'bg-white border border-gray-200 text-blue-600 hover:bg-blue-50' : 'bg-paper-50 border border-ink-300 text-ink-800 hover:bg-paper-200'} disabled:opacity-50`}
         >
           {isDownloadingDocx ? (isModern ? t.exportingModern : t.exporting) : (isModern ? t.downloadDocxModern : t.downloadDocx)}
         </button>
         <button 
           onClick={onDownloadZip}
           disabled={!hasSuccess || isDownloadingZip}
           className={`${buttonBase} ${isModern ? 'bg-white border border-gray-200 text-modern-accent hover:bg-blue-50' : 'bg-paper-50 border border-ink-300 text-ink-600 hover:bg-paper-200'} disabled:opacity-50`}
         >
           {isDownloadingZip ? (isModern ? t.downloadingModern : t.downloading) : (isModern ? t.downloadBatchModern : t.downloadBatch)}
         </button>
      </div>

      {/* 4. Save Session */}
      <div className={`mt-auto pt-6 border-t ${isModern ? 'border-gray-200' : 'border-ink-300'}`}>
        <label className="text-[10px] uppercase font-bold opacity-50 mb-4 block">
            {isModern ? t.consoleSaveModern : t.consoleSave}
        </label>

        {/* Folder Select */}
        <select 
          className={`w-full mb-3 p-2 text-xs rounded border outline-none ${
              isModern ? 'bg-white border-gray-300' : 'bg-paper-50 border-ink-300'
          }`}
          value={selectedFolderId}
          onChange={(e) => setSelectedFolderId(e.target.value)}
        >
          <option value="">-- Select Folder --</option>
          {library.filter(i => i.type === 'folder').map(folder => (
            <option key={folder.id} value={folder.id}>{folder.name}</option>
          ))}
        </select>

        {/* Name Input */}
        <input 
          type="text"
          placeholder="Session Name"
          className={`w-full mb-3 p-2 text-xs rounded border outline-none ${
              isModern ? 'bg-white border-gray-300' : 'bg-paper-50 border-ink-300'
          }`}
          value={sessionName}
          onChange={(e) => setSessionName(e.target.value)}
        />

        <button 
            onClick={handleSaveSession} 
            disabled={isSaving || results.length === 0}
            className={`${buttonBase} ${saveBtn} disabled:opacity-50`}
        >
            {isSaving ? "Saving..." : (isModern ? t.consoleSaveModern : t.consoleSave)}
        </button>
      </div>

    </aside>
  );
};

export default SidebarRight;
