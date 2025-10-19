import Link from 'next/link';

export const metadata = {
  title: 'Pricing - easeMail',
  description: 'Pricing page',
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-slate-950 p-20">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">
          Pricing Test Page
        </h1>
        <p className="text-slate-300 mb-4">
          If you can see this, the page is working!
        </p>
        <Link href="/" className="text-[#FF4C5A] hover:underline">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
