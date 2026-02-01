import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { ArrowDown, Play } from 'lucide-react';
import heroImage from '@/assets/hero-stadium.jpg';
import logo from '@/assets/logo.png';

const Hero = () => {
  const { t } = useLanguage();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with Parallax effect */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-110"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/80 via-foreground/40 to-background" />
      </div>

      {/* Floating particles/elements (CSS only) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-md mb-8 animate-fade-in">
          <img src={logo} alt="Logo" className="w-6 h-6 object-contain" />
          <span className="text-primary text-sm font-bold tracking-wider uppercase">
            {t('hero.subtitle')}
          </span>
        </div>

        <h1 className="text-5xl md:text-8xl font-black text-white mb-6 tracking-tighter leading-tight max-w-4xl mx-auto">
          {t('hero.title')}
        </h1>

        <p className="text-lg md:text-2xl text-white/70 max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
          {t('hero.description')}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            size="lg"
            className="text-lg px-10 py-8 rounded-2xl shadow-2xl shadow-primary/30 group relative overflow-hidden"
            onClick={() => document.getElementById('stadiums')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <span className="relative z-10 flex items-center gap-2">
              {t('hero.cta')}
              <ArrowDown className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="text-lg px-10 py-8 rounded-2xl bg-white/5 backdrop-blur-md border-white/10 hover:bg-white/10 text-white gap-2"
          >
            <Play className="w-5 h-5 fill-white" />
            Video ko'rish
          </Button>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4">
        <span className="text-white/40 text-xs font-bold tracking-[0.2em] uppercase">Scroll</span>
        <div className="w-6 h-12 rounded-full border-2 border-white/20 flex items-start justify-center p-1.5">
          <div className="w-1.5 h-3 bg-primary rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
