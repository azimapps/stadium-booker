import { LanguageProvider } from '@/contexts/LanguageContext';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import StadiumsSection from '@/components/StadiumsSection';
import TournamentsSection from '@/components/TournamentsSection';
import FeaturesSection from '@/components/FeaturesSection';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { isAuthenticated } = useAuth();
  return (
    <div className="min-h-screen">
      <Header />
      {!isAuthenticated && <Hero />}
      {isAuthenticated && <TournamentsSection />}
      <StadiumsSection />
      {!isAuthenticated && <FeaturesSection />}
      <Footer />
    </div>
  );
};

export default Index;
