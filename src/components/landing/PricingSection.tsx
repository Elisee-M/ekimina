import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const planKeys = ["starter", "growth", "enterprise"];

export function PricingSection() {
  const { t } = useTranslation();

  const plans = planKeys.map((key, index) => ({
    key,
    name: t(`pricing.${key}.name`),
    price: t(`pricing.${key}.price`),
    period: key === "growth" ? t('pricing.perMonth') : "",
    description: t(`pricing.${key}.description`),
    features: t(`pricing.${key}.features`, { returnObjects: true }) as string[],
    cta: t(`pricing.${key}.cta`),
    variant: key === "growth" ? "hero" : "outline" as const,
    popular: key === "growth"
  }));

  return (
    <section id="pricing" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t('pricing.title')} <span className="text-primary">{t('pricing.titleHighlight')}</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            {t('pricing.description')}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={plan.popular ? "relative" : ""}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <Badge variant="gold" className="px-4 py-1">{t('pricing.mostPopular')}</Badge>
                </div>
              )}
              <Card 
                variant={plan.popular ? "gold" : "elevated"} 
                className={`h-full ${plan.popular ? "border-2 border-secondary" : ""}`}
              >
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-foreground">
                      {plan.price === "Free" || plan.price === "Ubuntu" || plan.price === "Custom" || plan.price === "Biravugana" 
                        ? plan.price 
                        : `RWF ${plan.price}`}
                    </span>
                    {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-primary" />
                        </div>
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button variant={plan.variant as any} className="w-full" size="lg" asChild>
                    <Link to={plan.key === "enterprise" ? "/contact" : `/register?plan=${plan.key}`}>{plan.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Payment Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-16 text-center"
        >
          <Card variant="elevated" className="max-w-xl mx-auto">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-2">{t('pricing.paymentInfo.title')}</h3>
              <p className="text-muted-foreground mb-4">
                {t('pricing.paymentInfo.description')}
              </p>
              <div className="bg-primary/10 rounded-lg p-4 inline-block">
                <span className="text-xl font-bold text-primary">+250 798 809 812</span>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                {t('pricing.paymentInfo.note')}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
