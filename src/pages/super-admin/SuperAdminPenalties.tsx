import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  Search,
  Filter,
  DollarSign,
  Building2,
  Settings2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { usePageSeo } from "@/hooks/usePageSeo";

interface GroupPenaltyData {
  groupId: string;
  groupName: string;
  rule: {
    penalty_type: string;
    penalty_value: number;
    grace_period_days: number;
    enabled: boolean;
  } | null;
  penalties: {
    id: string;
    memberName: string;
    amount: number;
    reason: string;
    status: string;
    createdAt: string;
  }[];
  stats: {
    pending: number;
    paid: number;
    waived: number;
    totalPending: number;
    totalPaid: number;
  };
}

export default function SuperAdminPenalties() {
  usePageSeo({
    title: "Penalties Overview | Super Admin | eKimina",
    description: "View penalty settings and records for all groups.",
    canonicalPath: "/super-admin/penalties",
  });

  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<GroupPenaltyData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "enabled" | "disabled">("all");

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);

      // Fetch all groups
      const { data: allGroups } = await supabase
        .from("ikimina_groups")
        .select("id, name")
        .order("name");

      if (!allGroups || allGroups.length === 0) {
        setGroups([]);
        return;
      }

      // Fetch all penalty rules
      const { data: rules } = await supabase
        .from("penalty_rules")
        .select("*");

      // Fetch all penalties with profiles
      const { data: allPenalties } = await supabase
        .from("penalties")
        .select("*")
        .order("created_at", { ascending: false });

      // Fetch all profiles for member names
      const memberIds = [...new Set((allPenalties || []).map((p) => p.member_id))];
      let profileMap = new Map<string, string>();
      if (memberIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", memberIds);
        profileMap = new Map((profiles || []).map((p) => [p.id, p.full_name]));
      }

      const rulesMap = new Map((rules || []).map((r) => [r.group_id, r]));
      const penaltiesByGroup = new Map<string, typeof allPenalties>();
      for (const p of allPenalties || []) {
        if (!penaltiesByGroup.has(p.group_id)) penaltiesByGroup.set(p.group_id, []);
        penaltiesByGroup.get(p.group_id)!.push(p);
      }

      const result: GroupPenaltyData[] = allGroups.map((g) => {
        const rule = rulesMap.get(g.id);
        const gPenalties = penaltiesByGroup.get(g.id) || [];
        const pending = gPenalties.filter((p) => p.status === "pending");
        const paid = gPenalties.filter((p) => p.status === "paid");
        const waived = gPenalties.filter((p) => p.status === "waived");

        return {
          groupId: g.id,
          groupName: g.name,
          rule: rule
            ? {
                penalty_type: rule.penalty_type,
                penalty_value: Number(rule.penalty_value),
                grace_period_days: rule.grace_period_days,
                enabled: rule.enabled,
              }
            : null,
          penalties: gPenalties.map((p) => ({
            id: p.id,
            memberName: profileMap.get(p.member_id) || "Unknown",
            amount: Number(p.amount),
            reason: p.reason,
            status: p.status,
            createdAt: p.created_at,
          })),
          stats: {
            pending: pending.length,
            paid: paid.length,
            waived: waived.length,
            totalPending: pending.reduce((s, p) => s + Number(p.amount), 0),
            totalPaid: paid.reduce((s, p) => s + Number(p.amount), 0),
          },
        };
      });

      setGroups(result);
    } catch (error) {
      console.error("Error fetching penalty data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = groups.filter((g) => {
    const matchSearch = g.groupName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFilter =
      filterType === "all" ||
      (filterType === "enabled" && g.rule?.enabled) ||
      (filterType === "disabled" && (!g.rule || !g.rule.enabled));
    return matchSearch && matchFilter;
  });

  const totalPendingAll = groups.reduce((s, g) => s + g.stats.totalPending, 0);
  const totalPaidAll = groups.reduce((s, g) => s + g.stats.totalPaid, 0);
  const totalPendingCount = groups.reduce((s, g) => s + g.stats.pending, 0);
  const enabledGroups = groups.filter((g) => g.rule?.enabled).length;

  const formatCurrency = (n: number) => new Intl.NumberFormat("en-RW").format(n);
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  if (loading) {
    return (
      <DashboardLayout role="super-admin">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="super-admin">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">Penalties Overview</h1>
          <p className="text-muted-foreground">View penalty settings and records across all groups</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Settings2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Groups with Penalties</p>
                  <p className="text-xl font-bold text-foreground">{enabledGroups} / {groups.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending Penalties</p>
                  <p className="text-xl font-bold text-foreground">{totalPendingCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <DollarSign className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Unpaid Amount</p>
                  <p className="text-xl font-bold text-foreground">RWF {formatCurrency(totalPendingAll)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Collected</p>
                  <p className="text-xl font-bold text-foreground">RWF {formatCurrency(totalPaidAll)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search group name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterType} onValueChange={(v) => setFilterType(v as any)}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Groups</SelectItem>
              <SelectItem value="enabled">Penalties Enabled</SelectItem>
              <SelectItem value="disabled">Penalties Disabled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Groups Accordion */}
        {filtered.length === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            title="No groups found"
            description="No groups match your search or filter criteria."
          />
        ) : (
          <Accordion type="multiple" className="space-y-3">
            {filtered.map((group) => (
              <AccordionItem key={group.groupId} value={group.groupId} className="border rounded-lg bg-card">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center gap-3 flex-1 text-left">
                    <Building2 className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground">{group.groupName}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant={group.rule?.enabled ? "success" : "secondary"} className="text-xs">
                          {group.rule?.enabled ? "Enabled" : "Disabled"}
                        </Badge>
                        {group.rule && (
                          <span className="text-xs text-muted-foreground">
                            {group.rule.penalty_type === "percentage"
                              ? `${group.rule.penalty_value}%`
                              : `RWF ${formatCurrency(group.rule.penalty_value)}`}{" "}
                            • {group.rule.grace_period_days} day grace
                          </span>
                        )}
                        {group.stats.pending > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {group.stats.pending} pending
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-medium text-foreground">
                        RWF {formatCurrency(group.stats.totalPending + group.stats.totalPaid)}
                      </p>
                      <p className="text-xs text-muted-foreground">{group.penalties.length} total</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  {/* Rule Config Summary */}
                  {group.rule ? (
                    <Card className="mb-4">
                      <CardContent className="p-4">
                        <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                          <Settings2 className="w-4 h-4" /> Penalty Configuration
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                          <div>
                            <p className="text-muted-foreground">Status</p>
                            <p className="font-medium">{group.rule.enabled ? "Active" : "Inactive"}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Type</p>
                            <p className="font-medium capitalize">{group.rule.penalty_type}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Value</p>
                            <p className="font-medium">
                              {group.rule.penalty_type === "percentage"
                                ? `${group.rule.penalty_value}%`
                                : `RWF ${formatCurrency(group.rule.penalty_value)}`}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Grace Period</p>
                            <p className="font-medium">{group.rule.grace_period_days} days</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <p className="text-sm text-muted-foreground mb-4">No penalty rules configured for this group.</p>
                  )}

                  {/* Penalties Table */}
                  {group.penalties.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No penalty records yet.</p>
                  ) : (
                    <div className="rounded-md border overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Member</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.penalties.slice(0, 20).map((p) => (
                            <TableRow key={p.id}>
                              <TableCell className="font-medium">{p.memberName}</TableCell>
                              <TableCell>RWF {formatCurrency(p.amount)}</TableCell>
                              <TableCell className="capitalize">
                                {p.reason === "late_contribution" ? "Late contribution" : p.reason}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    p.status === "paid"
                                      ? "success"
                                      : p.status === "waived"
                                      ? "secondary"
                                      : "destructive"
                                  }
                                  className="gap-1"
                                >
                                  {p.status === "paid" && <CheckCircle2 className="w-3 h-3" />}
                                  {p.status === "pending" && <Clock className="w-3 h-3" />}
                                  {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground">{formatDate(p.createdAt)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {group.penalties.length > 20 && (
                        <p className="text-xs text-muted-foreground p-3 text-center">
                          Showing 20 of {group.penalties.length} records
                        </p>
                      )}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </motion.div>
    </DashboardLayout>
  );
}
