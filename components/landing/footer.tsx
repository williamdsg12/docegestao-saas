import { Instagram, Facebook, Mail, ShieldCheck, Lock } from "lucide-react"
import Link from "next/link"

export function LandingFooter() {
  return (
    <footer className="bg-background py-16 lg:py-24 border-t border-border relative overflow-hidden">
      {/* Subtle Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-primary/5 blur-[120px] rounded-t-full -z-10" />

      <div className="container mx-auto px-6 lg:px-8 max-w-7xl">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4 lg:items-start">
          <div className="space-y-6">
            <Link href="/" className="group flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-xl font-bold text-white shadow-lg relative overflow-hidden">
                <span className="relative z-10">D</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
                DoceGestão
              </span>
            </Link>
            <p className="text-base text-muted-foreground font-medium leading-relaxed max-w-xs">
              O sistema que transforma confeiteiras em empresárias lucrativas.
            </p>
            <div className="flex gap-4">
              <a href="#" className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white transition-all"><Instagram className="size-5" /></a>
              <a href="#" className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white transition-all"><Facebook className="size-5" /></a>
              <a href="#" className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white transition-all"><Mail className="size-5" /></a>
            </div>
          </div>

          <div>
            <h4 className="mb-6 text-xs font-bold uppercase tracking-wider text-foreground">Produto</h4>
            <ul className="flex flex-col gap-4 text-muted-foreground font-medium text-sm">
              <li><Link href="#funcionalidades" className="hover:text-primary transition-colors">Funcionalidades</Link></li>
              <li><Link href="#como-funciona" className="hover:text-primary transition-colors">Como funciona</Link></li>
              <li><Link href="#planos" className="hover:text-primary transition-colors">Planos</Link></li>
              <li><Link href="#depoimentos" className="hover:text-primary transition-colors">Depoimentos</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-6 text-xs font-bold uppercase tracking-wider text-foreground">Suporte</h4>
            <ul className="flex flex-col gap-4 text-muted-foreground font-medium text-sm">
              <li><Link href="#" className="hover:text-primary transition-colors">Central de Ajuda</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Termos de Uso</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Privacidade</Link></li>
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="mb-6 text-xs font-bold uppercase tracking-wider text-foreground">Segurança</h4>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground bg-muted/50 p-4 rounded-xl border border-border/50">
                <ShieldCheck className="size-5 text-green-500" />
                <span>SSL Criptografado 256-bit</span>
              </div>
              <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground bg-muted/50 p-4 rounded-xl border border-border/50">
                <Lock className="size-5 text-primary" />
                <span>Pagamento 100% Seguro</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-20 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm text-muted-foreground text-center md:text-left">
            &copy; {new Date().getFullYear()} DoceGestão Software. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            Desenvolvido com <span className="text-primary font-bold animate-pulse">♥</span> para confeiteiras.
          </div>
        </div>
      </div>
    </footer>
  )
}
