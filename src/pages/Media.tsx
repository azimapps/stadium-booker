import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MediaSection from '@/components/MediaSection';

const MediaPage = () => {
    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-grow pt-24">
                <MediaSection />
            </main>
            <Footer />
        </div>
    );
};

export default MediaPage;
