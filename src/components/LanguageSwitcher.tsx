import { useTheme } from 'next-themes';
import { useLanguage } from '@/contexts/LanguageContext';

const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1.5 rounded-xl border border-border/50 bg-background/50 backdrop-blur-md p-1.5 shadow-sm">
      <button
        onClick={() => setLanguage('uz')}
        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${language === 'uz'
            ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-105'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
      >
        UZ
      </button>
      <button
        onClick={() => setLanguage('ru')}
        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${language === 'ru'
            ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-105'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
      >
        RU
      </button>
      <div className="w-px h-5 bg-border/50" />
      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="px-2.5 py-2 text-xs rounded-lg transition-all duration-300 text-muted-foreground hover:text-foreground hover:bg-muted"
        aria-label="Toggle dark mode"
      >
        {theme === 'dark' ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          </svg>
        )}
      </button>
    </div>
  );
};

export default LanguageSwitcher;
