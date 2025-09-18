import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { StructuredData } from "@/components/StructuredData";
import { AIMetaTags } from "@/components/AIMetaTags";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import { StartupInitializer } from "@/components/StartupInitializer";
import { PerformanceMonitor } from "@/components/PerformanceMonitor";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
  fallback: ['system-ui', '-apple-system', 'sans-serif'],
});

export const metadata: Metadata = {
  title: "HotNewsTrends.com - Where Speed Meets Style",
  description: "AI-powered newsroom delivering comprehensive articles about trending topics within hours. Stay ahead with the fastest, most reliable source for trending news and analysis.",
  keywords: "trending news, AI journalism, breaking news, trending topics, fast news, mobile news",
  authors: [{ name: "HotNewsTrends" }],
  creator: "HotNewsTrends",
  publisher: "HotNewsTrends",
  robots: "index, follow",
  viewport: "width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes",
  themeColor: "#007AFF",
  colorScheme: "light",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://hotnewstrends.com",
    siteName: "HotNewsTrends.com",
    title: "HotNewsTrends.com - Where Speed Meets Style",
    description: "AI-powered newsroom delivering comprehensive articles about trending topics within hours.",
    images: [
      {
        url: "https://hotnewstrends.com/hnt-logo.png",
        width: 1200,
        height: 630,
        alt: "HotNewsTrends - AI-powered newsroom",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "HotNewsTrends.com - Where Speed Meets Style",
    description: "AI-powered newsroom delivering comprehensive articles about trending topics within hours.",
    creator: "@hotnewstrends",
    images: ["https://hotnewstrends.com/hnt-logo.png"],
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "mask-icon", url: "/safari-pinned-tab.svg", color: "#007AFF" },
    ],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <meta name="theme-color" content="#007AFF" />
        <meta name="msapplication-TileColor" content="#007AFF" />

        {/* Content Security Policy - Override for Google Analytics */}
        <meta httpEquiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: http:; font-src 'self' data:; connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://region2.google-analytics.com https://region3.google-analytics.com https://region4.google-analytics.com https://region5.google-analytics.com https://analytics.google.com https://stats.g.doubleclick.net https://www.googletagmanager.com https://api.perplexity.ai https://api.unsplash.com https://api.pexels.com https://trends.google.com https://www.google.com https://serpapi.com https://rss.cnn.com https://feeds.bbci.co.uk https://www.reuters.com https://feeds.reuters.com https://firestore.googleapis.com https://firebase.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com; frame-src 'self'; object-src 'none'; base-uri 'self';" />

        {/* Preconnect to essential external domains only */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Google Analytics - Official Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-29LL0RMMRY"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-29LL0RMMRY');
            `,
          }}
        />

        <AIMetaTags type="website" />
        <StructuredData type="website" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const savedTheme = localStorage.getItem('theme');
                  // Default to light theme, ignore system preferences
                  const theme = savedTheme || 'light';

                  if (theme === 'dark') {
                    document.documentElement.setAttribute('data-theme', 'dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased bg-background text-foreground">
        <PerformanceMonitor />
        <StartupInitializer />
        <AnalyticsProvider>
          {children}
        </AnalyticsProvider>
      </body>
    </html>
  );
}
