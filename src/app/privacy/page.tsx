import type { Metadata } from 'next';
import Link from 'next/link';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { StructuredData } from '@/components/StructuredData';

export const metadata: Metadata = {
  title: 'Privacy Policy | HotNewsTrends',
  description: 'Learn how HotNewsTrends collects, uses, and protects your personal information. Read our comprehensive privacy policy.',
  keywords: 'privacy policy, data protection, GDPR, personal information, hotnewstrends',
  openGraph: {
    title: 'Privacy Policy | HotNewsTrends',
    description: 'Learn how we protect your privacy and handle your personal information.',
    type: 'website',
    url: 'https://hotnewstrends.com/privacy',
  },
  twitter: {
    card: 'summary',
    title: 'Privacy Policy | HotNewsTrends',
    description: 'Learn how we protect your privacy and handle your personal information.',
  },
  alternates: {
    canonical: 'https://hotnewstrends.com/privacy',
  },
  robots: 'index, follow',
};

export default function PrivacyPage() {
  const lastUpdated = 'January 15, 2025';

  return (
    <div className="min-h-screen bg-background">
      <StructuredData type="privacy" />
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-text-secondary mb-8">
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <span>›</span>
          <span className="text-text">Privacy Policy</span>
        </nav>

        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-text mb-4">
            Privacy Policy
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
                At HotNewsTrends ("we," "our," or "us"), we are committed to protecting your privacy and ensuring 
                the security of your personal information. This Privacy Policy explains how we collect, use, 
                disclose, and safeguard your information when you visit our website hotnewstrends.com.
              </p>
            </CardContent>
          </Card>

          {/* Information We Collect */}
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-bold text-text">Information We Collect</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-text mb-2">Information You Provide</h3>
                <ul className="list-disc list-inside space-y-1 text-text-secondary">
                  <li>Contact information when you reach out to us</li>
                  <li>Feedback and comments you submit</li>
                  <li>Newsletter subscription information (if applicable)</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-text mb-2">Automatically Collected Information</h3>
                <ul className="list-disc list-inside space-y-1 text-text-secondary">
                  <li>IP address and location data</li>
                  <li>Browser type and version</li>
                  <li>Device information and operating system</li>
                  <li>Pages visited and time spent on our site</li>
                  <li>Referral sources and search terms</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* How We Use Information */}
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-bold text-text">How We Use Your Information</h2>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2 text-text-secondary">
                <li>To provide and maintain our news service</li>
                <li>To improve our website and user experience</li>
                <li>To respond to your inquiries and provide customer support</li>
                <li>To analyze website traffic and usage patterns</li>
                <li>To detect and prevent fraud or abuse</li>
                <li>To comply with legal obligations</li>
                <li>To send newsletters or updates (with your consent)</li>
              </ul>
            </CardContent>
          </Card>

          {/* Cookies and Tracking */}
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-bold text-text">Cookies and Tracking Technologies</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-text-secondary">
                We use cookies and similar tracking technologies to enhance your browsing experience:
              </p>
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-text">Essential Cookies</h4>
                  <p className="text-sm text-text-secondary">Required for basic website functionality and security.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-text">Analytics Cookies</h4>
                  <p className="text-sm text-text-secondary">Help us understand how visitors interact with our website.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-text">Preference Cookies</h4>
                  <p className="text-sm text-text-secondary">Remember your settings and preferences (like theme selection).</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Sharing */}
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-bold text-text">Information Sharing and Disclosure</h2>
            </CardHeader>
            <CardContent>
              <p className="text-text-secondary mb-4">
                We do not sell, trade, or rent your personal information to third parties. We may share your 
                information only in the following circumstances:
              </p>
              <ul className="list-disc list-inside space-y-1 text-text-secondary">
                <li>With your explicit consent</li>
                <li>To comply with legal requirements or court orders</li>
                <li>To protect our rights, property, or safety</li>
                <li>With service providers who assist in website operations (under strict confidentiality agreements)</li>
                <li>In connection with a business transfer or merger</li>
              </ul>
            </CardContent>
          </Card>

          {/* Data Security */}
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-bold text-text">Data Security</h2>
            </CardHeader>
            <CardContent>
              <p className="text-text-secondary">
                We implement appropriate technical and organizational security measures to protect your personal 
                information against unauthorized access, alteration, disclosure, or destruction. These measures include:
              </p>
              <ul className="list-disc list-inside space-y-1 text-text-secondary mt-4">
                <li>SSL encryption for data transmission</li>
                <li>Secure hosting infrastructure</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and authentication</li>
                <li>Data backup and recovery procedures</li>
              </ul>
            </CardContent>
          </Card>

          {/* Your Rights */}
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-bold text-text">Your Privacy Rights</h2>
            </CardHeader>
            <CardContent>
              <p className="text-text-secondary mb-4">
                Depending on your location, you may have the following rights regarding your personal information:
              </p>
              <ul className="list-disc list-inside space-y-1 text-text-secondary">
                <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
                <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                <li><strong>Portability:</strong> Request transfer of your data to another service</li>
                <li><strong>Objection:</strong> Object to certain processing of your information</li>
                <li><strong>Restriction:</strong> Request limitation of processing in certain circumstances</li>
              </ul>
            </CardContent>
          </Card>

          {/* Third-Party Links */}
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-bold text-text">Third-Party Links</h2>
            </CardHeader>
            <CardContent>
              <p className="text-text-secondary">
                Our website may contain links to third-party websites. We are not responsible for the privacy 
                practices or content of these external sites. We encourage you to review the privacy policies 
                of any third-party websites you visit.
              </p>
            </CardContent>
          </Card>

          {/* Children's Privacy */}
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-bold text-text">Children's Privacy</h2>
            </CardHeader>
            <CardContent>
              <p className="text-text-secondary">
                Our service is not intended for children under 13 years of age. We do not knowingly collect 
                personal information from children under 13. If you are a parent or guardian and believe your 
                child has provided us with personal information, please contact us immediately.
              </p>
            </CardContent>
          </Card>

          {/* Changes to Policy */}
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-bold text-text">Changes to This Privacy Policy</h2>
            </CardHeader>
            <CardContent>
              <p className="text-text-secondary">
                We may update this Privacy Policy from time to time. We will notify you of any changes by 
                posting the new Privacy Policy on this page and updating the "Last updated" date. We encourage 
                you to review this Privacy Policy periodically for any changes.
              </p>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-bold text-text">Contact Us</h2>
            </CardHeader>
            <CardContent>
              <p className="text-text-secondary mb-4">
                If you have any questions about this Privacy Policy or our privacy practices, please contact us:
              </p>
              <div className="space-y-2 text-text-secondary">
                <p><strong>Email:</strong> privacy@hotnewstrends.com</p>
                <p><strong>Website:</strong> <Link href="/contact" className="text-primary hover:text-primary-dark">Contact Form</Link></p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
