import { Navigation } from '@/components/Navigation';
import { LoadingSkeleton, ContentLoading } from '@/components/ui/Loading';

export default function ArticleLoading() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb Skeleton */}
        <nav className="flex items-center space-x-2 text-sm mb-8">
          <LoadingSkeleton className="h-4 w-12" variant="text" />
          <span className="text-text-secondary">›</span>
          <LoadingSkeleton className="h-4 w-20" variant="text" />
          <span className="text-text-secondary">›</span>
          <LoadingSkeleton className="h-4 w-32" variant="text" />
        </nav>

        {/* Article Header Skeleton */}
        <header className="mb-8">
          {/* Badges */}
          <div className="flex items-center gap-3 mb-4">
            <LoadingSkeleton className="h-6 w-20 rounded-full" />
            <LoadingSkeleton className="h-6 w-16 rounded-full" />
          </div>
          
          {/* Title */}
          <LoadingSkeleton className="h-10 w-full mb-2" variant="text" />
          <LoadingSkeleton className="h-10 w-3/4 mb-4" variant="text" />
          
          {/* Excerpt */}
          <LoadingSkeleton className="h-6 w-full mb-2" variant="text" />
          <LoadingSkeleton className="h-6 w-5/6 mb-6" variant="text" />
          
          {/* Meta info */}
          <div className="flex items-center justify-between flex-wrap gap-4 py-4 border-t border-b border-surface">
            <div className="flex items-center gap-4">
              <LoadingSkeleton className="h-4 w-24" variant="text" />
              <LoadingSkeleton className="h-4 w-20" variant="text" />
              <LoadingSkeleton className="h-4 w-16" variant="text" />
            </div>
            <div className="flex items-center gap-4">
              <LoadingSkeleton className="h-4 w-20" variant="text" />
              <LoadingSkeleton className="h-4 w-16" variant="text" />
            </div>
          </div>
        </header>

        {/* Article Content Skeleton */}
        <article className="mb-12">
          <ContentLoading rows={15} className="space-y-4" />
        </article>

        {/* Tags Skeleton */}
        <div className="mb-12">
          <LoadingSkeleton className="h-6 w-16 mb-4" variant="text" />
          <div className="flex flex-wrap gap-2">
            {[...Array(5)].map((_, i) => (
              <LoadingSkeleton key={i} className="h-8 w-16 rounded-full" />
            ))}
          </div>
        </div>

        {/* Related Articles Skeleton */}
        <section className="border-t border-surface pt-12">
          <LoadingSkeleton className="h-8 w-48 mb-8" variant="text" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-surface rounded-xl p-6 animate-pulse">
                <LoadingSkeleton className="h-6 w-20 mb-3 rounded-full" />
                <LoadingSkeleton className="h-5 w-full mb-2" variant="text" />
                <LoadingSkeleton className="h-5 w-3/4 mb-4" variant="text" />
                <LoadingSkeleton className="h-4 w-full mb-2" variant="text" />
                <LoadingSkeleton className="h-4 w-5/6 mb-4" variant="text" />
                <div className="flex items-center justify-between">
                  <LoadingSkeleton className="h-3 w-16" variant="text" />
                  <LoadingSkeleton className="h-3 w-12" variant="text" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Skeleton */}
        <section className="bg-surface rounded-xl p-8 mt-12 text-center animate-pulse">
          <LoadingSkeleton className="h-8 w-48 mb-4 mx-auto" variant="text" />
          <LoadingSkeleton className="h-5 w-96 mb-6 mx-auto" variant="text" />
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <LoadingSkeleton className="h-12 w-48" />
            <LoadingSkeleton className="h-12 w-40" />
          </div>
        </section>
      </main>
    </div>
  );
}
