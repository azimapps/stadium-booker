import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    AlertTriangle,
    ArrowLeft,
    ArrowRight,
    ImageOff,
    Loader2,
    Minus,
    Plus,
    ShoppingBag,
    Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
    Cart as CartType,
    CartItem,
    fetchCart,
    removeCartItem,
    updateCartItem,
} from '@/services/api';
import { cn } from '@/lib/utils';

const formatPrice = (n: number) => new Intl.NumberFormat('ru-RU').format(n);

const Cart = () => {
    const { token, isAuthenticated } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: cart, isLoading, error } = useQuery({
        queryKey: ['marketplace-cart'],
        queryFn: () => fetchCart(token!),
        enabled: !!token,
        refetchOnWindowFocus: true,
    });

    const updateMutation = useMutation({
        mutationFn: ({ itemId, quantity }: { itemId: number; quantity: number }) =>
            updateCartItem(token!, itemId, quantity),
        onSuccess: (c) => {
            queryClient.setQueryData(['marketplace-cart'], c);
        },
        onError: (e: Error) => {
            toast.error(e.message || t('common.error'));
            queryClient.invalidateQueries({ queryKey: ['marketplace-cart'] });
        }
    });

    const removeMutation = useMutation({
        mutationFn: (itemId: number) => removeCartItem(token!, itemId),
        onSuccess: (c) => {
            queryClient.setQueryData(['marketplace-cart'], c);
        },
        onError: (e: Error) => {
            toast.error(e.message || t('common.error'));
            queryClient.invalidateQueries({ queryKey: ['marketplace-cart'] });
        }
    });

    const removeAllUnavailable = async () => {
        if (!cart) return;
        const unavailableIds = cart.items.filter(i => !i.is_available).map(i => i.id);
        for (const id of unavailableIds) {
            await removeMutation.mutateAsync(id);
        }
    };

    if (!isAuthenticated) {
        return (
            <ShellEmpty
                title={t('cart.title')}
                description="Please sign in"
                action={
                    <button onClick={() => navigate('/auth')} className="h-12 px-8 rounded-full bg-foreground text-background font-bold">
                        {t('auth.login')}
                    </button>
                }
            />
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Header />
            <main className="flex-grow pt-16 lg:pt-24 pb-32">
                <div className="container mx-auto px-4">
                    <Link
                        to="/marketplace"
                        className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors mb-6"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        {t('marketplace.title')}
                    </Link>

                    <div className="mb-10 flex items-end justify-between gap-4">
                        <h1 className="font-serif italic text-5xl lg:text-6xl tracking-tight">
                            {t('cart.title')}
                        </h1>
                        {cart && cart.items.length > 0 && (
                            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground hidden sm:block">
                                <span className="font-mono text-foreground">{cart.items.reduce((s, i) => s + i.quantity, 0)}</span> {t('morders.items')}
                            </div>
                        )}
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center py-24">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        </div>
                    ) : error ? (
                        <div className="py-24 text-center">
                            <p className="text-destructive">{t('common.error')}</p>
                        </div>
                    ) : !cart || cart.items.length === 0 ? (
                        <EmptyCart />
                    ) : (
                        <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
                            {/* Lines */}
                            <div className="space-y-3">
                                {cart.has_unavailable && (
                                    <div className="flex items-start gap-3 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 mb-4">
                                        <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-semibold text-foreground">
                                                {t('cart.unavailable')}
                                            </div>
                                            <button
                                                onClick={removeAllUnavailable}
                                                className="mt-1 text-xs font-bold text-destructive hover:underline"
                                            >
                                                {t('cart.removeUnavailable')}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {cart.items.map(item => (
                                    <CartLine
                                        key={item.id}
                                        item={item}
                                        onIncrement={() => updateMutation.mutate({ itemId: item.id, quantity: item.quantity + 1 })}
                                        onDecrement={() => updateMutation.mutate({ itemId: item.id, quantity: Math.max(1, item.quantity - 1) })}
                                        onRemove={() => removeMutation.mutate(item.id)}
                                        busy={updateMutation.isPending || removeMutation.isPending}
                                    />
                                ))}
                            </div>

                            {/* Summary */}
                            <CartSummary cart={cart} onCheckout={() => navigate('/marketplace/checkout')} />
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
};

const CartLine = ({
    item,
    onIncrement,
    onDecrement,
    onRemove,
    busy,
}: {
    item: CartItem;
    onIncrement: () => void;
    onDecrement: () => void;
    onRemove: () => void;
    busy: boolean;
}) => {
    const { t } = useLanguage();
    return (
        <div className={cn(
            'flex gap-4 p-4 lg:p-5 rounded-2xl bg-card border border-border relative',
            !item.is_available && 'opacity-70 border-destructive/30'
        )}>
            <Link
                to={`/marketplace/products/${item.product_id}`}
                className="flex-shrink-0 w-24 h-24 lg:w-28 lg:h-28 rounded-xl overflow-hidden bg-secondary/40 border border-border"
            >
                {item.product_image ? (
                    <img src={item.product_image} alt={item.product_title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center"><ImageOff className="w-6 h-6 text-muted-foreground/40" /></div>
                )}
            </Link>

            <div className="flex-1 min-w-0 flex flex-col">
                <Link to={`/marketplace/products/${item.product_id}`} className="hover:underline">
                    <h3 className="font-serif text-base lg:text-lg leading-snug line-clamp-2">
                        {item.product_title}
                    </h3>
                </Link>
                <div className="mt-1 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-bold">
                    <span>{t('marketplace.size')}</span>
                    <span className="inline-flex items-center justify-center min-w-6 h-5 px-1.5 rounded-md bg-secondary/80 text-foreground font-mono">
                        {item.size_label}
                    </span>
                </div>

                {!item.is_available && (
                    <div className="mt-2 text-xs font-bold text-destructive flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {t('cart.unavailable')}
                    </div>
                )}

                <div className="mt-auto pt-3 flex items-end justify-between gap-3">
                    <div className="flex items-center bg-secondary/50 rounded-full p-0.5">
                        <button
                            onClick={onDecrement}
                            disabled={busy || item.quantity <= 1}
                            className="w-8 h-8 rounded-full bg-background flex items-center justify-center shadow-sm disabled:opacity-30"
                        >
                            <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-mono font-bold text-sm min-w-7 text-center">{item.quantity}</span>
                        <button
                            onClick={onIncrement}
                            disabled={busy || item.quantity >= item.available_stock || !item.is_available}
                            className="w-8 h-8 rounded-full bg-background flex items-center justify-center shadow-sm disabled:opacity-30"
                        >
                            <Plus className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <div className="text-right">
                        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-bold">
                            {formatPrice(item.unit_price)} × {item.quantity}
                        </div>
                        <div className="font-mono font-bold text-lg leading-none">
                            {formatPrice(item.line_total)}
                            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground ml-1">{t('common.currency')}</span>
                        </div>
                    </div>
                </div>
            </div>

            <button
                onClick={onRemove}
                disabled={busy}
                className="absolute top-3 right-3 w-8 h-8 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex items-center justify-center transition-colors"
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </div>
    );
};

const CartSummary = ({ cart, onCheckout }: { cart: CartType; onCheckout: () => void }) => {
    const { t } = useLanguage();
    const disabled = cart.has_unavailable || cart.items.length === 0;
    return (
        <div className="lg:sticky lg:top-28 rounded-3xl bg-card border border-border p-6 shadow-lg shadow-black/5">
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground mb-5">
                {t('checkout.summary')}
            </div>

            <div className="space-y-3 pb-5 border-b border-border">
                <div className="flex items-baseline justify-between">
                    <span className="text-sm text-muted-foreground">{t('cart.subtotal')}</span>
                    <span className="font-mono font-bold">
                        {formatPrice(cart.items_total)} <span className="text-[10px] text-muted-foreground">{t('common.currency')}</span>
                    </span>
                </div>
                <div className="flex items-baseline justify-between">
                    <span className="text-sm text-muted-foreground">{t('cart.prepayment')}</span>
                    <span className="font-mono font-bold text-primary">
                        {formatPrice(cart.prepayment_total)} <span className="text-[10px] text-muted-foreground">{t('common.currency')}</span>
                    </span>
                </div>
            </div>

            <div className="pt-5 mb-6">
                <div className="flex items-end justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t('morders.itemsTotal')}</span>
                    <div className="text-right">
                        <div className="font-mono font-bold text-2xl leading-none">
                            {formatPrice(cart.items_total)}
                        </div>
                        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mt-1">{t('common.currency')}</div>
                    </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3 italic">
                    {t('checkout.deliveryNote')}
                </p>
            </div>

            <button
                onClick={onCheckout}
                disabled={disabled}
                className={cn(
                    'group w-full h-14 rounded-full flex items-center justify-center gap-3 font-bold transition-all',
                    disabled
                        ? 'bg-muted text-muted-foreground cursor-not-allowed'
                        : 'bg-foreground text-background hover:bg-foreground/90 active:scale-[0.99]'
                )}
            >
                {t('cart.proceedCheckout')}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
        </div>
    );
};

const EmptyCart = () => {
    const { t } = useLanguage();
    return (
        <div className="py-24 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-secondary/60 flex items-center justify-center mb-6">
                <ShoppingBag className="w-11 h-11 text-muted-foreground" />
            </div>
            <h2 className="font-serif italic text-4xl text-foreground mb-3">{t('cart.empty')}</h2>
            <p className="text-muted-foreground max-w-sm mb-8">{t('cart.emptyDesc')}</p>
            <Link to="/marketplace" className="h-12 px-8 rounded-full bg-foreground text-background font-bold text-sm inline-flex items-center gap-2 hover:bg-foreground/90 transition-colors">
                {t('cart.continueShopping')}
                <ArrowRight className="w-4 h-4" />
            </Link>
        </div>
    );
};

const ShellEmpty = ({ title, description, action }: { title: string; description: string; action: React.ReactNode }) => (
    <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-grow pt-16 lg:pt-24 pb-24 flex items-center">
            <div className="container mx-auto px-4 text-center max-w-md">
                <h1 className="font-serif italic text-4xl mb-3">{title}</h1>
                <p className="text-muted-foreground mb-8">{description}</p>
                {action}
            </div>
        </main>
        <Footer />
    </div>
);

export default Cart;
