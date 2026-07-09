import LandingNav from '../components/landing/LandingNav';
import HeroSection from '../components/landing/HeroSection';
import StatsSection from '../components/landing/StatsSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import HowItWorks from '../components/landing/HowItWorks';
import SocialProof from '../components/landing/SocialProof';
import PricingSection from '../components/landing/PricingSection';
import CTASection from '../components/landing/CTASection';
import LandingFooter from '../components/landing/LandingFooter';
import ParticleBackground from '../components/animations/ParticleBackground';

export default function LandingPage() {
  return (
    <div className="min-h-screen landing-body font-sans relative overflow-x-hidden">
      <ParticleBackground />
      <LandingNav />
      
      <main>
        <HeroSection />
        <StatsSection />
        <FeaturesSection />
        <HowItWorks />
        <SocialProof />
        <PricingSection />
        <CTASection />
      </main>
      
      <LandingFooter />
    </div>
  );
}
