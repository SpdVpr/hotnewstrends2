import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-surface mt-16 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-primary mb-4">
            HotNewsTrends<span className="text-orange">↗</span>
          </h3>
          <p className="text-text-secondary mb-6">
            Where Speed Meets Style, and Function Meets Beauty.
          </p>
          <div className="flex justify-center space-x-6 text-sm text-text-secondary">
            <Link href="/about" className="hover:text-primary transition-colors">About</Link>
            <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
            <Link href="/contact" className="hover:text-primary transition-colors">Contact</Link>
          </div>
          <div className="mt-6 text-xs text-text-secondary">
            © 2025 HotNewsTrends.com. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}

