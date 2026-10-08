import type { Metadata } from 'next';
import './globals.css';
import { SiteShell } from '@/components/qe/shell';
import { loaderBootScript } from '@/components/qe/loader-boot';
export const metadata: Metadata = {
  title: { default: 'QE Conclave 2026 — Quality, Unbound', template: '%s · QE Conclave 2026' },
  description: 'Engineering confidence across code, AI and autonomous systems. 11 December 2026. HICC, Hyderabad. Join India’s quality engineering community.',
  icons: { icon: '/favicon.svg', apple: '/apple-touch-icon.png' },
};
export default function RootLayout({children}: {children: React.ReactNode}) {
  return <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html: loaderBootScript}}/></head><body><SiteShell>{children}</SiteShell></body></html>;
}
