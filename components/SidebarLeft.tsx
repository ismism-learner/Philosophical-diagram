
import React, { useState } from 'react';
import { AppMode, LibraryItem, SavedSession, Language } from '../types';
import { UI_TEXT } from '../constants';
import { createFolder, deleteItem, renameItem } from '../services/storageService';

interface SidebarLeftProps {
  mode: AppMode;
  lang: Language;
  library: LibraryItem[];
  onLoadSession: (session: SavedSession) => void;
  onRefreshLibrary: () => void;
}

const SidebarLeft: React.FC<SidebarLeftProps> = ({ mode, lang, library, onLoadSession, onRefreshLibrary }) => {
  const isModern = mode === AppMode.MODERN;
  const t = UI_TEXT[lang];

  // UI State for folder toggles
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  const toggleFolder = (id: string) => {
    setExpandedFolders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateBook = async () => {
    const name = prompt(isModern ? "Enter Folder Name:" : "请输入图册名称：");
    if (name) {
      setLoading(true);
      await createFolder(name);
      onRefreshLibrary();
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Delete this item?")) {
      setLoading(true);
      await deleteItem(id);
      onRefreshLibrary();
      setLoading(false);
    }
  };

  const handleRename = async (e: React.MouseEvent, id: string, currentName: string) => {
    e.stopPropagation();
    const newName = prompt("Rename:", currentName);
    if (newName && newName !== currentName) {
        setLoading(true);
        await renameItem(id, newName);
        onRefreshLibrary();
        setLoading(false);
    }
  };

  const baseClasses = isModern 
    ? "bg-gray-50 border-r border-gray-200 text-gray-700 font-modern" 
    : "bg-paper-100 border-r border-paper-300 text-ink-800 font-serif";

  const buttonClasses = isModern
    ? "bg-white border border-gray-200 hover:bg-gray-100 text-xs px-2 py-1 rounded shadow-sm text-gray-600"
    : "bg-paper-50 border border-ink-300 hover:bg-paper-200 text-xs px-2 py-1 text-ink-800 shadow-sm";

  return (
    <aside className={`h-full w-64 flex flex-col transition-colors duration-300 ${baseClasses} ${loading ? 'opacity-70 pointer-events-none' : ''}`}>
      
      {/* Header */}
      <div className={`p-4 border-b flex items-center justify-between ${isModern ? 'border-gray-200' : 'border-paper-300'}`}>
        <h2 className="text-sm font-bold tracking-widest uppercase">
          {isModern ? t.libTitleModern : t.libTitleClassic}
        </h2>
        <button onClick={handleCreateBook} className={buttonClasses}>
          + {isModern ? t.libNewBookModern : t.libNewBook}
        </button>
      </div>

      {/* List */}
      <div className="flex-grow overflow-y-auto p-2 classic-scroll">
        {library.length === 0 && (
          <div className="text-center p-8 opacity-50 text-xs italic">
            {isModern ? t.libEmptyModern : t.libEmpty}
          </div>
        )}

        {library.map((item) => (
          <div key={item.id} className="mb-2">
            {/* Folder Item */}
            <div 
              className={`flex items-center justify-between p-2 rounded cursor-pointer select-none group ${isModern ? 'hover:bg-gray-200' : 'hover:bg-paper-200'}`}
              onClick={() => toggleFolder(item.id)}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="text-xs">{expandedFolders[item.id] ? '📂' : '📁'}</span>
                <span className="text-sm font-semibold truncate">{item.name}</span>
              </div>
              <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                    onClick={(e) => handleRename(e, item.id, item.name)}
                    className="hover:text-blue-500 px-1"
                    title="Rename"
                >
                    ✎
                </button>
                <button 
                    onClick={(e) => handleDelete(e, item.id)}
                    className="hover:text-red-500 px-1"
                    title="Delete"
                >
                    ×
                </button>
              </div>
            </div>

            {/* Folder Children (Files) */}
            {expandedFolders[item.id] && (
              <div className={`ml-4 pl-2 border-l ${isModern ? 'border-gray-300' : 'border-ink-300/50'}`}>
                {item.children?.map((child) => (
                  <div 
                    key={child.id}
                    className={`group flex items-center justify-between p-2 rounded cursor-pointer text-xs mb-1 ${
                      isModern ? 'hover:bg-blue-50 text-gray-600' : 'hover:bg-paper-200 text-ink-600'
                    }`}
                    onClick={() => child.data && onLoadSession(child.data)}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span>{isModern ? '📄' : '📜'}</span>
                      <span className="truncate">{child.name}</span>
                      <span className="opacity-50 text-[10px]">({child.data?.results.length})</span>
                    </div>
                    <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                            onClick={(e) => handleRename(e, child.id, child.name)}
                            className="hover:text-blue-500 px-1 text-sm leading-none"
                            title="Rename"
                        >
                            ✎
                        </button>
                        <button 
                            onClick={(e) => handleDelete(e, child.id)}
                            className="hover:text-red-500 px-1 text-lg leading-none"
                            title="Delete"
                        >
                            ×
                        </button>
                    </div>
                  </div>
                ))}
                {(!item.children || item.children.length === 0) && (
                   <div className="p-2 text-[10px] opacity-40 italic ml-2">
                     (Empty)
                   </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
};

export default SidebarLeft;