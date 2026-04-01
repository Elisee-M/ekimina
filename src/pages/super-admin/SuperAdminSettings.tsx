import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePageSeo } from "@/hooks/usePageSeo";
import { useTranslation } from "react-i18next";

export default function SuperAdminSettings() {
  const { t } = useTranslation();
  
  usePageSeo({
    title: "Settings | Super Admin | eKimina",
    description: "Super admin settings for platform configuration.",
    canonicalPath: "/super-admin/settings",
  });

  return (
    <DashboardLayout role="super-admin">
      <main className="space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-foreground">{t('superAdmin.settings.title')}</h1>
          <p className="text-muted-foreground">{t('superAdmin.settings.description')}</p>
        </header>

        <section className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('superAdmin.settings.passwordSecurity')}</CardTitle>
              <CardDescription>
                {t('superAdmin.settings.passwordSecurityDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('superAdmin.settings.status')}</span>
              <Badge variant="warning">{t('superAdmin.settings.needsReview')}</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('superAdmin.settings.platform')}</CardTitle>
              <CardDescription>{t('superAdmin.settings.platformDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{t('superAdmin.settings.comingSoon')}</p>
            </CardContent>
          </Card>
        </section>
      </main>
    </DashboardLayout>
  );
}