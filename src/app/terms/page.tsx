import type { Metadata } from 'next';
import Link from 'next/link';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { StructuredData } from '@/components/StructuredData';

export const metadata: Metadata = {
  title: 'Terms of Service | HotNewsTrends',
  description: 'Read the terms and conditions for using HotNewsTrends. Understand your rights and responsibilities when accessing our content.',
  keywords: 'terms of service, terms and conditions, user agreement, legal terms, hotnewstrends',
  openGraph: {
    title: 'Terms of Service | HotNewsTrends',
    description: 'Terms and conditions for using HotNewsTrends platform and services.',
    type: 'website',
    url: 'https://hotnewstrends.com/terms',
  },
  twitter: {
    card: 'summary',
    title: 'Terms of Service | HotNewsTrends',
    description: 'Terms and conditions for using HotNewsTrends platform and services.',
  },
  alternates: {
    canonical: 'https://hotnewstrends.com/terms',
  },
  robots: 'index, follow',
};

export default function TermsPage() {
  const lastUpdated = 'January 15, 2025';

  return (
    <div className="min-h-screen bg-background">
      <StructuredData type="terms" />
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-text-secondary mb-8">
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <span>›</span>
          <span className="text-text">Terms of Service</span>
        </nav>

        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-text mb-4">
            Terms of Service
          </h1>
          <p className="text-text-secondary">
            Last updated: {lastUpdated}
          </p>
        </header>

        {/* Content */}
        <div className="space-y-6">
          {/* Introduction */}
          <Card>
            <CardContent className="pt-6">
              <p className="text-text-secondary leading-relaxed">
                Welcome to HotNewsTrends ("we," "our," or "us"). These Terms of Service ("Terms") govern your 
                use of our website located at hotnewstrends.com and all related services, features, and content 
                (collectively, the "Service"). By accessing or using our Service, you agree to be bound by these Terms.
              </p>
            </CardContent>
          </Card>

          {/* Acceptance of Terms */}
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-bold text-text">1. Acceptance of Terms</h2>
            </CardHeader>
            <CardContent>
              <p className="text-text-secondary">
                By accessing and using HotNewsTrends, you accept and agree to be bound by the terms and provision 
                of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </CardContent>
          </Card>

          {/* Description of Service */}
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-bold text-text">2. Description of Service</h2>
            </CardHeader>
            <CardContent>
              <p className="text-text-secondary mb-4">
                HotNewsTrends is an AI-powered news platform that provides:
              </p>
              <ul className="list-disc list-inside space-y-1 text-text-secondary">
                <li>Breaking news and trending topic coverage</li>
                <li>AI-generated articles and content</li>
                <li>Category-based news organization</li>
                <li>Mobile-optimized reading experience</li>
                <li>Search and discovery features</li>
              </ul>
            </CardContent>
          </Card>

          {/* User Responsibilities */}
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-bold text-text">3. User Responsibilities</h2>
            </CardHeader>
            <CardContent>
              <p className="text-text-secondary mb-4">When using our Service, you agree to:</p>
              <ul className="list-disc list-inside space-y-1 text-text-secondary">
                <li>Use the Service only for lawful purposes</li>
                <li>Not attempt to gain unauthorized access to our systems</li>
                <li>Not interfere with or disrupt the Service</li>
                <li>Not use automated systems to access the Service without permission</li>
                <li>Respect intellectual property rights</li>
                <li>Provide accurate information when contacting us</li>
                <li>Not engage in any activity that could harm our reputation</li>
              </ul>
            </CardContent>
          </Card>

          {/* Intellectual Property */}
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-bold text-text">4. Intellectual Property Rights</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-text mb-2">Our Content</h3>
                <p className="text-text-secondary">
                  All content on HotNewsTrends, including but not limited to text, graphics, logos, images, 
                  and software, is the property of HotNewsTrends or its content suppliers and is protected 
                  by copyright and other intellectual property laws.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-text mb-2">Limited License</h3>
                <p className="text-text-secondary">
                  We grant you a limited, non-exclusive, non-transferable license to access and use our 
                  Service for personal, non-commercial purposes. You may not reproduce, distribute, modify, 
                  or create derivative works without our express written permission.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* AI-Generated Content */}
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-bold text-text">5. AI-Generated Content</h2>
            </CardHeader>
            <CardContent>
              <p className="text-text-secondary mb-4">
                Our platform uses artificial intelligence to generate news content. You acknowledge that:
              </p>
              <ul className="list-disc list-inside space-y-1 text-text-secondary">
                <li>AI-generated content may contain inaccuracies or errors</li>
                <li>We strive for accuracy but cannot guarantee complete precision</li>
                <li>Content is generated based on available data and trending information</li>
                <li>You should verify important information from primary sources</li>
                <li>We continuously improve our AI systems for better accuracy</li>
              </ul>
            </CardContent>
          </Card>

          {/* Privacy and Data */}
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-bold text-text">6. Privacy and Data Collection</h2>
            </CardHeader>
            <CardContent>
              <p className="text-text-secondary">
                Your privacy is important to us. Our collection and use of personal information is governed 
                by our <Link href="/privacy" className="text-primary hover:text-primary-dark">Privacy Policy</Link>, 
                which is incorporated into these Terms by reference.
              </p>
            </CardContent>
          </Card>

          {/* Disclaimers */}
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-bold text-text">7. Disclaimers</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-text mb-2">Service Availability</h3>
                  <p className="text-text-secondary">
                    We provide our Service on an "as is" and "as available" basis. We do not guarantee 
                    uninterrupted or error-free operation of the Service.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-text mb-2">Content Accuracy</h3>
                  <p className="text-text-secondary">
                    While we strive to provide accurate and up-to-date information, we make no warranties 
                    about the completeness, reliability, or accuracy of the content.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-text mb-2">Third-Party Content</h3>
                  <p className="text-text-secondary">
                    Our Service may include links to third-party websites or content. We are not responsible 
                    for the content, accuracy, or practices of these third parties.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Limitation of Liability */}
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-bold text-text">8. Limitation of Liability</h2>
            </CardHeader>
            <CardContent>
              <p className="text-text-secondary">
                To the fullest extent permitted by law, HotNewsTrends shall not be liable for any indirect, 
                incidental, special, consequential, or punitive damages, including but not limited to loss of 
                profits, data, or use, arising out of or relating to your use of the Service.
              </p>
            </CardContent>
          </Card>

          {/* Termination */}
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-bold text-text">9. Termination</h2>
            </CardHeader>
            <CardContent>
              <p className="text-text-secondary">
                We reserve the right to terminate or suspend your access to our Service at any time, without 
                prior notice, for conduct that we believe violates these Terms or is harmful to other users, 
                us, or third parties.
              </p>
            </CardContent>
          </Card>

          {/* Governing Law */}
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-bold text-text">10. Governing Law</h2>
            </CardHeader>
            <CardContent>
              <p className="text-text-secondary">
                These Terms shall be governed by and construed in accordance with the laws of the United States, 
                without regard to its conflict of law provisions. Any disputes arising under these Terms shall 
                be subject to the exclusive jurisdiction of the courts in the United States.
              </p>
            </CardContent>
          </Card>

          {/* Changes to Terms */}
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-bold text-text">11. Changes to Terms</h2>
            </CardHeader>
            <CardContent>
              <p className="text-text-secondary">
                We reserve the right to modify these Terms at any time. We will notify users of any material 
                changes by posting the updated Terms on our website and updating the "Last updated" date. 
                Your continued use of the Service after such changes constitutes acceptance of the new Terms.
              </p>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-bold text-text">12. Contact Information</h2>
            </CardHeader>
            <CardContent>
              <p className="text-text-secondary mb-4">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <div className="space-y-2 text-text-secondary">
                <p><strong>Email:</strong> legal@hotnewstrends.com</p>
                <p><strong>Website:</strong> <Link href="/contact" className="text-primary hover:text-primary-dark">Contact Form</Link></p>
              </div>
            </CardContent>
          </Card>

          {/* Severability */}
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-bold text-text">13. Severability</h2>
            </CardHeader>
            <CardContent>
              <p className="text-text-secondary">
                If any provision of these Terms is found to be unenforceable or invalid, that provision will 
                be limited or eliminated to the minimum extent necessary so that these Terms will otherwise 
                remain in full force and effect.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
