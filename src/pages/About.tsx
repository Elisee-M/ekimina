import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { usePageSeo } from "@/hooks/usePageSeo";
import { useTranslation } from "react-i18next";
import { Users, Target, Heart, Shield } from "lucide-react";

const About = () => {
  const { t } = useTranslation();
  usePageSeo({ title: "About Us | eKimina", description: "Learn about eKimina – the modern platform for Rwandan savings groups.", canonicalPath: "/about" });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="py-20 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">{t('about.title')}</h1>
            <p className="text-lg text-muted-foreground">{t('about.description')}</p>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="grid md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary"><Target className="w-6 h-6" /></div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">{t('about.missionTitle')}</h3>
                    <p className="text-muted-foreground">{t('about.missionDesc')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary"><Heart className="w-6 h-6" /></div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">{t('about.valuesTitle')}</h3>
                    <p className="text-muted-foreground">{t('about.valuesDesc')}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary"><Users className="w-6 h-6" /></div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">{t('about.serveTitle')}</h3>
                    <p className="text-muted-foreground">{t('about.serveDesc')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary"><Shield className="w-6 h-6" /></div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">{t('about.securityTitle')}</h3>
                    <p className="text-muted-foreground">{t('about.securityDesc')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default About;
