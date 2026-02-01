import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TournamentCard from '@/components/TournamentCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, AlertCircle } from 'lucide-react';
import { fetchTournaments, Tournament } from '@/services/api';

const TournamentsPage = () => {
    const { language, t } = useLanguage();
    const { data: tournaments, isLoading, error } = useQuery<Tournament[]>({
        queryKey: ['tournaments'],
        queryFn: () => fetchTournaments(),
    });

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Header />
            <main className="flex-grow pt-24 pb-12">
                <div className="container mx-auto px-4">
                    <div className="relative mb-12 p-8 rounded-3xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/10 overflow-hidden">
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                                    {t('nav.tournaments')}
                                </h1>
                                <p className="text-muted-foreground text-lg max-w-2xl">
                                    {t('tournaments.subtitle')}
                                </p>
                            </div>
                            <div className="hidden lg:flex items-center justify-center w-24 h-24 rounded-2xl bg-primary/20 backdrop-blur-sm border border-primary/20">
                                <Trophy className="w-12 h-12 text-primary animate-pulse" />
                            </div>
                        </div>
                        {/* Decorative elements */}
                        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
                        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
                    </div>

                    {isLoading ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="space-y-4">
                                    <Skeleton className="h-64 w-full rounded-2xl" />
                                    <Skeleton className="h-6 w-3/4" />
                                    <Skeleton className="h-4 w-1/2" />
                                </div>
                            ))}
                        </div>
                    ) : error ? (
                        <div className="text-center py-20 bg-muted/30 rounded-3xl border-2 border-dashed border-border">
                            <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4 opacity-50" />
                            <h2 className="text-2xl font-bold mb-2">Turnirlarni yuklashda xatolik</h2>
                            <p className="text-muted-foreground">Keyinroq yana qaytadan urinib ko'ring.</p>
                        </div>
                    ) : tournaments?.length === 0 ? (
                        <div className="text-center py-20 bg-muted/30 rounded-3xl border-2 border-dashed border-border">
                            <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
                            <h2 className="text-2xl font-bold mb-2">Hozircha faol turnirlar yo'q</h2>
                            <p className="text-muted-foreground">Tez orada yangi turnirlar qo'shiladi.</p>
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
            </main>
            <Footer />
        </div>
    );
};

export default TournamentsPage;
