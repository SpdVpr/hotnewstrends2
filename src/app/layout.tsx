import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { StructuredData } from "@/components/StructuredData";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import { StartupInitializer } from "@/components/StartupInitializer";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "HotNewsTrends.com - Where Speed Meets Style",
  description: "AI-powered newsroom delivering comprehensive articles about trending topics within hours. Stay ahead with the fastest, most reliable source for trending news and analysis.",
  keywords: "trending news, AI journalism, breaking news, trending topics, fast news, mobile news",
  authors: [{ name: "HotNewsTrends" }],
  creator: "HotNewsTrends",
  publisher: "HotNewsTrends",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://hotnewstrends.com",
    siteName: "HotNewsTrends.com",
    title: "HotNewsTrends.com - Where Speed Meets Style",
    description: "AI-powered newsroom delivering comprehensive articles about trending topics within hours.",
  },
  twitter: {
    card: "summary_large_image",
    title: "HotNewsTrends.com - Where Speed Meets Style",
    description: "AI-powered newsroom delivering comprehensive articles about trending topics within hours.",
    creator: "@hotnewstrends",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
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
        <StartupInitializer />
        <AnalyticsProvider>
          {children}
        </AnalyticsProvider>
      </body>
    </html>
  );
}
