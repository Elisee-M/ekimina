import { motion } from "framer-motion";
import { Users, Wallet, BarChart3, Repeat } from "lucide-react";
import { useTranslation } from "react-i18next";

const stepIcons = [Users, Wallet, Repeat, BarChart3];
const stepKeys = ["step1", "step2", "step3", "step4"];

export function HowItWorksSection() {
  const { t } = useTranslation();

  return (
    <section id="how-it-works" className="py-24 gradient-subtle">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t('howItWorks.title')} <span className="text-primary">{t('howItWorks.titleHighlight')}</span> {t('howItWorks.titleEnd')}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t('howItWorks.description')}
          </p>
        </motion.div>

        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2" />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stepKeys.map((stepKey, index) => {
              const Icon = stepIcons[index];
              const stepNumber = String(index + 1).padStart(2, '0');
              
              return (
                <motion.div
                  key={stepKey}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.15 }}
                  className="relative"
                >
                  <div className="bg-card rounded-2xl p-8 shadow-elegant border border-border text-center relative z-10">
                    {/* Step Number */}
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full gradient-hero flex items-center justify-center">
                      <span className="text-xs font-bold text-primary-foreground">{stepNumber}</span>
                    </div>

                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6 mt-2">
                      <Icon className="w-8 h-8 text-primary" />
                    </div>

                    <h3 className="text-xl font-semibold text-foreground mb-3">
                      {t(`howItWorks.${stepKey}.title`)}
                    </h3>
                    <p className="text-muted-foreground">
                      {t(`howItWorks.${stepKey}.description`)}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
