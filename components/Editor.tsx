
import React, { useRef, useEffect, useState } from 'react';
import { Note, Language } from '../types';
import { translations } from '../translations';
import { ChevronUp, ChevronDown, ChevronLeft, RotateCcw, AlertCircle, Sparkles, Wand2, Type, AlignLeft, Pin, Maximize2, Minimize2, Edit3 } from 'lucide-react';

interface EditorProps {
  note: Note;
  onUpdate: (updates: Partial<Note>) => void;
  onRestore?: () => void;
  onAiAction: (action: 'summarize' | 'polish' | 'title' | 'continue') => Promise<void>;
  searchQuery: string;
  onBack: () => void;
  language: Language;
  onTogglePin: () => void;
  isFocusMode: boolean;
  onToggleFocus: () => void;
}

export const Editor: React.FC<EditorProps> = ({ 
  note, onUpdate, onRestore, onAiAction, searchQuery, onBack, language, onTogglePin, isFocusMode, onToggleFocus 
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [matchIndices, setMatchIndices] = useState<number[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [isAiMenuOpen, setIsAiMenuOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const isDeleted = note.deletedAt !== undefined;
  const t = translations[language];

  useEffect(() => {
    if (!searchQuery.trim() || !note.content) {
      setMatchIndices([]);
      setCurrentMatchIndex(0);
      return;
    }
    const regex = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const indices: number[] = [];
    let match;
    while ((match = regex.exec(note.content)) !== null) {
      indices.push(match.index);
    }
    setMatchIndices(indices);
    setCurrentMatchIndex(0);
  }, [searchQuery, note.content]);

  const scrollToMatch = (index: number) => {
    if (index < 0 || index >= matchIndices.length || !textareaRef.current) return;
    const textarea = textareaRef.current;
    const pos = matchIndices[index];
    
    const lines = note.content.substring(0, pos).split('\n');
    const lineIndex = lines.length;
    textarea.scrollTop = (lineIndex - 5) * 28;
    setCurrentMatchIndex(index);
  };

  useEffect(() => {
    if (matchIndices.length > 0) scrollToMatch(0);
  }, [matchIndices.length]);

  const runAi = async (action: 'summarize' | 'polish' | 'title' | 'continue') => {
    setIsAiLoading(true);
    setIsAiMenuOpen(false);
    await onAiAction(action);
    setIsAiLoading(false);
  };

  const renderHighlightedContent = () => {
    if (!searchQuery.trim() || !note.content) return note.content;
    const parts = note.content.split(new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    let matchCounter = 0;
    return parts.map((part, i) => {
      if (part.toLowerCase() === searchQuery.toLowerCase()) {
        const isCurrent = matchCounter === currentMatchIndex;
        matchCounter++;
        return <mark key={i} className={isCurrent ? 'current' : ''}>{part}</mark>;
      }
      return part;
    });
  };

  return (
    <div className={`h-full w-full flex flex-col transition-colors relative ${isFocusMode ? 'max-w-4xl mx-auto px-4 md:px-0' : 'bg-white dark:bg-[#1e293b]'}`}>
      {isDeleted && (
        <div className="bg-red-50 dark:bg-red-900/20 px-6 py-2 flex items-center justify-between text-red-600 dark:text-red-400">
          <div className="flex items-center gap-2 text-xs font-bold">
            <AlertCircle size={14} />
            <span>{t.noteInTrash}</span>
          </div>
          <button 
            onClick={onRestore}
            className="flex items-center gap-1.5 px-3 py-1 bg-red-600 text-white rounded-lg text-[10px] font-bold hover:bg-red-700 transition-colors"
          >
            <RotateCcw size={12} />
            {t.restore.toUpperCase()}
          </button>
        </div>
      )}

      {/* Editor Header */}
      <div className={`px-6 py-4 flex items-center gap-4 border-b border-slate-50 dark:border-slate-800 transition-opacity duration-300 ${isFocusMode ? 'opacity-20 hover:opacity-100' : 'opacity-100'}`}>
        <button onClick={onBack} className="md:hidden text-slate-400"><ChevronLeft size={20} /></button>
        <div className="flex-1">
          <input 
            type="text"
            disabled={isDeleted}
            value={note.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder={t.title}
            className={`text-xl font-bold bg-transparent outline-none w-full transition-colors ${
              isDeleted ? 'text-slate-400' : 'text-slate-800 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600'
            }`}
          />
        </div>
        
        <div className="flex items-center gap-2">
          {!isDeleted && (
            <>
              <button 
                onClick={onToggleFocus}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                title={t.focusMode}
              >
                {isFocusMode ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
              <button 
                onClick={onTogglePin}
                className={`p-2 rounded-xl transition-colors ${note.isPinned ? 'text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                title={note.isPinned ? t.unpin : t.pin}
              >
                <Pin size={18} className={note.isPinned ? '' : 'rotate-45'} fill={note.isPinned ? 'currentColor' : 'none'} />
              </button>
            </>
          )}

          {searchQuery && matchIndices.length > 0 && (
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-100 dark:border-slate-700 mr-2">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{currentMatchIndex + 1}/{matchIndices.length}</span>
              <div className="flex gap-1">
                <button onClick={() => scrollToMatch((currentMatchIndex - 1 + matchIndices.length) % matchIndices.length)} className="p-0.5 text-slate-400"><ChevronUp size={14} /></button>
                <button onClick={() => scrollToMatch((currentMatchIndex + 1) % matchIndices.length)} className="p-0.5 text-slate-400"><ChevronDown size={14} /></button>
              </div>
            </div>
          )}

          {/* AI Sparkle Button */}
          {!isDeleted && note.content.trim().length > 5 && (
            <div className="relative">
              <button 
                onClick={() => setIsAiMenuOpen(!isAiMenuOpen)}
                className={`p-2 rounded-xl transition-all duration-300 flex items-center gap-2 border ${
                  isAiLoading 
                    ? 'animate-pulse bg-indigo-50 border-indigo-200 text-indigo-500' 
                    : 'hover:bg-indigo-50 dark:hover:bg-indigo-900/30 border-transparent hover:border-indigo-100 dark:hover:border-indigo-800 text-indigo-400 dark:text-indigo-400'
                }`}
                title={t.aiMagic}
              >
                <Sparkles size={18} className={isAiLoading ? 'animate-spin' : ''} />
              </button>

              {isAiMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsAiMenuOpen(false)}></div>
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white/80 dark:bg-[#1e293b]/90 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-20 py-2 animate-in fade-in slide-in-from-top-2">
                    <button 
                      onClick={() => runAi('continue')}
                      className="w-full px-4 py-2.5 text-left flex items-center gap-3 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                    >
                      <Edit3 size={14} />
                      {t.aiContinue}
                    </button>
                    <div className="h-px bg-slate-100 dark:bg-slate-800 my-1 mx-2" />
                    <button 
                      onClick={() => runAi('summarize')}
                      className="w-full px-4 py-2.5 text-left flex items-center gap-3 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <AlignLeft size={14} className="text-slate-400" />
                      {t.summarize}
                    </button>
                    <button 
                      onClick={() => runAi('polish')}
                      className="w-full px-4 py-2.5 text-left flex items-center gap-3 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Wand2 size={14} className="text-slate-400" />
                      {t.polish}
                    </button>
                    <button 
                      onClick={() => runAi('title')}
                      className="w-full px-4 py-2.5 text-left flex items-center gap-3 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Type size={14} className="text-slate-400" />
                      {t.suggestTitle}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        {searchQuery && (
          <div 
            className={`absolute inset-0 px-8 py-6 text-lg leading-relaxed highlight-layer overflow-hidden pointer-events-none ${isFocusMode ? 'md:px-12' : ''}`}
            style={{ top: textareaRef.current ? -textareaRef.current.scrollTop : 0 }}
          >
            {renderHighlightedContent()}
          </div>
        )}
        <textarea
          ref={textareaRef}
          disabled={isDeleted}
          value={note.content}
          onChange={(e) => onUpdate({ content: e.target.value })}
          onScroll={() => searchQuery && setMatchIndices([...matchIndices])}
          placeholder={t.writeThoughts}
          className={`w-full h-full px-8 py-6 text-lg leading-relaxed bg-transparent custom-scrollbar outline-none transition-all ${
            isDeleted ? 'text-slate-300 dark:text-slate-600' : 'text-slate-600 dark:text-slate-300 placeholder:text-slate-300 dark:placeholder:text-slate-600'
          } ${isFocusMode ? 'md:px-12 md:py-10 text-xl' : ''}`}
          spellCheck={false}
        />
      </div>

      <div className={`px-8 py-3 text-[10px] text-slate-300 dark:text-slate-600 font-bold uppercase tracking-widest border-t border-slate-50 dark:border-slate-800 flex justify-between items-center transition-opacity ${isFocusMode ? 'opacity-30 hover:opacity-100' : 'opacity-100'}`}>
        <span>{note.content.length} {t.characters}</span>
        {isAiLoading && <span className="text-indigo-400 animate-pulse">{t.aiWorking}</span>}
      </div>
    </div>
  );
};
