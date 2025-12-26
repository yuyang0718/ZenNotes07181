
import React, { useState } from 'react';
import { Note, Category, Language } from '../types';
import { translations } from '../translations';
import { Plus, Search, Trash2, X, Settings, RotateCcw, Pin } from 'lucide-react';

interface SidebarProps {
  notes: Note[];
  categories: Category[];
  selectedCatId: string;
  isTrashView: boolean;
  onSelectCat: (id: string) => void;
  onToggleTrash: () => void;
  onAddCat: (name: string) => void;
  onDeleteCat: (id: string) => void;
  activeNoteId: string | null;
  searchQuery: string;
  onSearch: (query: string) => void;
  onSelectNote: (id: string) => void;
  onCreateNote: () => void;
  onDeleteNote: (id: string) => void;
  onRestoreNote: (id: string) => void;
  onPermanentDelete: (id: string) => void;
  onEmptyTrash: () => void;
  onOpenSettings: () => void;
  trashCount: number;
  language: Language;
  onTogglePin: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  notes, categories, selectedCatId, isTrashView, onSelectCat, onToggleTrash, onAddCat, onDeleteCat,
  activeNoteId, searchQuery, onSearch, onSelectNote, onCreateNote, onDeleteNote, 
  onRestoreNote, onPermanentDelete, onEmptyTrash, onOpenSettings, trashCount, language, onTogglePin
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const t = translations[language];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAddCat(name.trim());
      setName('');
      setIsAdding(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-[#0f172a] transition-colors">
      {/* Top Header Section */}
      <div className="p-6 pb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">{t.appName}</h1>
        <div className="flex items-center gap-1">
          <button onClick={onOpenSettings} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
            <Settings size={18} />
          </button>
          {!isTrashView && (
            <button onClick={onCreateNote} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
              <Plus size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Search Section */}
      <div className="px-6 pb-4">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800/50 rounded-xl outline-none focus:bg-white dark:focus:bg-slate-800 border border-transparent focus:border-slate-100 dark:focus:border-slate-700 transition-all text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600"
          />
        </div>
      </div>

      {/* Category Bar */}
      <div className="px-6 pb-4 overflow-x-auto no-scrollbar flex items-center gap-2">
        <button
          onClick={() => onSelectCat('all')}
          className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all ${
            selectedCatId === 'all' && !isTrashView
              ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md' 
              : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          {t.all}
        </button>
        {categories.map(cat => (
          <div key={cat.id} className="relative group shrink-0">
            <button
              onClick={() => onSelectCat(cat.id)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                selectedCatId === cat.id && !isTrashView
                  ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md pr-1.5' 
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {cat.name}
              {selectedCatId === cat.id && !isTrashView && (
                <div 
                  className="p-0.5 rounded-full hover:bg-red-500 hover:text-white transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteCat(cat.id);
                  }}
                >
                  <X size={10} />
                </div>
              )}
            </button>
          </div>
        ))}
        {isAdding ? (
          <form onSubmit={submit} className="shrink-0">
            <input 
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              onBlur={() => !name && setIsAdding(false)}
              className="px-2 py-1 rounded-full text-[11px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none w-20 text-slate-700 dark:text-slate-200"
            />
          </form>
        ) : (
          <button onClick={() => setIsAdding(true)} className="p-1 rounded-full text-slate-300 hover:text-slate-500 shrink-0">
            <Plus size={14} />
          </button>
        )}
      </div>

      {/* Note List Section (Scrollable) */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 space-y-1">
        {isTrashView && notes.length > 0 && (
          <div className="px-3 py-2 flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.inTrash}</span>
            <button 
              onClick={onEmptyTrash}
              className="text-[10px] font-bold text-red-400 hover:text-red-500 transition-colors uppercase tracking-widest"
            >
              {t.emptyTrash}
            </button>
          </div>
        )}
        {notes.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-300 dark:text-slate-700 italic">
            {isTrashView ? t.trashEmpty : t.noNotes}
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              onClick={() => onSelectNote(note.id)}
              className={`group p-3 rounded-2xl cursor-pointer transition-all border border-transparent ${
                activeNoteId === note.id 
                  ? 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700' 
                  : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 truncate">
                  {note.isPinned && !isTrashView && (
                    <Pin size={10} className="text-indigo-400 rotate-45 shrink-0" fill="currentColor" />
                  )}
                  <span className={`text-sm font-semibold truncate ${activeNoteId === note.id ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                    {note.title || t.untitledNote}
                  </span>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!isTrashView && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); onTogglePin(note.id); }}
                      className={`p-1 transition-colors ${note.isPinned ? 'text-indigo-400' : 'text-slate-300 hover:text-indigo-300'}`}
                      title={note.isPinned ? t.unpin : t.pin}
                    >
                      <Pin size={12} className={note.isPinned ? '' : 'rotate-45'} fill={note.isPinned ? 'currentColor' : 'none'} />
                    </button>
                  )}
                  {isTrashView ? (
                    <>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onRestoreNote(note.id); }}
                        className="p-1 text-slate-400 hover:text-indigo-500 transition-colors"
                        title={t.restore}
                      >
                        <RotateCcw size={12} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onPermanentDelete(note.id); }}
                        className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                        title={t.deletePermanently}
                      >
                        <Trash2 size={12} />
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDeleteNote(note.id); }}
                      className="p-1 text-slate-300 hover:text-red-400 transition-colors"
                      title={t.inTrash}
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-1 mt-0.5 font-medium">
                {note.content || t.startWriting}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Bottom Sticky Section */}
      <div className="p-4 border-t border-slate-50 dark:border-slate-800/50 bg-white dark:bg-[#0f172a] transition-colors">
        <button 
          onClick={onToggleTrash}
          className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl text-[11px] font-bold transition-all w-full group ${
            isTrashView 
              ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' 
              : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <div className={`p-1.5 rounded-lg transition-colors ${isTrashView ? 'bg-red-100 dark:bg-red-900/40' : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'}`}>
            <Trash2 size={14} />
          </div>
          <span>{t.trashBin}</span>
          {trashCount > 0 && (
            <span className={`ml-auto px-2 py-0.5 rounded-full text-[9px] ${
              isTrashView ? 'bg-red-200/50 dark:bg-red-800/50' : 'bg-slate-100 dark:bg-slate-800'
            }`}>
              {trashCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
