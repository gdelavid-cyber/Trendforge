import { Header } from '@/components/layouts/header';
import { Shield, AlertTriangle, Scale, Lock } from 'lucide-react';

export default function LegalPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="max-w-[800px] mx-auto px-4 py-12">
        <h1 className="font-display font-bold text-3xl mb-8 flex items-center gap-2">
          <Scale className="w-7 h-7 text-gold" /> Legal & Disclosures
        </h1>

        <div className="space-y-8">
          <section className="bg-card-bg border border-border-subtle rounded-lg p-6">
            <h2 className="font-display font-semibold text-xl mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-gold" /> Risk Disclosure
            </h2>
            <div className="text-sm text-muted-foreground space-y-3">
              <p>Trendly provides educational content about money-making opportunities based on trending topics. All tasks, strategies, and earning estimates are for educational purposes only.</p>
              <p><strong className="text-foreground">No Guarantee of Earnings:</strong> Past results do not guarantee future performance. Earnings depend on individual effort, market conditions, skills, and many external factors.</p>
              <p><strong className="text-foreground">Risk Levels:</strong> Tasks are classified as Low, Medium, or High risk. High-risk tasks may involve financial loss. Always do your own research before investing money.</p>
              <p><strong className="text-foreground">Not Financial Advice:</strong> Nothing on Trendly constitutes financial, investment, legal, or tax advice. Consult qualified professionals before making financial decisions.</p>
            </div>
          </section>

          <section className="bg-card-bg border border-border-subtle rounded-lg p-6">
            <h2 className="font-display font-semibold text-xl mb-3 flex items-center gap-2">
              <Lock className="w-5 h-5 text-gold" /> Data Protection
            </h2>
            <div className="text-sm text-muted-foreground space-y-3">
              <p>We collect and process personal data (email, name, usage data) to provide our services. Your data is stored securely and never sold to third parties.</p>
              <p><strong className="text-foreground">GDPR/CCPA Rights:</strong> You have the right to access, correct, delete, or export your personal data at any time by contacting us.</p>
              <p><strong className="text-foreground">Cookies:</strong> We use essential cookies for authentication and session management. Analytics cookies may be used with your consent.</p>
            </div>
          </section>

          <section className="bg-card-bg border border-border-subtle rounded-lg p-6">
            <h2 className="font-display font-semibold text-xl mb-3 flex items-center gap-2">
              <Shield className="w-5 h-5 text-gold" /> Limitation of Liability
            </h2>
            <div className="text-sm text-muted-foreground space-y-3">
              <p>Trendly and its team are not liable for any direct, indirect, incidental, or consequential damages arising from the use of our platform, content, or suggested tasks.</p>
              <p>Users assume full responsibility for actions taken based on Trendly content. By using Trendly, you agree to hold the platform harmless from any claims.</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
