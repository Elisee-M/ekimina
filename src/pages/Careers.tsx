import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { usePageSeo } from "@/hooks/usePageSeo";
import { Briefcase, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Careers = () => {
  usePageSeo({ title: "Careers | eKimina", description: "Join the eKimina team and help build the future of community savings in Rwanda.", canonicalPath: "/careers" });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="py-20 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">Join Our Team</h1>
            <p className="text-lg text-muted-foreground">
              Help us transform how Rwandan communities save and grow together. We're always looking for passionate people.
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4 max-w-3xl">
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-foreground">
                  <Briefcase className="w-5 h-5 text-primary" />
                  No Open Positions Right Now
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  We don't have any open positions at the moment, but we're always interested in hearing from talented individuals who are passionate about fintech and community development.
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>Kigali, Rwanda</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Send your CV and a short introduction to{" "}
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
