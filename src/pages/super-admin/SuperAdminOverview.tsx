import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Building2, Users, Wallet, TrendingUp, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePageSeo } from "@/hooks/usePageSeo";
import { Link } from "react-router-dom";

interface GroupRow {
  id: string;
  name: string;
  created_at: string;
}

export default function SuperAdminOverview() {
  usePageSeo({
    title: "Super Admin Overview | eKimina",
    description: "Super admin overview for monitoring all groups, members, contributions and loans.",
    canonicalPath: "/super-admin",
  });

  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [stats, setStats] = useState({
    totalGroups: 0,
    totalMembers: 0,
    totalContributions: 0,
    totalLoans: 0,
  });

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);

        const [{ data: groupRows }, { data: memberRows }, { data: contributionRows }, { data: loanRows }] = await Promise.all([
          supabase.from("ikimina_groups").select("id,name,created_at").order("created_at", { ascending: false }).limit(10),
          supabase.from("group_members").select("id,status").eq("status", "active"),
          supabase.from("contributions").select("amount"),
          supabase.from("loans").select("principal_amount"),
        ]);

        const recentGroups = (groupRows || []) as GroupRow[];
        const totalMembers = (memberRows || []).length;
        const totalContributions = (contributionRows || []).reduce((sum, r: any) => sum + Number(r.amount || 0), 0);
        const totalLoans = (loanRows || []).reduce((sum, r: any) => sum + Number(r.principal_amount || 0), 0);

        setGroups(recentGroups);
        setStats({
          totalGroups: (groupRows || []).length,
          totalMembers,
          totalContributions,
          totalLoans,
        });

        // Total groups needs a real count query
        const { count: groupsCount } = await supabase
          .from("ikimina_groups")
          .select("id", { count: "exact", head: true });

        setStats((s) => ({ ...s, totalGroups: groupsCount || 0 }));
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  const formatCurrency = (amount: number) => new Intl.NumberFormat("en-RW").format(amount);

  const statCards = useMemo(
    () => [
      { title: "Total Groups", value: stats.totalGroups.toLocaleString(), icon: Building2 },
      { title: "Active Members", value: stats.totalMembers.toLocaleString(), icon: Users },
      { title: "Total Contributions", value: `RWF ${formatCurrency(stats.totalContributions)}`, icon: Wallet },
      { title: "Total Loans Issued", value: `RWF ${formatCurrency(stats.totalLoans)}`, icon: TrendingUp },
    ],
    [stats]
  );

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
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">System Overview</h1>
            <p className="text-muted-foreground">Monitor all groups, members, contributions and loans</p>
          </div>
          <Button asChild variant="outline">
            <Link to="/super-admin/groups">
              View all groups <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </header>

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4" aria-label="System stats">
          {statCards.map((c) => (
            <Card key={c.title}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground truncate">{c.title}</p>
                    <p className="text-2xl font-bold text-foreground truncate">{c.value}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <c.icon className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <section>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Groups</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Latest groups created on the platform</p>
              </div>
              <Badge variant="gold">Super Admin</Badge>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Group</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groups.map((g) => (
                      <TableRow key={g.id}>
                        <TableCell className="font-medium">{g.name}</TableCell>
                        <TableCell>{new Date(g.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <Button asChild size="sm" variant="outline">
                            <Link to={`/super-admin/groups`}>Open</Link>
                          </Button>
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
