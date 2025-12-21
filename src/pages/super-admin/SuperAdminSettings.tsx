import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePageSeo } from "@/hooks/usePageSeo";

export default function SuperAdminSettings() {
  usePageSeo({
    title: "Settings | Super Admin | eKimina",
    description: "Super admin settings for platform configuration.",
    canonicalPath: "/super-admin/settings",
  });

  return (
    <DashboardLayout role="super-admin">
      <main className="space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-foreground">System Settings</h1>
          <p className="text-muted-foreground">High-level settings for the whole platform</p>
        </header>

        <section className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Password security</CardTitle>
              <CardDescription>
                Recommended: enable leaked password protection for stronger security.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant="warning">Needs review</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Platform</CardTitle>
              <CardDescription>More system-wide settings can be added here.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Coming soon.</p>
            </CardContent>
          </Card>
        </section>
      </main>
    </DashboardLayout>
  );
}
