import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/EmptyState";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  Search,
  Filter,
  DollarSign,
  Ban,
  Play,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePageSeo } from "@/hooks/usePageSeo";
import { useTranslation } from "react-i18next";

interface Penalty {
  id: string;
  memberId: string;
  memberName: string;
  amount: number;
  reason: string;
  status: string;
  createdAt: string;
  contributionDueDate?: string;
}

export default function Penalties() {
  const { t } = useTranslation();
  const { groupMembership } = useAuth();
  const [loading, setLoading] = useState(true);
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [waiveDialog, setWaiveDialog] = useState<Penalty | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [runningAuto, setRunningAuto] = useState(false);

  usePageSeo({
    title: "Penalties | eKimina",
    description: "Manage automatic penalties for late contributions.",
    canonicalPath: "/dashboard/penalties",
  });

  useEffect(() => {
    if (groupMembership?.group_id) fetchPenalties();
  }, [groupMembership?.group_id]);

  const fetchPenalties = async () => {
    if (!groupMembership?.group_id) return;
    try {
      setLoading(true);

      const { data: penaltyRows, error } = await supabase
        .from("penalties")
        .select("*, contributions(due_date)")
        .eq("group_id", groupMembership.group_id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const memberIds = [...new Set((penaltyRows || []).map((p: any) => p.member_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", memberIds);

      const profileMap = new Map((profiles || []).map((p) => [p.id, p.full_name]));

      setPenalties(
        (penaltyRows || []).map((p: any) => ({
          id: p.id,
          memberId: p.member_id,
          memberName: profileMap.get(p.member_id) || "Unknown",
          amount: Number(p.amount),
          reason: p.reason,
          status: p.status,
          createdAt: p.created_at,
          contributionDueDate: p.contributions?.due_date,
        }))
      );
    } catch (error) {
      console.error("Error fetching penalties:", error);
      toast.error("Failed to load penalties");
    } finally {
      setLoading(false);
    }
  };

  const handleWaive = async () => {
    if (!waiveDialog) return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("penalties")
        .update({ status: "waived" })
        .eq("id", waiveDialog.id);
      if (error) throw error;
      toast.success("Penalty waived");
      setWaiveDialog(null);
      fetchPenalties();
    } catch (error: any) {
      toast.error("Failed to waive penalty");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkPaid = async (penalty: Penalty) => {
    try {
      const { error } = await supabase
        .from("penalties")
        .update({ status: "paid" })
        .eq("id", penalty.id);
      if (error) throw error;
      toast.success("Penalty marked as paid");
      fetchPenalties();
    } catch {
      toast.error("Failed to update penalty");
    }
  };

  const handleRunAuto = async () => {
    setRunningAuto(true);
    try {
      const { data, error } = await supabase.functions.invoke("apply-penalties");
      if (error) throw error;
      toast.success(data?.message || "Penalties applied");
      fetchPenalties();
    } catch (error: any) {
      toast.error("Failed to run auto-penalties: " + (error.message || "Unknown error"));
    } finally {
      setRunningAuto(false);
    }
  };

  const filtered = penalties.filter((p) => {
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    const matchSearch = p.memberName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  const totalPending = penalties.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0);
  const totalPaid = penalties.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const pendingCount = penalties.filter((p) => p.status === "pending").length;

  const formatCurrency = (n: number) => new Intl.NumberFormat("en-RW").format(n);
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  if (loading) {
    return (
      <DashboardLayout role="admin">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('penalties.title', 'Penalties')}</h1>
            <p className="text-muted-foreground">{t('penalties.description', 'Manage late contribution penalties')}</p>
          </div>
          <Button onClick={handleRunAuto} disabled={runningAuto} variant="outline" className="gap-2">
            {runningAuto ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {t('penalties.runAuto', 'Run Auto-Penalties')}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('penalties.pendingPenalties', 'Pending Penalties')}</p>
                  <p className="text-xl font-bold text-foreground">{pendingCount}</p>
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
                  <p className="text-sm text-muted-foreground">{t('penalties.unpaidAmount', 'Unpaid Amount')}</p>
                  <p className="text-xl font-bold text-foreground">RWF {formatCurrency(totalPending)}</p>
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
                  <p className="text-sm text-muted-foreground">{t('penalties.collected', 'Collected')}</p>
                  <p className="text-xl font-bold text-foreground">RWF {formatCurrency(totalPaid)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search member..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="waived">Waived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            title={t('penalties.noPenalties', 'No penalties found')}
            description={t('penalties.noPenaltiesDesc', 'Penalties will appear here when auto-applied to late contributions.')}
          />
        ) : (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                {t('penalties.penaltyRecords', 'Penalty Records')} ({filtered.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {filtered.map((penalty) => (
                  <div key={penalty.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-destructive/10 text-destructive">
                          {getInitials(penalty.memberName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">{penalty.memberName}</p>
                        <p className="text-sm text-muted-foreground">
                          {penalty.reason === "late_contribution" ? "Late Contribution" : penalty.reason}
                          {penalty.contributionDueDate && ` • Due: ${formatDate(penalty.contributionDueDate)}`}
                        </p>
                        <p className="text-xs text-muted-foreground">Applied: {formatDate(penalty.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-semibold text-foreground">RWF {formatCurrency(penalty.amount)}</p>
                      </div>
                      <Badge
                        variant={
                          penalty.status === "paid" ? "success" : penalty.status === "waived" ? "secondary" : "destructive"
                        }
                        className="gap-1"
                      >
                        {penalty.status === "paid" && <CheckCircle2 className="w-3 h-3" />}
                        {penalty.status === "pending" && <Clock className="w-3 h-3" />}
                        {penalty.status === "waived" && <Ban className="w-3 h-3" />}
                        {penalty.status.charAt(0).toUpperCase() + penalty.status.slice(1)}
                      </Badge>
                      {penalty.status === "pending" && (
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm" onClick={() => handleMarkPaid(penalty)}>
                            Paid
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setWaiveDialog(penalty)}>
                            Waive
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Waive Dialog */}
        <Dialog open={!!waiveDialog} onOpenChange={() => setWaiveDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Waive Penalty</DialogTitle>
              <DialogDescription>
                Are you sure you want to waive the RWF {waiveDialog ? formatCurrency(waiveDialog.amount) : 0} penalty for {waiveDialog?.memberName}?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setWaiveDialog(null)}>Cancel</Button>
              <Button variant="destructive" onClick={handleWaive} disabled={actionLoading}>
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Waive Penalty
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </DashboardLayout>
  );
}
