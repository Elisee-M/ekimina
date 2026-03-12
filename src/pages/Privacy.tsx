import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { usePageSeo } from "@/hooks/usePageSeo";
import { useTranslation } from "react-i18next";

const Privacy = () => {
  const { t } = useTranslation();
  usePageSeo({ title: "Privacy Policy | eKimina", description: "Read eKimina's privacy policy to understand how we collect, use, and protect your data.", canonicalPath: "/privacy" });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-20">
        <div className="container mx-auto px-4 max-w-3xl prose prose-lg dark:prose-invert">
          <h1 className="text-4xl font-bold text-foreground mb-8">{t('privacy.title')}</h1>
          <p className="text-muted-foreground text-sm mb-8">{t('privacy.lastUpdated')}</p>

          <h2 className="text-2xl font-semibold text-foreground">{t('privacy.s1Title')}</h2>
          <p className="text-muted-foreground">{t('privacy.s1Desc')}</p>

          <h2 className="text-2xl font-semibold text-foreground">{t('privacy.s2Title')}</h2>
          <p className="text-muted-foreground">{t('privacy.s2Desc')}</p>

          <h2 className="text-2xl font-semibold text-foreground">{t('privacy.s3Title')}</h2>
          <p className="text-muted-foreground">{t('privacy.s3Desc')}</p>

          <h2 className="text-2xl font-semibold text-foreground">{t('privacy.s4Title')}</h2>
          <p className="text-muted-foreground">{t('privacy.s4Desc')}</p>

          <h2 className="text-2xl font-semibold text-foreground">{t('privacy.s5Title')}</h2>
          <p className="text-muted-foreground">{t('privacy.s5Desc')}</p>

          <h2 className="text-2xl font-semibold text-foreground">{t('privacy.s6Title')}</h2>
          <p className="text-muted-foreground">
            {t('privacy.s6Desc')}{" "}
            <a href="mailto:mugiranezaelisee0@gmail.com" className="text-primary hover:underline">mugiranezaelisee0@gmail.com</a>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Privacy;
