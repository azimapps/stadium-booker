import { useLanguage } from '@/contexts/LanguageContext';
import { Calendar, Shield, Headphones } from 'lucide-react';

const features = [
  {
    icon: Calendar,
    titleKey: 'features.booking.title',
    descKey: 'features.booking.desc',
    color: 'bg-blue-500/10 text-blue-500',
  },
  {
    icon: Shield,
    titleKey: 'features.payment.title',
    descKey: 'features.payment.desc',
    color: 'bg-green-500/10 text-green-500',
  },
  {
    icon: Headphones,
    titleKey: 'features.support.title',
    descKey: 'features.support.desc',
    color: 'bg-purple-500/10 text-purple-500',
  },
];

const FeaturesSection = () => {
  const { t } = useLanguage();

  return (
    <section id="features" className="py-24 bg-card/30 backdrop-blur-sm relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/10 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            {t('features.title')}
          </h2>
          <p className="text-muted-foreground text-lg">
            Sifatli xizmat va qulayliklar bizning ustuvorligimizdir.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group relative p-8 rounded-2xl bg-background border border-border hover:border-primary/50 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2"
              >
                <div className={`w-16 h-16 rounded-2xl ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
                  <Icon className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  {t(feature.titleKey)}
                </h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  {t(feature.descKey)}
                </p>
                <div className="absolute bottom-4 right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-8 h-1 bg-primary rounded-full transition-all duration-500 group-hover:w-16" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
