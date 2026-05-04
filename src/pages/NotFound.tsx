import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { usePageSeo } from "@/hooks/usePageSeo";

const NotFound = () => {
  usePageSeo({ title: "Page Not Found | eKimina", description: "The page you're looking for doesn't exist." });
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center gradient-subtle">
      <div className="text-center space-y-6 p-8">
        <div className="w-24 h-24 rounded-full gradient-hero flex items-center justify-center mx-auto">
          <span className="text-4xl font-bold text-primary-foreground">404</span>
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">{t('notFound.title')}</h1>
          <p className="text-muted-foreground max-w-md">{t('notFound.description')}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" asChild><Link to="/"><ArrowLeft className="w-4 h-4 mr-2" />{t('common.goBack')}</Link></Button>
          <Button variant="default" asChild><Link to="/"><Home className="w-4 h-4 mr-2" />{t('common.homePage')}</Link></Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
