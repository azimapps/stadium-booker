import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
    fetchTournamentById, registerForTournament, fetchMyClubStatus,
    fetchClubs, createClub, joinClub, leaveClub, fetchClubDetail,
    createPaymeOrder, createClickOrder, fetchMyRegistrations,
    Club, ClubStatus, ClubsResponse,
} from '@/services/api';
import {
    ChevronLeft, MapPin, Calendar, Clock, Users, Trophy,
    CircleDollarSign, AlertCircle, Loader2, Shield, LogOut, Plus, Lock,
} from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';

const TournamentDetail = () => {
    const { id } = useParams<{ id: string }>();
    const tournamentId = parseInt(id!);
    const { language, t } = useLanguage();
    const { isAuthenticated, token } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [paymentOpen, setPaymentOpen] = useState(false);
    const [paymentLoading, setPaymentLoading] = useState<'payme' | 'click' | null>(null);
    const [createClubOpen, setCreateClubOpen] = useState(false);
    const [joinClubOpen, setJoinClubOpen] = useState<Club | null>(null);
    const [clubName, setClubName] = useState('');
    const [clubPassword, setClubPassword] = useState('');
    const [joinPassword, setJoinPassword] = useState('');
    const [clubDetailOpen, setClubDetailOpen] = useState<number | null>(null);

    // Fetch tournament
    const { data: tournament, isLoading, error } = useQuery({
        queryKey: ['tournament', tournamentId],
        queryFn: () => fetchTournamentById(token || '', tournamentId),
        enabled: !!id,
    });

    // Fetch my club status
    const { data: myStatus } = useQuery({
        queryKey: ['club-status', tournamentId],
        queryFn: () => fetchMyClubStatus(token!, tournamentId),
        enabled: !!token && !!id,
    });

    // Fetch clubs
    const { data: clubsData } = useQuery<ClubsResponse>({
        queryKey: ['clubs', tournamentId],
        queryFn: () => fetchClubs(token!, tournamentId),
        enabled: !!token && !!id && myStatus?.paid === true,
    });

    // Fetch club detail
    const { data: clubDetail } = useQuery({
        queryKey: ['club-detail', clubDetailOpen],
        queryFn: () => fetchClubDetail(token!, clubDetailOpen!),
        enabled: !!token && !!clubDetailOpen,
    });

    const [registerLoading, setRegisterLoading] = useState(false);

    // Register and immediately open payment
    const handleRegister = async () => {
        if (!token) return;
        setRegisterLoading(true);
        try {
            await registerForTournament(token, tournamentId);
            queryClient.invalidateQueries({ queryKey: ['club-status', tournamentId] });
            queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] });
            setPaymentOpen(true);
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setRegisterLoading(false);
        }
    };

    // Create club mutation
    const createClubMutation = useMutation({
        mutationFn: () => createClub(token!, { name: clubName, password: clubPassword, tournament_id: tournamentId }),
        onSuccess: () => {
            toast.success('Klub yaratildi!');
            setCreateClubOpen(false);
            setClubName('');
            setClubPassword('');
            queryClient.invalidateQueries({ queryKey: ['clubs', tournamentId] });
            queryClient.invalidateQueries({ queryKey: ['club-status', tournamentId] });
        },
        onError: (err: Error) => toast.error(err.message),
    });

    // Join club mutation
    const joinClubMutation = useMutation({
        mutationFn: () => joinClub(token!, joinClubOpen!.id, joinPassword),
        onSuccess: () => {
            toast.success('Klubga qo\'shildingiz!');
            setJoinClubOpen(null);
            setJoinPassword('');
            queryClient.invalidateQueries({ queryKey: ['clubs', tournamentId] });
            queryClient.invalidateQueries({ queryKey: ['club-status', tournamentId] });
        },
        onError: (err: Error) => toast.error(err.message),
    });

    // Leave club mutation
    const leaveClubMutation = useMutation({
        mutationFn: (clubId: number) => leaveClub(token!, clubId),
        onSuccess: () => {
            toast.success('Klubdan chiqdingiz');
            queryClient.invalidateQueries({ queryKey: ['clubs', tournamentId] });
            queryClient.invalidateQueries({ queryKey: ['club-status', tournamentId] });
        },
        onError: (err: Error) => toast.error(err.message),
    });

    // Payment
    const handlePayment = async (method: 'payme' | 'click') => {
        if (!token || !myStatus) return;
        setPaymentLoading(method);
        try {
            const regs = await fetchMyRegistrations(token, 'in_progress');
            const myReg = regs.find((r) => r.tournament_id === tournamentId && r.status === 'in_progress');
            if (!myReg) {
                toast.error("Ro'yxatdan topilmadi");
                setPaymentLoading(null);
                return;
            }

            const orderData = { tournament_registration_id: myReg.id };
            if (method === 'payme') {
                const order = await createPaymeOrder(token, orderData);
                if (!order.checkout_url) {
                    toast.error("To'lov havolasi topilmadi");
                    setPaymentLoading(null);
                    return;
                }
                window.location.href = order.checkout_url;
            } else {
                const order = await createClickOrder(token, orderData);
                if (!order.payment_url) {
                    toast.error("To'lov havolasi topilmadi");
                    setPaymentLoading(null);
                    return;
                }
                window.location.href = order.payment_url;
            }
        } catch (err: any) {
            toast.error(err.message || "To'lov xatosi");
            setPaymentLoading(null);
        }
    };

    const regStatus = tournament?.registration_status || myStatus?.status;

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col bg-background">
                <Header />
                <main className="flex-grow pt-16 lg:pt-24 container mx-auto px-4 max-w-3xl">
                    <Skeleton className="h-64 rounded-2xl w-full mb-6" />
                    <Skeleton className="h-8 w-3/4 mb-4" />
                    <Skeleton className="h-6 w-1/2 mb-4" />
                    <Skeleton className="h-40 w-full" />
                </main>
                <Footer />
            </div>
        );
    }

    if (error || !tournament) {
        return (
            <div className="min-h-screen flex flex-col bg-background">
                <Header />
                <main className="flex-grow pt-16 lg:pt-24 flex items-center justify-center">
                    <div className="text-center px-4">
                        <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
                        <h1 className="text-2xl font-bold mb-2">Turnir topilmadi</h1>
                        <Button onClick={() => navigate('/')}>Bosh sahifaga</Button>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    const displayTitle = language === 'uz' ? tournament.title_uz : tournament.title_ru;
    const displayDesc = language === 'uz' ? tournament.description_uz : tournament.description_ru;
    const stadiumName = language === 'uz' ? tournament.stadium?.name_uz : tournament.stadium?.name_ru;
    const stadiumAddress = language === 'uz' ? tournament.stadium?.address_uz : tournament.stadium?.address_ru;
    const coverImage = tournament.cover_image || tournament.stadium?.main_image || '';

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Header />
            <main className="flex-grow pt-16 lg:pt-24 pb-16">
                <div className="container mx-auto px-4 max-w-3xl">
                    {/* Back */}
                    <Button variant="ghost" className="mb-4 gap-2 -ml-4" onClick={() => navigate(-1)}>
                        <ChevronLeft className="w-4 h-4" /> {t('nav.back')}
                    </Button>

                    {/* Cover Image */}
                    {coverImage && (
                        <div className="relative rounded-2xl overflow-hidden mb-6 aspect-video">
                            <img src={coverImage} alt={displayTitle} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                            <div className="absolute bottom-4 left-4">
                                <Badge className="bg-primary/90 text-primary-foreground mb-2">
                                    <Trophy className="w-3.5 h-3.5 mr-1" /> Turnir
                                </Badge>
                                <h1 className="text-3xl font-bold text-white">{displayTitle}</h1>
                            </div>
                        </div>
                    )}

                    {!coverImage && <h1 className="text-3xl font-bold mb-4">{displayTitle}</h1>}

                    {/* Info Cards */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="bg-card border border-border/50 rounded-2xl p-4 space-y-1">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Calendar className="w-4 h-4 text-primary" />
                                Boshlanish
                            </div>
                            <p className="font-bold text-sm">{format(new Date(tournament.start_time), 'dd.MM.yyyy HH:mm')}</p>
                        </div>
                        <div className="bg-card border border-border/50 rounded-2xl p-4 space-y-1">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <CircleDollarSign className="w-4 h-4 text-primary" />
                                Ishtirok to'lovi
                            </div>
                            <p className="font-bold text-sm text-primary">
                                {tournament.entrance_fee > 0 ? `${tournament.entrance_fee.toLocaleString()} so'm` : 'Bepul'}
                            </p>
                        </div>
                        <div className="bg-card border border-border/50 rounded-2xl p-4 space-y-1">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Users className="w-4 h-4 text-primary" />
                                Jamoa hajmi
                            </div>
                            <p className="font-bold text-sm">{tournament.min_players_per_team}–{tournament.max_players_per_team} kishi</p>
                        </div>
                        <div className="bg-card border border-border/50 rounded-2xl p-4 space-y-1">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <MapPin className="w-4 h-4 text-primary" />
                                Stadion
                            </div>
                            <p className="font-bold text-sm truncate">{stadiumName}</p>
                        </div>
                    </div>

                    {/* Description */}
                    {displayDesc && (
                        <div className="mb-6">
                            <h2 className="text-lg font-semibold mb-2">Turnir haqida</h2>
                            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{displayDesc}</p>
                        </div>
                    )}

                    {/* Address */}
                    {stadiumAddress && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
                            <MapPin className="w-4 h-4 text-primary" />
                            <span>{stadiumAddress}</span>
                        </div>
                    )}

                    {/* Registration Section */}
                    <div className="bg-card border border-border/50 rounded-2xl p-6 space-y-4 mb-6">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-primary" />
                            Ro'yxatdan o'tish
                        </h2>

                        {!isAuthenticated ? (
                            <div className="text-center py-4">
                                <p className="text-sm text-muted-foreground mb-3">Ro'yxatdan o'tish uchun tizimga kiring</p>
                                <Button onClick={() => navigate('/auth')}>Kirish</Button>
                            </div>
                        ) : !regStatus || regStatus === 'in_progress' ? (
                            // Not registered or registered but not paid — same UX
                            <div className="space-y-3">
                                <p className="text-sm text-muted-foreground">
                                    Turnirda ishtirok etish uchun to'lov qiling.
                                    {tournament.entrance_fee > 0 && ` Ishtirok to'lovi: ${tournament.entrance_fee.toLocaleString()} so'm`}
                                </p>
                                <Button
                                    className="w-full h-12 text-lg rounded-xl"
                                    onClick={() => regStatus === 'in_progress' ? setPaymentOpen(true) : handleRegister()}
                                    disabled={registerLoading}
                                >
                                    {registerLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Ro'yxatdan o'tish — {tournament.entrance_fee.toLocaleString()} so'm
                                </Button>
                            </div>
                        ) : regStatus === 'paid' ? (
                            // Paid
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Badge className="bg-green-600">To'langan</Badge>
                                    {myStatus?.type === 'club' && myStatus.club_name && (
                                        <Badge variant="outline" className="border-primary/30 text-primary">
                                            <Shield className="w-3 h-3 mr-1" /> {myStatus.club_name}
                                        </Badge>
                                    )}
                                    {myStatus?.type === 'solo' && (
                                        <Badge variant="outline" className="border-muted-foreground/30">Yakka</Badge>
                                    )}
                                </div>
                                <p className="text-sm text-green-500">Siz turnirga muvaffaqiyatli ro'yxatdan o'tdingiz!</p>
                            </div>
                        ) : regStatus === 'cancelled' ? (
                            <div className="flex items-center gap-2">
                                <Badge variant="destructive">Bekor qilingan</Badge>
                            </div>
                        ) : null}
                    </div>

                    {/* Clubs Section — only for paid users */}
                    {myStatus?.paid && (
                        <div className="bg-card border border-border/50 rounded-2xl p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-primary" />
                                    Klublar
                                </h2>
                                {!myStatus.club_id && (
                                    <Button size="sm" onClick={() => setCreateClubOpen(true)} className="gap-1">
                                        <Plus className="w-4 h-4" /> Klub yaratish
                                    </Button>
                                )}
                            </div>

                            {/* My club info */}
                            {myStatus.club_id && myStatus.club_name && (
                                <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Sizning klubingiz</p>
                                            <p className="font-bold text-lg">{myStatus.club_name}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setClubDetailOpen(myStatus.club_id)}
                                                className="border-primary/30"
                                            >
                                                <Users className="w-4 h-4 mr-1" /> A'zolar
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => leaveClubMutation.mutate(myStatus.club_id!)}
                                                disabled={leaveClubMutation.isPending}
                                                className="border-red-500/30 text-red-500 hover:bg-red-500/10"
                                            >
                                                <LogOut className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Clubs list */}
                            {clubsData && clubsData.clubs.length > 0 ? (
                                <div className="space-y-2">
                                    {clubsData.clubs.map((club) => (
                                        <div key={club.id} className="flex items-center justify-between bg-muted/20 border border-border/30 rounded-xl p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                                                    {club.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-semibold">{club.name}</p>
                                                    <p className="text-xs text-muted-foreground">{club.member_count} a'zo</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setClubDetailOpen(club.id)}
                                                >
                                                    <Users className="w-4 h-4" />
                                                </Button>
                                                {!myStatus.club_id && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-primary/30"
                                                        onClick={() => { setJoinClubOpen(club); setJoinPassword(''); }}
                                                    >
                                                        Qo'shilish
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    Hozircha klublar yo'q. Birinchi bo'lib yarating!
                                </p>
                            )}

                            {/* Solo players */}
                            {clubsData && clubsData.solo_players.length > 0 && (
                                <div className="pt-2">
                                    <p className="text-xs text-muted-foreground uppercase font-semibold mb-2">Yakka o'yinchilar</p>
                                    <div className="flex flex-wrap gap-2">
                                        {clubsData.solo_players.map((player) => (
                                            <div key={player.user_id} className="bg-muted/30 rounded-lg px-3 py-1.5 text-xs">
                                                {player.user_fullname || player.user_phone}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
            <Footer />

            {/* Payment Dialog */}
            <Dialog open={paymentOpen} onOpenChange={(open) => { if (!open) { setPaymentOpen(false); setPaymentLoading(null); } }}>
                <DialogContent className="sm:max-w-[420px] rounded-3xl p-0 overflow-hidden gap-0">
                    <DialogHeader className="px-6 pt-6 pb-3">
                        <DialogTitle className="text-xl font-bold text-center">To'lov usulini tanlang</DialogTitle>
                    </DialogHeader>

                    {/* Tournament info */}
                    <div className="px-6 pb-2">
                        {coverImage && (
                            <div className="relative rounded-xl overflow-hidden mb-3 aspect-[2.5/1]">
                                <img src={coverImage} alt={displayTitle} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                                <div className="absolute bottom-2 left-3">
                                    <p className="text-white font-bold text-sm">{displayTitle}</p>
                                </div>
                            </div>
                        )}
                        <div className="bg-muted/20 rounded-xl p-4 space-y-2 text-sm">
                            {!coverImage && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Turnir</span>
                                    <span className="font-medium">{displayTitle}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Stadion</span>
                                <span className="font-medium truncate ml-4">{stadiumName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Sana</span>
                                <span className="font-medium">{format(new Date(tournament.start_time), 'dd.MM.yyyy HH:mm')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Jamoa hajmi</span>
                                <span className="font-medium">{tournament.min_players_per_team}–{tournament.max_players_per_team} kishi</span>
                            </div>
                            <div className="flex justify-between border-t border-border/50 pt-2 mt-2">
                                <span className="text-muted-foreground font-semibold">Summa</span>
                                <span className="font-bold text-primary">{tournament.entrance_fee.toLocaleString()} so'm</span>
                            </div>
                        </div>
                    </div>

                    <div className="px-6 pb-6 pt-3 space-y-3">
                        <button
                            onClick={() => handlePayment('payme')}
                            disabled={paymentLoading !== null}
                            className="w-full flex items-center justify-center gap-3 h-14 rounded-xl bg-[#00CCCC] hover:bg-[#00BBBB] text-white font-bold text-lg transition-colors disabled:opacity-60"
                        >
                            {paymentLoading === 'payme' ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Payme'}
                        </button>
                        <button
                            onClick={() => handlePayment('click')}
                            disabled={paymentLoading !== null}
                            className="w-full flex items-center justify-center gap-3 h-14 rounded-xl bg-[#0066FF] hover:bg-[#0055DD] text-white font-bold text-lg transition-colors disabled:opacity-60"
                        >
                            {paymentLoading === 'click' ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Click'}
                        </button>
                        <button
                            onClick={() => { setPaymentOpen(false); setPaymentLoading(null); }}
                            className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                        >
                            Bekor qilish
                        </button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Create Club Dialog */}
            <Dialog open={createClubOpen} onOpenChange={setCreateClubOpen}>
                <DialogContent className="sm:max-w-[400px] rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Yangi klub yaratish</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">Klub nomi</label>
                            <input
                                value={clubName}
                                onChange={(e) => setClubName(e.target.value)}
                                placeholder="FC Toshkent"
                                className="w-full h-11 px-4 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">Parol (boshqalar qo'shilish uchun)</label>
                            <input
                                value={clubPassword}
                                onChange={(e) => setClubPassword(e.target.value)}
                                placeholder="Parolni kiriting"
                                className="w-full h-11 px-4 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                        <Button
                            className="w-full h-12 text-lg rounded-xl"
                            onClick={() => createClubMutation.mutate()}
                            disabled={!clubName || !clubPassword || createClubMutation.isPending}
                        >
                            {createClubMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Yaratish
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Join Club Dialog */}
            <Dialog open={joinClubOpen !== null} onOpenChange={(open) => { if (!open) setJoinClubOpen(null); }}>
                <DialogContent className="sm:max-w-[400px] rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <Lock className="w-5 h-5" />
                            {joinClubOpen?.name}ga qo'shilish
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">Klub paroli</label>
                            <input
                                value={joinPassword}
                                onChange={(e) => setJoinPassword(e.target.value)}
                                placeholder="Parolni kiriting"
                                type="password"
                                className="w-full h-11 px-4 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                        <Button
                            className="w-full h-12 text-lg rounded-xl"
                            onClick={() => joinClubMutation.mutate()}
                            disabled={!joinPassword || joinClubMutation.isPending}
                        >
                            {joinClubMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Qo'shilish
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Club Detail Dialog */}
            <Dialog open={clubDetailOpen !== null} onOpenChange={(open) => { if (!open) setClubDetailOpen(null); }}>
                <DialogContent className="sm:max-w-[400px] rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <Shield className="w-5 h-5 text-primary" />
                            {clubDetail?.name}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 pt-2">
                        <p className="text-sm text-muted-foreground">{clubDetail?.member_count} a'zo</p>
                        {clubDetail?.members?.map((member) => (
                            <div key={member.id} className="flex items-center gap-3 bg-muted/20 rounded-xl p-3">
                                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                                    {member.user_fullname?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                                <div>
                                    <p className="font-medium text-sm">{member.user_fullname || 'Ism ko\'rsatilmagan'}</p>
                                    <p className="text-xs text-muted-foreground">{member.user_phone}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default TournamentDetail;
