import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Search, UserCog } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePageSeo } from "@/hooks/usePageSeo";

interface AdminRow {
  user_id: string;
  full_name: string;
  email: string;
  group_name: string;
  group_id: string;
}

export default function SuperAdminAdmins() {
  usePageSeo({
    title: "Admins | Super Admin | eKimina",
    description: "Super admin list of group administrators.",
    canonicalPath: "/super-admin/admins",
  });

  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<AdminRow[]>([]);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);

        const { data: memberships } = await supabase
          .from("group_members")
          .select("user_id, group_id, is_admin, ikimina_groups(name)")
          .eq("status", "active")
          .eq("is_admin", true);

        const ids = Array.from(new Set((memberships || []).map((m: any) => m.user_id)));
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", ids);

        const map = new Map((profiles || []).map((p: any) => [p.id, p]));

        const formatted: AdminRow[] = (memberships || []).map((m: any) => {
          const p = map.get(m.user_id);
          return {
            user_id: m.user_id,
            full_name: p?.full_name || "Unknown",
            email: p?.email || "",
            group_id: m.group_id,
            group_name: m.ikimina_groups?.name || "",
          };
        });

        setRows(formatted);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((r) =>
      r.full_name.toLowerCase().includes(query) ||
      r.email.toLowerCase().includes(query) ||
      r.group_name.toLowerCase().includes(query)
    );
  }, [rows, q]);

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
          <h1 className="text-2xl font-bold text-foreground">Admins</h1>
          <p className="text-muted-foreground">All active group administrators across the system</p>
        </header>

        <section className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search admin name, email, or group..."
              className="pl-10"
              aria-label="Search admins"
            />
          </div>
          <Card className="sm:w-56">
            <CardContent className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <UserCog className="w-4 h-4" />
                <span className="text-sm">Total</span>
              </div>
              <Badge variant="secondary">{rows.length}</Badge>
            </CardContent>
          </Card>
        </section>

        <section>
          <Card>
            <CardHeader>
              <CardTitle>Group Admins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Admin</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Group</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((r) => (
                      <TableRow key={`${r.user_id}-${r.group_id}`}>
                        <TableCell className="font-medium">{r.full_name}</TableCell>
                        <TableCell className="text-muted-foreground">{r.email}</TableCell>
                        <TableCell>{r.group_name}</TableCell>
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
