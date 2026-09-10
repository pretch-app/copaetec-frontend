import { Analytics } from "@vercel/analytics/next"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono, Oswald } from "next/font/google"
import { Suspense } from "react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { ChatWidget } from "@/components/chatbot/chat-widget"
import { Toaster } from "sonner"
import "./globals.css"

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans", display: "swap" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" })
const oswald = Oswald({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-oswald", display: "swap" })

export const metadata: Metadata = {
  title: {
    default: "Copa ETec 2026 | Torneo de Fútbol 6",
    template: "%s | Copa ETec 2026"
  },
  description:
    "Sitio oficial del torneo intercolegial de fútbol 6: fixture, resultados en vivo, tabla de posiciones, goleadores, estadísticas, planteles y galería.",
  keywords: ["fútbol", "torneo", "colegio", "etec", "fútbol 6", "deportes"],
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "https://copaetec.vercel.app",
    title: "Copa ETec 2026",
    description: "Sitio oficial del torneo intercolegial de fútbol 6",
    siteName: "Copa ETec 2026"
  },
  generator: "v0.app",
}

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" }
  ],
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} ${oswald.variable} dark`} suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground min-h-dvh flex flex-col font-sans">
        {/* Prevent flash of wrong theme */}
        <script dangerouslySetInnerHTML={{
          __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='light'){document.documentElement.classList.remove('dark');document.documentElement.classList.add('light');}else{document.documentElement.classList.remove('light');document.documentElement.classList.add('dark');}}catch(e){}})()`
        }} />
        <SiteHeader />
        
        {/* Scroll Progress Bar */}
        <div className="fixed top-0 left-0 w-full h-1 z-[60] opacity-50 pointer-events-none hidden sm:block">
          <div 
            className="h-full bg-gradient-to-r from-primary via-accent to-primary origin-left animate-pulse" 
            style={{ width: '0%', transition: 'width 0.1s' }} 
            id="scroll-progress"
            suppressHydrationWarning
          />
        </div>
        
        <script dangerouslySetInnerHTML={{
          __html: `
            window.addEventListener('scroll', () => {
              const el = document.getElementById('scroll-progress');
              if (!el) return;
              const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
              const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
              const scrolled = (winScroll / height) * 100;
              el.style.width = scrolled + '%';
            });
          `
        }} />

        <main className="flex-1 w-full overflow-hidden">{children}</main>
        <SiteFooter />
        
        {process.env.NODE_ENV === "production" && (
          <Suspense fallback={null}>
            <Analytics />
          </Suspense>
        )}
        <ChatWidget />
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  )
}
