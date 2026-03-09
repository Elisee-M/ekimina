import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { usePageSeo } from "@/hooks/usePageSeo";

const Terms = () => {
  usePageSeo({ title: "Terms of Service | eKimina", description: "Read eKimina's terms of service governing use of our savings group platform.", canonicalPath: "/terms" });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-20">
        <div className="container mx-auto px-4 max-w-3xl prose prose-lg dark:prose-invert">
          <h1 className="text-4xl font-bold text-foreground mb-8">Terms of Service</h1>
          <p className="text-muted-foreground text-sm mb-8">Last updated: March 6, 2026</p>

          <h2 className="text-2xl font-semibold text-foreground">1. Acceptance of Terms</h2>
          <p className="text-muted-foreground">By using eKimina, you agree to these Terms of Service. If you do not agree, please do not use our platform.</p>

          <h2 className="text-2xl font-semibold text-foreground">2. Description of Service</h2>
          <p className="text-muted-foreground">eKimina provides a digital platform for managing Ikimina (savings groups), including contribution tracking, loan management, penalty enforcement, and dividend distribution.</p>

          <h2 className="text-2xl font-semibold text-foreground">3. User Responsibilities</h2>
          <p className="text-muted-foreground">You are responsible for maintaining the confidentiality of your account, providing accurate information, and complying with your savings group's rules and regulations.</p>

          <h2 className="text-2xl font-semibold text-foreground">4. Financial Disclaimer</h2>
          <p className="text-muted-foreground">eKimina is a management tool and does not provide financial advice. All financial decisions within your savings group are the responsibility of the group and its members.</p>

          <h2 className="text-2xl font-semibold text-foreground">5. Limitation of Liability</h2>
          <p className="text-muted-foreground">eKimina is provided "as is" without warranties. We are not liable for any financial losses, disputes between group members, or interruptions in service.</p>

          <h2 className="text-2xl font-semibold text-foreground">6. Termination</h2>
          <p className="text-muted-foreground">We reserve the right to suspend or terminate accounts that violate these terms. You may delete your account at any time through your account settings.</p>

          <h2 className="text-2xl font-semibold text-foreground">7. Contact</h2>
          <p className="text-muted-foreground">
            For questions about these terms, contact us at{" "}
            <a href="mailto:mugiranezaelisee0@gmail.com" className="text-primary hover:underline">mugiranezaelisee0@gmail.com</a>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;
