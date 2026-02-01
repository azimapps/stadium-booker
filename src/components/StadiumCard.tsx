import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Users, ArrowDown } from 'lucide-react';

interface StadiumCardProps {
  id: number | string;
  image: string;
  images?: string[];
  nameKey?: string;
  locationKey?: string;
  name?: string;
  location?: string;
  price: number;
  capacity: number | string;
}

const StadiumCard = ({ id, image, images = [], nameKey, locationKey, name, location, price, capacity }: StadiumCardProps) => {
  const { t } = useLanguage();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Combine main image with other images if they exist, evitando duplicates
  const allImages = [image, ...(images || [])].filter((img, index, self) =>
    img && self.indexOf(img) === index
  );

  useEffect(() => {
    if (allImages.length <= 1 || isHovered) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [allImages.length, isHovered]);

  const displayName = name || (nameKey ? t(nameKey) : '');
  const displayLocation = location || (locationKey ? t(locationKey) : '');

  return (
    <Link to={`/stadiums/${id}`} className="block group">
      <Card
        className="relative h-full overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2 group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative h-56 overflow-hidden">
          {allImages.map((img, index) => (
            <img
              key={img}
              src={img}
              alt={`${displayName} ${index + 1}`}
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-in-out group-hover:scale-110 ${index === currentImageIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                }`}
            />
          ))}

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Price Tag */}
          <div className="absolute top-4 right-4 z-10 bg-background/80 backdrop-blur-md border border-white/20 text-foreground px-4 py-2 rounded-2xl text-sm font-bold shadow-xl">
            {price.toLocaleString()} <span className="text-[10px] text-muted-foreground uppercase">{t('stadiums.perHour')}</span>
          </div>

          {/* Indicators */}
          {allImages.length > 1 && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-10 transition-opacity duration-300 opacity-60 group-hover:opacity-100">
              {allImages.map((_, index) => (
                <div
                  key={index}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${index === currentImageIndex ? 'bg-white w-4' : 'bg-white/40'
                    }`}
                />
              ))}
            </div>
          )}
        </div>

        <CardContent className="p-6">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
              {displayName}
            </h3>
            <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="truncate">{displayLocation}</span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/50">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 text-muted-foreground text-xs font-semibold">
              <Users className="w-4 h-4" />
              <span>{capacity} {t('stadiums.players')}</span>
            </div>

            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
              <ArrowDown className="w-5 h-5 -rotate-90 group-hover:rotate-0 transition-transform" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default StadiumCard;
