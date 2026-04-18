import { SmartGestaoLayout } from "@/components/dashboard/SmartGestaoLayout"

export default function GestaoMobileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <SmartGestaoLayout>{children}</SmartGestaoLayout>
}
