import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Calendar, Clock, MapPin, AlertTriangle, CheckCircle2, Banknote, Loader2, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchMyBookings, createPaymeOrder, createClickOrder, Booking } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO } from 'date-fns';
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

const Bookings = () => {
    const { t, language } = useLanguage();
    const { token, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const [paymentBooking, setPaymentBooking] = useState<Booking | null>(null);
    const [paymentLoading, setPaymentLoading] = useState<'payme' | 'click' | null>(null);

    const { data: bookings, isLoading, error } = useQuery({
        queryKey: ['my-bookings'],
        queryFn: () => fetchMyBookings(token!),
        enabled: !!token,
        refetchInterval: 5000
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
            // Save booking details for payment status page
            localStorage.setItem('pending_payment_booking', JSON.stringify({
                stadium_name_uz: paymentBooking.stadium.name_uz,
                stadium_name_ru: paymentBooking.stadium.name_ru,
                date: paymentBooking.date,
                hours: paymentBooking.hours,
                price: paymentBooking.price,
            }));
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
                                                onClick={() => setPaymentBooking(booking)}
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
                        {/* Payme Button */}
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

                        {/* Click Button */}
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
