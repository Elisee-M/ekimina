import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useTranslation } from "react-i18next";

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-sidebar text-sidebar-foreground py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg gradient-gold flex items-center justify-center">
                <span className="text-secondary-foreground font-bold text-lg">e</span>
              </div>
              <span className="text-xl font-bold">Kimina</span>
            </Link>
            <p className="text-sidebar-foreground/70 text-sm">
              {t('footer.description')}
            </p>
          </div>

          {/* Product */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sidebar-primary">{t('footer.product')}</h4>
            <ul className="space-y-2 text-sm text-sidebar-foreground/70">
              <li><Link to="/#features" className="hover:text-sidebar-foreground transition-colors">{t('nav.features')}</Link></li>
              <li><Link to="/#pricing" className="hover:text-sidebar-foreground transition-colors">{t('nav.pricing')}</Link></li>
              <li><Link to="/#how-it-works" className="hover:text-sidebar-foreground transition-colors">{t('nav.howItWorks')}</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sidebar-primary">{t('footer.company')}</h4>
            <ul className="space-y-2 text-sm text-sidebar-foreground/70">
              <li><Link to="/about" className="hover:text-sidebar-foreground transition-colors">{t('footer.about')}</Link></li>
              <li><Link to="/contact" className="hover:text-sidebar-foreground transition-colors">{t('footer.contact')}</Link></li>
              <li><Link to="/careers" className="hover:text-sidebar-foreground transition-colors">{t('footer.careers')}</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sidebar-primary">{t('footer.legal')}</h4>
            <ul className="space-y-2 text-sm text-sidebar-foreground/70">
              <li><Link to="/privacy" className="hover:text-sidebar-foreground transition-colors">{t('footer.privacy')}</Link></li>
              <li><Link to="/terms" className="hover:text-sidebar-foreground transition-colors">{t('footer.terms')}</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-sidebar-border mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-sidebar-foreground/60">
            {t('footer.copyright')}
          </p>
          <p className="text-sm text-sidebar-foreground/60 flex items-center gap-1">
            Made with <Heart className="w-4 h-4 text-destructive fill-destructive" /> in Rwanda
          </p>
        </div>
      </div>
    </footer>
  );
}
