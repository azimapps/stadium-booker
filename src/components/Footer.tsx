import { useLanguage } from '@/contexts/LanguageContext';
import logo from '@/assets/logo.png';

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="py-8 bg-foreground">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Stadion 24/7" className="w-10 h-10 rounded-lg object-contain" />
            <span className="font-semibold text-lg text-background">Stadion 24/7</span>
          </div>

          <p className="text-background/60 text-sm">
            © 2024 Stadion 24/7. {t('footer.rights')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
