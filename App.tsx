
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Editor } from './components/Editor';
import { SettingsModal } from './components/SettingsModal';
import { Note, Category, Language } from './types';
import { translations } from './translations';
import { v4 as uuidv4 } from 'uuid';
import { GoogleGenAI } from "@google/genai";

const NOTES_KEY = 'zn_notes_v3';
const CATS_KEY = 'zn_cats_v3';
const SETTINGS_KEY = 'zn_settings_v1';

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'work', name: 'Work' },
  { id: 'personal', name: 'Personal' },
  { id: 'ideas', name: 'Ideas' },
];

const App: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedCatId, setSelectedCatId] = useState('all');
  const [isTrashView, setIsTrashView] = useState(false);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'editor'>('list');
  const [isFocusMode, setIsFocusMode] = useState(false);

  const t = translations[language];

  useEffect(() => {
    const savedNotes = localStorage.getItem(NOTES_KEY);
    const savedCats = localStorage.getItem(CATS_KEY);
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    
    if (savedNotes) try { setNotes(JSON.parse(savedNotes)); } catch (e) {}
    
    if (savedCats !== null) {
      try { setCategories(JSON.parse(savedCats)); } catch (e) {}
    } else {
      setCategories(DEFAULT_CATEGORIES);
    }

    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setIsDarkMode(settings.darkMode || false);
        setLanguage(settings.language || 'en');
      } catch (e) {}
    }
    
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ darkMode: isDarkMode, language }));
  }, [isDarkMode, language]);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
      localStorage.setItem(CATS_KEY, JSON.stringify(categories));
    }
  }, [notes, categories, isLoading]);

  const filteredNotes = useMemo(() => {
    let result = notes;
    
    if (isTrashView) {
      result = result.filter(n => n.deletedAt !== undefined);
    } else {
      result = result.filter(n => n.deletedAt === undefined);
      if (selectedCatId !== 'all') {
        result = result.filter(n => n.categoryId === selectedCatId);
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q));
    }

    // Sort: Pinned first, then by updatedAt
    return result.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.updatedAt - a.updatedAt;
    });
  }, [notes, searchQuery, selectedCatId, isTrashView]);

  const activeNote = useMemo(() => notes.find(n => n.id === activeNoteId) || null, [notes, activeNoteId]);

  const handleCreateNote = useCallback(() => {
    const newNote: Note = {
      id: uuidv4(),
      title: '',
      content: '',
      updatedAt: Date.now(),
      categoryId: selectedCatId !== 'all' ? selectedCatId : undefined,
      isPinned: false
    };
    setNotes(prev => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
    setIsTrashView(false);
    setViewMode('editor');
  }, [selectedCatId]);

  const handleUpdateNote = useCallback((id: string, updates: Partial<Note>) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n));
  }, []);

  const handleTogglePin = useCallback((id: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, isPinned: !n.isPinned } : n));
  }, []);

  const handleAiAction = async (id: string, action: 'summarize' | 'polish' | 'title' | 'continue') => {
    const note = notes.find(n => n.id === id);
    if (!note || !note.content.trim()) return;

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      let prompt = "";
      const langContext = language === 'zh' ? "请用简体中文回复。" : "Please respond in English.";
      
      switch (action) {
        case 'summarize':
          prompt = `Provide a concise 1-2 sentence summary for the following text. Format it as a quote block (start with '> '). ${langContext}\n\nText: ${note.content}`;
          break;
        case 'polish':
          prompt = `Improve the writing of the following text. Keep the meaning but make it more professional, clear, and elegant. Return ONLY the polished text. ${langContext}\n\nText: ${note.content}`;
          break;
        case 'title':
          prompt = `Based on the following content, suggest a short, catchy, and professional title (max 6 words). Return ONLY the title text. ${langContext}\n\nContent: ${note.content}`;
          break;
        case 'continue':
          prompt = `Based on the content below, naturally continue the writing for one coherent paragraph. Do not repeat the existing text. Return ONLY the new content. ${langContext}\n\nContent: ${note.content}`;
          break;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      const resultText = response.text?.trim();
      if (resultText) {
        if (action === 'summarize') {
          handleUpdateNote(id, { content: `${resultText}\n\n${note.content}` });
        } else if (action === 'polish') {
          handleUpdateNote(id, { content: resultText });
        } else if (action === 'title') {
          handleUpdateNote(id, { title: resultText });
        } else if (action === 'continue') {
          handleUpdateNote(id, { content: `${note.content}\n\n${resultText}` });
        }
      }
    } catch (error) {
      console.error("AI Error:", error);
      alert(t.aiError);
    }
  };

  const handleMoveToTrash = useCallback((id: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, deletedAt: Date.now(), isPinned: false } : n));
    if (activeNoteId === id) {
      setActiveNoteId(null);
      setViewMode('list');
    }
  }, [activeNoteId]);

  const handleRestoreNote = useCallback((id: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, deletedAt: undefined, updatedAt: Date.now() } : n));
  }, []);

  const handlePermanentDelete = useCallback((id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    if (activeNoteId === id) {
      setActiveNoteId(null);
      setViewMode('list');
    }
  }, [activeNoteId]);

  const handleEmptyTrash = useCallback(() => {
    if (window.confirm(t.emptyConfirm)) {
      setNotes(prev => prev.filter(n => n.deletedAt === undefined));
      setActiveNoteId(null);
      setViewMode('list');
    }
  }, [t.emptyConfirm]);

  const handleAddCategory = (name: string) => {
    const newCat = { id: uuidv4(), name };
    setCategories(prev => [...prev, newCat]);
    setSelectedCatId(newCat.id);
    setIsTrashView(false);
  };

  const handleDeleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
    setNotes(prev => prev.map(n => n.categoryId === id ? { ...n, categoryId: undefined } : n));
    if (selectedCatId === id) setSelectedCatId('all');
  };

  if (isLoading) return null;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#fcfcfc] dark:bg-[#0f172a]">
      {/* Sidebar - Conditional width based on Focus Mode */}
      <div className={`${viewMode === 'list' ? 'flex' : (isFocusMode ? 'hidden' : 'hidden md:flex')} w-full md:w-80 h-full border-r border-slate-100 dark:border-slate-800 transition-all duration-500 ease-in-out`}>
        <Sidebar 
          notes={filteredNotes}
          categories={categories}
          selectedCatId={selectedCatId}
          isTrashView={isTrashView}
          onSelectCat={(id) => { setSelectedCatId(id); setIsTrashView(false); }}
          onToggleTrash={() => { setIsTrashView(true); setSelectedCatId('all'); }}
          onAddCat={handleAddCategory}
          onDeleteCat={handleDeleteCategory}
          activeNoteId={activeNoteId}
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
          onSelectNote={(id) => { setActiveNoteId(id); setViewMode('editor'); }}
          onCreateNote={handleCreateNote}
          onDeleteNote={handleMoveToTrash}
          onRestoreNote={handleRestoreNote}
          onPermanentDelete={handlePermanentDelete}
          onEmptyTrash={handleEmptyTrash}
          onOpenSettings={() => setIsSettingsOpen(true)}
          trashCount={notes.filter(n => n.deletedAt !== undefined).length}
          language={language}
          onTogglePin={handleTogglePin}
        />
      </div>
      
      <main className={`${viewMode === 'editor' ? 'flex' : 'hidden md:flex'} flex-1 h-full bg-white dark:bg-[#1e293b] transition-all duration-500 overflow-hidden`}>
        {activeNote ? (
          <Editor 
            note={activeNote} 
            onUpdate={(updates) => handleUpdateNote(activeNote.id, updates)}
            onRestore={() => handleRestoreNote(activeNote.id)}
            onAiAction={(action) => handleAiAction(activeNote.id, action)}
            searchQuery={searchQuery}
            onBack={() => setViewMode('list')}
            language={language}
            onTogglePin={() => handleTogglePin(activeNote.id)}
            isFocusMode={isFocusMode}
            onToggleFocus={() => setIsFocusMode(!isFocusMode)}
          />
        ) : (
          <div className="hidden md:flex h-full w-full flex-col items-center justify-center text-slate-300 dark:text-slate-700">
            <p className="text-sm font-medium">{t.selectNote}</p>
          </div>
        )}
      </main>

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        language={language}
        onSetLanguage={setLanguage}
      />
    </div>
  );
};

export default App;
