import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    ArrowUpRight,
    Heart,
    ImageOff,
    Loader2,
    Receipt,
    Search,
    ShoppingBag,
    SlidersHorizontal,
    X,
} from 'lucide-react';
import { toast } from 'sonner';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
    Cart,
    fetchCart,
    fetchProducts,
    ListProductsParams,
    Product,
    ProductSort,
    toggleProductLike,
} from '@/services/api';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';

const formatPrice = (n: number) => new Intl.NumberFormat('ru-RU').format(n);

const sortLabelKey = (s: ProductSort): string => {
    switch (s) {
        case 'newest': return 'marketplace.sortNewest';
        case 'likes': return 'marketplace.sortLikes';
        case 'price_asc': return 'marketplace.sortPriceAsc';
        case 'price_desc': return 'marketplace.sortPriceDesc';
    }
};

const Marketplace = () => {
    const { t } = useLanguage();
    const { token, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [sort, setSort] = useState<ProductSort>('newest');
    const [category, setCategory] = useState<string>('');
    const [inStockOnly, setInStockOnly] = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(false);

    // Debounce search
    useEffect(() => {
        const id = setTimeout(() => setDebouncedSearch(search), 320);
        return () => clearTimeout(id);
    }, [search]);

    const params = useMemo<ListProductsParams>(() => ({
        search: debouncedSearch || undefined,
        sort,
        category: category || undefined,
        in_stock_only: inStockOnly || undefined,
        limit: 60,
    }), [debouncedSearch, sort, category, inStockOnly]);

    const { data: products, isLoading, error, isFetching } = useQuery({
        queryKey: ['marketplace-products', params],
        queryFn: () => fetchProducts(token, params),
        staleTime: 30_000,
    });

    const { data: cart } = useQuery({
        queryKey: ['marketplace-cart'],
        queryFn: () => fetchCart(token!),
        enabled: !!token,
        staleTime: 10_000,
    });

    const cartCount = cart?.items.reduce((s, i) => s + i.quantity, 0) ?? 0;

    // Discover all categories from current results
    const categories = useMemo(() => {
        const set = new Set<string>();
        (products ?? []).forEach(p => p.category && set.add(p.category));
        return Array.from(set).sort();
    }, [products]);

    const handleLike = async (productId: number) => {
        if (!token) {
            navigate('/auth');
            return;
        }
        // Optimistic
        queryClient.setQueryData<Product[]>(['marketplace-products', params], (prev) =>
            prev?.map(p => p.id === productId
                ? { ...p, is_liked_by_me: !p.is_liked_by_me, likes_count: p.likes_count + (p.is_liked_by_me ? -1 : 1) }
                : p
            ) ?? prev
        );
        try {
            const res = await toggleProductLike(token, productId);
            queryClient.setQueryData<Product[]>(['marketplace-products', params], (prev) =>
                prev?.map(p => p.id === productId
                    ? { ...p, is_liked_by_me: res.liked, likes_count: res.likes_count }
                    : p
                ) ?? prev
            );
        } catch {
            // rollback
            queryClient.invalidateQueries({ queryKey: ['marketplace-products'] });
            toast.error(t('marketplace.likeFailed'));
        }
    };

    const activeFilterCount =
        (sort !== 'newest' ? 1 : 0) +
        (category ? 1 : 0) +
        (inStockOnly ? 1 : 0);

    const resetFilters = () => {
        setSort('newest');
        setCategory('');
        setInStockOnly(false);
    };

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Header />
            <main className="flex-grow pt-16 lg:pt-24 pb-32">
                {/* Editorial hero */}
                <section className="border-b border-border/60 bg-gradient-to-b from-secondary/40 to-background">
                    <div className="container mx-auto px-4 py-10 lg:py-16">
                        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                            <div>
                                <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-primary mb-4">
                                    <span className="w-6 h-px bg-primary" />
                                    {t('marketplace.tagline')}
                                </div>
                                <h1 className="font-serif italic text-5xl lg:text-7xl leading-[0.95] text-foreground tracking-tight">
                                    {t('marketplace.title')}
                                </h1>
                            </div>
                            <div className="flex items-center gap-2">
                                <Link
                                    to="/marketplace/orders"
                                    className="group flex items-center gap-2 h-11 px-4 rounded-full border border-border bg-background hover:bg-secondary/60 transition-colors text-sm font-medium"
                                >
                                    <Receipt className="w-4 h-4" />
                                    <span className="hidden sm:inline">{t('marketplace.viewOrders')}</span>
                                </Link>
                                <Link
                                    to="/marketplace/cart"
                                    className="group relative flex items-center gap-2 h-11 pl-4 pr-5 rounded-full bg-foreground text-background hover:bg-foreground/90 transition-colors text-sm font-bold"
                                >
                                    <ShoppingBag className="w-4 h-4" />
                                    <span>{t('cart.title')}</span>
                                    {cartCount > 0 && (
                                        <span className="ml-1 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-mono font-bold">
                                            {cartCount}
                                        </span>
                                    )}
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Filter bar */}
                <section className="sticky top-14 lg:top-20 z-30 bg-background/85 backdrop-blur-md border-b border-border/60">
                    <div className="container mx-auto px-4 py-3 flex items-center gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={t('marketplace.searchHint')}
                                className="w-full h-12 pl-11 pr-10 rounded-full bg-secondary/60 border border-transparent focus:border-primary/40 focus:bg-background outline-none text-sm font-medium transition-colors"
                            />
                            {(isFetching && !isLoading) ? (
                                <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
                            ) : search ? (
                                <button
                                    onClick={() => setSearch('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
                                    aria-label="Clear"
                                >
                                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                                </button>
                            ) : null}
                        </div>
                        <button
                            onClick={() => setFiltersOpen(true)}
                            className={cn(
                                'relative h-12 px-4 rounded-full border flex items-center gap-2 text-sm font-medium transition-colors',
                                activeFilterCount > 0
                                    ? 'bg-foreground text-background border-foreground'
                                    : 'bg-background border-border hover:border-foreground/30'
                            )}
                        >
                            <SlidersHorizontal className="w-4 h-4" />
                            <span className="hidden sm:inline">{t('marketplace.filters')}</span>
                            {activeFilterCount > 0 && (
                                <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-mono font-bold">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Category chips */}
                    {categories.length > 0 && (
                        <div className="container mx-auto px-4 pb-3 -mt-1">
                            <div className="flex gap-2 overflow-x-auto scrollbar-none pr-4">
                                <CategoryChip
                                    label={t('marketplace.allCategories')}
                                    active={category === ''}
                                    onClick={() => setCategory('')}
                                />
                                {categories.map(c => (
                                    <CategoryChip
                                        key={c}
                                        label={c}
                                        active={category === c}
                                        onClick={() => setCategory(c)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </section>

                {/* Product grid */}
                <section className="container mx-auto px-4 mt-8">
                    {isLoading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <ProductSkeleton key={i} />
                            ))}
                        </div>
                    ) : error ? (
                        <ErrorState message={t('marketplace.loadError')} onRetry={() => queryClient.invalidateQueries({ queryKey: ['marketplace-products'] })} retryLabel={t('common.retry')} />
                    ) : !products || products.length === 0 ? (
                        <EmptyState
                            title={t('marketplace.empty')}
                            description={t('common.empty')}
                        />
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
                            {products.map((product, idx) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    index={idx}
                                    onLike={() => handleLike(product.id)}
                                    onClick={() => navigate(`/marketplace/products/${product.id}`)}
                                />
                            ))}
                        </div>
                    )}
                </section>

                {/* Floating cart pill */}
                {cartCount > 0 && (
                    <FloatingCart count={cartCount} cart={cart} />
                )}
            </main>
            <Footer />

            {/* Filters sheet */}
            <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                <SheetContent side="bottom" className="rounded-t-3xl border-t-0 max-h-[85vh] p-0">
                    <SheetHeader className="px-6 pt-6 pb-3 text-left">
                        <SheetTitle className="font-serif italic text-3xl">
                            {t('marketplace.filters')}
                        </SheetTitle>
                    </SheetHeader>

                    <div className="px-6 pb-8 space-y-6 overflow-y-auto">
                        <div>
                            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground mb-3">
                                {t('marketplace.sortBy')}
                            </div>
                            <div className="space-y-1">
                                {(['newest', 'likes', 'price_asc', 'price_desc'] as ProductSort[]).map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setSort(s)}
                                        className={cn(
                                            'w-full text-left flex items-center justify-between py-3 px-4 rounded-2xl transition-colors',
                                            sort === s ? 'bg-foreground text-background' : 'hover:bg-secondary/60'
                                        )}
                                    >
                                        <span className="text-sm font-medium">{t(sortLabelKey(s))}</span>
                                        <span className={cn(
                                            'w-4 h-4 rounded-full border-2 transition-all',
                                            sort === s ? 'border-background bg-background/0 ring-2 ring-background/40 ring-offset-2 ring-offset-foreground' : 'border-muted-foreground/30'
                                        )} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <label className="flex items-center justify-between gap-4 py-4 px-4 rounded-2xl border border-border bg-card cursor-pointer">
                            <div>
                                <div className="text-sm font-semibold">{t('marketplace.inStockOnly')}</div>
                                <div className="text-xs text-muted-foreground">{t('marketplace.outOfStock')}</div>
                            </div>
                            <ToggleSwitch checked={inStockOnly} onChange={setInStockOnly} />
                        </label>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={resetFilters}
                                className="flex-1 h-12 rounded-full border border-border text-sm font-semibold hover:bg-secondary/60 transition-colors"
                            >
                                {t('marketplace.reset')}
                            </button>
                            <button
                                onClick={() => setFiltersOpen(false)}
                                className="flex-1 h-12 rounded-full bg-foreground text-background text-sm font-bold hover:bg-foreground/90 transition-colors"
                            >
                                {t('marketplace.apply')}
                            </button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
};

// -----------------------------------------------------------
// Sub-components
// -----------------------------------------------------------

const CategoryChip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <button
        onClick={onClick}
        className={cn(
            'whitespace-nowrap h-8 px-3.5 rounded-full text-xs font-bold uppercase tracking-[0.12em] transition-all',
            active
                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30'
                : 'bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary'
        )}
    >
        {label}
    </button>
);

const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
            'relative w-11 h-6 rounded-full transition-colors',
            checked ? 'bg-primary' : 'bg-muted'
        )}
    >
        <span className={cn(
            'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-background shadow transition-transform',
            checked && 'translate-x-5'
        )} />
    </button>
);

const ProductCard = ({
    product,
    index,
    onLike,
    onClick,
}: {
    product: Product;
    index: number;
    onLike: () => void;
    onClick: () => void;
}) => {
    const { t } = useLanguage();
    const cover = product.images?.[0];
    const outOfStock = product.total_stock === 0;

    return (
        <article
            onClick={onClick}
            style={{ animationDelay: `${Math.min(index, 12) * 35}ms` }}
            className="group relative cursor-pointer animate-in fade-in slide-in-from-bottom-4 fill-mode-both duration-500"
        >
            <div className="relative overflow-hidden rounded-3xl bg-card border border-border shadow-sm group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-300">
                <div className="relative aspect-[3/4] overflow-hidden bg-secondary/40">
                    {cover ? (
                        <img
                            src={cover}
                            alt={product.title}
                            loading="lazy"
                            className={cn(
                                'w-full h-full object-cover transition-transform duration-700 group-hover:scale-105',
                                outOfStock && 'grayscale opacity-60'
                            )}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
                            <ImageOff className="w-10 h-10" />
                        </div>
                    )}

                    {/* gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />

                    {/* Category tag */}
                    {product.category && (
                        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-background/90 backdrop-blur-md text-[10px] font-bold uppercase tracking-[0.15em] text-foreground border border-white/40">
                            {product.category}
                        </div>
                    )}

                    {/* Like button */}
                    <button
                        onClick={(e) => { e.stopPropagation(); onLike(); }}
                        className={cn(
                            'absolute top-3 right-3 w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-all duration-300 active:scale-90',
                            product.is_liked_by_me
                                ? 'bg-white/95 shadow-lg shadow-rose-500/30'
                                : 'bg-black/30 hover:bg-black/40'
                        )}
                        aria-label="Like"
                    >
                        <Heart
                            className={cn(
                                'w-4 h-4 transition-all',
                                product.is_liked_by_me
                                    ? 'fill-rose-500 text-rose-500 scale-110'
                                    : 'text-white'
                            )}
                        />
                    </button>

                    {/* Stock badge */}
                    {outOfStock && (
                        <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-md bg-foreground/90 text-background text-[10px] font-bold uppercase tracking-[0.18em]">
                            {t('marketplace.outOfStock')}
                        </div>
                    )}

                    {/* Likes counter */}
                    {product.likes_count > 0 && (
                        <div className="absolute bottom-3 right-3 flex items-center gap-1 text-white drop-shadow-md">
                            <Heart className="w-3 h-3 fill-white" />
                            <span className="text-[11px] font-mono font-bold">{product.likes_count}</span>
                        </div>
                    )}
                </div>

                <div className="p-4">
                    <h3 className={cn(
                        'font-serif text-base leading-snug line-clamp-2 mb-2 min-h-[2.6em]',
                        outOfStock ? 'text-muted-foreground' : 'text-foreground'
                    )}>
                        {product.title}
                    </h3>
                    <div className="flex items-baseline justify-between gap-2">
                        <div className="flex items-baseline gap-1">
                            <span className={cn(
                                'font-mono font-bold text-base lg:text-lg',
                                outOfStock ? 'text-muted-foreground' : 'text-foreground'
                            )}>
                                {formatPrice(product.price)}
                            </span>
                            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                                {t('common.currency')}
                            </span>
                        </div>
                        <ArrowUpRight className={cn(
                            'w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5',
                            outOfStock ? 'text-muted-foreground' : 'text-primary'
                        )} />
                    </div>
                </div>
            </div>
        </article>
    );
};

const ProductSkeleton = () => (
    <div className="space-y-3">
        <Skeleton className="aspect-[3/4] rounded-3xl" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
    </div>
);

const EmptyState = ({ title, description }: { title: string; description: string }) => (
    <div className="py-24 flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-full bg-secondary/60 flex items-center justify-center mb-6">
            <ShoppingBag className="w-9 h-9 text-muted-foreground" />
        </div>
        <h3 className="font-serif italic text-3xl text-foreground mb-2">{title}</h3>
        <p className="text-muted-foreground max-w-sm">{description}</p>
    </div>
);

const ErrorState = ({ message, onRetry, retryLabel }: { message: string; onRetry: () => void; retryLabel: string }) => (
    <div className="py-24 text-center">
        <p className="text-destructive font-medium mb-4">{message}</p>
        <button
            onClick={onRetry}
            className="h-11 px-5 rounded-full bg-foreground text-background text-sm font-bold hover:bg-foreground/90 transition-colors"
        >
            {retryLabel}
        </button>
    </div>
);

const FloatingCart = ({ count, cart }: { count: number; cart: Cart | undefined }) => {
    const { t } = useLanguage();
    const [hidden, setHidden] = useState(false);
    const lastY = useRef(0);

    useEffect(() => {
        const onScroll = () => {
            const y = window.scrollY;
            const goingDown = y > lastY.current + 8;
            const goingUp = y < lastY.current - 8;
            if (goingDown) setHidden(true);
            else if (goingUp) setHidden(false);
            lastY.current = y;
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <div
            className={cn(
                'fixed inset-x-0 z-40 flex justify-center px-4 pointer-events-none transition-all duration-400',
                hidden ? 'translate-y-32 opacity-0' : 'translate-y-0 opacity-100',
                'bottom-20 lg:bottom-6'
            )}
        >
            <Link
                to="/marketplace/cart"
                className="pointer-events-auto group flex items-center gap-3 h-14 pl-5 pr-3 rounded-full bg-foreground text-background shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] hover:shadow-[0_18px_40px_-10px_rgba(0,0,0,0.6)] transition-all active:scale-[0.98]"
            >
                <ShoppingBag className="w-5 h-5" />
                <span className="font-bold text-sm tracking-wide">
                    {t('marketplace.viewCart')}
                </span>
                <span className="inline-flex items-center justify-center min-w-8 h-8 px-2 rounded-full bg-primary text-primary-foreground text-xs font-mono font-bold">
                    {count}
                </span>
                {cart && (
                    <span className="hidden sm:flex items-center gap-1 ml-2 pl-4 border-l border-background/20">
                        <span className="font-mono text-sm font-bold">{formatPrice(cart.items_total)}</span>
                        <span className="text-[10px] uppercase tracking-[0.16em] text-background/70">
                            {t('common.currency')}
                        </span>
                    </span>
                )}
            </Link>
        </div>
    );
};

export default Marketplace;
