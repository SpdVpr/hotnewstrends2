import type { Metadata } from 'next';
import Link from 'next/link';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { StructuredData } from '@/components/StructuredData';

export const metadata: Metadata = {
  title: 'About Us | HotNewsTrends',
  description: 'Learn about HotNewsTrends - your trusted AI-powered newsroom delivering comprehensive articles about trending topics within hours.',
  keywords: 'about hotnewstrends, AI journalism, news platform, trending topics, about us',
  openGraph: {
    title: 'About HotNewsTrends',
    description: 'Learn about our AI-powered newsroom and mission to deliver trending news faster than ever.',
    type: 'website',
    url: 'https://hotnewstrends.com/about',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About HotNewsTrends',
    description: 'Learn about our AI-powered newsroom and mission to deliver trending news faster than ever.',
  },
  alternates: {
    canonical: 'https://hotnewstrends.com/about',
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <StructuredData type="about" />
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-text-secondary mb-8">
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <span>›</span>
          <span className="text-text">About</span>
        </nav>

        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-text mb-4">
            About HotNewsTrends
          </h1>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            Where Speed Meets Style, and Function Meets Beauty
          </p>
        </header>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Mission Section */}
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-bold text-text">Our Mission</h2>
            </CardHeader>
            <CardContent className="prose prose-lg max-w-none">
              <p className="text-text-secondary leading-relaxed">
                HotNewsTrends is revolutionizing digital journalism through the power of artificial intelligence. 
                Our mission is to deliver comprehensive, accurate, and engaging articles about trending topics 
                within hours of them becoming popular worldwide.
              </p>
              <p className="text-text-secondary leading-relaxed">
                We believe that staying informed shouldn't mean sacrificing quality for speed. That's why we've 
                built an AI-powered newsroom that combines cutting-edge technology with journalistic excellence 
                to bring you the stories that matter, when they matter.
              </p>
            </CardContent>
          </Card>

          {/* What We Do Section */}
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-bold text-text">What We Do</h2>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h3 className="font-semibold text-text mb-1">AI-Powered Content</h3>
                      <p className="text-text-secondary text-sm">
                        Our advanced AI systems monitor global trends and generate comprehensive articles in real-time.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h3 className="font-semibold text-text mb-1">Trending Topics</h3>
                      <p className="text-text-secondary text-sm">
                        We cover technology, entertainment, business, science, health, and breaking news as it happens.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h3 className="font-semibold text-text mb-1">Quality Assurance</h3>
                      <p className="text-text-secondary text-sm">
                        Every article undergoes rigorous quality checks to ensure accuracy and readability.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-orange rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h3 className="font-semibold text-text mb-1">Mobile-First Design</h3>
                      <p className="text-text-secondary text-sm">
                        Our platform is optimized for mobile devices, ensuring great reading experience anywhere.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-orange rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h3 className="font-semibold text-text mb-1">Fast Loading</h3>
                      <p className="text-text-secondary text-sm">
                        Advanced performance optimizations ensure lightning-fast page loads and smooth navigation.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-orange rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h3 className="font-semibold text-text mb-1">SEO Optimized</h3>
                      <p className="text-text-secondary text-sm">
                        Built for both traditional search engines and modern AI-powered search platforms.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technology Section */}
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-bold text-text">Our Technology</h2>
            </CardHeader>
            <CardContent className="prose prose-lg max-w-none">
              <p className="text-text-secondary leading-relaxed">
                HotNewsTrends is built on cutting-edge technology stack including Next.js 15, React, TypeScript, 
                and Firebase. Our AI content generation is powered by advanced language models that analyze 
                trending topics and create engaging, informative articles.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="text-center p-4 bg-surface rounded-lg">
                  <div className="text-2xl mb-2">⚡</div>
                  <div className="text-sm font-medium text-text">Next.js 15</div>
                </div>
                <div className="text-center p-4 bg-surface rounded-lg">
                  <div className="text-2xl mb-2">🤖</div>
                  <div className="text-sm font-medium text-text">AI-Powered</div>
                </div>
                <div className="text-center p-4 bg-surface rounded-lg">
                  <div className="text-2xl mb-2">🔥</div>
                  <div className="text-sm font-medium text-text">Firebase</div>
                </div>
                <div className="text-center p-4 bg-surface rounded-lg">
                  <div className="text-2xl mb-2">📱</div>
                  <div className="text-sm font-medium text-text">Mobile-First</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact CTA */}
          <Card className="text-center">
            <CardContent className="py-8">
              <h2 className="text-2xl font-bold text-text mb-4">Get in Touch</h2>
              <p className="text-text-secondary mb-6">
                Have questions or feedback? We'd love to hear from you.
              </p>
              <Link 
                href="/contact"
                className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
              >
                Contact Us
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
