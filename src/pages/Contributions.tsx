import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Wallet, Plus, Search, CheckCircle2, Clock, AlertCircle, Filter } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Contribution {
  id: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  avatarUrl: string | null;
  amount: number;
  status: string;
  dueDate: string;
  paidDate: string | null;
}

interface MemberOption {
  id: string;
  fullName: string;
}

export default function Contributions() {
  const { user, groupMembership } = useAuth();
  const [loading, setLoading] = useState(true);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [recordDialog, setRecordDialog] = useState(false);
  const [markPaidDialog, setMarkPaidDialog] = useState<Contribution | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [groupInfo, setGroupInfo] = useState<{ contributionAmount: number } | null>(null);

  const [newContribution, setNewContribution] = useState({
    memberId: "",
    amount: "",
    dueDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    if (groupMembership) {
      fetchData();
    }
  }, [groupMembership]);

  const fetchData = async () => {
    if (!groupMembership) return;

    try {
      // Fetch group info
      const { data: groupData } = await supabase
        .from("ikimina_groups")
        .select("contribution_amount")
        .eq("id", groupMembership.group_id)
        .single();

      if (groupData) {
        setGroupInfo({ contributionAmount: groupData.contribution_amount });
        setNewContribution((prev) => ({
          ...prev,
          amount: groupData.contribution_amount.toString(),
        }));
      }

      // Fetch members
      const { data: membersData } = await supabase
        .from("group_members")
        .select("user_id")
        .eq("group_id", groupMembership.group_id)
        .eq("status", "active");

      const userIds = membersData?.map((m) => m.user_id) || [];

      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url")
        .in("id", userIds);

      const memberOptions: MemberOption[] = (profilesData || []).map((p) => ({
        id: p.id,
        fullName: p.full_name,
      }));
      setMembers(memberOptions);

      // Fetch contributions
      const { data: contributionsData, error } = await supabase
        .from("contributions")
        .select("*")
        .eq("group_id", groupMembership.group_id)
        .order("due_date", { ascending: false });

      if (error) throw error;

      const profilesMap = new Map(
        profilesData?.map((p) => [p.id, { fullName: p.full_name, email: p.email, avatarUrl: p.avatar_url }])
      );

      const formattedContributions: Contribution[] = (contributionsData || []).map((c) => {
        const profile = profilesMap.get(c.member_id);
        return {
          id: c.id,
          memberId: c.member_id,
          memberName: profile?.fullName || "Unknown",
          memberEmail: profile?.email || "",
          avatarUrl: profile?.avatarUrl || null,
          amount: Number(c.amount),
          status: c.status,
          dueDate: c.due_date,
          paidDate: c.paid_date,
        };
      });

      setContributions(formattedContributions);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load contributions");
    } finally {
      setLoading(false);
    }
  };

  const filteredContributions = contributions.filter((c) => {
    const matchesSearch =
      c.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.memberEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    const contributionDate = new Date(c.paidDate || c.dueDate);
    const matchesStartDate = !startDate || contributionDate >= new Date(startDate);
    const matchesEndDate = !endDate || contributionDate <= new Date(endDate);
    return matchesSearch && matchesStatus && matchesStartDate && matchesEndDate;
  });

  const handleRecordContribution = async () => {
    if (!newContribution.memberId || !newContribution.amount || !groupMembership || !user) {
      toast.error("Please fill all fields");
      return;
    }

    setActionLoading(true);
    try {
      const { error } = await supabase.from("contributions").insert({
        group_id: groupMembership.group_id,
        member_id: newContribution.memberId,
        amount: parseFloat(newContribution.amount),
        due_date: newContribution.dueDate,
        status: "pending",
        recorded_by: user.id,
      });

      if (error) throw error;

      toast.success("Contribution recorded successfully");
      setRecordDialog(false);
      setNewContribution({
        memberId: "",
        amount: groupInfo?.contributionAmount.toString() || "",
        dueDate: new Date().toISOString().split("T")[0],
      });
      fetchData();
    } catch (error) {
      console.error("Error recording contribution:", error);
      toast.error("Failed to record contribution");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!markPaidDialog) return;

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("contributions")
        .update({
          status: "paid",
          paid_date: new Date().toISOString().split("T")[0],
        })
        .eq("id", markPaidDialog.id);

      if (error) throw error;

      toast.success(`Contribution marked as paid`);
      setMarkPaidDialog(null);
      fetchData();
    } catch (error) {
      console.error("Error updating contribution:", error);
      toast.error("Failed to update contribution");
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("en-RW");
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Paid
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="warning" className="gap-1">
            <Clock className="w-3 h-3" />
            Pending
          </Badge>
        );
      case "overdue":
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="w-3 h-3" />
            Overdue
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Stats
  const totalPaid = contributions.filter((c) => c.status === "paid").reduce((sum, c) => sum + c.amount, 0);
  const pendingCount = contributions.filter((c) => c.status === "pending").length;
  const overdueCount = contributions.filter((c) => c.status === "overdue").length;

  if (loading) {
    return (
      <DashboardLayout role="admin">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Contributions</h1>
            <p className="text-muted-foreground">
              Track and manage member contributions
            </p>
          </div>
          <Button className="gap-2" onClick={() => setRecordDialog(true)}>
            <Plus className="w-4 h-4" />
            Record Contribution
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Collected</p>
                  <p className="text-xl font-bold text-foreground">RWF {formatCurrency(totalPaid)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Clock className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-xl font-bold text-foreground">{pendingCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Overdue</p>
                  <p className="text-xl font-bold text-foreground">{overdueCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by member name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2 items-center">
            <Input
              type="date"
              placeholder="From"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-36"
            />
            <span className="text-muted-foreground">to</span>
            <Input
              type="date"
              placeholder="To"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-36"
            />
          </div>
        </div>

        {/* Contributions List */}
        {filteredContributions.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="No contributions found"
            description={
              searchQuery || statusFilter !== "all"
                ? "Try adjusting your filters"
                : "Record your first contribution to get started"
            }
          />
        ) : (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Wallet className="w-5 h-5 text-primary" />
                Contribution Records
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {filteredContributions.map((contribution) => (
                  <div
                    key={contribution.id}
                    className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={contribution.avatarUrl || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(contribution.memberName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">{contribution.memberName}</p>
                        <p className="text-sm text-muted-foreground">Due: {formatDate(contribution.dueDate)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold text-foreground">RWF {formatCurrency(contribution.amount)}</p>
                        {contribution.paidDate && (
                          <p className="text-xs text-muted-foreground">Paid: {formatDate(contribution.paidDate)}</p>
                        )}
                      </div>
                      {getStatusBadge(contribution.status)}
                      {contribution.status !== "paid" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setMarkPaidDialog(contribution)}
                        >
                          Mark Paid
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Record Contribution Dialog */}
        <Dialog open={recordDialog} onOpenChange={setRecordDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Contribution</DialogTitle>
              <DialogDescription>Add a new contribution record for a group member.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Member</Label>
                <Select
                  value={newContribution.memberId}
                  onValueChange={(value) => setNewContribution((prev) => ({ ...prev, memberId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select member" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Amount (RWF)</Label>
                <Input
                  type="number"
                  value={newContribution.amount}
                  onChange={(e) => setNewContribution((prev) => ({ ...prev, amount: e.target.value }))}
                  placeholder="Enter amount"
                />
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={newContribution.dueDate}
                  onChange={(e) => setNewContribution((prev) => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRecordDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleRecordContribution} disabled={actionLoading}>
                {actionLoading ? "Recording..." : "Record"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Mark as Paid Dialog */}
        <Dialog open={!!markPaidDialog} onOpenChange={() => setMarkPaidDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mark as Paid</DialogTitle>
              <DialogDescription>
                Confirm that {markPaidDialog?.memberName}'s contribution of RWF{" "}
                {formatCurrency(markPaidDialog?.amount || 0)} has been received.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setMarkPaidDialog(null)}>
                Cancel
              </Button>
              <Button onClick={handleMarkAsPaid} disabled={actionLoading}>
                {actionLoading ? "Processing..." : "Confirm Payment"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </DashboardLayout>
  );
}
