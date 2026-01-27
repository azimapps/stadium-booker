import { useLanguage } from '@/contexts/LanguageContext';
import StadiumCard from './StadiumCard';
import stadium1 from '@/assets/stadium-1.jpg';
import stadium2 from '@/assets/stadium-2.jpg';
import stadium3 from '@/assets/stadium-3.jpg';

const stadiums = [
  {
    id: 1,
    image: stadium1,
    nameKey: 'stadium.central.name',
    locationKey: 'stadium.central.location',
    price: 300000,
    capacity: 22,
  },
  {
    id: 2,
    image: stadium2,
    nameKey: 'stadium.indoor.name',
    locationKey: 'stadium.indoor.location',
    price: 200000,
    capacity: 12,
  },
  {
    id: 3,
    image: stadium3,
    nameKey: 'stadium.mini.name',
    locationKey: 'stadium.mini.location',
    price: 150000,
    capacity: 10,
  },
];

const StadiumsSection = () => {
  const { t } = useLanguage();

  return (
    <section id="stadiums" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            {t('stadiums.title')}
          </h2>
          <p className="text-muted-foreground text-lg">
            {t('stadiums.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stadiums.map((stadium) => (
            <StadiumCard
              key={stadium.id}
              image={stadium.image}
              nameKey={stadium.nameKey}
              locationKey={stadium.locationKey}
              price={stadium.price}
              capacity={stadium.capacity}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default StadiumsSection;
