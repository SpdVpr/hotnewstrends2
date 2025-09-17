import type { Metadata } from 'next';
import Link from 'next/link';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { StructuredData } from '@/components/StructuredData';
import { ContactForm } from '@/components/ContactForm';

export const metadata: Metadata = {
  title: 'Contact Us | HotNewsTrends',
  description: 'Get in touch with HotNewsTrends team. Send us your feedback, questions, or partnership inquiries. We respond within 24 hours.',
  keywords: 'contact hotnewstrends, feedback, support, partnership, press inquiry, contact form',
  openGraph: {
    title: 'Contact HotNewsTrends',
    description: 'Get in touch with our team. We\'d love to hear from you.',
    type: 'website',
    url: 'https://hotnewstrends.com/contact',
  },
  twitter: {
    card: 'summary',
    title: 'Contact HotNewsTrends',
    description: 'Get in touch with our team. We\'d love to hear from you.',
  },
  alternates: {
    canonical: 'https://hotnewstrends.com/contact',
  },
  robots: 'index, follow',
};

export default function ContactPage() {

  return (
    <div className="min-h-screen bg-background">
      <StructuredData type="contact" />
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-text-secondary mb-8">
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <span>›</span>
          <span className="text-text">Contact</span>
        </nav>

        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-text mb-4">
            Contact Us
          </h1>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            Get in touch with our team. We'd love to hear from you.
          </p>
        </header>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Contact Form */}
          <ContactForm />

          {/* Contact Information */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h2 className="text-2xl font-bold text-text">Get in Touch</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 text-primary flex-shrink-0 mt-1">
                    📧
                  </div>
                  <div>
                    <h3 className="font-semibold text-text">Email</h3>
                    <p className="text-text-secondary">contact@hotnewstrends.com</p>
                    <p className="text-sm text-text-secondary">We typically respond within 24 hours</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 text-primary flex-shrink-0 mt-1">
                    🌐
                  </div>
                  <div>
                    <h3 className="font-semibold text-text">Website</h3>
                    <p className="text-text-secondary">www.hotnewstrends.com</p>
                    <p className="text-sm text-text-secondary">Visit our homepage for latest news</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 text-primary flex-shrink-0 mt-1">
                    📱
                  </div>
                  <div>
                    <h3 className="font-semibold text-text">Social Media</h3>
                    <p className="text-text-secondary">Follow us for updates</p>
                    <div className="flex space-x-3 mt-2">
                      <a href="#" className="text-primary hover:text-primary-dark transition-colors">Twitter</a>
                      <a href="#" className="text-primary hover:text-primary-dark transition-colors">Facebook</a>
                      <a href="#" className="text-primary hover:text-primary-dark transition-colors">Instagram</a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold text-text">Frequently Asked Questions</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-text mb-1">How often is content updated?</h3>
                  <p className="text-sm text-text-secondary">
                    Our AI-powered system continuously monitors trending topics and generates new articles throughout the day.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-text mb-1">Can I suggest topics?</h3>
                  <p className="text-sm text-text-secondary">
                    Absolutely! Use the contact form above to suggest topics you'd like us to cover.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-text mb-1">Do you accept guest posts?</h3>
                  <p className="text-sm text-text-secondary">
                    We're currently focused on AI-generated content, but we're open to partnerships. Contact us to discuss.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
