import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, Eye, Loader2, Search, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePageSeo } from "@/hooks/usePageSeo";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface GroupRow {
  id: string;
  name: string;
  created_at: string;
  contribution_frequency: string;
  contribution_amount: number;
  status: string;
  plan: string;
}

export default function SuperAdminGroups() {
  const { t } = useTranslation();
  
  usePageSeo({
    title: "All Groups | Super Admin | eKimina",
    description: "Super admin view of all savings groups in the platform.",
    canonicalPath: "/super-admin/groups",
  });

  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [groups, setGroups] = useState<GroupRow[]>([]);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const { data } = await supabase
          .from("ikimina_groups")
          .select("id,name,created_at,contribution_frequency,contribution_amount,status,plan")
          .order("created_at", { ascending: false });
        setGroups((data || []) as GroupRow[]);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return groups;
    return groups.filter((g) => g.name.toLowerCase().includes(query) || g.id.toLowerCase().includes(query));
  }, [groups, q]);

  const formatCurrency = (amount: number) => new Intl.NumberFormat("en-RW").format(amount);

  const toggleGroupStatus = async (group: GroupRow) => {
    const newStatus = group.status === "active" ? "disabled" : "active";
    const { error } = await supabase
      .from("ikimina_groups")
      .update({ status: newStatus })
      .eq("id", group.id);

    if (error) {
      toast.error(t('superAdmin.groups.failedUpdate'));
      return;
    }

    setGroups((prev) =>
      prev.map((g) => (g.id === group.id ? { ...g, status: newStatus } : g))
    );
    toast.success(newStatus === "active" ? t('superAdmin.groups.enabledSuccess') : t('superAdmin.groups.disabledSuccess'));
  };

  const deleteGroup = async (groupId: string) => {
    try {
      const response = await supabase.functions.invoke("delete-group-users", {
        body: { groupId },
      });

      if (response.error) throw response.error;

      const data = response.data;
      setGroups((prev) => prev.filter((g) => g.id !== groupId));
      toast.success(
        `Group deleted. ${data.deletedUsers} user(s) removed, ${data.skippedUsers} user(s) kept (belong to other groups).`
      );
    } catch (error) {
      console.error("Error deleting group:", error);
      toast.error(t('superAdmin.groups.failedDelete'));
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="super-admin">
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="super-admin">
      <main className="space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-foreground">{t('superAdmin.groups.title')}</h1>
          <p className="text-muted-foreground">{t('superAdmin.groups.description')}</p>
        </header>

        <section className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('superAdmin.groups.searchPlaceholder')}
              className="pl-10"
              aria-label={t('superAdmin.groups.title')}
            />
          </div>
          <Card className="sm:w-56">
            <CardContent className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="w-4 h-4" />
                <span className="text-sm">{t('superAdmin.groups.total')}</span>
              </div>
              <Badge variant="secondary">{groups.length}</Badge>
            </CardContent>
          </Card>
        </section>

        <section>
          <Card>
            <CardHeader>
              <CardTitle>{t('superAdmin.groups.groups')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('superAdmin.groups.name')}</TableHead>
                      <TableHead>{t('superAdmin.groups.plan')}</TableHead>
                      <TableHead>{t('superAdmin.groups.status')}</TableHead>
                      <TableHead>{t('superAdmin.groups.frequency')}</TableHead>
                      <TableHead>{t('superAdmin.groups.contribution')}</TableHead>
                      <TableHead>{t('superAdmin.groups.created')}</TableHead>
                      <TableHead className="text-right">{t('superAdmin.groups.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((g) => (
                      <TableRow key={g.id}>
                        <TableCell className="font-medium">{g.name}</TableCell>
                        <TableCell>
                          <Badge variant={g.plan === "growth" ? "gold" : "muted"} className="capitalize">
                            {g.plan || "starter"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={g.status === "active" ? "default" : "secondary"}>
                            {g.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize">{g.contribution_frequency}</TableCell>
                        <TableCell>RWF {formatCurrency(Number(g.contribution_amount || 0))}</TableCell>
                        <TableCell>{new Date(g.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button asChild variant="ghost" size="sm" title={t('superAdmin.overview.viewDetails')}>
                            <Link to={`/super-admin/groups/${g.id}`}>
                              <Eye className="w-4 h-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleGroupStatus(g)}
                            title={g.status === "active" ? t('superAdmin.groups.disableGroup') : t('superAdmin.groups.enableGroup')}
                          >
                            {g.status === "active" ? (
                              <ToggleRight className="w-4 h-4 text-green-600" />
                            ) : (
                              <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                            )}
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" title={t('superAdmin.groups.deleteGroup')}>
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t('superAdmin.groups.deleteGroup')}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t('superAdmin.groups.deleteConfirm', { name: g.name })}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteGroup(g.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {t('common.delete')}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </DashboardLayout>
  );
}