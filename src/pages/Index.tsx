import { LanguageProvider } from '@/contexts/LanguageContext';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import StadiumsSection from '@/components/StadiumsSection';
import FeaturesSection from '@/components/FeaturesSection';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <LanguageProvider>
      <div className="min-h-screen">
        <Header />
        <Hero />
        <StadiumsSection />
        <FeaturesSection />
        <Footer />
      </div>
    </LanguageProvider>
  );
};

export default Index;
