import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    ArrowLeft,
    ArrowRight,
    ImageOff,
    Loader2,
    Receipt,
} from 'lucide-react';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
    fetchMyMarketplaceOrders,
    MarketplaceOrder,
    MarketplaceOrderStatus,
} from '@/services/api';
import { cn } from '@/lib/utils';

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

const STATUSES: ('all' | MarketplaceOrderStatus)[] = [
    'all',
    'awaiting_prepayment',
    'prepaid',
    'confirmed',
    'delivery_sent',
    'delivery_completed',
    'cancelled',
];

const MarketplaceOrders = () => {
    const { token, isAuthenticated } = useAuth();
    const { t } = useLanguage();
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
                        {t('morders.title')}
                    </h1>

                    {/* Status filter */}
                    <div className="flex gap-2 overflow-x-auto scrollbar-none mb-8 -mx-4 px-4 pb-1">
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
                        <EmptyOrders />
                    ) : (
                        <div className="space-y-4">
                            {orders.map(order => (
                                <OrderCard key={order.id} order={order} />
                            ))}
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
};

const OrderCard = ({ order }: { order: MarketplaceOrder }) => {
    const { t } = useLanguage();
    const navigate = useNavigate();

    const firstItem = order.items[0];
    const remainingItemsCount = order.items.length - 1;

    return (
        <article
            onClick={() => navigate(`/marketplace/orders/${order.id}`)}
            className="group cursor-pointer rounded-3xl bg-card border border-border p-5 lg:p-6 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
        >
            {/* Top row */}
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
                {/* Image stack */}
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
                    {remainingItemsCount > 0 && (
                        <div className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center font-mono font-bold text-xs border-2 border-background">
                            +{remainingItemsCount}
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
                                <PaymentCountdown deadline={order.payment_deadline} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </article>
    );
};

const PaymentCountdown = ({ deadline }: { deadline: string }) => {
    const { t } = useLanguage();
    const [left, setLeft] = useState(0);
    useEffect(() => {
        const update = () => {
            const diff = Math.max(0, Math.floor((new Date(deadline).getTime() - Date.now()) / 1000));
            setLeft(diff);
        };
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

const EmptyOrders = () => {
    const { t } = useLanguage();
    return (
        <div className="py-24 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-secondary/60 flex items-center justify-center mb-6">
                <Receipt className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="font-serif italic text-4xl text-foreground mb-3">{t('morders.empty')}</h2>
            <p className="text-muted-foreground max-w-sm mb-8">{t('morders.emptyDesc')}</p>
            <Link to="/marketplace" className="h-12 px-8 rounded-full bg-foreground text-background font-bold text-sm inline-flex items-center gap-2 hover:bg-foreground/90 transition-colors">
                {t('marketplace.title')}
                <ArrowRight className="w-4 h-4" />
            </Link>
        </div>
    );
};

export default MarketplaceOrders;
