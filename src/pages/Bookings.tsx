import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Calendar, Clock, MapPin, AlertTriangle, CheckCircle2, Banknote } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchMyBookings, Booking } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO, differenceInSeconds } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const BookingTimer = ({ deadline }: { deadline: string }) => {
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        const calculateTimeLeft = () => {
            if (!deadline) return;

            const now = new Date();
            // Handle common DB formats like "YYYY-MM-DD HH:mm:ss"
            let isoDeadline = deadline.replace(' ', 'T');
            if (!isoDeadline.includes('Z') && !isoDeadline.includes('+')) {
                isoDeadline += 'Z';
            }

            const end = new Date(isoDeadline);
            const diff = Math.floor((end.getTime() - now.getTime()) / 1000);
            setTimeLeft(Math.max(0, diff));
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
    }, [deadline]);

    const hours = Math.floor(timeLeft / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    const seconds = timeLeft % 60;

    const formattedTime = hours > 0
        ? `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        : `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    return (
        <span className="font-mono">
            {formattedTime}
        </span>
    );
};

const Bookings = () => {
    const { t, language } = useLanguage();
    const { token, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const { data: bookings, isLoading, error } = useQuery({
        queryKey: ['my-bookings'],
        queryFn: () => fetchMyBookings(token!),
        enabled: !!token,
        refetchInterval: 5000 // Poll every 5 seconds to keep status updated
    });

    useEffect(() => {
        if (!isAuthenticated && !isLoading) {
            // Optional: redirect or just show empty state
            // navigate('/auth'); 
        }
    }, [isAuthenticated, isLoading, navigate]);


    const getStatusBadge = (status: Booking['status'], deadline: string | null) => {
        if (status === 'cancelled') {
            return <Badge variant="destructive">Cancelled / Expired</Badge>;
        }

        switch (status) {
            case 'in_progress':
                return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Payment Pending</Badge>;
            case 'paid_online':
                return <Badge variant="default" className="bg-green-600">Paid Online</Badge>;
            case 'assigned_by_admin':
                return <Badge variant="default" className="bg-blue-600">Confirmed</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Header />
            <main className="flex-grow pt-24 pb-24">
                <div className="container mx-auto px-4 max-w-3xl">
                    <h1 className="text-3xl font-bold mb-8">{t('nav.orders')}</h1>

                    {!isAuthenticated ? (
                        <div className="text-center py-20">
                            <p className="text-muted-foreground mb-4">Please log in to view your bookings.</p>
                            <Button onClick={() => navigate('/auth')}>{t('auth.login')}</Button>
                        </div>
                    ) : isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <Skeleton key={i} className="h-40 w-full rounded-2xl" />
                            ))}
                        </div>
                    ) : error ? (
                        <div className="text-center text-destructive py-10">
                            Failed to load bookings. Please try again later.
                        </div>
                    ) : bookings && bookings.length > 0 ? (
                        <div className="space-y-4">
                            {bookings.map((booking) => (
                                <div key={booking.id} className="bg-card border border-border rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-xl font-bold">
                                            {language === 'uz' ? booking.stadium.name_uz : booking.stadium.name_ru}
                                        </h3>
                                        {/* Always show badge based on status */}
                                        {booking.status !== 'in_progress' && getStatusBadge(booking.status, booking.payment_deadline)}
                                    </div>

                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center gap-3 text-muted-foreground">
                                            <Calendar className="w-5 h-5" />
                                            <span className="font-medium text-foreground">
                                                {booking.date ? format(parseISO(booking.date), 'yyyy-MM-dd') : 'Recurring'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-muted-foreground">
                                            <Clock className="w-5 h-5" />
                                            <span className="font-medium text-foreground">
                                                {booking.hours.map(h => `${h.toString().padStart(2, '0')}:00`).join(', ')}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-muted-foreground">
                                            <Banknote className="w-5 h-5" />
                                            <span className="font-medium text-foreground">
                                                {booking.price?.toLocaleString()} so'm
                                            </span>
                                        </div>
                                    </div>

                                    {booking.status === 'in_progress' && (
                                        <div className="space-y-4">
                                            {booking.payment_deadline && (
                                                <div className="flex items-center justify-center gap-2 bg-red-50 text-red-500 py-3 rounded-xl font-bold text-lg">
                                                    <Clock className="w-5 h-5 animate-pulse" />
                                                    <BookingTimer deadline={booking.payment_deadline} />
                                                </div>
                                            )}

                                            <Button
                                                className="w-full h-12 text-lg rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                                                onClick={() => toast.info('To\'lov tizimi tez orada qo\'shiladi')}
                                            >
                                                To'lov qilish
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 bg-muted/30 rounded-3xl border-2 border-dashed border-border text-center p-6">
                            <div className="bg-primary/10 p-4 rounded-full mb-4">
                                <Calendar className="w-12 h-12 text-primary" />
                            </div>
                            <h2 className="text-xl font-semibold mb-2">Buyurtmalar tarixi hozircha bo'sh</h2>
                            <p className="text-muted-foreground max-w-md mb-6">
                                Siz hali hech qanday maydonni band qilmadingiz. Maydonlarni ko'rish uchun Asosiy sahifaga o'ting.
                            </p>
                            <Button onClick={() => navigate('/')}>Find a Stadium</Button>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Bookings;
