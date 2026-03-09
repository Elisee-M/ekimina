import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { usePageSeo } from "@/hooks/usePageSeo";

const Privacy = () => {
  usePageSeo({ title: "Privacy Policy | eKimina", description: "Read eKimina's privacy policy to understand how we collect, use, and protect your data.", canonicalPath: "/privacy" });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-20">
        <div className="container mx-auto px-4 max-w-3xl prose prose-lg dark:prose-invert">
          <h1 className="text-4xl font-bold text-foreground mb-8">Privacy Policy</h1>
          <p className="text-muted-foreground text-sm mb-8">Last updated: March 6, 2026</p>

          <h2 className="text-2xl font-semibold text-foreground">1. Information We Collect</h2>
          <p className="text-muted-foreground">We collect information you provide directly, including your name, email address, phone number, and financial data related to your savings group activities (contributions, loans, and repayments).</p>

          <h2 className="text-2xl font-semibold text-foreground">2. How We Use Your Information</h2>
          <p className="text-muted-foreground">Your information is used to provide and improve our services, manage your savings group, process contributions and loans, send notifications, and ensure the security of your account.</p>

          <h2 className="text-2xl font-semibold text-foreground">3. Data Security</h2>
          <p className="text-muted-foreground">We implement industry-standard security measures including encryption, secure data storage, and access controls to protect your personal and financial information.</p>

          <h2 className="text-2xl font-semibold text-foreground">4. Data Sharing</h2>
          <p className="text-muted-foreground">We do not sell your personal data. Your financial information is shared only with members of your savings group as necessary for group operations. We may share anonymized data for analytics purposes.</p>

          <h2 className="text-2xl font-semibold text-foreground">5. Your Rights</h2>
          <p className="text-muted-foreground">You have the right to access, update, or delete your personal data. You can manage your information through your account settings or by contacting us directly.</p>

          <h2 className="text-2xl font-semibold text-foreground">6. Contact Us</h2>
          <p className="text-muted-foreground">
            For any privacy-related questions, contact us at{" "}
            <a href="mailto:mugiranezaelisee0@gmail.com" className="text-primary hover:underline">mugiranezaelisee0@gmail.com</a>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Privacy;
