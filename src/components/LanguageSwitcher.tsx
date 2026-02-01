import { useLanguage } from '@/contexts/LanguageContext';

const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();

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
    </div>
  );
};

export default LanguageSwitcher;
