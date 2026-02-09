import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import ekiminaLogo from "@/assets/ekimina-logo.png";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const scrollToSection = (sectionId: string) => {
    setMobileMenuOpen(false);
    
    // If not on home page, navigate first then scroll
    if (location.pathname !== "/") {
      navigate("/");
      // Wait for navigation then scroll
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        element?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      const element = document.getElementById(sectionId);
      element?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src={ekiminaLogo} alt="eKimina" className="h-12 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => scrollToSection("features")} 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('nav.features')}
            </button>
            <button 
              onClick={() => scrollToSection("how-it-works")} 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('nav.howItWorks')}
            </button>
            <button 
              onClick={() => scrollToSection("pricing")} 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('nav.pricing')}
            </button>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher />
            <Button variant="ghost" asChild>
              <Link to="/login">{t('nav.login')}</Link>
            </Button>
            <Button variant="default" asChild>
              <Link to="/register">{t('nav.getStarted')}</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-foreground"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-card border-b border-border"
          >
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-4">
              <button 
                onClick={() => scrollToSection("features")}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2 text-left"
              >
                {t('nav.features')}
              </button>
              <button 
                onClick={() => scrollToSection("how-it-works")}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2 text-left"
              >
                {t('nav.howItWorks')}
              </button>
              <button 
                onClick={() => scrollToSection("pricing")}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2 text-left"
              >
                {t('nav.pricing')}
              </button>
              <div className="py-2">
                <LanguageSwitcher />
              </div>
              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                <Button variant="ghost" asChild className="justify-center">
                  <Link to="/login">{t('nav.login')}</Link>
                </Button>
                <Button variant="default" asChild className="justify-center">
                  <Link to="/register">{t('nav.getStarted')}</Link>
                </Button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
