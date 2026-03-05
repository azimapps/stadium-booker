import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { checkClickStatus, checkPaymeStatus, fetchMyBookings } from '@/services/api';
import { CheckCircle2, XCircle, Loader2, Globe, Calendar, Clock, Monitor, Timer } from 'lucide-react';
import { useEffect, useState } from 'react';

const CountdownTimer = ({ date, hours }: { date: string; hours: number[] }) => {
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
        <div className="flex items-center justify-center gap-3 bg-primary/10 border border-primary/30 rounded-2xl py-4 px-5">
            <Timer className="w-6 h-6 text-green-500 flex-shrink-0" />
            <span className="text-sm font-medium">Boshlanishiga</span>
            <span className="text-xl font-bold text-green-500 font-mono">{timeLeft}</span>
        </div>
    );
};

const PaymentStatus = () => {
    const { orderId } = useParams<{ orderId: string }>();
    const { token } = useAuth();
    const { language } = useLanguage();
    const navigate = useNavigate();

    const { data: status, isLoading } = useQuery({
        queryKey: ['payment-status', orderId],
        queryFn: async () => {
            try {
                return await checkClickStatus(token!, parseInt(orderId!));
            } catch {
                return await checkPaymeStatus(token!, parseInt(orderId!));
            }
        },
        enabled: !!token && !!orderId,
        refetchInterval: (query) => {
            if (query.state.data?.status === 'pending') return 3000;
            return false;
        },
    });

    // Fetch user's bookings to get details (stadium, date, hours, price)
    const { data: bookings } = useQuery({
        queryKey: ['my-bookings-payment', orderId],
        queryFn: () => fetchMyBookings(token!),
        enabled: !!token && !!status,
    });

    // Find the most recently updated booking that matches
    const booking = bookings
        ?.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        ?.[0];

    const stadiumName = booking
        ? (language === 'uz' ? booking.stadium.name_uz : booking.stadium.name_ru)
        : undefined;

    const formatHours = (hours: number[]) => {
        if (!hours || hours.length === 0) return '';
        const sorted = [...hours].sort((a, b) => a - b);
        const start = `${sorted[0].toString().padStart(2, '0')}:00`;
        const end = `${(sorted[sorted.length - 1] + 1).toString().padStart(2, '0')}:00`;
        return `${start} — ${end}`;
    };

    // Loading state
    if (isLoading || !status) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center px-6">
                    <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto mb-6" />
                    <h1 className="text-2xl font-bold mb-2">Tekshirilmoqda...</h1>
                    <p className="text-muted-foreground">To'lov holati tekshirilmoqda</p>
                </div>
            </div>
        );
    }

    // Pending state
    if (status.status === 'pending') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center px-6 max-w-sm w-full">
                    <div className="w-24 h-24 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-6">
                        <Clock className="w-12 h-12 text-yellow-500 animate-pulse" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">To'lov kutilmoqda...</h1>
                    <p className="text-muted-foreground mb-8">
                        {status.amount.toLocaleString()} so'm to'lov kutilmoqda
                    </p>
                    <button
                        onClick={() => navigate('/bookings')}
                        className="w-full h-14 rounded-2xl bg-yellow-500 text-white font-bold text-lg hover:bg-yellow-600 transition-colors"
                    >
                        Buyurtmalarga o'tish
                    </button>
                </div>
            </div>
        );
    }

    // Success state
    if (status.status === 'paid') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background px-4">
                <div className="text-center max-w-sm w-full">
                    <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-14 h-14 text-white" strokeWidth={2.5} />
                    </div>

                    <h1 className="text-2xl font-bold mb-2">Buyurtma tasdiqlandi!</h1>
                    {stadiumName && (
                        <p className="text-muted-foreground mb-8">
                            {stadiumName} uchun buyurtmangiz tasdiqlandi
                        </p>
                    )}

                    <div className="bg-card border border-border rounded-2xl p-5 mb-8 text-left space-y-0">
                        {stadiumName && (
                            <>
                                <div className="flex items-center gap-3 py-4">
                                    <Globe className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                                    <span className="font-bold">{stadiumName}</span>
                                </div>
                                <div className="border-t border-border" />
                            </>
                        )}

                        {booking?.date && (
                            <>
                                <div className="flex items-center gap-3 py-4">
                                    <Calendar className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                                    <span>{booking.date}</span>
                                </div>
                                <div className="border-t border-border" />
                            </>
                        )}

                        {booking?.hours && booking.hours.length > 0 && (
                            <>
                                <div className="flex items-center gap-3 py-4">
                                    <Clock className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                                    <span>{formatHours(booking.hours)}</span>
                                </div>
                                <div className="border-t border-border" />
                            </>
                        )}

                        <div className="flex items-center gap-3 py-4">
                            <Monitor className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                            <span className="font-bold">{(booking?.price ?? status.amount).toLocaleString()} so'm</span>
                        </div>
                    </div>

                    {booking?.date && booking?.hours && booking.hours.length > 0 && (
                        <div className="mb-6">
                            <CountdownTimer date={booking.date} hours={booking.hours} />
                        </div>
                    )}

                    <button
                        onClick={() => navigate('/bookings')}
                        className="w-full h-14 rounded-2xl bg-green-500 text-white font-bold text-lg hover:bg-green-600 transition-colors"
                    >
                        Davom etish
                    </button>
                </div>
            </div>
        );
    }

    // Cancelled / Failed state
    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="text-center max-w-sm w-full">
                <div className="w-24 h-24 rounded-full bg-red-500 flex items-center justify-center mx-auto mb-6">
                    <XCircle className="w-14 h-14 text-white" strokeWidth={2.5} />
                </div>

                <h1 className="text-2xl font-bold mb-2">To'lov amalga oshmadi!</h1>
                <p className="text-muted-foreground mb-8">
                    To'lov bekor qilindi yoki xatolik yuz berdi. Qayta urinib ko'ring.
                </p>

                <div className="bg-card border border-border rounded-2xl p-5 mb-8 text-left space-y-0">
                    {stadiumName && (
                        <>
                            <div className="flex items-center gap-3 py-4">
                                <Globe className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                                <span className="font-bold">{stadiumName}</span>
                            </div>
                            <div className="border-t border-border" />
                        </>
                    )}
                    <div className="flex items-center gap-3 py-4">
                        <Monitor className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                        <span className="font-bold">{(booking?.price ?? status.amount).toLocaleString()} so'm</span>
                    </div>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={() => navigate('/bookings')}
                        className="w-full h-14 rounded-2xl bg-red-500 text-white font-bold text-lg hover:bg-red-600 transition-colors"
                    >
                        Qayta urinish
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full h-14 rounded-2xl border border-border text-foreground font-medium text-lg hover:bg-muted transition-colors"
                    >
                        Bosh sahifaga
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentStatus;
