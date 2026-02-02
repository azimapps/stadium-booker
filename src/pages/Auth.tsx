import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { sendOtp, verifyOtp } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowRight, Loader2, Phone, ShieldCheck } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const Auth = () => {
    const { t } = useLanguage();
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

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
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
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522770179533-24471fcdba45?q=80&w=2560&auto=format&fit=crop')] bg-cover bg-center opacity-10" />
            </div>

            <div className="relative z-10 w-full max-w-md px-4">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">Stadion 24/7</h1>
                    <p className="text-slate-400">Futbol maydonlarini onlayn band qiling</p>
                </div>

                <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-2xl">
                    <CardHeader>
                        <CardTitle className="text-xl text-white">
                            {step === 'phone' ? 'Kirish' : 'Kodni kiriting'}
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                            {step === 'phone'
                                ? 'Davom etish uchun telefon raqamingizni kiriting'
                                : `${phone} raqamiga yuborilgan kodni kiriting`}
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
                                <Button
                                    type="submit"
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                                    disabled={isLoading}
                                >
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Davom etish
                                    {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                                </Button>
                            </form>
                        ) : (
                            <form onSubmit={handleVerifyOtp} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="otp" className="text-slate-200">SMS Kod</Label>
                                    <div className="relative">
                                        <ShieldCheck className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                                        <Input
                                            id="otp"
                                            placeholder="123456"
                                            className="pl-9 bg-slate-950/50 border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-emerald-500 tracking-widest"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                            autoFocus
                                            maxLength={6}
                                        />
                                    </div>
                                </div>
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
        </div>
    );
};

export default Auth;
