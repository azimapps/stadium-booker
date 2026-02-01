import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import StadiumCard from '@/components/StadiumCard';
import { Skeleton } from '@/components/ui/skeleton';

import { fetchStadiums, Stadium } from '@/services/api';

const StadiumsPage = () => {
    const { language, t } = useLanguage();
    const { data: stadiums, isLoading, error } = useQuery<Stadium[]>({
        queryKey: ['stadiums'],
        queryFn: () => fetchStadiums(),
    });

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Header />
            <main className="flex-grow pt-24 pb-12">
                <div className="container mx-auto px-4">
                    <div className="mb-12">
                        <h1 className="text-4xl font-bold text-foreground mb-4">
                            {t('nav.stadiums')}
                        </h1>
                        <p className="text-muted-foreground text-lg">
                            {t('stadiums.subtitle')}
                        </p>
                    </div>

                    {isLoading ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="space-y-4">
                                    <Skeleton className="h-48 w-full rounded-xl" />
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-4 w-1/2" />
                                </div>
                            ))}
                        </div>
                    ) : error ? (
                        <div className="text-center py-20">
                            <p className="text-destructive text-lg">Error loading stadiums. Please try again later.</p>
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
            </main>
            <Footer />
        </div>
    );
};

export default StadiumsPage;
