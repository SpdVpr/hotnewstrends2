import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = 'https://www.hotnewstrends.com';
  const canonicalUrl = `${baseUrl}/articles`;

  return {
    title: 'All Articles | HotNewsTrends',
    description: 'Browse all trending articles on HotNewsTrends. Stay updated with the latest news, trends, and insights across all categories.',
    openGraph: {
      title: 'All Articles | HotNewsTrends',
      description: 'Browse all trending articles on HotNewsTrends.',
      url: canonicalUrl,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'All Articles | HotNewsTrends',
      description: 'Browse all trending articles on HotNewsTrends.',
    },
    alternates: {
      canonical: canonicalUrl,
    },
    // For filtered pages (with ?tag= or ?category=), use robots to prevent indexing duplicates
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    },
  };
}

export default function ArticlesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
