import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Shield, Users, TrendingUp, Play } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DemoWalkthrough } from "./DemoWalkthrough";
import { useTranslation } from "react-i18next";

export function HeroSection() {
  const [showDemo, setShowDemo] = useState(false);
  const { t } = useTranslation();

  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 gradient-subtle" />
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-sm font-medium text-primary">{t('hero.badge')}</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight">
              {t('hero.title')} <span className="text-primary">{t('hero.titleHighlight')}</span> {t('hero.titleEnd')}{" "}
              <span className="gradient-hero bg-clip-text text-transparent">{t('hero.titleGradient')}</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-xl">
              {t('hero.description')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="hero" size="xl" asChild>
                <Link to="/register">
                  {t('hero.ctaPrimary')}
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button variant="outline" size="xl" onClick={() => setShowDemo(true)}>
                <Play className="w-5 h-5 mr-2" />
                {t('hero.ctaSecondary')}
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap gap-6 pt-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Shield className="w-5 h-5 text-primary" />
                <span className="text-sm">{t('hero.trustBadge1')}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="w-5 h-5 text-primary" />
                <span className="text-sm">{t('hero.trustBadge2')}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span className="text-sm">{t('hero.trustBadge3')}</span>
              </div>
            </div>
          </motion.div>

          {/* Right Content - Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative">
              {/* Main Card */}
              <div className="bg-card rounded-2xl shadow-lg border border-border p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('hero.groupBalance')}</p>
                    <p className="text-3xl font-bold text-foreground">RWF 2,450,000</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl gradient-hero flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-primary-foreground" />
                  </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-muted rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">{t('hero.members')}</p>
                    <p className="text-lg font-semibold text-foreground">24</p>
                  </div>
                  <div className="bg-muted rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">{t('hero.activeLoans')}</p>
                    <p className="text-lg font-semibold text-foreground">8</p>
                  </div>
                  <div className="bg-muted rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">{t('hero.profit')}</p>
                    <p className="text-lg font-semibold text-success">+12%</p>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground">{t('hero.recentActivity')}</p>
                  <div className="space-y-2">
                    {[
                      { name: "Jean Claude", action: t('hero.contributed'), amount: "50,000 RWF" },
                      { name: "Marie Claire", action: t('hero.repaid'), amount: "75,000 RWF" },
                      { name: "Patrick", action: t('hero.contributed'), amount: "50,000 RWF" },
                    ].map((activity, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-semibold text-primary">
                              {activity.name.split(" ").map(n => n[0]).join("")}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{activity.name}</p>
                            <p className="text-xs text-muted-foreground">{activity.action}</p>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-primary">{activity.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating Card */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="absolute -bottom-6 -left-6 bg-card rounded-xl shadow-lg border border-border p-4 w-48"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg gradient-gold flex items-center justify-center">
                    <Shield className="w-5 h-5 text-secondary-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t('hero.thisMonth')}</p>
                    <p className="text-sm font-bold text-foreground">{t('hero.onTime')}</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Demo Video Modal */}
      <Dialog open={showDemo} onOpenChange={setShowDemo}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{t('hero.demoTitle')}</DialogTitle>
            <DialogDescription>
              {t('hero.demoDescription')}
            </DialogDescription>
          </DialogHeader>
          <DemoWalkthrough />
        </DialogContent>
      </Dialog>
    </section>
  );
}
