import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, Loader2, Search, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePageSeo } from "@/hooks/usePageSeo";
import { toast } from "sonner";
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
}

export default function SuperAdminGroups() {
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
          .select("id,name,created_at,contribution_frequency,contribution_amount,status")
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
      toast.error("Failed to update group status");
      return;
    }

    setGroups((prev) =>
      prev.map((g) => (g.id === group.id ? { ...g, status: newStatus } : g))
    );
    toast.success(`Group ${newStatus === "active" ? "enabled" : "disabled"} successfully`);
  };

  const deleteGroup = async (groupId: string) => {
    const { error } = await supabase.from("ikimina_groups").delete().eq("id", groupId);

    if (error) {
      toast.error("Failed to delete group. It may have related data.");
      return;
    }

    setGroups((prev) => prev.filter((g) => g.id !== groupId));
    toast.success("Group deleted successfully");
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
          <h1 className="text-2xl font-bold text-foreground">All Groups</h1>
          <p className="text-muted-foreground">System-wide list of groups</p>
        </header>

        <section className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by group name or ID..."
              className="pl-10"
              aria-label="Search groups"
            />
          </div>
          <Card className="sm:w-56">
            <CardContent className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="w-4 h-4" />
                <span className="text-sm">Total</span>
              </div>
              <Badge variant="secondary">{groups.length}</Badge>
            </CardContent>
          </Card>
        </section>

        <section>
          <Card>
            <CardHeader>
              <CardTitle>Groups</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Contribution</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((g) => (
                      <TableRow key={g.id}>
                        <TableCell className="font-medium">{g.name}</TableCell>
                        <TableCell>
                          <Badge variant={g.status === "active" ? "default" : "secondary"}>
                            {g.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize">{g.contribution_frequency}</TableCell>
                        <TableCell>RWF {formatCurrency(Number(g.contribution_amount || 0))}</TableCell>
                        <TableCell>{new Date(g.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleGroupStatus(g)}
                            title={g.status === "active" ? "Disable group" : "Enable group"}
                          >
                            {g.status === "active" ? (
                              <ToggleRight className="w-4 h-4 text-green-600" />
                            ) : (
                              <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                            )}
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" title="Delete group">
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Group</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{g.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteGroup(g.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
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
