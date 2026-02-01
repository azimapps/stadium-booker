import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import logo from '@/assets/logo.png';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Header = () => {
  const { t } = useLanguage();
  const location = useLocation();

  const handleStadiumsClick = (e: React.MouseEvent) => {
    if (location.pathname === '/') {
      e.preventDefault();
      const element = document.getElementById('stadiums');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-xl border-b border-border/50" />
      <div className="container relative mx-auto px-4 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group transition-transform hover:scale-105 active:scale-95">
          <div className="relative w-12 h-12 rounded-2xl overflow-hidden shadow-lg shadow-primary/20 bg-primary/10 flex items-center justify-center border border-primary/20">
            <img src={logo} alt="Stadion 24/7" className="w-full h-full object-cover" />
          </div>
          <span className="font-bold text-xl tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            Stadion 24/7
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-10">
          {[
            { name: t('nav.home'), to: '/' },
            { name: t('nav.stadiums'), to: '/stadiums', onClick: handleStadiumsClick },
            { name: t('nav.tournaments'), to: '/tournaments' },
            { name: t('nav.about'), to: '#features', href: true }
          ].map((link, i) => (
            link.href ? (
              <a
                key={i}
                href={link.to}
                className="text-[15px] font-semibold text-muted-foreground hover:text-primary transition-all duration-300 relative group"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
              </a>
            ) : (
              <Link
                key={i}
                to={link.to}
                onClick={link.onClick}
                className="text-[15px] font-semibold text-muted-foreground hover:text-primary transition-all duration-300 relative group"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
              </Link>
            )
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
};

export default Header;
