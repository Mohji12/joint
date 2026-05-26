import { lazy, Suspense } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";

// Lazy load below-the-fold components for better initial load performance
const UseCasesSection = lazy(() => import("@/components/UseCasesSection"));
const StorytellingSection = lazy(() => import("@/components/StorytellingSection"));
const CTASection = lazy(() => import("@/components/CTASection"));
const Footer = lazy(() => import("@/components/Footer"));

// Loading fallback for lazy components
const SectionLoader = () => (
  <div className="min-h-[400px] flex items-center justify-center">
    <div className="animate-pulse text-muted-foreground">Loading...</div>
  </div>
);

const Index = () => {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <Navbar variant="hero" />
      <HeroSection />
      <Suspense fallback={<SectionLoader />}>
        <UseCasesSection />
      </Suspense>
      <Suspense fallback={<SectionLoader />}>
        <StorytellingSection />
      </Suspense>
      <Suspense fallback={<SectionLoader />}>
        <CTASection />
      </Suspense>
      <Suspense fallback={<SectionLoader />}>
        <Footer />
      </Suspense>
    </div>
  );
};

export default Index;
