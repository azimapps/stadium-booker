import { useLanguage } from '@/contexts/LanguageContext';
import { Calendar, Shield, Headphones } from 'lucide-react';

const features = [
  {
    icon: Calendar,
    titleKey: 'features.booking.title',
    descKey: 'features.booking.desc',
  },
  {
    icon: Shield,
    titleKey: 'features.payment.title',
    descKey: 'features.payment.desc',
  },
  {
    icon: Headphones,
    titleKey: 'features.support.title',
    descKey: 'features.support.desc',
  },
];

const FeaturesSection = () => {
  const { t } = useLanguage();

  return (
    <section id="features" className="py-20 bg-card">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-card-foreground mb-12">
          {t('features.title')}
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div 
                key={index}
                className="text-center p-6 rounded-xl bg-background border border-border hover:border-primary/30 transition-colors"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                  <Icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {t(feature.titleKey)}
                </h3>
                <p className="text-muted-foreground">
                  {t(feature.descKey)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
