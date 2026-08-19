import { Header } from '@/components/header';
import { LandingPricing } from '../_components/landing-pricing';

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="pt-8">
        <LandingPricing />
      </div>
    </div>
  );
}
