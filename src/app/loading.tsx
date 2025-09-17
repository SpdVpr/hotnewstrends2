import { Navigation } from '@/components/Navigation';
import { GridLoading } from '@/components/ui/Loading';

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section Skeleton */}
        <section className="mb-12">
          <div className="text-center mb-8">
            <div className="h-12 bg-gray-light rounded-lg mb-4 animate-pulse max-w-2xl mx-auto"></div>
            <div className="h-6 bg-gray-light rounded mb-2 animate-pulse max-w-3xl mx-auto"></div>
            <div className="h-6 bg-gray-light rounded animate-pulse max-w-2xl mx-auto"></div>
          </div>

          {/* Trending Banner Skeleton */}
          <div className="bg-surface rounded-lg p-4 mb-8 animate-pulse">
            <div className="h-6 bg-gray-light rounded max-w-md mx-auto"></div>
          </div>
        </section>

        {/* Category Filter Skeleton */}
        <section className="mb-8">
          <div className="flex gap-3 overflow-x-auto pb-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 w-24 bg-gray-light rounded-full animate-pulse flex-shrink-0"></div>
            ))}
          </div>
        </section>

        {/* Articles Grid Skeleton */}
        <GridLoading items={9} columns={3} />
      </main>
    </div>
  );
}
