import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Wallet, 
  Users, 
  TrendingUp, 
  Shield, 
  FileText, 
  Bell,
  BarChart3,
  Lock
} from "lucide-react";
import { useTranslation } from "react-i18next";

const featureKeys = [
  { icon: Wallet, key: "contributionTracking", color: "primary" },
  { icon: TrendingUp, key: "smartLoans", color: "secondary" },
  { icon: Users, key: "memberManagement", color: "accent" },
  { icon: Shield, key: "groupIsolation", color: "primary" },
  { icon: BarChart3, key: "reportsAnalytics", color: "secondary" },
  { icon: Bell, key: "smartNotifications", color: "accent" },
  { icon: FileText, key: "exportReports", color: "primary" },
  { icon: Lock, key: "secureAuth", color: "secondary" }
];

const colorClasses = {
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary/10 text-secondary",
  accent: "bg-accent/10 text-accent"
};

export function FeaturesSection() {
  const { t } = useTranslation();

  return (
    <section id="features" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t('features.title')} <span className="text-primary">{t('features.titleHighlight')}</span> {t('features.titleEnd')}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t('features.description')}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featureKeys.map((feature, index) => (
            <motion.div
              key={feature.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card variant="feature" className="h-full group">
                <CardContent className="p-6 space-y-4">
                  <div className={`w-12 h-12 rounded-xl ${colorClasses[feature.color as keyof typeof colorClasses]} flex items-center justify-center transition-transform group-hover:scale-110`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {t(`features.${feature.key}.title`)}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t(`features.${feature.key}.description`)}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
