import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { usePageSeo } from "@/hooks/usePageSeo";
import { useTranslation } from "react-i18next";

const Terms = () => {
  const { t } = useTranslation();
  usePageSeo({ title: "Terms of Service | eKimina", description: "Read eKimina's terms of service governing use of our savings group platform.", canonicalPath: "/terms" });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-20">
        <div className="container mx-auto px-4 max-w-3xl prose prose-lg dark:prose-invert">
          <h1 className="text-4xl font-bold text-foreground mb-8">{t('termsPage.title')}</h1>
          <p className="text-muted-foreground text-sm mb-8">{t('termsPage.lastUpdated')}</p>

          <h2 className="text-2xl font-semibold text-foreground">{t('termsPage.s1Title')}</h2>
          <p className="text-muted-foreground">{t('termsPage.s1Desc')}</p>

          <h2 className="text-2xl font-semibold text-foreground">{t('termsPage.s2Title')}</h2>
          <p className="text-muted-foreground">{t('termsPage.s2Desc')}</p>

          <h2 className="text-2xl font-semibold text-foreground">{t('termsPage.s3Title')}</h2>
          <p className="text-muted-foreground">{t('termsPage.s3Desc')}</p>

          <h2 className="text-2xl font-semibold text-foreground">{t('termsPage.s4Title')}</h2>
          <p className="text-muted-foreground">{t('termsPage.s4Desc')}</p>

          <h2 className="text-2xl font-semibold text-foreground">{t('termsPage.s5Title')}</h2>
          <p className="text-muted-foreground">{t('termsPage.s5Desc')}</p>

          <h2 className="text-2xl font-semibold text-foreground">{t('termsPage.s6Title')}</h2>
          <p className="text-muted-foreground">{t('termsPage.s6Desc')}</p>

          <h2 className="text-2xl font-semibold text-foreground">{t('termsPage.s7Title')}</h2>
          <p className="text-muted-foreground">
            {t('termsPage.s7Desc')}{" "}
            <a href="mailto:mugiranezaelisee0@gmail.com" className="text-primary hover:underline">mugiranezaelisee0@gmail.com</a>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;
