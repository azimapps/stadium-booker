import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
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
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { fetchStadiumById } from '@/services/api';
import {
    MapPin,
    Users,
    Phone,
    Maximize,
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Info,
    CheckCircle2,
    AlertCircle,
    Clock
} from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';

const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
    '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
    '20:00', '21:00', '22:00', '23:00'
];

const StadiumDetail = () => {
    const { id } = useParams<{ id: string }>();
    const { language, t } = useLanguage();
    const navigate = useNavigate();
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [phone, setPhone] = useState('');
    const [isBookingOpen, setIsBookingOpen] = useState(false);

    const { data: stadium, isLoading, error } = useQuery({
        queryKey: ['stadium', id],
        queryFn: () => fetchStadiumById(id!),
        enabled: !!id,
    });

    const handleBook = () => {
        if (!selectedDate || !selectedTime || !phone) {
            toast.error(t('booking.error'));
            return;
        }

        toast.success(t('booking.success'), {
            description: `${format(selectedDate, 'PP')} at ${selectedTime}`,
        });
        setIsBookingOpen(false);
    };

    if (isLoading) {
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

    if (error || !stadium) {
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
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                <div className="p-4 rounded-xl bg-card border border-border flex flex-col items-center text-center">
                                    <Maximize className="w-6 h-6 text-primary mb-2" />
                                    <span className="text-sm text-muted-foreground">{t('stadiums.size')}</span>
                                    <span className="font-semibold">{stadium.capacity}</span>
                                </div>
                                <div className="p-4 rounded-xl bg-card border border-border flex flex-col items-center text-center">
                                    <Info className="w-6 h-6 text-primary mb-2" />
                                    <span className="text-sm text-muted-foreground">{t('stadiums.surface')}</span>
                                    <span className="font-semibold capitalize">{stadium.surface_type}</span>
                                </div>
                                <div className="p-4 rounded-xl bg-card border border-border flex flex-col items-center text-center">
                                    <CalendarIcon className="w-6 h-6 text-primary mb-2" />
                                    <span className="text-sm text-muted-foreground">{t('stadiums.roof')}</span>
                                    <span className="font-semibold capitalize">{stadium.roof_type}</span>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-4">
                                <h2 className="text-xl font-semibold">{t('stadiums.about')}</h2>
                                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                    {displayDescription}
                                </p>
                            </div>

                            {/* Facilities */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <CheckCircle2 className="w-5 h-5 text-primary" />
                                    <span>{t('stadiums.artificialTurfs')}</span>
                                </div>
                                {stadium.is_metro_near && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <CheckCircle2 className="w-5 h-5 text-primary" />
                                        <span>{t('stadiums.nearMetro')}: {stadium.metro_station}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <CheckCircle2 className="w-5 h-5 text-primary" />
                                    <span>{t('stadiums.open247')}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <CheckCircle2 className="w-5 h-5 text-primary" />
                                    <span>{t('stadiums.freeParking')}</span>
                                </div>
                            </div>

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

                                <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
                                    <DialogTrigger asChild>
                                        <Button size="lg" className="w-full text-lg h-14 shadow-lg shadow-primary/20">
                                            {t('stadiums.book')}
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                                        <DialogHeader>
                                            <DialogTitle className="text-2xl font-bold">{t('booking.title')}</DialogTitle>
                                        </DialogHeader>

                                        <div className="space-y-6 py-4">
                                            <div className="space-y-3">
                                                <label className="text-sm font-medium flex items-center gap-2">
                                                    <CalendarIcon className="w-4 h-4 text-primary" />
                                                    {t('booking.date')}
                                                </label>
                                                <div className="border rounded-xl p-2 bg-background flex justify-center">
                                                    <Calendar
                                                        mode="single"
                                                        selected={selectedDate}
                                                        onSelect={setSelectedDate}
                                                        className="rounded-md border-0"
                                                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <label className="text-sm font-medium flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-primary" />
                                                    {t('booking.time')}
                                                </label>
                                                <div className="grid grid-cols-4 gap-2">
                                                    {timeSlots.map((time) => (
                                                        <Button
                                                            key={time}
                                                            variant={selectedTime === time ? "default" : "outline"}
                                                            className={`text-xs h-9 transition-all ${selectedTime === time ? "ring-2 ring-primary ring-offset-2" : ""
                                                                }`}
                                                            onClick={() => setSelectedTime(time)}
                                                        >
                                                            {time}
                                                        </Button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <label className="text-sm font-medium flex items-center gap-2">
                                                    <Phone className="w-4 h-4 text-primary" />
                                                    {t('booking.phone')}
                                                </label>
                                                <Input
                                                    type="tel"
                                                    placeholder="+998"
                                                    value={phone}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (!val.startsWith('+998')) {
                                                            setPhone('+998');
                                                        } else {
                                                            // Keep only numbers after +998 and limit length
                                                            const numbers = val.slice(4).replace(/\D/g, '');
                                                            if (numbers.length <= 9) {
                                                                setPhone('+998' + numbers);
                                                            }
                                                        }
                                                    }}
                                                    onFocus={(e) => {
                                                        if (!phone) setPhone('+998');
                                                    }}
                                                    className="h-12 rounded-xl"
                                                />
                                            </div>
                                        </div>

                                        <DialogFooter>
                                            <Button
                                                size="lg"
                                                className="w-full h-12 text-lg"
                                                onClick={handleBook}
                                                disabled={!selectedDate || !selectedTime || !phone}
                                            >
                                                {t('booking.confirm')}
                                            </Button>
                                        </DialogFooter>
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
