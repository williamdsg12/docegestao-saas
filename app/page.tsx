import dynamic from "next/dynamic"
import { LandingHeader } from "@/components/landing/header"
import { HeroSection } from "@/components/landing/hero-section"

// Componentes abaixo da dobra carregados dinamicamente para otimizar performance e evitar travamentos na compilação
const StatsSection = dynamic(() => import("@/components/landing/stats-section").then(mod => mod.StatsSection), { ssr: true })
const ProblemsSection = dynamic(() => import("@/components/landing/problems-section").then(mod => mod.ProblemsSection), { ssr: true })
const SolutionSection = dynamic(() => import("@/components/landing/solution-section").then(mod => mod.SolutionSection), { ssr: true })
const InteractiveFeatures = dynamic(() => import("@/components/landing/interactive-features").then(mod => mod.InteractiveFeatures), { ssr: true })
const DashboardPreview = dynamic(() => import("@/components/landing/dashboard-preview").then(mod => mod.DashboardPreview), { ssr: true })
const DemoVideo = dynamic(() => import("@/components/landing/demo-video").then(mod => mod.DemoVideo), { ssr: true })
const TestimonialsSection = dynamic(() => import("@/components/landing/testimonials-section").then(mod => mod.TestimonialsSection), { ssr: true })
const ComparisonSection = dynamic(() => import("@/components/landing/comparison-section").then(mod => mod.ComparisonSection), { ssr: true })
const PricingSection = dynamic(() => import("@/components/landing/pricing-section").then(mod => mod.PricingSection), { ssr: true })
const FaqSection = dynamic(() => import("@/components/landing/faq-section").then(mod => mod.FaqSection), { ssr: true })
const CtaSection = dynamic(() => import("@/components/landing/cta-section").then(mod => mod.CtaSection), { ssr: true })
const LandingFooter = dynamic(() => import("@/components/landing/footer").then(mod => mod.LandingFooter), { ssr: true })

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
