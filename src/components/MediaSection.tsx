import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { fetchMedia, Media } from '@/services/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Play, AlertCircle } from 'lucide-react';

const MediaSection = () => {
    const { language, t } = useLanguage();
    const { token } = useAuth();

    const { data: mediaItems, isLoading, error } = useQuery<Media[]>({
        queryKey: ['media'],
        queryFn: () => fetchMedia(token || ''),
        enabled: !!token,
    });

    const getYoutubeEmbedUrl = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        const videoId = (match && match[2].length === 11) ? match[2] : null;
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    };

    if (!isLoading && (!mediaItems || mediaItems.length === 0)) {
        return null;
    }

    return (
        <section id="media" className="pt-10 pb-20 bg-background">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3 flex items-center justify-center gap-3">
                        <Play className="w-8 h-8 text-primary fill-primary" />
                        {t('nav.media')}
                    </h2>
                    <p className="text-muted-foreground text-lg">
                        {language === 'uz' ? 'Eng so\'nggi video lavhalar' : 'Последние видео ролики'}
                    </p>
                </div>

                {isLoading ? (
                    <div className="grid md:grid-cols-2 gap-8">
                        {[1, 2].map((i) => (
                            <div key={i} className="space-y-4">
                                <Skeleton className="aspect-video w-full rounded-2xl" />
                                <Skeleton className="h-6 w-3/4" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="text-center py-10">
                        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4 opacity-50" />
                        <p className="text-destructive">Error loading media content.</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-8">
                        {mediaItems?.map((item) => {
                            const embedUrl = getYoutubeEmbedUrl(item.youtube_video_link);
                            return (
                                <div key={item.id} className="group bg-muted/30 rounded-3xl border border-border/50 overflow-hidden hover:border-primary/30 transition-all duration-300">
                                    <div className="aspect-video w-full relative">
                                        {embedUrl ? (
                                            <iframe
                                                src={embedUrl}
                                                className="w-full h-full"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                                title={language === 'uz' ? item.title_uz : item.title_ru}
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
                                                Invalid YouTube Link
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-6">
                                        <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                                            {language === 'uz' ? item.title_uz : item.title_ru}
                                        </h3>
                                        <p className="text-muted-foreground line-clamp-2">
                                            {language === 'uz' ? item.content_uz : item.content_ru}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
};

export default MediaSection;
