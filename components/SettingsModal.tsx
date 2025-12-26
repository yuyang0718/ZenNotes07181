
import React from 'react';
import { X, Moon, Sun, Languages } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  language: Language;
  onSetLanguage: (lang: Language) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, onClose, isDarkMode, onToggleDarkMode, language, onSetLanguage 
}) => {
  if (!isOpen) return null;
  const t = translations[language];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-all">
      <div 
        className="w-full max-w-sm bg-white dark:bg-[#1e293b] rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-50 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">{t.settings}</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Dark Mode Setting */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">{t.darkMode}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">{t.appearance}</p>
              </div>
            </div>
            
            <button 
              onClick={onToggleDarkMode}
              className={`relative w-12 h-6 rounded-full transition-all duration-300 outline-none ${
                isDarkMode ? 'bg-indigo-600' : 'bg-slate-200'
              }`}
            >
              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-sm ${
                isDarkMode ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Language Setting */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                <Languages size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">{t.language}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">{t.languageName}</p>
              </div>
            </div>
            
            <div className="flex bg-slate-50 dark:bg-slate-800 p-1 rounded-xl">
              <button 
                onClick={() => onSetLanguage('en')}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  language === 'en' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                EN
              </button>
              <button 
                onClick={() => onSetLanguage('zh')}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  language === 'zh' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                中
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-50 dark:border-slate-800">
            <p className="text-[10px] text-slate-300 dark:text-slate-600 font-bold uppercase tracking-widest text-center">
              {t.version}
            </p>
          </div>
        </div>
      </div>
      <div className="absolute inset-0 -z-10" onClick={onClose} />
    </div>
  );
};
