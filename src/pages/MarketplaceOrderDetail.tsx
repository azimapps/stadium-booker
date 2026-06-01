import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    AlertCircle,
    ArrowLeft,
    Check,
    CheckCircle2,
    Clock,
    ImageOff,
    Loader2,
    MapPin,
    Package,
    Truck,
    Wallet,
    XCircle,
} from 'lucide-react';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
    fetchMarketplaceOrderById,
    MarketplaceOrder,
    MarketplaceOrderStatus,
} from '@/services/api';
import { cn } from '@/lib/utils';

const formatPrice = (n: number | null | undefined) =>
    n == null ? '—' : new Intl.NumberFormat('ru-RU').format(n);

const STAGES: MarketplaceOrderStatus[] = [
    'awaiting_prepayment',
    'prepaid',
    'confirmed',
    'delivery_sent',
    'delivery_completed',
];

const STAGE_ICON: Record<MarketplaceOrderStatus, React.ComponentType<{ className?: string }>> = {
    awaiting_prepayment: Wallet,
    prepaid: CheckCircle2,
    confirmed: Check,
    delivery_sent: Truck,
    delivery_completed: Package,
    cancelled: XCircle,
};

const stageIndex = (s: MarketplaceOrderStatus) =>
    s === 'cancelled' ? -1 : STAGES.indexOf(s);

const Deadline = ({ deadline }: { deadline: string }) => {
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
        <div className="rounded-2xl bg-rose-500/10 border border-rose-500/30 px-5 py-4 flex items-center gap-3">
            <Clock className="w-5 h-5 text-rose-500" />
            <div className="flex-1">
                <div className="text-[10px] uppercase tracking-[0.22em] font-bold text-rose-600">
                    {t('morders.payDeadline')}
                </div>
            </div>
            <div className="font-mono font-bold text-2xl tabular-nums text-rose-600">
                {m}:{s}
            </div>
        </div>
    );
};

const MarketplaceOrderDetail = () => {
    const { id } = useParams<{ id: string }>();
    const orderId = id ? parseInt(id, 10) : NaN;
    const { token, isAuthenticated } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();

    const { data: order, isLoading, error } = useQuery({
        queryKey: ['marketplace-order', orderId],
        queryFn: () => fetchMarketplaceOrderById(token!, orderId),
        enabled: !!token && !Number.isNaN(orderId),
        refetchInterval: (q) => {
            const o = q.state.data as MarketplaceOrder | undefined;
            if (o?.status === 'awaiting_prepayment' || o?.status === 'prepaid') return 3000;
            return false;
        }
    });

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

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col bg-background">
                <Header />
                <main className="flex-grow pt-16 lg:pt-24 pb-24 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </main>
                <Footer />
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen flex flex-col bg-background">
                <Header />
                <main className="flex-grow pt-16 lg:pt-24 pb-24 container mx-auto px-4">
                    <div className="py-24 text-center">
                        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                        <p className="text-destructive mb-6">{t('common.error')}</p>
                        <Link to="/marketplace/orders" className="inline-flex items-center gap-2 font-bold">
                            <ArrowLeft className="w-4 h-4" />
                            {t('morders.title')}
                        </Link>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    const currentIdx = stageIndex(order.status);
    const cancelled = order.status === 'cancelled';

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Header />
            <main className="flex-grow pt-16 lg:pt-24 pb-32">
                <div className="container mx-auto px-4 max-w-4xl">
                    <Link
                        to="/marketplace/orders"
                        className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors mb-6"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        {t('morders.title')}
                    </Link>

                    <div className="flex items-end justify-between gap-4 mb-10">
                        <div>
                            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground mb-2">
                                Order <span className="font-mono text-foreground">#{order.id}</span>
                            </div>
                            <h1 className="font-serif italic text-4xl lg:text-5xl tracking-tight">
                                {t(`status.${order.status}`)}
                            </h1>
                        </div>
                    </div>

                    {/* Banner: deadline / refund */}
                    {order.status === 'awaiting_prepayment' && order.payment_deadline && (
                        <div className="mb-6">
                            <Deadline deadline={order.payment_deadline} />
                        </div>
                    )}
                    {order.needs_refund && (
                        <div className="mb-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 px-5 py-4 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <div className="font-bold text-amber-700">{t('morders.refundFlag')}</div>
                            </div>
                        </div>
                    )}

                    {/* Timeline */}
                    {!cancelled && (
                        <section className="mb-10 p-6 lg:p-8 rounded-3xl bg-card border border-border">
                            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground mb-6">
                                {t('morders.timeline')}
                            </div>
                            <Timeline currentIdx={currentIdx} />
                        </section>
                    )}
                    {cancelled && (
                        <section className="mb-10 p-6 rounded-3xl bg-rose-500/5 border border-rose-500/20 flex items-center gap-4">
                            <XCircle className="w-10 h-10 text-rose-500" />
                            <div>
                                <div className="font-bold text-rose-600 text-lg">{t('status.cancelled')}</div>
                                {order.cancelled_at && (
                                    <div className="text-xs text-muted-foreground font-mono">
                                        {new Date(order.cancelled_at).toLocaleString()}
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
                        <div className="space-y-6">
                            {/* Address */}
                            <section className="p-6 rounded-3xl bg-card border border-border">
                                <div className="flex items-center gap-3 mb-3">
                                    <MapPin className="w-4 h-4 text-primary" />
                                    <h2 className="font-bold text-sm uppercase tracking-[0.18em]">{t('morders.address')}</h2>
                                </div>
                                <p className="text-foreground/90">{order.address_text}</p>
                                <p className="text-[11px] font-mono text-muted-foreground mt-2">
                                    {order.address_lat.toFixed(4)}, {order.address_lng.toFixed(4)}
                                </p>
                            </section>

                            {/* Items */}
                            <section className="p-6 rounded-3xl bg-card border border-border">
                                <h2 className="font-bold text-sm uppercase tracking-[0.18em] mb-4">{t('morders.items')}</h2>
                                <div className="space-y-4">
                                    {order.items.map(item => (
                                        <div key={item.id} className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-secondary/40 flex-shrink-0 border border-border">
                                                {item.product_image ? (
                                                    <img src={item.product_image} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <ImageOff className="w-5 h-5 text-muted-foreground/40" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-serif text-base line-clamp-1">{item.product_title}</div>
                                                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mt-1">
                                                    {t('marketplace.size')} <span className="font-mono text-foreground">{item.size_label}</span> · {t('morders.qty')} <span className="font-mono text-foreground">×{item.quantity}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-mono font-bold text-base leading-none">
                                                    {formatPrice(item.line_total)}
                                                </div>
                                                <div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground mt-1">
                                                    {t('common.currency')}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>

                        {/* Pricing card */}
                        <aside className="lg:sticky lg:top-28 rounded-3xl bg-foreground text-background p-6">
                            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-background/60 mb-5">
                                {t('checkout.summary')}
                            </div>

                            <div className="space-y-3 pb-5 border-b border-background/15">
                                <PriceRow label={t('morders.itemsTotal')} value={order.items_total} />
                                {order.delivery_fee != null && (
                                    <PriceRow label={t('morders.delivery')} value={order.delivery_fee} />
                                )}
                                {order.total_price != null && (
                                    <PriceRow label={t('morders.total')} value={order.total_price} bold />
                                )}
                            </div>

                            <div className="pt-5 space-y-3">
                                <PriceRow label={t('morders.paid')} value={order.paid_amount} positive />
                                {order.remaining_amount != null && order.remaining_amount > 0 && (
                                    <PriceRow label={t('morders.remaining')} value={order.remaining_amount} />
                                )}
                            </div>

                            <div className="mt-6 pt-6 border-t border-background/15 text-[10px] font-bold uppercase tracking-[0.22em] text-background/50 space-y-1.5">
                                {order.prepaid_at && (
                                    <DatePoint label="Prepaid" date={order.prepaid_at} />
                                )}
                                {order.confirmed_at && (
                                    <DatePoint label="Confirmed" date={order.confirmed_at} />
                                )}
                                {order.delivery_sent_at && (
                                    <DatePoint label="Sent" date={order.delivery_sent_at} />
                                )}
                                {order.delivery_completed_at && (
                                    <DatePoint label="Delivered" date={order.delivery_completed_at} />
                                )}
                                {order.cancelled_at && (
                                    <DatePoint label="Cancelled" date={order.cancelled_at} />
                                )}
                            </div>
                        </aside>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

const PriceRow = ({ label, value, bold, positive }: { label: string; value: number; bold?: boolean; positive?: boolean }) => {
    const { t } = useLanguage();
    return (
        <div className="flex items-baseline justify-between text-sm">
            <span className="text-background/70">{label}</span>
            <span className={cn(
                'font-mono font-bold',
                bold && 'text-lg text-primary-foreground',
                positive && 'text-emerald-300'
            )}>
                {formatPrice(value)} <span className="text-[10px] text-background/50">{t('common.currency')}</span>
            </span>
        </div>
    );
};

const DatePoint = ({ label, date }: { label: string; date: string }) => (
    <div className="flex items-center justify-between">
        <span>{label}</span>
        <span className="font-mono text-background/80 normal-case tracking-normal text-[10px]">
            {new Date(date).toLocaleDateString()} {new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
    </div>
);

const Timeline = ({ currentIdx }: { currentIdx: number }) => {
    const { t } = useLanguage();
    return (
        <div className="relative">
            <div className="absolute left-5 top-5 bottom-5 w-px bg-border" />
            <div
                className="absolute left-5 top-5 w-px bg-primary transition-all duration-700"
                style={{ height: `calc(${Math.max(0, currentIdx) / (STAGES.length - 1) * 100}% - 0px)` }}
            />
            <div className="space-y-5">
                {STAGES.map((stage, idx) => {
                    const Icon = STAGE_ICON[stage];
                    const done = idx <= currentIdx;
                    const current = idx === currentIdx;
                    return (
                        <div key={stage} className="flex items-center gap-4 relative">
                            <div className={cn(
                                'relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all',
                                done
                                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30'
                                    : 'bg-secondary text-muted-foreground border border-border',
                                current && 'ring-4 ring-primary/20 scale-110'
                            )}>
                                <Icon className="w-4 h-4" />
                            </div>
                            <div className={cn(
                                'flex-1',
                                done ? 'text-foreground' : 'text-muted-foreground'
                            )}>
                                <div className="text-sm font-bold uppercase tracking-[0.12em]">
                                    {t(`status.${stage}`)}
                                </div>
                            </div>
                            {current && (
                                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
                                    Now
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default MarketplaceOrderDetail;
