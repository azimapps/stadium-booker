import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { sendOtp, verifyOtp, fetchTerms, fetchPrivacy, LegalDocument } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowRight, Loader2, Phone, ShieldCheck, Send, FileText, Shield } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import heroImage from '@/assets/hero-stadium.jpg';

const Auth = () => {
    const { t, language } = useLanguage();
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();

    // Get the redirect path from location state, default to home
    const from = location.state?.from?.pathname || '/';

    const [step, setStep] = useState<'phone' | 'otp'>('phone');
    const [phone, setPhone] = useState('+998');
    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [accepted, setAccepted] = useState(false);
    const [legalModal, setLegalModal] = useState<'terms' | 'privacy' | null>(null);
    const [legalContent, setLegalContent] = useState<LegalDocument | null>(null);
    const [legalLoading, setLegalLoading] = useState(false);

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (!value.startsWith('+998')) {
            setPhone('+998');
            return;
        }
        // Only allow numbers after +
        if (!/^\+?\d*$/.test(value)) {
            return;
        }
        // Limit length to standard Uzbek number (+998 + 9 digits = 13 chars)
        if (value.length > 13) {
            return;
        }
        setPhone(value);
    };

    const openLegalModal = async (type: 'terms' | 'privacy') => {
        setLegalModal(type);
        setLegalLoading(true);
        try {
            const data = type === 'terms' ? await fetchTerms() : await fetchPrivacy();
            setLegalContent(data);
        } catch {
            setLegalContent(null);
        } finally {
            setLegalLoading(false);
        }
    };

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!accepted) {
            toast({
                title: "Xatolik",
                description: "Shartlar va maxfiylik siyosatini qabul qiling",
                variant: "destructive"
            });
            return;
        }
        if (phone.length !== 13) {
            toast({
                title: "Error",
                description: "Please enter a valid phone number (+998 XX XXX XX XX)",
                variant: "destructive"
            });
            return;
        }

        setIsLoading(true);
        try {
            await sendOtp(phone);
            setStep('otp');
            toast({
                title: "Success",
                description: "OTP code sent to your phone",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to send OTP. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otp) {
            toast({
                title: "Error",
                description: "Please enter the OTP code",
                variant: "destructive"
            });
            return;
        }

        setIsLoading(true);
        try {
            const data = await verifyOtp(phone, otp);

            // Should match backend response { access_token, role, data: { ... } }
            login(data.access_token, data.role, data.data);

            toast({
                title: "Success",
                description: "Successfully logged in!",
            });

            navigate(from, { replace: true });
        } catch (error) {
            toast({
                title: "Error",
                description: "Invalid OTP code. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-950">
            {/* Ambient Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute -top-[30%] -left-[10%] w-[70%] h-[70%] rounded-full bg-blue-600/20 blur-[120px]" />
                <div className="absolute top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-emerald-500/10 blur-[100px]" />
                <div className="absolute -bottom-[20%] left-[20%] w-[50%] h-[50%] rounded-full bg-purple-500/20 blur-[120px]" />
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-20"
                    style={{ backgroundImage: `url(${heroImage})` }}
                />
            </div>

            <div className="relative z-10 w-full max-w-md px-4">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">Stadion 24/7</h1>
                    <p className="text-slate-400">Futbol maydonlarini onlayn band qiling</p>
                </div>

                <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-2xl">
                    <CardHeader>
                        <CardTitle className="text-xl text-white">
                            {step === 'phone' ? 'Kirish' : 'SMS kodni kiriting'}
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                            {step === 'phone'
                                ? 'Davom etish uchun telefon raqamingizni kiriting'
                                : 'Kodni olish uchun quyidagilarni bajaring:'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {step === 'phone' ? (
                            <form onSubmit={handleSendOtp} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="text-slate-200">Telefon raqam</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                                        <Input
                                            id="phone"
                                            placeholder="+998 90 123 45 67"
                                            className="pl-9 bg-slate-950/50 border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-emerald-500"
                                            value={phone}
                                            onChange={handlePhoneChange}
                                            autoFocus
                                        />
                                    </div>
                                </div>
                                {/* Legal acceptance */}
                                <div className="flex items-start gap-2">
                                    <Checkbox
                                        id="legal"
                                        checked={accepted}
                                        onCheckedChange={(v) => setAccepted(v === true)}
                                        className="mt-0.5 border-slate-600 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                                    />
                                    <label htmlFor="legal" className="text-xs text-slate-400 leading-relaxed">
                                        <button type="button" onClick={() => openLegalModal('terms')} className="text-emerald-400 hover:text-emerald-300 underline">
                                            Foydalanish shartlari
                                        </button>
                                        {' '}va{' '}
                                        <button type="button" onClick={() => openLegalModal('privacy')} className="text-emerald-400 hover:text-emerald-300 underline">
                                            Maxfiylik siyosati
                                        </button>
                                        ni o'qib chiqdim va qabul qilaman
                                    </label>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                                    disabled={isLoading || !accepted}
                                >
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Davom etish
                                    {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                                </Button>
                            </form>
                        ) : (
                            <form onSubmit={handleVerifyOtp} className="space-y-6">
                                {/* Step-by-step instructions */}
                                <ol className="space-y-2 text-sm text-slate-300">
                                    <li>1. <span className="text-emerald-400 font-medium">@stadion24uz_bot</span> botiga o'ting va "Start" bosing</li>
                                    <li>2. Telefon raqamingizni yuboring</li>
                                    <li>3. Botdan kelgan kodni kiriting</li>
                                </ol>

                                {/* OTP Input boxes */}
                                <div className="flex justify-center gap-3">
                                    {[0, 1, 2, 3].map((index) => (
                                        <input
                                            key={index}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            className="w-14 h-14 text-center text-xl font-bold rounded-xl bg-slate-950/50 border-2 border-slate-700 text-white focus:border-emerald-500 focus:outline-none transition-colors"
                                            value={otp[index] || ''}
                                            autoFocus={index === 0}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, '');
                                                const newOtp = otp.split('');
                                                newOtp[index] = val;
                                                setOtp(newOtp.join(''));
                                                if (val && index < 3) {
                                                    const next = e.target.nextElementSibling as HTMLInputElement;
                                                    next?.focus();
                                                }
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Backspace' && !otp[index] && index > 0) {
                                                    const prev = (e.target as HTMLElement).previousElementSibling as HTMLInputElement;
                                                    prev?.focus();
                                                }
                                            }}
                                        />
                                    ))}
                                </div>

                                {/* Telegram bot button */}
                                <a
                                    href="https://t.me/stadion24uz_bot"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#29B6F6] hover:bg-[#03A9F4] text-white font-semibold transition-colors"
                                >
                                    <Send className="w-5 h-5" />
                                    Botni ochish
                                </a>

                                <Button
                                    type="submit"
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                                    disabled={isLoading}
                                >
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Tasdiqlash
                                </Button>
                                <Button
                                    type="button"
                                    variant="link"
                                    className="w-full text-slate-400 hover:text-white"
                                    onClick={() => setStep('phone')}
                                >
                                    Raqamni o'zgartirish
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Legal Document Modal */}
            <Dialog open={legalModal !== null} onOpenChange={() => setLegalModal(null)}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-slate-900 border-slate-700 text-white">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-white">
                            {legalModal === 'terms' ? <FileText className="w-5 h-5 text-emerald-400" /> : <Shield className="w-5 h-5 text-emerald-400" />}
                            {legalLoading ? 'Yuklanmoqda...' : (
                                language === 'uz'
                                    ? legalContent?.title_uz
                                    : legalContent?.title_ru
                            )}
                        </DialogTitle>
                    </DialogHeader>
                    {legalLoading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                        </div>
                    ) : legalContent ? (
                        <div className="prose prose-invert prose-sm max-w-none text-slate-300 whitespace-pre-wrap">
                            {language === 'uz' ? legalContent.content_uz : legalContent.content_ru}
                        </div>
                    ) : (
                        <p className="text-slate-400 text-center py-10">Yuklab bo'lmadi. Keyinroq qaytadan urinib ko'ring.</p>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Auth;
