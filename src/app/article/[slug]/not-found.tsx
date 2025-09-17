import Link from 'next/link';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/Button';

export default function ArticleNotFound() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <div className="mb-8">
            <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
            <h2 className="text-3xl font-bold text-text mb-4">Article Not Found</h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              The article you're looking for doesn't exist or may have been moved. 
              Don't worry, we have plenty of other trending content for you to explore.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/">
              <Button variant="primary" size="lg">
                Back to Homepage
              </Button>
            </Link>
            <Link href="/search">
              <Button variant="secondary" size="lg">
                Search Articles
              </Button>
            </Link>
          </div>
          
          <div className="bg-surface rounded-xl p-8">
            <h3 className="text-xl font-semibold text-text mb-4">Popular Categories</h3>
            <div className="flex flex-wrap gap-3 justify-center">
              {['Technology', 'News', 'Business', 'Science', 'Health'].map((category) => (
                <Link
                  key={category}
                  href={`/category/${category.toLowerCase()}`}
                  className="px-4 py-2 bg-primary text-white rounded-full text-sm font-medium hover:bg-primary-dark transition-colors"
                >
                  {category}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
