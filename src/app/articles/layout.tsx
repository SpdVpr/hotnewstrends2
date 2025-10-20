import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'All Articles | HotNewsTrends',
    description: 'Browse all articles on HotNewsTrends. Stay updated with the latest trends, news, and insights across all categories.',
    robots: 'noindex, follow', // Don't index filtered pages
  };
}

export default function ArticlesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

