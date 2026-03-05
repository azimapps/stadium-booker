import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { fetchStadiumById, fetchAvailability, createBooking, CreateBookingRequest } from '@/services/api';
import {
    MapPin,
    Phone,
    Maximize,
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Info,
    CheckCircle2,
    AlertCircle,
    Clock,
    Loader2,
    Tag
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { format } from 'date-fns';

const StadiumDetail = () => {
    const { id } = useParams<{ id: string }>();
    const { language, t } = useLanguage();
    const { isAuthenticated, token } = useAuth(); // Get auth state
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [selectedHours, setSelectedHours] = useState<number[]>([]);
    const [isBookingOpen, setIsBookingOpen] = useState(false);
    const [bookingStep, setBookingStep] = useState<'selection' | 'confirm' | 'success'>('selection');

    // Fetch Stadium Details
    const { data: stadium, isLoading: isStadiumLoading, error: stadiumError } = useQuery({
        queryKey: ['stadium', id],
        queryFn: () => fetchStadiumById(id!),
        enabled: !!id,
    });

    // Fetch Availability
    const formattedDate = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined;
    const { data: availability, isLoading: isAvailabilityLoading } = useQuery({
        queryKey: ['availability', id, formattedDate],
        queryFn: () => fetchAvailability(token!, parseInt(id!), formattedDate),
        enabled: !!id && !!selectedDate && !!token && isBookingOpen,
    });


    // Create Booking Mutation
    const createBookingMutation = useMutation({
        mutationFn: (data: CreateBookingRequest) => createBooking(token!, data),
        onSuccess: () => {
            setBookingStep('success');
            queryClient.invalidateQueries({ queryKey: ['availability', id, formattedDate] });
        },
        onError: (error: Error) => {
            toast.error(error.message || t('booking.error'));
        }
    });

    const handleConfirmBooking = () => {
        if (!isAuthenticated || !selectedDate || selectedHours.length === 0) return;

        createBookingMutation.mutate({
            stadium_id: parseInt(id!),
            is_recurring: false,
            date: format(selectedDate, 'yyyy-MM-dd'),
            hours: selectedHours.sort((a, b) => a - b)
        });
    };

    const toggleHourSelection = (hour: number) => {
        let newSelection = [...selectedHours];

        if (newSelection.includes(hour)) {
            newSelection = newSelection.filter(h => h !== hour);
        } else {
            // Logic for max 3 consecutive
            if (newSelection.length === 0) {
                newSelection = [hour];
            } else {
                const min = Math.min(...newSelection);
                const max = Math.max(...newSelection);

                // If adjacent and within limit (max 3)
                // We check if adding this hour keeps it consecutive and <= 3
                // Cases: 
                // 1. Adding to end: hour == max + 1
                // 2. Adding to start: hour == min - 1

                if ((hour === min - 1 || hour === max + 1) && newSelection.length < 3) {
                    newSelection.push(hour);
                } else {
                    // Not adjacent or limit reached, restart selection
                    newSelection = [hour];
                }
            }
        }
        setSelectedHours(newSelection.sort((a, b) => a - b));
    };

    const resetBooking = () => {
        setBookingStep('selection');
        setSelectedHours([]);
        setIsBookingOpen(false);
    };

    if (isStadiumLoading) {
        return (
            <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-grow pt-24 container mx-auto px-4">
                    <div className="grid lg:grid-cols-2 gap-8 mb-12">
                        <Skeleton className="h-[400px] rounded-2xl w-full" />
                        <div className="space-y-6">
                            <Skeleton className="h-10 w-3/4" />
                            <Skeleton className="h-6 w-1/2" />
                            <div className="flex gap-4">
                                <Skeleton className="h-20 w-32" />
                                <Skeleton className="h-20 w-32" />
                                <Skeleton className="h-20 w-32" />
                            </div>
                            <Skeleton className="h-32 w-full" />
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (stadiumError || !stadium) {
        return (
            <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-grow pt-24 flex items-center justify-center">
                    <div className="text-center px-4">
                        <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
                        <h1 className="text-2xl font-bold mb-2">Stadium not found</h1>
                        <p className="text-muted-foreground mb-6">The stadium you are looking for does not exist or has been removed.</p>
                        <Button onClick={() => navigate('/stadiums')}>Back to Stadiums</Button>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    const allImages = [stadium.main_image, ...stadium.images].filter((img, index, self) =>
        img && self.indexOf(img) === index
    );
    const displayName = language === 'uz' ? stadium.name_uz : stadium.name_ru;
    const displayDescription = language === 'uz' ? stadium.description_uz : stadium.description_ru;
    const displayAddress = language === 'uz' ? stadium.address_uz : stadium.address_ru;

    const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
    const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);

    // Generate time slots based on availability or default 9-23
    const hoursReference = availability?.timetable_hours || Array.from({ length: 15 }, (_, i) => i + 9); // Default 9 to 23

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Header />

            <main className="flex-grow pt-24 pb-16">
                <div className="container mx-auto px-4">
                    {/* Back button */}
                    <Button
                        variant="ghost"
                        className="mb-6 gap-2 hover:bg-transparent -ml-4"
                        onClick={() => navigate(-1)}
                    >
                        <ChevronLeft className="w-4 h-4" />
                        {t('nav.back')}
                    </Button>

                    <div className="grid lg:grid-cols-2 gap-8 items-start">
                        {/* Image Gallery */}
                        <div className="space-y-4">
                            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden group">
                                <img
                                    src={allImages[currentImageIndex]}
                                    alt={displayName}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />

                                {allImages.length > 1 && (
                                    <>
                                        <button
                                            onClick={(e) => { e.preventDefault(); prevImage(); }}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/50 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <ChevronLeft className="w-6 h-6" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.preventDefault(); nextImage(); }}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/50 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <ChevronRight className="w-6 h-6" />
                                        </button>
                                    </>
                                )}

                                <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-full font-bold shadow-lg">
                                    {stadium.price_per_hour.toLocaleString()} UZS / {t('stadiums.perHour')}
                                </div>
                            </div>

                            {allImages.length > 1 && (
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide py-2">
                                    {allImages.map((img, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setCurrentImageIndex(index)}
                                            className={`relative flex-shrink-0 w-24 h-20 rounded-lg overflow-hidden border-2 transition-all ${index === currentImageIndex ? 'border-primary' : 'border-transparent opacity-60'
                                                }`}
                                        >
                                            <img src={img} alt={`${displayName} ${index}`} className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Stadium Info */}
                        <div className="space-y-8">
                            <div>
                                <h1 className="text-4xl font-bold text-foreground mb-3">{displayName}</h1>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <MapPin className="w-5 h-5 text-primary" />
                                    <span className="text-lg">{displayAddress}</span>
                                </div>
                            </div>

                            {/* Quick Stats */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="flex flex-col items-center text-center gap-2">
                                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                                        <Maximize className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">{stadium.capacity}</p>
                                        <p className="text-xs text-muted-foreground">{t('stadiums.size')}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-center text-center gap-2">
                                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                                        <CalendarIcon className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm capitalize">{t(`roof.${stadium.roof_type.toLowerCase()}`) !== `roof.${stadium.roof_type.toLowerCase()}` ? t(`roof.${stadium.roof_type.toLowerCase()}`) : stadium.roof_type}</p>
                                        <p className="text-xs text-muted-foreground">{t('stadiums.roof')}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-center text-center gap-2">
                                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                                        <Info className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm capitalize">{t(`surface.${stadium.surface_type.toLowerCase()}`) !== `surface.${stadium.surface_type.toLowerCase()}` ? t(`surface.${stadium.surface_type.toLowerCase()}`) : stadium.surface_type}</p>
                                        <p className="text-xs text-muted-foreground">{t('stadiums.surface')}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Discount banner */}
                            {stadium.discount_price && stadium.discount_price > 0 && (
                                <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-2xl px-5 py-4">
                                    <Tag className="w-5 h-5 text-primary flex-shrink-0" />
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                        <span className="text-sm font-medium">
                                            14:00 — 18:00 chegirma narxi
                                        </span>
                                        <span className="text-sm font-bold text-primary">
                                            {stadium.discount_price.toLocaleString()} so'm/soat
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Description */}
                            <div className="space-y-4">
                                <h2 className="text-xl font-semibold">{t('stadiums.about')}</h2>
                                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                    {displayDescription}
                                </p>
                            </div>

                            {/* Location Map */}
                            {stadium.latitude && stadium.longitude && (
                                <div className="space-y-4">
                                    <h2 className="text-xl font-semibold">Manzil xaritasi</h2>
                                    <div className="rounded-2xl overflow-hidden border border-border">
                                        <iframe
                                            src={`https://yandex.uz/map-widget/v1/?ll=${stadium.longitude}%2C${stadium.latitude}&z=16&pt=${stadium.longitude}%2C${stadium.latitude}%2Cpm2rdm`}
                                            width="100%"
                                            height="250"
                                            style={{ border: 0 }}
                                            allowFullScreen
                                            loading="lazy"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <MapPin className="w-4 h-4 text-primary" />
                                        <span>{displayAddress}</span>
                                    </div>
                                </div>
                            )}

                            {/* Booking Action */}
                            <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 space-y-6">
                                <div className="flex flex-col gap-1">
                                    <span className="text-sm text-muted-foreground">{t('stadiums.contact')}</span>
                                    {stadium.phone.map((num, i) => (
                                        <div key={i} className="flex items-center gap-2 text-lg font-semibold">
                                            <Phone className="w-5 h-5 text-primary" />
                                            <a href={`tel:${num}`} className="hover:text-primary transition-colors">{num}</a>
                                        </div>
                                    ))}
                                </div>

                                <Dialog open={isBookingOpen} onOpenChange={(open) => {
                                    if (!open) resetBooking();
                                    else setIsBookingOpen(true);
                                }}>
                                    <DialogTrigger asChild>
                                        <Button size="lg" className="w-full text-lg h-14 shadow-lg shadow-primary/20">
                                            {t('stadiums.book')}
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden bg-white dark:bg-zinc-950 rounded-3xl gap-0 max-h-[90vh] flex flex-col">

                                        {/* Step 1: Selection */}
                                        {bookingStep === 'selection' && (
                                            <>
                                                <DialogHeader className="px-6 pt-6 pb-2">
                                                    <DialogTitle className="text-xl font-bold">{displayName}</DialogTitle>
                                                </DialogHeader>

                                                <div className="flex-1 overflow-y-auto px-6 py-2 space-y-6">
                                                    <div className="space-y-4">
                                                        <h3 className="font-semibold">{t('booking.date')}</h3>
                                                        <div className="flex justify-center bg-muted/20 rounded-2xl p-2">
                                                            <Calendar
                                                                mode="single"
                                                                selected={selectedDate}
                                                                onSelect={setSelectedDate}
                                                                className="rounded-md border-0"
                                                                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-4 pb-4">
                                                        <h3 className="font-semibold">{t('booking.available_hours')}</h3>
                                                        {!isAuthenticated ? (
                                                            <div className="text-center p-4 bg-muted/50 rounded-xl">
                                                                <p className="text-sm text-muted-foreground mb-3">Login required to view availability</p>
                                                                <Button variant="outline" size="sm" onClick={() => navigate('/auth')}>Login</Button>
                                                            </div>
                                                        ) : isAvailabilityLoading ? (
                                                            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary" /></div>
                                                        ) : (
                                                            <div className="grid grid-cols-4 gap-2">
                                                                {hoursReference.map((hour) => {
                                                                    const isBooked = availability?.booked_hours?.includes(hour);
                                                                    const isSelected = selectedHours.includes(hour);
                                                                    const isDiscount = availability?.discount_hours?.includes(hour);
                                                                    const timeLabel = `${hour.toString().padStart(2, '0')}:00`;

                                                                    return (
                                                                        <button
                                                                            key={hour}
                                                                            type="button"
                                                                            disabled={isBooked}
                                                                            onClick={() => toggleHourSelection(hour)}
                                                                            className={`
                                                                                relative rounded-xl text-xs font-medium transition-all duration-200 border
                                                                                ${isDiscount && !isBooked ? 'h-14' : 'h-10'}
                                                                                ${isSelected
                                                                                    ? 'bg-primary text-primary-foreground border-primary'
                                                                                    : isBooked
                                                                                        ? 'bg-muted text-muted-foreground border-transparent opacity-50 cursor-not-allowed'
                                                                                        : isDiscount
                                                                                            ? 'bg-yellow-500/10 hover:bg-yellow-500/20 text-foreground border-yellow-500/30 hover:border-yellow-500/50'
                                                                                            : 'bg-muted/30 hover:bg-muted text-foreground border-transparent hover:border-primary/20'
                                                                                }
                                                                            `}
                                                                        >
                                                                            <span>{timeLabel}</span>
                                                                            {isDiscount && !isBooked && (
                                                                                <span className={`block text-[10px] mt-0.5 ${isSelected ? 'text-primary-foreground/80' : 'text-yellow-600 dark:text-yellow-400'}`}>
                                                                                    {availability!.discount_price.toLocaleString()}
                                                                                </span>
                                                                            )}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-4 text-xs text-muted-foreground">
                                                            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-primary"></div> Tanlangan</div>
                                                            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-muted/30"></div> Bo'sh</div>
                                                            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-muted"></div> Band</div>
                                                            {availability?.discount_hours && availability.discount_hours.length > 0 && (
                                                                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-yellow-500/30 border border-yellow-500/50"></div> Chegirma</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="p-6 border-t bg-background mt-auto">
                                                    <Button
                                                        className="w-full h-12 text-lg rounded-xl bg-primary hover:bg-primary/90"
                                                        disabled={selectedHours.length === 0 || !selectedDate || !isAuthenticated}
                                                        onClick={() => setBookingStep('confirm')}
                                                    >
                                                        Band qilish
                                                    </Button>
                                                </div>
                                            </>
                                        )}

                                        {/* Step 2: Confirmation */}
                                        {bookingStep === 'confirm' && (
                                            <>
                                                <div className="px-6 pt-6 pb-2 text-center">
                                                    <h3 className="text-xl font-semibold">Buyurtmani tasdiqlash</h3>
                                                </div>

                                                <div className="p-6 space-y-4 flex-1 overflow-y-auto">
                                                    <div className="bg-muted/30 rounded-2xl p-4 space-y-4">
                                                        <div className="flex justify-between items-center text-sm">
                                                            <span className="text-muted-foreground">Sana</span>
                                                            <span className="font-medium">{selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}</span>
                                                        </div>

                                                        <div className="space-y-2 border-t border-border/50 pt-2">
                                                            {selectedHours.sort((a, b) => a - b).map(h => {
                                                                const isDiscount = availability?.discount_hours?.includes(h);
                                                                const price = isDiscount ? availability!.discount_price : stadium.price_per_hour;
                                                                return (
                                                                    <div key={h} className="flex justify-between items-center text-sm">
                                                                        <span className="font-mono text-base text-primary">{h.toString().padStart(2, '0')}:00</span>
                                                                        <div className="flex items-center gap-2">
                                                                            {isDiscount && (
                                                                                <span className="text-xs line-through text-muted-foreground">{stadium.price_per_hour.toLocaleString()}</span>
                                                                            )}
                                                                            <span className={`font-medium tracking-wide ${isDiscount ? 'text-yellow-600 dark:text-yellow-400' : 'text-primary'}`}>
                                                                                {price.toLocaleString()} so'm
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>

                                                        <div className="flex justify-between items-center pt-2 border-t border-border">
                                                            <span className="font-bold text-lg">Jami summa</span>
                                                            <span className="font-bold text-lg text-primary">
                                                                {selectedHours.reduce((total, h) => {
                                                                    const isDiscount = availability?.discount_hours?.includes(h);
                                                                    return total + (isDiscount ? availability!.discount_price : stadium.price_per_hour);
                                                                }, 0).toLocaleString()} so'm
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="p-6 pt-0 space-y-3 mt-auto">
                                                    <Button
                                                        className="w-full h-12 text-lg rounded-xl bg-primary hover:bg-primary/90"
                                                        onClick={handleConfirmBooking}
                                                        disabled={createBookingMutation.isPending}
                                                    >
                                                        {createBookingMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                        Tasdiqlash
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        className="w-full h-12 text-lg rounded-xl border-primary text-primary hover:bg-primary/10"
                                                        onClick={() => setBookingStep('selection')}
                                                    >
                                                        Bekor qilish
                                                    </Button>
                                                </div>
                                            </>
                                        )}

                                        {/* Step 3: Success */}
                                        {bookingStep === 'success' && (
                                            <div className="flex flex-col items-center justify-center p-8 text-center h-full">
                                                <div className="w-20 h-20 bg-transparent border-4 border-primary rounded-full flex items-center justify-center mb-6">
                                                    <CheckCircle2 className="w-10 h-10 text-primary" strokeWidth={3} />
                                                </div>

                                                <h2 className="text-2xl font-bold mb-8">Buyurtma yaratildi</h2>

                                                <div className="w-full space-y-3 mb-8 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground text-left">Stadion</span>
                                                        <span className="font-medium text-right max-w-[60%] truncate">{displayName}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Sana</span>
                                                        <span className="font-medium">{selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Soat</span>
                                                        <span className="font-medium">{selectedHours.sort((a, b) => a - b).map(h => `${h.toString().padStart(2, '0')}:00`).join(', ')}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Jami</span>
                                                        <span className="font-medium">{selectedHours.reduce((total, h) => {
                                                            const isDiscount = availability?.discount_hours?.includes(h);
                                                            return total + (isDiscount ? availability!.discount_price : stadium.price_per_hour);
                                                        }, 0).toLocaleString()} so'm</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Holat</span>
                                                        <span className="font-bold text-primary">Jarayonda</span>
                                                    </div>
                                                </div>

                                                <Button
                                                    className="w-full h-12 text-lg rounded-xl bg-primary hover:bg-primary/90"
                                                    onClick={() => navigate('/bookings')}
                                                >
                                                    Buyurtmalarga o'tish
                                                </Button>
                                            </div>
                                        )}
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default StadiumDetail;
