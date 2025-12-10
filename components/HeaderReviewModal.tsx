import React, { useState } from 'react';
import { AppMode, Language } from '../types';
import { UI_TEXT } from '../constants';
import Button from './Button';

interface HeaderReviewModalProps {
  headers: { index: number; text: string }[];
  mode: AppMode;
  lang: Language;
  onConfirm: (indicesToKeep: Set<number>) => void;
  onCancel: () => void;
}

const HeaderReviewModal: React.FC<HeaderReviewModalProps> = ({
  headers,
  mode,
  lang,
  onConfirm,
  onCancel,
}) => {
  const t = UI_TEXT[lang];
  const isModern = mode === AppMode.MODERN;
  
  // Default: All checked (assume valid headers)
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set(headers.map(h => h.index)));

  const toggleItem = (index: number) => {
    const newSet = new Set(selectedIndices);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setSelectedIndices(newSet);
  };

  const toggleAll = () => {
    if (selectedIndices.size === headers.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(headers.map(h => h.index)));
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className={`w-full max-w-lg flex flex-col max-h-[85vh] rounded-lg shadow-2xl ${isModern ? 'bg-white font-modern' : 'bg-paper-50 font-serif border-2 border-ink-200'}`}>
        
        {/* Header */}
        <div className={`p-6 border-b shrink-0 ${isModern ? 'border-gray-200' : 'border-ink-200'}`}>
          <h3 className={`text-xl font-bold mb-2 ${isModern ? 'text-gray-900' : 'text-ink-900'}`}>
            {isModern ? t.reviewTitleModern : t.reviewTitle}
          </h3>
          <p className={`text-sm leading-relaxed ${isModern ? 'text-gray-500' : 'text-ink-600'}`}>
            {isModern ? t.reviewDescModern : t.reviewDesc}
          </p>
        </div>

        {/* List */}
        <div className="flex-grow overflow-y-auto p-4 custom-scrollbar bg-opacity-50">
           <div className="flex justify-end mb-2">
             <button onClick={toggleAll} className={`text-xs underline ${isModern ? 'text-blue-600' : 'text-cinnabar-700'}`}>
                {selectedIndices.size === headers.length ? (isModern ? t.reviewDeselectAll : t.reviewDeselectAll) : (isModern ? t.reviewSelectAll : t.reviewSelectAll)}
             </button>
           </div>
           
           <div className="space-y-2">
             {headers.map((h) => {
               const isSelected = selectedIndices.has(h.index);
               return (
                 <label 
                    key={h.index} 
                    className={`flex items-start gap-3 p-3 rounded cursor-pointer transition-colors border ${
                        isSelected 
                            ? (isModern ? 'bg-blue-50 border-blue-200' : 'bg-paper-200 border-ink-300') 
                            : (isModern ? 'bg-gray-50 border-transparent opacity-60' : 'bg-paper-100 border-transparent opacity-60 decoration-slice line-through text-ink-400')
                    }`}
                 >
                   <input 
                     type="checkbox" 
                     className={`mt-1 ${isModern ? 'accent-blue-600' : 'accent-cinnabar-700'}`}
                     checked={isSelected}
                     onChange={() => toggleItem(h.index)}
                   />
                   <span className={`text-sm break-all font-mono ${isModern ? 'text-gray-800' : 'text-ink-800'}`}>
                     {h.text}
                   </span>
                 </label>
               );
             })}
           </div>
        </div>

        {/* Footer */}
        <div className={`p-4 border-t shrink-0 flex justify-end gap-3 ${isModern ? 'border-gray-200 bg-gray-50' : 'border-ink-200 bg-paper-100'}`}>
           <Button variant={isModern ? 'modern-secondary' : 'secondary'} onClick={onCancel} mode={mode}>
             {t.modalCancel}
           </Button>
           <Button variant={isModern ? 'modern-primary' : 'primary'} onClick={() => onConfirm(selectedIndices)} mode={mode}>
             {isModern ? t.reviewConfirmModern : t.reviewConfirm}
           </Button>
        </div>

      </div>
    </div>
  );
};

export default HeaderReviewModal;