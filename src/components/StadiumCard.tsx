import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Users } from 'lucide-react';

interface StadiumCardProps {
  image: string;
  nameKey: string;
  locationKey: string;
  price: number;
  capacity: number;
}

const StadiumCard = ({ image, nameKey, locationKey, price, capacity }: StadiumCardProps) => {
  const { t } = useLanguage();

  return (
    <Card className="group overflow-hidden border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
      <div className="relative h-48 overflow-hidden">
        <img 
          src={image} 
          alt={t(nameKey)}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold">
          {price.toLocaleString()} UZS/{t('stadiums.perHour')}
        </div>
      </div>
      <CardContent className="p-5">
        <h3 className="text-lg font-semibold text-card-foreground mb-2">
          {t(nameKey)}
        </h3>
        <div className="flex items-center gap-1 text-muted-foreground text-sm mb-3">
          <MapPin className="w-4 h-4" />
          <span>{t(locationKey)}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-muted-foreground text-sm">
            <Users className="w-4 h-4" />
            <span>{capacity} {t('stadiums.players')}</span>
          </div>
          <Button size="sm">
            {t('stadiums.book')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default StadiumCard;
