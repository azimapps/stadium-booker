import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Calendar, CircleDollarSign, Trophy } from 'lucide-react';
import { format } from 'date-fns';

interface TournamentCardProps {
    id: number;
    title: string;
    description: string;
    stadiumName: string;
    stadiumAddress: string;
    startTime: string;
    entranceFee: number;
    image: string;
}

const TournamentCard = ({
    id,
    title,
    description,
    stadiumName,
    stadiumAddress,
    startTime,
    entranceFee,
    image
}: TournamentCardProps) => {
    const { t } = useLanguage();

    const formattedDate = format(new Date(startTime), 'dd.MM.yyyy HH:mm');

    return (
        <Card className="overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2 group">
            <div className="relative h-48 overflow-hidden">
                <img
                    src={image || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=800&auto=format&fit=crop'}
                    alt={title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                <div className="absolute top-4 left-4">
                    <div className="flex items-center gap-2 bg-primary/90 backdrop-blur-md text-primary-foreground px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
                        <Trophy className="w-3.5 h-3.5" />
                        <span>Tournament</span>
                    </div>
                </div>

                <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h3 className="text-xl font-bold line-clamp-1">{title}</h3>
                    <div className="flex items-center gap-1.5 text-white/80 text-xs mt-1">
                        <MapPin className="w-3.5 h-3.5 text-primary" />
                        <span className="truncate">{stadiumName}</span>
                    </div>
                </div>
            </div>

            <CardContent className="p-6 space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                    {description}
                </p>

                <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase font-semibold">
                            <Calendar className="w-3.5 h-3.5 text-primary" />
                            {t('tournaments.start_date')}
                        </div>
                        <div className="text-sm font-medium">{formattedDate}</div>
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase font-semibold">
                            <CircleDollarSign className="w-3.5 h-3.5 text-primary" />
                            {t('tournaments.entrance_fee')}
                        </div>
                        <div className="text-sm font-bold text-primary">
                            {entranceFee > 0 ? `${entranceFee.toLocaleString()} UZS` : t('tournaments.free')}
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-border/50">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground italic">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="truncate">{stadiumAddress}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default TournamentCard;
