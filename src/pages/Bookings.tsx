import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Calendar, Clock, Banknote, Loader2, CheckCircle2, Timer, MapPin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchMyBookings, fetchStadiums, createPaymeOrder, createClickOrder, Booking } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const BookingTimer = ({ deadline }: { deadline: string }) => {
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        const calculateTimeLeft = () => {
            if (!deadline) return;

            let isoDeadline = deadline.replace(' ', 'T');
            if (!isoDeadline.includes('Z') && !isoDeadline.includes('+')) {
                isoDeadline += 'Z';
            }

            const now = new Date();
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

const StartCountdown = ({ date, hours }: { date: string; hours: number[] }) => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const startHour = Math.min(...hours);
        const targetDate = new Date(`${date}T${startHour.toString().padStart(2, '0')}:00:00`);

        const update = () => {
            const now = new Date();
            const diff = targetDate.getTime() - now.getTime();

            if (diff <= 0) {
                setTimeLeft('Boshlandi!');
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hrs = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const secs = Math.floor((diff % (1000 * 60)) / 1000);

            const time = `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            setTimeLeft(days > 0 ? `${days}d ${time}` : time);
        };

        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [date, hours]);

    return (
        <div className="flex items-center justify-center gap-3 bg-primary/10 border border-primary/30 rounded-xl py-3 px-4">
            <Timer className="w-5 h-5 text-green-500 flex-shrink-0" />
            <span className="text-sm font-medium">Boshlanishiga</span>
            <span className="text-lg font-bold text-green-500 font-mono">{timeLeft}</span>
        </div>
    );
};

const formatHourRange = (hours: number[]) => {
    if (!hours || hours.length === 0) return '';
    const sorted = [...hours].sort((a, b) => a - b);
    const start = `${sorted[0].toString().padStart(2, '0')}:00`;
    const end = `${(sorted[sorted.length - 1] + 1).toString().padStart(2, '0')}:00`;
    return `${start} — ${end}`;
};

const Bookings = () => {
    const { t, language } = useLanguage();
    const { token, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const [paymentBooking, setPaymentBooking] = useState<Booking | null>(null);
    const [paymentLoading, setPaymentLoading] = useState<'payme' | 'click' | null>(null);

    const { data: bookingsRaw, isLoading, error } = useQuery({
        queryKey: ['my-bookings'],
        queryFn: () => fetchMyBookings(token!),
        enabled: !!token,
        refetchInterval: 5000
    });

    // Fetch full stadium data to get addresses
    const { data: stadiums } = useQuery({
        queryKey: ['stadiums-all'],
        queryFn: () => fetchStadiums(),
    });

    // Enrich bookings with full stadium data (including address) and filter out started ones
    const bookings = bookingsRaw?.map(booking => {
        const fullStadium = stadiums?.find(s => s.id === booking.stadium_id);
        return fullStadium ? { ...booking, stadium: { ...booking.stadium, ...fullStadium } } : booking;
    }).filter(booking => {
        if (!booking.date || !booking.hours || booking.hours.length === 0) return true;
        const startHour = Math.min(...booking.hours);
        const startTime = new Date(`${booking.date}T${startHour.toString().padStart(2, '0')}:00:00`);
        return startTime.getTime() > Date.now();
    });

    useEffect(() => {
        if (!isAuthenticated && !isLoading) {
        }
    }, [isAuthenticated, isLoading, navigate]);

    const handlePayment = async (method: 'payme' | 'click') => {
        if (!paymentBooking || !token) return;
        setPaymentLoading(method);

        try {
            const orderData = { stadium_book_id: paymentBooking.id };
            if (method === 'payme') {
                const order = await createPaymeOrder(token, orderData);
                window.location.href = order.checkout_url!;
            } else {
                const order = await createClickOrder(token, orderData);
                window.location.href = order.payment_url!;
            }
        } catch (error: any) {
            toast.error(error.message || "To'lov yaratishda xatolik yuz berdi");
            setPaymentLoading(null);
        }
    };

    const getStatusBadge = (status: Booking['status']) => {
        switch (status) {
            case 'in_progress':
                return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30 hover:bg-yellow-500/30">To'lov kutilmoqda</Badge>;
            case 'paid_online':
                return <Badge variant="default" className="bg-green-600 hover:bg-green-700">To'langan</Badge>;
            case 'partially_paid':
                return <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30">Qisman to'langan</Badge>;
            case 'assigned_by_admin':
                return <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">Tasdiqlangan</Badge>;
            case 'cancelled':
                return <Badge variant="destructive">Bekor qilingan</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    // Check if booking start time is in the future
    const isUpcoming = (booking: Booking) => {
        if (!booking.date || !booking.hours || booking.hours.length === 0) return false;
        const startHour = Math.min(...booking.hours);
        const startTime = new Date(`${booking.date}T${startHour.toString().padStart(2, '0')}:00:00`);
        return startTime.getTime() > Date.now();
    };

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Header />
            <main className="flex-grow pt-16 lg:pt-24 pb-24">
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
                                    {/* Header: stadium name + status badge */}
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-xl font-bold flex-1 mr-3">
                                            {language === 'uz' ? booking.stadium.name_uz : booking.stadium.name_ru}
                                        </h3>
                                        {getStatusBadge(booking.status)}
                                    </div>

                                    {/* Booking details */}
                                    <div className="space-y-3 mb-4">
                                        <div className="flex items-center gap-3 text-muted-foreground">
                                            <Calendar className="w-5 h-5 flex-shrink-0" />
                                            <span className="font-medium text-foreground">
                                                {booking.date || 'Recurring'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-muted-foreground">
                                            <Clock className="w-5 h-5 flex-shrink-0" />
                                            <span className="font-medium text-foreground">
                                                {formatHourRange(booking.hours)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-muted-foreground">
                                            <Banknote className="w-5 h-5 flex-shrink-0" />
                                            <span className="font-medium text-foreground">
                                                {booking.price?.toLocaleString()} so'm
                                            </span>
                                        </div>
                                        {(booking.stadium.address_uz || booking.stadium.address_ru) && (
                                            <div className="flex items-center gap-3 text-muted-foreground">
                                                <MapPin className="w-5 h-5 flex-shrink-0" />
                                                <span className="font-medium text-foreground">
                                                    {language === 'uz' ? booking.stadium.address_uz : booking.stadium.address_ru}
                                                </span>
                                            </div>
                                        )}

                                        {/* Payment info for partially paid */}
                                        {booking.status === 'partially_paid' && (
                                            <div className="flex items-center gap-3">
                                                <CheckCircle2 className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                                                <span className="font-bold text-yellow-500">
                                                    To'langan: {booking.price?.toLocaleString()} so'm
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Countdown timer for upcoming bookings */}
                                    {booking.date && booking.hours && booking.hours.length > 0 &&
                                     booking.status !== 'cancelled' && isUpcoming(booking) && (
                                        <div className="mb-4">
                                            <StartCountdown date={booking.date} hours={booking.hours} />
                                        </div>
                                    )}

                                    {/* Payment deadline + pay button for in_progress */}
                                    {booking.status === 'in_progress' && (
                                        <div className="space-y-3">
                                            {booking.payment_deadline && (
                                                <div className="flex items-center justify-center gap-2 bg-red-500/10 text-red-500 py-3 rounded-xl font-bold text-lg">
                                                    <Clock className="w-5 h-5 animate-pulse" />
                                                    <BookingTimer deadline={booking.payment_deadline} />
                                                </div>
                                            )}
                                            <Button
                                                className="w-full h-12 text-lg rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                                                onClick={() => setPaymentBooking(booking)}
                                            >
                                                To'lov qilish
                                            </Button>
                                        </div>
                                    )}

                                    {/* Batafsil button - navigate to stadium page */}
                                    {booking.status !== 'in_progress' && booking.status !== 'cancelled' && (
                                        <Button
                                            variant="outline"
                                            className="w-full h-12 text-lg rounded-xl border-primary/30"
                                            onClick={() => navigate(`/stadiums/${booking.stadium_id}`)}
                                        >
                                            Batafsil
                                        </Button>
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
                            <Button onClick={() => navigate('/')}>Stadion topish</Button>
                        </div>
                    )}
                </div>
            </main>
            <Footer />

            {/* Payment Method Selection Dialog */}
            <Dialog open={paymentBooking !== null} onOpenChange={(open) => { if (!open) { setPaymentBooking(null); setPaymentLoading(null); } }}>
                <DialogContent className="sm:max-w-[400px] rounded-3xl p-0 overflow-hidden gap-0">
                    <DialogHeader className="px-6 pt-6 pb-4">
                        <DialogTitle className="text-xl font-bold text-center">To'lov usulini tanlang</DialogTitle>
                    </DialogHeader>

                    <div className="px-6 pb-2">
                        <div className="bg-muted/30 rounded-xl p-4 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Stadion</span>
                                <span className="font-medium">
                                    {paymentBooking && (language === 'uz' ? paymentBooking.stadium.name_uz : paymentBooking.stadium.name_ru)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Summa</span>
                                <span className="font-bold text-primary">{paymentBooking?.price?.toLocaleString()} so'm</span>
                            </div>
                        </div>
                    </div>

                    <div className="px-6 pb-6 pt-2 space-y-3">
                        <button
                            onClick={() => handlePayment('payme')}
                            disabled={paymentLoading !== null}
                            className="w-full flex items-center justify-center gap-3 h-14 rounded-xl bg-[#00CCCC] hover:bg-[#00BBBB] text-white font-bold text-lg transition-colors disabled:opacity-60"
                        >
                            {paymentLoading === 'payme' ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                        <rect width="24" height="24" rx="4" fill="white"/>
                                        <path d="M4 8h4v8H4V8zm6 0h4v8h-4V8zm6 0h4v8h-4V8z" fill="#00CCCC"/>
                                    </svg>
                                    Payme
                                </>
                            )}
                        </button>

                        <button
                            onClick={() => handlePayment('click')}
                            disabled={paymentLoading !== null}
                            className="w-full flex items-center justify-center gap-3 h-14 rounded-xl bg-[#0066FF] hover:bg-[#0055DD] text-white font-bold text-lg transition-colors disabled:opacity-60"
                        >
                            {paymentLoading === 'click' ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                        <rect width="24" height="24" rx="4" fill="white"/>
                                        <path d="M12 4l8 8-8 8-8-8 8-8z" fill="#0066FF"/>
                                    </svg>
                                    Click
                                </>
                            )}
                        </button>

                        <button
                            onClick={() => { setPaymentBooking(null); setPaymentLoading(null); }}
                            className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                        >
                            Bekor qilish
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Bookings;
