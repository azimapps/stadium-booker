import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import logo from '@/assets/logo.png';

const Header = () => {
  const { t } = useLanguage();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={logo} alt="Stadion 24/7" className="w-10 h-10 rounded-lg object-contain" />
          <span className="font-semibold text-lg text-foreground">Stadion 24/7</span>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <a href="#" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            {t('nav.home')}
          </a>
          <a href="#stadiums" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            {t('nav.stadiums')}
          </a>
          <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            {t('nav.about')}
          </a>
        </nav>

        <LanguageSwitcher />
      </div>
    </header>
  );
};

export default Header;
