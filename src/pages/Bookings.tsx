import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Calendar } from 'lucide-react';

const Bookings = () => {
    const { t } = useLanguage();

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Header />
            <main className="flex-grow pt-24 pb-12">
                <div className="container mx-auto px-4">
                    <h1 className="text-3xl font-bold mb-8">{t('nav.orders')}</h1>

                    <div className="flex flex-col items-center justify-center py-20 bg-muted/30 rounded-3xl border-2 border-dashed border-border text-center p-6">
                        <div className="bg-primary/10 p-4 rounded-full mb-4">
                            <Calendar className="w-12 h-12 text-primary" />
                        </div>
                        <h2 className="text-xl font-semibold mb-2">Buyurtmalar tarixi hozircha bo'sh</h2>
                        <p className="text-muted-foreground max-w-md">
                            Siz hali hech qanday maydonni band qilmadingiz. Maydonlarni ko'rish uchun Asosiy sahifaga o'ting.
                        </p>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Bookings;
