import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    ArrowLeft,
    Check,
    Heart,
    ImageOff,
    Loader2,
    Minus,
    Plus,
    ShoppingBag,
} from 'lucide-react';
import { toast } from 'sonner';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
    addToCart,
    fetchCart,
    fetchProductById,
    Product,
    ProductSize,
    toggleProductLike,
} from '@/services/api';
import { cn } from '@/lib/utils';

const formatPrice = (n: number) => new Intl.NumberFormat('ru-RU').format(n);

const ProductDetail = () => {
    const { id } = useParams<{ id: string }>();
    const productId = id ? parseInt(id, 10) : NaN;
    const { token } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [activeImageIdx, setActiveImageIdx] = useState(0);
    const [selectedSizeId, setSelectedSizeId] = useState<number | null>(null);
    const [quantity, setQuantity] = useState(1);

    const { data: product, isLoading, error } = useQuery({
        queryKey: ['marketplace-product', productId],
        queryFn: () => fetchProductById(token, productId),
        enabled: !Number.isNaN(productId),
    });

    // Auto-select first in-stock size
    useEffect(() => {
        if (product && selectedSizeId == null) {
            const firstAvailable = product.sizes.find(s => s.stock > 0) ?? product.sizes[0];
            if (firstAvailable) setSelectedSizeId(firstAvailable.id);
        }
    }, [product, selectedSizeId]);

    const selectedSize: ProductSize | undefined = useMemo(
        () => product?.sizes.find(s => s.id === selectedSizeId),
        [product, selectedSizeId]
    );

    const maxQty = selectedSize?.stock ?? 1;
    useEffect(() => {
        if (quantity > maxQty) setQuantity(Math.max(1, maxQty));
    }, [maxQty, quantity]);

    const addMutation = useMutation({
        mutationFn: () => {
            if (!token) throw new Error('UNAUTHORIZED');
            if (!selectedSize) throw new Error('NO_SIZE');
            return addToCart(token, {
                product_id: product!.id,
                product_size_id: selectedSize.id,
                quantity,
            });
        },
        onSuccess: (cart) => {
            queryClient.setQueryData(['marketplace-cart'], cart);
            toast.success(t('marketplace.added'));
        },
        onError: (e: Error) => {
            if (e.message === 'UNAUTHORIZED') {
                navigate('/auth');
                return;
            }
            toast.error(e.message || t('common.error'));
        }
    });

    const likeMutation = useMutation({
        mutationFn: () => {
            if (!token) throw new Error('UNAUTHORIZED');
            return toggleProductLike(token, product!.id);
        },
        onMutate: () => {
            if (!product) return;
            queryClient.setQueryData<Product>(['marketplace-product', productId], (prev) =>
                prev ? { ...prev, is_liked_by_me: !prev.is_liked_by_me, likes_count: prev.likes_count + (prev.is_liked_by_me ? -1 : 1) } : prev
            );
        },
        onSuccess: (res) => {
            queryClient.setQueryData<Product>(['marketplace-product', productId], (prev) =>
                prev ? { ...prev, is_liked_by_me: res.liked, likes_count: res.likes_count } : prev
            );
        },
        onError: (e: Error) => {
            queryClient.invalidateQueries({ queryKey: ['marketplace-product', productId] });
            if (e.message === 'UNAUTHORIZED') {
                navigate('/auth');
                return;
            }
            toast.error(t('marketplace.likeFailed'));
        }
    });

    const { data: cart } = useQuery({
        queryKey: ['marketplace-cart'],
        queryFn: () => fetchCart(token!),
        enabled: !!token,
    });
    const cartCount = cart?.items.reduce((s, i) => s + i.quantity, 0) ?? 0;

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col bg-background">
                <Header />
                <main className="flex-grow pt-16 lg:pt-24 pb-24">
                    <div className="container mx-auto px-4 flex items-center justify-center min-h-[50vh]">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen flex flex-col bg-background">
                <Header />
                <main className="flex-grow pt-16 lg:pt-24 pb-24 container mx-auto px-4">
                    <div className="py-24 text-center">
                        <p className="text-destructive mb-4">{t('marketplace.loadError')}</p>
                        <Link to="/marketplace" className="inline-flex items-center gap-2 text-sm font-bold">
                            <ArrowLeft className="w-4 h-4" />
                            {t('marketplace.title')}
                        </Link>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    const images = product.images?.length ? product.images : [];
    const outOfStock = product.total_stock === 0;

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Header />
            <main className="flex-grow pt-16 lg:pt-24 pb-32">
                <div className="container mx-auto px-4">
                    {/* Breadcrumb */}
                    <div className="mb-6 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                        <Link to="/marketplace" className="hover:text-foreground transition-colors flex items-center gap-1.5">
                            <ArrowLeft className="w-3.5 h-3.5" />
                            {t('marketplace.title')}
                        </Link>
                        <span className="text-muted-foreground/40">/</span>
                        {product.category && <span>{product.category}</span>}
                    </div>

                    <div className="grid lg:grid-cols-[1.1fr_1fr] gap-8 lg:gap-16">
                        {/* Gallery */}
                        <div className="space-y-4">
                            <div className="relative aspect-square lg:aspect-[4/5] rounded-3xl overflow-hidden bg-secondary/40 border border-border">
                                {images.length > 0 ? (
                                    <img
                                        src={images[activeImageIdx]}
                                        alt={product.title}
                                        className={cn(
                                            'w-full h-full object-cover transition-opacity duration-500',
                                            outOfStock && 'grayscale opacity-70'
                                        )}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
                                        <ImageOff className="w-16 h-16" />
                                    </div>
                                )}

                                {/* Like floating */}
                                <button
                                    onClick={() => likeMutation.mutate()}
                                    className={cn(
                                        'absolute top-4 right-4 w-12 h-12 rounded-full backdrop-blur-md flex items-center justify-center transition-all active:scale-90 shadow-lg',
                                        product.is_liked_by_me
                                            ? 'bg-white shadow-rose-500/30'
                                            : 'bg-black/30 hover:bg-black/40'
                                    )}
                                >
                                    <Heart className={cn(
                                        'w-5 h-5 transition-all',
                                        product.is_liked_by_me ? 'fill-rose-500 text-rose-500 scale-110' : 'text-white'
                                    )} />
                                </button>

                                {outOfStock && (
                                    <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-md bg-foreground text-background text-[11px] font-bold uppercase tracking-[0.2em]">
                                        {t('marketplace.outOfStock')}
                                    </div>
                                )}
                            </div>

                            {images.length > 1 && (
                                <div className="grid grid-cols-5 gap-2">
                                    {images.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setActiveImageIdx(idx)}
                                            className={cn(
                                                'relative aspect-square rounded-xl overflow-hidden border-2 transition-all',
                                                activeImageIdx === idx
                                                    ? 'border-foreground scale-100'
                                                    : 'border-transparent opacity-60 hover:opacity-100'
                                            )}
                                        >
                                            <img src={img} alt="" className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="lg:sticky lg:top-28 self-start">
                            {product.category && (
                                <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary mb-3">
                                    {product.category}
                                </div>
                            )}
                            <h1 className="font-serif italic text-4xl lg:text-5xl leading-tight text-foreground mb-4 tracking-tight">
                                {product.title}
                            </h1>

                            <div className="flex items-end gap-3 mb-6 pb-6 border-b border-border">
                                <div className="flex items-baseline gap-1">
                                    <span className="font-mono font-bold text-3xl lg:text-4xl text-foreground">
                                        {formatPrice(product.price)}
                                    </span>
                                    <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground ml-1">
                                        {t('common.currency')}
                                    </span>
                                </div>
                                {product.prepayment_amount > 0 && (
                                    <div className="ml-auto text-right">
                                        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                                            {t('marketplace.prepayment')}
                                        </div>
                                        <div className="font-mono font-bold text-sm">
                                            {formatPrice(product.prepayment_amount)} <span className="text-[10px] text-muted-foreground">{t('common.currency')}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Description */}
                            {product.description && (
                                <div className="mb-8">
                                    <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground mb-2">
                                        {t('marketplace.description')}
                                    </div>
                                    <p className="text-foreground/85 leading-relaxed text-[15px]">
                                        {product.description}
                                    </p>
                                </div>
                            )}

                            {/* Size selector */}
                            {product.sizes.length > 0 && (
                                <div className="mb-8">
                                    <div className="flex items-baseline justify-between mb-3">
                                        <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                                            {t('marketplace.selectSize')}
                                        </div>
                                        {selectedSize?.hint_label && (
                                            <div className="text-[11px] text-muted-foreground italic">
                                                {selectedSize.hint_label}
                                            </div>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                                        {product.sizes.map(size => {
                                            const disabled = size.stock === 0;
                                            const selected = selectedSizeId === size.id;
                                            return (
                                                <button
                                                    key={size.id}
                                                    onClick={() => !disabled && setSelectedSizeId(size.id)}
                                                    disabled={disabled}
                                                    className={cn(
                                                        'relative h-14 rounded-xl border-2 font-bold text-sm transition-all',
                                                        selected
                                                            ? 'border-foreground bg-foreground text-background'
                                                            : disabled
                                                                ? 'border-border bg-muted/30 text-muted-foreground/50 cursor-not-allowed line-through'
                                                                : 'border-border hover:border-foreground/40 text-foreground'
                                                    )}
                                                >
                                                    {size.size_label}
                                                    {selected && (
                                                        <Check className="absolute -top-1.5 -right-1.5 w-4 h-4 p-0.5 rounded-full bg-primary text-primary-foreground" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Quantity stepper */}
                            {!outOfStock && selectedSize && (
                                <div className="mb-8 flex items-center justify-between">
                                    <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                                        {t('cart.quantity')}
                                    </div>
                                    <div className="flex items-center gap-3 bg-secondary/60 rounded-full p-1">
                                        <button
                                            onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                            disabled={quantity <= 1}
                                            className="w-10 h-10 rounded-full bg-background flex items-center justify-center shadow-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-background/80 transition-colors"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <span className="font-mono font-bold text-lg min-w-8 text-center">{quantity}</span>
                                        <button
                                            onClick={() => setQuantity(q => Math.min(maxQty, q + 1))}
                                            disabled={quantity >= maxQty}
                                            className="w-10 h-10 rounded-full bg-background flex items-center justify-center shadow-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-background/80 transition-colors"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* CTA */}
                            <div className="space-y-3">
                                <button
                                    onClick={() => addMutation.mutate()}
                                    disabled={outOfStock || !selectedSize || addMutation.isPending}
                                    className={cn(
                                        'w-full h-14 rounded-full flex items-center justify-center gap-3 font-bold transition-all',
                                        outOfStock
                                            ? 'bg-muted text-muted-foreground cursor-not-allowed'
                                            : 'bg-foreground text-background hover:bg-foreground/90 active:scale-[0.99] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.4)]'
                                    )}
                                >
                                    {addMutation.isPending ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <ShoppingBag className="w-5 h-5" />
                                            {outOfStock ? t('marketplace.outOfStock') : t('marketplace.addToCart')}
                                        </>
                                    )}
                                </button>

                                {cartCount > 0 && (
                                    <Link
                                        to="/marketplace/cart"
                                        className="w-full h-12 rounded-full border border-border flex items-center justify-center gap-2 text-sm font-bold hover:bg-secondary/60 transition-colors"
                                    >
                                        <span>{t('marketplace.viewCart')}</span>
                                        <span className="font-mono">({cartCount})</span>
                                    </Link>
                                )}
                            </div>

                            {/* meta */}
                            <div className="mt-8 pt-6 border-t border-border flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                                <div className="flex items-center gap-1.5">
                                    <Heart className={cn('w-3.5 h-3.5', product.is_liked_by_me && 'fill-rose-500 text-rose-500')} />
                                    <span className="font-mono">{product.likes_count}</span>
                                    <span>{t('marketplace.likes')}</span>
                                </div>
                                {product.total_stock > 0 && (
                                    <div>
                                        <span className="font-mono">{product.total_stock}</span> <span className="lowercase tracking-normal text-muted-foreground/80 italic">in stock</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default ProductDetail;
