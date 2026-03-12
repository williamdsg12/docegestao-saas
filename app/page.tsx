import { LandingHeader } from "@/components/landing/header"
import { HeroSection } from "@/components/landing/hero-section"
import { ProblemsSection } from "@/components/landing/problems-section"
import { SolutionSection } from "@/components/landing/solution-section"
import { DashboardPreview } from "@/components/landing/dashboard-preview"
import { InteractiveFeatures } from "@/components/landing/interactive-features"
import { DemoVideo } from "@/components/landing/demo-video"
import { StatsSection } from "@/components/landing/stats-section"
import { TestimonialsSection } from "@/components/landing/testimonials-section"
import { ComparisonSection } from "@/components/landing/comparison-section"
import { PricingSection } from "@/components/landing/pricing-section"
import { FaqSection } from "@/components/landing/faq-section"
import { CtaSection } from "@/components/landing/cta-section"
import { LandingFooter } from "@/components/landing/footer"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <LandingHeader />
      <HeroSection />
      <StatsSection />
      <ProblemsSection />
      <SolutionSection />
      <InteractiveFeatures />
      <DashboardPreview />
      <DemoVideo />
      <TestimonialsSection />
      <ComparisonSection />
      <PricingSection />
      <FaqSection />
      <CtaSection />
      <LandingFooter />
    </main>
  )
}
