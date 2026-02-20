import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import TournamentCard from './TournamentCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, AlertCircle } from 'lucide-react';
import { fetchTournaments, Tournament } from '@/services/api';

const TournamentsSection = () => {
    const { language, t } = useLanguage();
    const { data: tournaments, isLoading, error } = useQuery<Tournament[]>({
        queryKey: ['tournaments'],
        queryFn: () => fetchTournaments(),
    });

    if (!isLoading && (!tournaments || tournaments.length === 0)) {
        return null; // Don't show the section if there are no tournaments
    }

    return (
        <section id="tournaments" className="pt-20 pb-6 bg-muted/30">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3 flex items-center justify-center gap-3">
                        <Trophy className="w-8 h-8 text-primary" />
                        {t('nav.tournaments')}
                    </h2>
                    <p className="text-muted-foreground text-lg">
                        {t('tournaments.subtitle')}
                    </p>
                </div>

                {isLoading ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="space-y-4">
                                <Skeleton className="h-64 w-full rounded-2xl" />
                                <Skeleton className="h-6 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="text-center py-10">
                        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4 opacity-50" />
                        <p className="text-destructive">Error loading tournaments.</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {tournaments?.map((tournament) => (
                            <TournamentCard
                                key={tournament.id}
                                id={tournament.id}
                                title={language === 'uz' ? tournament.title_uz : tournament.title_ru}
                                description={language === 'uz' ? tournament.description_uz : tournament.description_ru}
                                stadiumName={language === 'uz' ? tournament.stadium?.name_uz || '' : tournament.stadium?.name_ru || ''}
                                stadiumAddress={language === 'uz' ? tournament.stadium?.address_uz || '' : tournament.stadium?.address_ru || ''}
                                startTime={tournament.start_time}
                                entranceFee={tournament.entrance_fee}
                                image={tournament.stadium?.main_image || ''}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default TournamentsSection;
