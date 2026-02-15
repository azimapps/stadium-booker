import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getProfile, updateProfile, uploadAvatar, deleteAccount } from "@/services/api";
import { compressImage } from "@/lib/utils";
import getCroppedImg from "@/lib/cropImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Slider } from "@/components/ui/slider";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Upload, User, Trash2, Camera, ZoomIn, ZoomOut } from "lucide-react";
import Cropper from "react-easy-crop";

export default function Profile() {
    const { token, role, login, logout, isAuthenticated, loading: isAuthLoading } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [profileData, setProfileData] = useState<any>(null);
    const [formData, setFormData] = useState({
        fullname: "",
        name: "", // For manager
    });

    // Avatar states
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [compressedSize, setCompressedSize] = useState<string | null>(null);
    const [avatarTs, setAvatarTs] = useState(Date.now()); // Timestamp to bust cache

    // Cropper states
    const [isCropOpen, setIsCropOpen] = useState(false);
    const [tempImgUrl, setTempImgUrl] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

    useEffect(() => {
        if (isAuthLoading) return; // Wait until auth state is determined

        if (!isAuthenticated) {
            navigate("/auth");
            return;
        }

        const loadProfile = async () => {
            try {
                if (token && role) {
                    const data = await getProfile(token, role);
                    setProfileData(data);
                    setFormData({
                        fullname: data.fullname || "",
                        name: data.name || "",
                    });
                }
            } catch (err) {
                const error = err as Error;
                if (error.message === 'UNAUTHORIZED') {
                    // This is redundant if we check !isAuthenticated, but good for token expiration
                    logout();
                    navigate('/auth');
                    return;
                }
                toast({
                    title: t('common.error'),
                    description: t('profile.load_error'),
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };

        loadProfile();

        // Cleanup preview URL on unmount
        return () => {
            if (avatarPreview && !avatarPreview.startsWith("http")) URL.revokeObjectURL(avatarPreview);
        };
    }, [isAuthenticated, isAuthLoading, token, role, navigate, toast, t, avatarPreview, logout]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const url = URL.createObjectURL(file);
            setTempImgUrl(url);
            setZoom(1);
            setCrop({ x: 0, y: 0 });
            setIsCropOpen(true);
            // Reset input value to allow selecting same file again
            e.target.value = '';
        }
    };

    const onCropComplete = useCallback((croppedArea: Record<string, number>, croppedAreaPixels: Record<string, number>) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSaveCroppedImage = async () => {
        if (!tempImgUrl || !croppedAreaPixels || !token || !role) return;

        try {
            const croppedBlob = await getCroppedImg(tempImgUrl, croppedAreaPixels);
            if (!croppedBlob) throw new Error("Could not crop image");

            const file = new File([croppedBlob], "avatar.jpg", { type: "image/jpeg" });
            const compressedFile = await compressImage(file);

            // Immediate Upload
            setSaving(true);

            if (role === 'user') {
                await uploadAvatar(token, role, compressedFile);

                // Refresh profile to get new avatar URL
                const updatedProfile = await getProfile(token, role);
                setProfileData(updatedProfile);
                // Update context
                login(token, role, updatedProfile);

                // Set compressed size specific to this upload
                setCompressedSize((compressedFile.size / 1024).toFixed(1) + " KB");
                // Bust cache
                setAvatarTs(Date.now());

                toast({
                    title: t('common.success'),
                    description: t('profile.update_success'),
                });
            }

            setIsCropOpen(false);
            // Cleanup temp
            URL.revokeObjectURL(tempImgUrl);
            setTempImgUrl(null);
        } catch (err) {
            const error = err as Error;
            console.error(error);
            if (error.message === 'AVATAR_UPLOAD_UNAUTHORIZED') {
                toast({
                    title: t('common.error'),
                    description: "Avatar upload permission denied. Please try re-logging in.",
                    variant: "destructive",
                });
                return;
            }
            toast({
                title: t('common.error'),
                description: "Failed to upload image",
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    };

    const handleAutoSave = async () => {
        if (!token || !role) return;

        // Check if data actually changed
        const currentName = role === 'manager' ? formData.name : formData.fullname;
        const originalName = role === 'manager' ? profileData?.name : profileData?.fullname;

        if (currentName === originalName) return;

        setSaving(true);
        try {
            const updateData = role === 'manager'
                ? { name: formData.name }
                : { fullname: formData.fullname };

            const updatedProfile = await updateProfile(token, role, updateData);
            setProfileData(updatedProfile);
            login(token, role, updatedProfile);

            toast({
                title: t('common.success'),
                description: t('profile.update_success'),
            });
        } catch (err) {
            const error = err as Error;
            if (error.message === 'UNAUTHORIZED') {
                toast({
                    title: t('common.error'),
                    description: "Session expired.",
                    variant: "destructive",
                });
                return;
            }
            toast({
                title: t('common.error'),
                description: t('profile.update_error'),
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token || !role) return;

        setSaving(true);
        try {
            // 1. Upload Avatar if selected (User only usually)
            if (avatarFile && role === 'user') {
                await uploadAvatar(token, role, avatarFile);
            }
            const updateData = role === 'manager'
                ? { name: formData.name }
                : { fullname: formData.fullname };

            const updatedProfile = await updateProfile(token, role, updateData);
            setProfileData(updatedProfile);
            login(token, role, updatedProfile);

            toast({
                title: t('common.success'),
                description: t('profile.update_success'),
            });
        } catch (err) {
            const error = err as Error;
            if (error.message === 'UNAUTHORIZED') {
                toast({
                    title: t('common.error'),
                    description: "Session expired.",
                    variant: "destructive",
                });
                return;
            }
            toast({
                title: t('common.error'),
                description: t('profile.update_error'),
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    // Removed handleUpdateProfile as it is no longer used for manual submission

    const handleDeleteAccount = async () => {
        if (!token || !role) return;

        try {
            await deleteAccount(token, role);
            logout();
            navigate("/");
            toast({
                title: t('profile.account_deleted'),
                description: t('profile.account_deleted_desc'),
            });
        } catch (error) {
            toast({
                title: t('common.error'),
                description: t('profile.delete_error'),
                variant: "destructive",
            });
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10 px-4 max-w-3xl">
            <h1 className="text-3xl font-bold mb-8">{t('profile.title')}</h1>

            <div className="grid gap-8">
                {/* Profile Card */}
                <Card>
                    <CardHeader className="relative">
                        <CardTitle>{t('profile.personal_info')}</CardTitle>
                        <CardDescription>{t('profile.personal_info_desc')}</CardDescription>
                        {saving && (
                            <div className="absolute top-4 right-4">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            </div>
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">

                            <div className="flex flex-col md:flex-row gap-6 items-start">
                                {/* Avatar Section */}
                                <div className="flex flex-col items-center gap-4">
                                    <div className="relative">
                                        <Avatar className="h-24 w-24 border-2 border-border">
                                            <AvatarImage
                                                src={profileData?.avatar ? `${profileData.avatar}${profileData.avatar.includes('?') ? '&' : '?'}v=${avatarTs}` : undefined}
                                                alt={profileData?.fullname || profileData?.name}
                                                className="object-cover"
                                            />
                                            <AvatarFallback className="text-2xl">
                                                {(profileData?.fullname || profileData?.name || "U").charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>

                                        {role === 'user' && (
                                            <>
                                                <Label
                                                    htmlFor="avatar-upload"
                                                    className="absolute -bottom-1 -right-1 p-2 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90 transition-all shadow-md border-2 border-background"
                                                >
                                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                                                </Label>
                                                <Input
                                                    id="avatar-upload"
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleFileChange}
                                                    className="hidden"
                                                    disabled={saving}
                                                />
                                            </>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-center gap-2">
                                        <p className="text-[10px] text-muted-foreground text-center max-w-[150px]">
                                            {t('profile.avatar_help')}
                                        </p>
                                        {compressedSize && (
                                            <div className="bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-full border border-green-200 dark:border-green-800 animate-in fade-in zoom-in duration-300">
                                                <p className="text-xs text-green-600 dark:text-green-400 font-semibold flex items-center gap-1.5">
                                                    <span className="relative flex h-2 w-2">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                                    </span>
                                                    {t('profile.image_size')}: {compressedSize}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Fields Section */}
                                <div className="flex-1 space-y-4 w-full">
                                    <div className="grid gap-2">
                                        <Label htmlFor="phone">{t('profile.phone')}</Label>
                                        <Input
                                            id="phone"
                                            value={profileData?.phone || ""}
                                            disabled
                                            className="bg-muted"
                                        />
                                        <p className="text-xs text-muted-foreground">{t('profile.phone_tooltip')}</p>
                                    </div>

                                    {role === 'manager' ? (
                                        <div className="grid gap-2">
                                            <Label htmlFor="name">{t('profile.manager_name')}</Label>
                                            <Input
                                                id="name"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                onBlur={handleAutoSave}
                                                placeholder="Stadium Manager"
                                            />
                                        </div>
                                    ) : (
                                        <div className="grid gap-2">
                                            <Label htmlFor="fullname">{t('profile.full_name')}</Label>
                                            <Input
                                                id="fullname"
                                                name="fullname"
                                                value={formData.fullname}
                                                onChange={handleInputChange}
                                                onBlur={handleAutoSave}
                                                placeholder="John Doe"
                                            />
                                        </div>
                                    )}

                                    {role === 'manager' && profileData?.stadium_ids && (
                                        <div className="grid gap-2">
                                            <Label>{t('profile.managed_stadiums')}</Label>
                                            <div className="flex flex-wrap gap-2">
                                                {profileData.stadium_ids.map((id: number) => (
                                                    <div key={id} className="bg-secondary text-secondary-foreground px-3 py-1 rounded-md text-sm">
                                                        {t('profile.stadium_id')}: {id}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

            </div>

            {/* Crop Dialog */}
            <Dialog open={isCropOpen} onOpenChange={setIsCropOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{t('profile.crop_image') || "Crop Image"}</DialogTitle>
                        <DialogDescription>
                            {t('profile.crop_desc') || "Adjust the image to fit your profile."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="relative w-full h-[300px] bg-black rounded-md overflow-hidden">
                        {tempImgUrl && (
                            <Cropper
                                image={tempImgUrl}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                                cropShape="round"
                                showGrid={false}
                            />
                        )}
                    </div>

                    <div className="py-2 flex items-center gap-4">
                        <ZoomOut className="h-4 w-4 text-muted-foreground" />
                        <Slider
                            value={[zoom]}
                            min={1}
                            max={3}
                            step={0.1}
                            onValueChange={(value) => setZoom(value[0])}
                            className="flex-1"
                        />
                        <ZoomIn className="h-4 w-4 text-muted-foreground" />
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCropOpen(false)} disabled={saving}>
                            {t('common.cancel') || "Cancel"}
                        </Button>
                        <Button onClick={handleSaveCroppedImage} disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('profile.set_photo') || "Set Photo"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
