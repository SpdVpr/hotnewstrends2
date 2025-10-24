import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = 'https://www.hotnewstrends.com';
  const canonicalUrl = `${baseUrl}/search`;

  return {
    title: 'Search Articles | HotNewsTrends',
    description: 'Search through our collection of trending articles, breaking news, and in-depth analysis.',
    openGraph: {
      title: 'Search Articles | HotNewsTrends',
      description: 'Search through our collection of trending articles.',
      url: canonicalUrl,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Search Articles | HotNewsTrends',
      description: 'Search through our collection of trending articles.',
    },
    alternates: {
      canonical: canonicalUrl,
    },
    // Search pages with query parameters should not be indexed
    robots: {
      index: false, // Don't index search result pages
      follow: true,
      googleBot: {
        index: false,
        follow: true,
      },
    },
  };
}

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}