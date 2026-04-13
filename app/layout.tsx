import type { Metadata, Viewport } from 'next'
import { Inter, DM_Sans, DM_Serif_Display } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import Script from 'next/script'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans' })
const dmSerif = DM_Serif_Display({ weight: '400', subsets: ['latin'], variable: '--font-dm-serif' })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://docegestao.com.br'),
  title: 'DoceGestão - Gestão Inteligente para Confeiteiras',
  description: 'O sistema de gestão criado especialmente para confeiteiras que trabalham com encomendas. Controle sua produção, insumos e pagamentos em um só lugar.',
  generator: 'DoceGestão App',
  keywords: ['confeitaria', 'gestão', 'encomendas', 'produção', 'insumos', 'pagamentos'],
  authors: [{ name: 'DoceGestão App' }],
  robots: 'index, follow',
  icons: {
    icon: [
      { url: '/favicon.svg' },
    ],
    apple: [
      { url: '/favicon.svg', sizes: '300x300', type: 'image/svg+xml' },
    ],
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    url: 'https://docegestao.com.br',
    title: 'DoceGestão - Gestão Inteligente para Confeiteiras',
    description: 'Seu ateliê mais profissional com a ajuda do DoceGestão. Controle sua produção, insumos e pagamentos em um só lugar.',
    siteName: 'DoceGestão App',
    locale: 'pt_BR',
    images: [{
      url: '/logo_cupcake.png',
      width: 1200,
      height: 400,
      alt: 'DoceGestão - Sistema de Gestão para Confeiteiras',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DoceGestão - Gestão Inteligente para Confeiteiras',
    description: 'Seu ateliê mais profissional com a ajuda do DoceGestão. Controle sua produção, insumos e pagamentos em um só lugar.',
    images: ['/logo_cupcake.png'],
    creator: '@docegestao_app',
  },
}

import { PageTransition } from '@/components/ui/page-transition'

// ... existing font imports

export const viewport: Viewport = {
  themeColor: '#FF2F81',
  width: 'device-width',
  initialScale: 1,
}

import { Providers } from "@/components/providers"
import { AffiliateTracker } from "@/components/dashboard/AffiliateTracker"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Google Tag Manager - Solo en producción para evitar avisos de Hotjar (HTTPS) en local */}
        {process.env.NODE_ENV === 'production' && (
          <>
            <Script id="google-tag-manager" strategy="afterInteractive">
              {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-T73FGD9M');`}
            </Script>

            {/* Meta Pixel Code */}
            <Script id="fb-pixel" strategy="afterInteractive">
              {`!function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '1940798166669273');
              fbq('track', 'PageView');`}
            </Script>
          </>
        )}
      </head>
      <body className={`${inter.variable} ${dmSans.variable} ${dmSerif.variable} font-sans antialiased`} suppressHydrationWarning>
        {/* Noscript fallbacks - Solo en producción */}
        {process.env.NODE_ENV === 'production' && (
          <noscript dangerouslySetInnerHTML={{ __html: `
            <iframe src="https://www.googletagmanager.com/ns.html?id=GTM-T73FGD9M" height="0" width="0" style="display:none;visibility:hidden"></iframe>
            <img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=1940798166669273&ev=PageView&noscript=1" />
          `}} />
        )}

        <Providers>
          <AffiliateTracker />
          <PageTransition>
            {children}
          </PageTransition>
        </Providers>
        <Analytics />
        
        {/* Mercado Pago SDK v2 */}
        <Script src="https://sdk.mercadopago.com/js/v2" strategy="beforeInteractive" />
        
        {/* Registro do Service Worker para PWA */}
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(function(registration) {
                  console.log('ServiceWorker registration successful with scope: ', registration.scope);
                }, function(err) {
                  console.log('ServiceWorker registration failed: ', err);
                });
              });
            }
          `}
        </Script>
      </body>
    </html>
  )
}

