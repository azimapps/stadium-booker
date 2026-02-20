import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import StadiumCard from './StadiumCard';
import { fetchStadiums, Stadium } from '@/services/api';
import { Skeleton } from '@/components/ui/skeleton';

const StadiumsSection = () => {
  const { language, t } = useLanguage();

  const { data: stadiums, isLoading, error } = useQuery<Stadium[]>({
    queryKey: ['home-stadiums'],
    queryFn: () => fetchStadiums(),
  });

  return (
    <section id="stadiums" className="pt-6 pb-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            {t('stadiums.title')}
          </h2>
          <p className="text-muted-foreground text-lg">
            {t('stadiums.subtitle')}
          </p>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-48 w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <p className="text-destructive">Error loading stadiums.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stadiums?.map((stadium) => (
              <StadiumCard
                key={stadium.id}
                id={stadium.id}
                image={stadium.main_image}
                images={stadium.images}
                name={language === 'uz' ? stadium.name_uz : stadium.name_ru}
                location={language === 'uz' ? stadium.address_uz : stadium.address_ru}
                price={stadium.price_per_hour}
                capacity={stadium.capacity}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default StadiumsSection;
