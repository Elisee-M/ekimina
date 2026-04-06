import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { CTASection } from "@/components/landing/CTASection";
import { usePageSeo } from "@/hooks/usePageSeo";

const Index = () => {
  usePageSeo({
    title: "eKimina – Community Savings & Lending Platform for Rwanda",
    description: "The modern platform for Rwandan Ikimina savings groups. Track contributions, manage loans, and build community wealth with transparency and trust.",
    canonicalPath: "/",
    ogType: "website",
  });

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <PricingSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
