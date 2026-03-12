import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { usePageSeo } from "@/hooks/usePageSeo";
import { useTranslation } from "react-i18next";
import { Briefcase, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Careers = () => {
  const { t } = useTranslation();
  usePageSeo({ title: "Careers | eKimina", description: "Join the eKimina team and help build the future of community savings in Rwanda.", canonicalPath: "/careers" });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="py-20 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">{t('careers.title')}</h1>
            <p className="text-lg text-muted-foreground">{t('careers.description')}</p>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4 max-w-3xl">
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-foreground">
                  <Briefcase className="w-5 h-5 text-primary" />
                  {t('careers.noPositions')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{t('careers.noPositionsDesc')}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{t('careers.location')}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('careers.sendCV')}{" "}
                  <a href="mailto:mugiranezaelisee0@gmail.com" className="text-primary hover:underline">
                    mugiranezaelisee0@gmail.com
                  </a>
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Careers;
