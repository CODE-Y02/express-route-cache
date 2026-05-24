import { RootProvider } from 'fumadocs-ui/provider/next';
import './global.css';
import { Inter, Geist } from 'next/font/google';
import { cn } from "@/lib/utils";
import type { Metadata } from 'next';
import CustomSearchDialog from '@/components/SearchDialog';

export const metadata: Metadata = {
  title: {
    template: '%s | @express-route-cache',
    default: '@express-route-cache | O(1) Route Caching for Express.js',
  },
  description: 'Production-grade Express.js route caching with O(1) invalidation, Stale-While-Revalidate (SWR), and Stampede Protection. Supports Redis, Memcached, and in-memory adapters.',
  metadataBase: new URL('https://express-route-cache.js.org'),
  keywords: [
    'express cache middleware', 'express route cache', 'nodejs caching', 'redis cache express', 
    'stale-while-revalidate express', 'swr nodejs', 'express performance', 'cache invalidation', 
    'stampede protection', 'thundering herd', 'express redis middleware', 'memcached express', 
    'nodejs api caching', 'express middleware typescript', 'o1 cache invalidation', 
    'express cache library', 'api response caching nodejs'
  ],
  authors: [{ name: 'Yatharth Lakhate', url: 'https://github.com/CODE-Y02' }],
  robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://express-route-cache.js.org',
    siteName: 'express-route-cache',
    title: '@express-route-cache | O(1) Route Caching for Express.js',
    description: 'Production-grade Express.js route caching with O(1) invalidation, SWR, and Stampede Protection. Supports Redis, Memcached & Memory adapters.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'express-route-cache — O(1) Route Caching for Express.js',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '@express-route-cache | O(1) Route Caching for Express.js',
    description: 'Production-grade Express.js caching: O(1) invalidation, SWR, Stampede Protection. Redis, Memcached & Memory adapters.',
    images: ['/og-image.png'],
    site: '@Yatharth_L',
    creator: '@Yatharth_L',
  },
};

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  subsets: ['latin'],
});

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={cn(inter.className, "font-sans", geist.variable)} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:font-semibold focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          Skip to main content
        </a>
        <RootProvider search={{ SearchDialog: CustomSearchDialog }}>{children}</RootProvider>
      </body>
    </html>
  );
}
