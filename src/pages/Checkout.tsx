import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    AlertTriangle,
    ArrowLeft,
    ArrowRight,
    Loader2,
    MapPin,
    PackageX,
    Wallet,
} from 'lucide-react';
import { toast } from 'sonner';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
    checkoutCart,
    CheckoutResponse,
    fetchCart,
    OutOfStockError,
} from '@/services/api';
import { cn } from '@/lib/utils';

const formatPrice = (n: number) => new Intl.NumberFormat('ru-RU').format(n);

const Checkout = () => {
    const { token } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [address, setAddress] = useState('');
    const [lat, setLat] = useState('41.3275');
    const [lng, setLng] = useState('69.2817');
    const [checkoutResp, setCheckoutResp] = useState<CheckoutResponse | null>(null);
    const [outOfStockList, setOutOfStockList] = useState<{ product_title: string; size_label: string; reason: string }[] | null>(null);

    const { data: cart, isLoading: cartLoading } = useQuery({
        queryKey: ['marketplace-cart'],
        queryFn: () => fetchCart(token!),
        enabled: !!token,
    });

    const checkoutMutation = useMutation({
        mutationFn: () => checkoutCart(token!, {
            address_text: address.trim(),
            address_lat: parseFloat(lat),
            address_lng: parseFloat(lng),
        }),
        onSuccess: (res) => {
            setCheckoutResp(res);
            setOutOfStockList(null);
            queryClient.invalidateQueries({ queryKey: ['marketplace-cart'] });
        },
        onError: (e: Error) => {
            if (e instanceof OutOfStockError) {
                setOutOfStockList(e.detail.removed_items);
                queryClient.invalidateQueries({ queryKey: ['marketplace-cart'] });
                return;
            }
            toast.error(e.message || t('common.error'));
        }
    });

    const canSubmit = address.trim().length >= 3 && !!parseFloat(lat) && !!parseFloat(lng) && cart && cart.items.length > 0 && !cart.has_unavailable;

    // If user pays, redirect, etc. Show payment chooser modal when checkoutResp is set.

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Header />
            <main className="flex-grow pt-16 lg:pt-24 pb-32">
                <div className="container mx-auto px-4">
                    <Link
                        to="/marketplace/cart"
                        className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors mb-6"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        {t('cart.title')}
                    </Link>

                    <h1 className="font-serif italic text-5xl lg:text-6xl tracking-tight mb-10">
                        {t('checkout.title')}
                    </h1>

                    {cartLoading ? (
                        <div className="flex justify-center py-24">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        </div>
                    ) : !cart || cart.items.length === 0 ? (
                        <EmptyCheckout />
                    ) : (
                        <div className="grid lg:grid-cols-[1fr_400px] gap-8 items-start">
                            {/* Form */}
                            <div className="space-y-6">
                                {/* Address */}
                                <section className="p-6 rounded-3xl bg-card border border-border">
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center">
                                            <MapPin className="w-4 h-4 text-primary" />
                                        </div>
                                        <h2 className="font-serif text-2xl">{t('checkout.address')}</h2>
                                    </div>

                                    <div className="space-y-4">
                                        <FieldGroup label={t('checkout.address')}>
                                            <textarea
                                                value={address}
                                                onChange={(e) => setAddress(e.target.value)}
                                                placeholder={t('checkout.addressHint')}
                                                rows={2}
                                                className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-foreground/40 outline-none text-sm resize-none transition-colors"
                                            />
                                        </FieldGroup>

                                        <div className="grid grid-cols-2 gap-3">
                                            <FieldGroup label={t('checkout.lat')}>
                                                <input
                                                    value={lat}
                                                    onChange={(e) => setLat(e.target.value)}
                                                    inputMode="decimal"
                                                    className="w-full h-11 px-3 rounded-xl bg-background border border-border focus:border-foreground/40 outline-none text-sm font-mono transition-colors"
                                                />
                                            </FieldGroup>
                                            <FieldGroup label={t('checkout.lng')}>
                                                <input
                                                    value={lng}
                                                    onChange={(e) => setLng(e.target.value)}
                                                    inputMode="decimal"
                                                    className="w-full h-11 px-3 rounded-xl bg-background border border-border focus:border-foreground/40 outline-none text-sm font-mono transition-colors"
                                                />
                                            </FieldGroup>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground italic">
                                            {t('checkout.coordsHint')}
                                        </p>
                                    </div>
                                </section>

                                {/* Items review */}
                                <section className="p-6 rounded-3xl bg-card border border-border">
                                    <h2 className="font-serif text-2xl mb-5">{t('morders.items')}</h2>
                                    <div className="space-y-3">
                                        {cart.items.map(item => (
                                            <div key={item.id} className="flex items-center gap-3">
                                                <div className="w-14 h-14 rounded-lg overflow-hidden bg-secondary/40 flex-shrink-0 border border-border">
                                                    {item.product_image && <img src={item.product_image} alt="" className="w-full h-full object-cover" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-sm truncate">{item.product_title}</div>
                                                    <div className="text-[11px] text-muted-foreground font-bold uppercase tracking-[0.15em] mt-0.5">
                                                        {t('marketplace.size')} · <span className="font-mono">{item.size_label}</span> · ×{item.quantity}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-mono font-bold text-sm">
                                                        {formatPrice(item.line_total)}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                {outOfStockList && outOfStockList.length > 0 && (
                                    <section className="p-6 rounded-3xl border border-destructive/30 bg-destructive/5">
                                        <div className="flex items-center gap-3 mb-3 text-destructive">
                                            <PackageX className="w-5 h-5" />
                                            <h3 className="font-bold">{t('checkout.outOfStock')}</h3>
                                        </div>
                                        <ul className="space-y-1.5 text-sm">
                                            {outOfStockList.map((item, i) => (
                                                <li key={i} className="text-foreground/80">
                                                    {item.product_title} · <span className="font-mono">{item.size_label}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </section>
                                )}
                            </div>

                            {/* Sticky summary */}
                            <CheckoutSummary
                                cart={cart}
                                disabled={!canSubmit || checkoutMutation.isPending}
                                loading={checkoutMutation.isPending}
                                onSubmit={() => checkoutMutation.mutate()}
                            />
                        </div>
                    )}
                </div>
            </main>
            <Footer />

            <PaymentDialog response={checkoutResp} onClose={() => setCheckoutResp(null)} />
        </div>
    );
};

const FieldGroup = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
        <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground mb-1.5">
            {label}
        </div>
        {children}
    </div>
);

const CheckoutSummary = ({
    cart,
    disabled,
    loading,
    onSubmit,
}: {
    cart: { items_total: number; prepayment_total: number; has_unavailable: boolean };
    disabled: boolean;
    loading: boolean;
    onSubmit: () => void;
}) => {
    const { t } = useLanguage();
    const remaining = cart.items_total - cart.prepayment_total;
    return (
        <div className="lg:sticky lg:top-28 rounded-3xl bg-foreground text-background p-6 shadow-2xl shadow-black/30">
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-background/60 mb-5">
                {t('checkout.summary')}
            </div>

            <div className="space-y-3 pb-5 border-b border-background/15">
                <Row label={t('cart.subtotal')} value={formatPrice(cart.items_total)} />
                <Row label={t('checkout.payNow')} value={formatPrice(cart.prepayment_total)} highlight />
                <Row label={t('checkout.payOnDelivery')} value={formatPrice(remaining)} />
            </div>

            <div className="pt-5 mb-6">
                <div className="text-[10px] uppercase tracking-[0.22em] text-background/60 font-bold mb-2">
                    {t('checkout.payNow')}
                </div>
                <div className="flex items-end gap-1">
                    <span className="font-mono font-bold text-4xl leading-none text-primary-foreground">
                        {formatPrice(cart.prepayment_total)}
                    </span>
                    <span className="text-xs uppercase tracking-[0.2em] text-background/60 mb-0.5">
                        {t('common.currency')}
                    </span>
                </div>
                <p className="text-xs text-background/60 mt-3 italic leading-relaxed">
                    {t('checkout.deliveryNote')}
                </p>
            </div>

            <button
                onClick={onSubmit}
                disabled={disabled}
                className={cn(
                    'group w-full h-14 rounded-full flex items-center justify-center gap-3 font-bold text-sm transition-all',
                    disabled
                        ? 'bg-background/15 text-background/40 cursor-not-allowed'
                        : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/30 active:scale-[0.99]'
                )}
            >
                {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    <>
                        <Wallet className="w-4 h-4" />
                        {t('checkout.placeOrder')}
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </>
                )}
            </button>
        </div>
    );
};

const Row = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => {
    const { t } = useLanguage();
    return (
        <div className="flex items-baseline justify-between text-sm">
            <span className="text-background/70">{label}</span>
            <span className={cn('font-mono font-bold', highlight ? 'text-primary-foreground text-base' : 'text-background/95')}>
                {value} <span className="text-[10px] text-background/50">{t('common.currency')}</span>
            </span>
        </div>
    );
};

const PaymentDialog = ({ response, onClose }: { response: CheckoutResponse | null; onClose: () => void }) => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [secondsLeft, setSecondsLeft] = useState(0);

    useEffect(() => {
        if (!response) return;
        const update = () => {
            const end = new Date(response.payment_deadline).getTime();
            const diff = Math.floor((end - Date.now()) / 1000);
            setSecondsLeft(Math.max(0, diff));
        };
        update();
        const id = setInterval(update, 1000);
        return () => clearInterval(id);
    }, [response]);

    if (!response) return null;

    const m = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
    const s = (secondsLeft % 60).toString().padStart(2, '0');

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-3xl bg-background p-6 lg:p-8 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-primary mb-3">
                        <span className="w-6 h-px bg-primary" />
                        {t('checkout.payDeadline')}
                        <span className="w-6 h-px bg-primary" />
                    </div>
                    <div className="font-mono font-bold text-5xl tracking-tight tabular-nums">
                        {m}:{s}
                    </div>
                </div>

                <div className="rounded-2xl bg-secondary/50 p-4 mb-6 text-center">
                    <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-bold mb-1">
                        {t('checkout.payNow')}
                    </div>
                    <div className="font-mono font-bold text-2xl">
                        {formatPrice(response.prepayment_total)} <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t('common.currency')}</span>
                    </div>
                </div>

                <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground mb-3 text-center">
                    {t('checkout.choosePayment')}
                </div>

                <div className="space-y-3">
                    <a
                        href={response.payme_url}
                        className="flex items-center justify-center gap-3 h-14 rounded-2xl bg-[#00CCCC] hover:bg-[#00BBBB] text-white font-bold text-base transition-colors"
                    >
                        <PaymeLogo />
                        Payme
                        <ArrowRight className="w-4 h-4 ml-auto opacity-70" />
                    </a>
                    <a
                        href={response.click_url}
                        className="flex items-center justify-center gap-3 h-14 rounded-2xl bg-[#0066FF] hover:bg-[#0055DD] text-white font-bold text-base transition-colors"
                    >
                        <ClickLogo />
                        Click
                        <ArrowRight className="w-4 h-4 ml-auto opacity-70" />
                    </a>
                </div>

                <div className="mt-5 flex flex-col gap-2">
                    <button
                        onClick={() => { onClose(); navigate(`/marketplace/orders/${response.order_id}`); }}
                        className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors py-2"
                    >
                        {t('morders.title')}
                    </button>
                </div>
            </div>
        </div>
    );
};

const PaymeLogo = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" className="rounded">
        <rect width="24" height="24" rx="4" fill="white" />
        <path d="M4 8h4v8H4V8zm6 0h4v8h-4V8zm6 0h4v8h-4V8z" fill="#00CCCC" />
    </svg>
);

const ClickLogo = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" className="rounded">
        <rect width="24" height="24" rx="4" fill="white" />
        <path d="M12 4l8 8-8 8-8-8 8-8z" fill="#0066FF" />
    </svg>
);

const EmptyCheckout = () => {
    const { t } = useLanguage();
    return (
        <div className="py-24 flex flex-col items-center text-center">
            <AlertTriangle className="w-12 h-12 text-muted-foreground/60 mb-4" />
            <h2 className="font-serif italic text-3xl mb-3">{t('checkout.cartEmpty')}</h2>
            <Link to="/marketplace" className="mt-4 h-11 px-6 rounded-full bg-foreground text-background font-bold text-sm inline-flex items-center gap-2">
                {t('cart.continueShopping')}
            </Link>
        </div>
    );
};

export default Checkout;
