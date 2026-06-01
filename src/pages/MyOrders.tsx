import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    Banknote,
    Calendar,
    CheckCircle2,
    Clock,
    ImageOff,
    Loader2,
    MapPin,
    Package,
    Receipt,
    ShoppingBag,
    Timer,
    Trophy,
} from 'lucide-react';
import { toast } from 'sonner';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
    Booking,
    createClickOrder,
    createPaymeOrder,
    fetchMyBookings,
    fetchMyMarketplaceOrders,
    fetchStadiums,
    MarketplaceOrder,
    MarketplaceOrderStatus,
} from '@/services/api';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const formatPrice = (n: number | null | undefined) =>
    n == null ? '—' : new Intl.NumberFormat('ru-RU').format(n);

const statusBadge: Record<MarketplaceOrderStatus, string> = {
    awaiting_prepayment: 'bg-amber-500/15 text-amber-700 border-amber-500/30',
    prepaid: 'bg-blue-500/10 text-blue-700 border-blue-500/30',
    confirmed: 'bg-violet-500/10 text-violet-700 border-violet-500/30',
    delivery_sent: 'bg-sky-500/10 text-sky-700 border-sky-500/30',
    delivery_completed: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30',
    cancelled: 'bg-rose-500/10 text-rose-700 border-rose-500/30',
};

type Tab = 'stadium' | 'shop';

interface Props {
    defaultTab?: Tab;
}

const MyOrders = ({ defaultTab = 'shop' }: Props) => {
    const { t } = useLanguage();
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const initialTab: Tab = (searchParams.get('tab') === 'stadium' ? 'stadium' : (searchParams.get('tab') === 'shop' ? 'shop' : defaultTab));
    const [tab, setTab] = useState<Tab>(initialTab);

    const setTabAndUrl = (next: Tab) => {
        setTab(next);
        const newParams = new URLSearchParams(searchParams);
        newParams.set('tab', next);
        setSearchParams(newParams, { replace: true });
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex flex-col bg-background">
                <Header />
                <main className="flex-grow pt-16 lg:pt-24 pb-24 flex items-center justify-center">
                    <button onClick={() => navigate('/auth')} className="h-12 px-8 rounded-full bg-foreground text-background font-bold">
                        {t('auth.login')}
                    </button>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Header />
            <main className="flex-grow pt-16 lg:pt-24 pb-32">
                <div className="container mx-auto px-4 max-w-4xl">
                    <Link
                        to="/marketplace"
                        className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors mb-6"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        {t('marketplace.title')}
                    </Link>

                    <h1 className="font-serif italic text-5xl lg:text-6xl tracking-tight mb-8">
                        {t('nav.orders')}
                    </h1>

                    {/* Tab pills */}
                    <div className="inline-flex gap-1 p-1 mb-8 rounded-full bg-secondary/60 border border-border">
                        <TabPill
                            label={t('orders.stadium')}
                            icon={Trophy}
                            active={tab === 'stadium'}
                            onClick={() => setTabAndUrl('stadium')}
                        />
                        <TabPill
                            label={t('orders.shop')}
                            icon={ShoppingBag}
                            active={tab === 'shop'}
                            onClick={() => setTabAndUrl('shop')}
                        />
                    </div>

                    {tab === 'stadium' ? <StadiumBookingsList /> : <MarketplaceOrdersList />}
                </div>
            </main>
            <Footer />
        </div>
    );
};

// -----------------------------------------------------------
// Tab pill
// -----------------------------------------------------------

const TabPill = ({ label, icon: Icon, active, onClick }: { label: string; icon: React.ComponentType<{ className?: string }>; active: boolean; onClick: () => void }) => (
    <button
        onClick={onClick}
        className={cn(
            'h-10 px-5 rounded-full text-sm font-bold inline-flex items-center gap-2 transition-all',
            active ? 'bg-foreground text-background shadow-md' : 'text-muted-foreground hover:text-foreground'
        )}
    >
        <Icon className="w-4 h-4" />
        {label}
    </button>
);

// -----------------------------------------------------------
// MARKETPLACE / SHOP ORDERS
// -----------------------------------------------------------

const STATUSES: ('all' | MarketplaceOrderStatus)[] = [
    'all',
    'awaiting_prepayment',
    'prepaid',
    'confirmed',
    'delivery_sent',
    'delivery_completed',
    'cancelled',
];

const MarketplaceOrdersList = () => {
    const { t } = useLanguage();
    const { token } = useAuth();
    const navigate = useNavigate();
    const [filter, setFilter] = useState<'all' | MarketplaceOrderStatus>('all');

    const { data: orders, isLoading, error } = useQuery({
        queryKey: ['marketplace-orders', filter],
        queryFn: () => fetchMyMarketplaceOrders(token!, filter === 'all' ? undefined : filter),
        enabled: !!token,
        refetchInterval: (q) => {
            const list = q.state.data as MarketplaceOrder[] | undefined;
            if (list?.some(o => o.status === 'awaiting_prepayment')) return 3000;
            return false;
        }
    });

    return (
        <div>
            {/* Status filter */}
            <div className="flex gap-2 overflow-x-auto scrollbar-none mb-6 -mx-4 px-4 pb-1">
                {STATUSES.map(s => (
                    <button
                        key={s}
                        onClick={() => setFilter(s)}
                        className={cn(
                            'whitespace-nowrap h-9 px-4 rounded-full text-xs font-bold uppercase tracking-[0.12em] border transition-colors',
                            filter === s
                                ? 'bg-foreground text-background border-foreground'
                                : 'bg-background border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
                        )}
                    >
                        {s === 'all' ? t('morders.filterAll') : t(`status.${s}`)}
                    </button>
                ))}
            </div>

            {isLoading ? (
                <div className="flex justify-center py-24">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
            ) : error ? (
                <div className="py-24 text-center text-destructive">{t('common.error')}</div>
            ) : !orders || orders.length === 0 ? (
                <EmptyState
                    title={t('morders.empty')}
                    description={t('morders.emptyDesc')}
                    cta={t('marketplace.title')}
                    onClick={() => navigate('/marketplace')}
                />
            ) : (
                <div className="space-y-4">
                    {orders.map(order => (
                        <MarketplaceOrderCard key={order.id} order={order} />
                    ))}
                </div>
            )}
        </div>
    );
};

const MarketplaceOrderCard = ({ order }: { order: MarketplaceOrder }) => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const firstItem = order.items[0];
    const remaining = order.items.length - 1;

    return (
        <article
            onClick={() => navigate(`/marketplace/orders/${order.id}`)}
            className="group cursor-pointer rounded-3xl bg-card border border-border p-5 lg:p-6 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                        #<span className="font-mono text-foreground">{order.id}</span>
                    </div>
                    <span className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.15em] border',
                        statusBadge[order.status]
                    )}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {t(`status.${order.status}`)}
                    </span>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </div>

            <div className="flex gap-4 items-center">
                <div className="relative flex-shrink-0">
                    {firstItem?.product_image ? (
                        <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-xl overflow-hidden bg-secondary/40 border border-border">
                            <img src={firstItem.product_image} alt="" className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-xl bg-secondary/40 border border-border flex items-center justify-center">
                            <ImageOff className="w-6 h-6 text-muted-foreground/40" />
                        </div>
                    )}
                    {remaining > 0 && (
                        <div className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center font-mono font-bold text-xs border-2 border-background">
                            +{remaining}
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <h3 className="font-serif text-lg lg:text-xl leading-snug line-clamp-1 mb-1">
                        {firstItem?.product_title}
                    </h3>
                    <div className="text-xs text-muted-foreground line-clamp-1 mb-2">
                        {order.address_text}
                    </div>
                    <div className="flex items-baseline gap-3">
                        <div>
                            <div className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground font-bold">
                                {t('cart.subtotal')}
                            </div>
                            <div className="font-mono font-bold">
                                {formatPrice(order.items_total)}
                            </div>
                        </div>
                        {order.total_price != null && (
                            <div>
                                <div className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground font-bold">
                                    {t('morders.total')}
                                </div>
                                <div className="font-mono font-bold text-primary">
                                    {formatPrice(order.total_price)}
                                </div>
                            </div>
                        )}
                        {order.status === 'awaiting_prepayment' && order.payment_deadline && (
                            <div className="ml-auto">
                                <Countdown deadline={order.payment_deadline} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </article>
    );
};

const Countdown = ({ deadline }: { deadline: string }) => {
    const { t } = useLanguage();
    const [left, setLeft] = useState(0);
    useEffect(() => {
        const update = () => setLeft(Math.max(0, Math.floor((new Date(deadline).getTime() - Date.now()) / 1000)));
        update();
        const id = setInterval(update, 1000);
        return () => clearInterval(id);
    }, [deadline]);
    const m = Math.floor(left / 60).toString().padStart(2, '0');
    const s = (left % 60).toString().padStart(2, '0');
    return (
        <div className="text-right">
            <div className="text-[9px] uppercase tracking-[0.22em] text-rose-500 font-bold">
                {t('morders.payDeadline')}
            </div>
            <div className="font-mono font-bold text-rose-500 tabular-nums">
                {m}:{s}
            </div>
        </div>
    );
};

// -----------------------------------------------------------
// STADIUM BOOKINGS
// -----------------------------------------------------------

const StadiumBookingsList = () => {
    const { token } = useAuth();
    const { t, language } = useLanguage();
    const navigate = useNavigate();

    const { data: bookingsRaw, isLoading, error } = useQuery({
        queryKey: ['my-bookings'],
        queryFn: () => fetchMyBookings(token!),
        enabled: !!token,
        refetchInterval: 5000,
    });

    const { data: stadiums } = useQuery({
        queryKey: ['stadiums-all'],
        queryFn: () => fetchStadiums(),
    });

    const bookings = useMemo(() => {
        if (!bookingsRaw) return undefined;
        return bookingsRaw.map(booking => {
            const fullStadium = stadiums?.find(s => s.id === booking.stadium_id);
            return fullStadium ? { ...booking, stadium: { ...booking.stadium, ...fullStadium } } : booking;
        });
    }, [bookingsRaw, stadiums]);

    const [paymentBooking, setPaymentBooking] = useState<Booking | null>(null);
    const [paymentLoading, setPaymentLoading] = useState<'payme' | 'click' | null>(null);

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
        } catch (err) {
            const e = err as Error;
            toast.error(e.message || "To'lov yaratishda xatolik yuz berdi");
            setPaymentLoading(null);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
    }
    if (error) {
        return <div className="py-24 text-center text-destructive">{t('common.error')}</div>;
    }
    if (!bookings || bookings.length === 0) {
        return (
            <EmptyState
                title={t('orders.stadiumEmpty')}
                description={t('orders.stadiumEmptyDesc')}
                cta={t('nav.stadiums')}
                onClick={() => navigate('/stadiums')}
            />
        );
    }

    return (
        <>
            <div className="space-y-4">
                {bookings.map(b => (
                    <StadiumBookingCard
                        key={b.id}
                        booking={b}
                        language={language}
                        onPay={() => setPaymentBooking(b)}
                    />
                ))}
            </div>

            <Dialog open={paymentBooking !== null} onOpenChange={(open) => { if (!open) { setPaymentBooking(null); setPaymentLoading(null); } }}>
                <DialogContent className="sm:max-w-[400px] rounded-3xl p-0 overflow-hidden gap-0">
                    <DialogHeader className="px-6 pt-6 pb-4">
                        <DialogTitle className="text-xl font-bold text-center">{t('checkout.choosePayment')}</DialogTitle>
                    </DialogHeader>

                    <div className="px-6 pb-2">
                        <div className="bg-muted/30 rounded-xl p-4 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t('orders.stadium')}</span>
                                <span className="font-medium">
                                    {paymentBooking && (language === 'uz' ? paymentBooking.stadium.name_uz : paymentBooking.stadium.name_ru)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t('marketplace.price')}</span>
                                <span className="font-bold text-primary font-mono">{formatPrice(paymentBooking?.price ?? 0)} {t('common.currency')}</span>
                            </div>
                        </div>
                    </div>

                    <div className="px-6 pb-6 pt-2 space-y-3">
                        <button
                            onClick={() => handlePayment('payme')}
                            disabled={paymentLoading !== null}
                            className="w-full flex items-center justify-center gap-3 h-14 rounded-2xl bg-[#00CCCC] hover:bg-[#00BBBB] text-white font-bold transition-colors disabled:opacity-60"
                        >
                            {paymentLoading === 'payme' ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                <>
                                    <svg width="22" height="22" viewBox="0 0 24 24" className="rounded">
                                        <rect width="24" height="24" rx="4" fill="white" />
                                        <path d="M4 8h4v8H4V8zm6 0h4v8h-4V8zm6 0h4v8h-4V8z" fill="#00CCCC" />
                                    </svg>
                                    Payme
                                </>
                            )}
                        </button>
                        <button
                            onClick={() => handlePayment('click')}
                            disabled={paymentLoading !== null}
                            className="w-full flex items-center justify-center gap-3 h-14 rounded-2xl bg-[#0066FF] hover:bg-[#0055DD] text-white font-bold transition-colors disabled:opacity-60"
                        >
                            {paymentLoading === 'click' ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                <>
                                    <svg width="22" height="22" viewBox="0 0 24 24" className="rounded">
                                        <rect width="24" height="24" rx="4" fill="white" />
                                        <path d="M12 4l8 8-8 8-8-8 8-8z" fill="#0066FF" />
                                    </svg>
                                    Click
                                </>
                            )}
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

const formatHourRange = (hours: number[]) => {
    if (!hours || hours.length === 0) return '';
    const sorted = [...hours].sort((a, b) => a - b);
    const start = `${sorted[0].toString().padStart(2, '0')}:00`;
    const end = `${(sorted[sorted.length - 1] + 1).toString().padStart(2, '0')}:00`;
    return `${start} — ${end}`;
};

const bookingStatusBadge: Record<Booking['status'], { label: string; cls: string }> = {
    in_progress: { label: 'awaiting_prepayment', cls: 'bg-amber-500/15 text-amber-700 border-amber-500/30' },
    paid_online: { label: 'delivery_completed', cls: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30' },
    partially_paid: { label: 'prepaid', cls: 'bg-blue-500/10 text-blue-700 border-blue-500/30' },
    assigned_by_admin: { label: 'confirmed', cls: 'bg-violet-500/10 text-violet-700 border-violet-500/30' },
    cancelled: { label: 'cancelled', cls: 'bg-rose-500/10 text-rose-700 border-rose-500/30' },
};

const StadiumBookingCard = ({ booking, language, onPay }: { booking: Booking; language: 'uz' | 'ru'; onPay: () => void }) => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const stadiumName = language === 'uz' ? booking.stadium.name_uz : booking.stadium.name_ru;
    const address = language === 'uz' ? booking.stadium.address_uz : booking.stadium.address_ru;
    const badge = bookingStatusBadge[booking.status];

    return (
        <article className="rounded-3xl bg-card border border-border p-5 lg:p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                        <Trophy className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-serif text-lg lg:text-xl leading-snug">{stadiumName}</h3>
                        {address && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3" />
                                {address}
                            </div>
                        )}
                    </div>
                </div>
                <span className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.15em] border whitespace-nowrap',
                    badge.cls
                )}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {t(`status.${badge.label}`)}
                </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4 text-sm">
                <div>
                    <div className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground font-bold mb-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Date
                    </div>
                    <div className="font-mono font-bold text-foreground text-sm">
                        {booking.date || '—'}
                    </div>
                </div>
                <div>
                    <div className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground font-bold mb-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Time
                    </div>
                    <div className="font-mono font-bold text-foreground text-sm">
                        {formatHourRange(booking.hours)}
                    </div>
                </div>
                <div>
                    <div className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground font-bold mb-1 flex items-center gap-1">
                        <Banknote className="w-3 h-3" /> {t('marketplace.price')}
                    </div>
                    <div className="font-mono font-bold text-primary text-sm">
                        {formatPrice(booking.price ?? 0)}
                    </div>
                </div>
            </div>

            {booking.status === 'in_progress' && booking.payment_deadline && (
                <div className="flex items-center justify-between gap-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl px-4 py-3 mb-3">
                    <div className="flex items-center gap-2 text-rose-600">
                        <Clock className="w-4 h-4 animate-pulse" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.18em]">
                            {t('morders.payDeadline')}
                        </span>
                    </div>
                    <BookingDeadline deadline={booking.payment_deadline} />
                </div>
            )}

            {booking.status === 'in_progress' ? (
                <button
                    onClick={onPay}
                    className="w-full h-12 rounded-full bg-foreground text-background font-bold text-sm hover:bg-foreground/90 active:scale-[0.99] transition-all"
                >
                    {t('morders.payNow')}
                </button>
            ) : booking.status === 'paid_online' || booking.status === 'partially_paid' || booking.status === 'assigned_by_admin' ? (
                <button
                    onClick={() => navigate(`/stadiums/${booking.stadium_id}`)}
                    className="w-full h-12 rounded-full border border-border font-bold text-sm hover:bg-secondary/60 transition-colors flex items-center justify-center gap-2"
                >
                    {stadiumName}
                    <ArrowRight className="w-4 h-4" />
                </button>
            ) : null}
        </article>
    );
};

const BookingDeadline = ({ deadline }: { deadline: string }) => {
    const [left, setLeft] = useState(0);
    useEffect(() => {
        const update = () => {
            let iso = deadline.replace(' ', 'T');
            if (!iso.includes('Z') && !iso.includes('+')) iso += 'Z';
            const end = new Date(iso).getTime();
            setLeft(Math.max(0, Math.floor((end - Date.now()) / 1000)));
        };
        update();
        const id = setInterval(update, 1000);
        return () => clearInterval(id);
    }, [deadline]);
    const h = Math.floor(left / 3600);
    const m = Math.floor((left % 3600) / 60).toString().padStart(2, '0');
    const s = (left % 60).toString().padStart(2, '0');
    return (
        <span className="font-mono font-bold text-rose-600 tabular-nums">
            {h > 0 ? `${h.toString().padStart(2, '0')}:` : ''}{m}:{s}
        </span>
    );
};

// -----------------------------------------------------------
// Shared
// -----------------------------------------------------------

const EmptyState = ({ title, description, cta, onClick }: { title: string; description: string; cta: string; onClick: () => void }) => (
    <div className="py-24 flex flex-col items-center text-center">
        <div className="w-24 h-24 rounded-full bg-secondary/60 flex items-center justify-center mb-6">
            <Receipt className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="font-serif italic text-4xl text-foreground mb-3">{title}</h2>
        <p className="text-muted-foreground max-w-sm mb-8">{description}</p>
        <button onClick={onClick} className="h-12 px-8 rounded-full bg-foreground text-background font-bold text-sm inline-flex items-center gap-2 hover:bg-foreground/90 transition-colors">
            {cta}
            <ArrowRight className="w-4 h-4" />
        </button>
    </div>
);

export default MyOrders;
