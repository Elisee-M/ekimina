import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";

export function CTASection() {
  const { t } = useTranslation();

  return (
    <section className="py-24 gradient-hero relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-foreground rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto space-y-8"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground">
            {t('cta.title')}
          </h2>
          <p className="text-lg text-primary-foreground/80">
            {t('cta.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="gold" size="xl" asChild>
              <Link to="/register">
                {t('cta.primary')}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button variant="outline-light" size="xl" asChild>
              <Link to="/contact">{t('cta.secondary')}</Link>
            </Button>
          </div>
          <p className="text-sm text-primary-foreground/60">
            {t('cta.note')}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
