import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/EmptyState";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  Search,
  Plus,
  Filter,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  DollarSign,
  Calendar,
  User,
  FileText
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

interface Loan {
  id: string;
  borrower_id: string;
  borrower_name: string;
  principal_amount: number;
  interest_rate: number;
  total_payable: number;
  profit: number;
  duration_months: number;
  start_date: string;
  due_date: string;
  status: 'pending' | 'active' | 'completed' | 'overdue';
  notes: string | null;
  approved_at: string | null;
  total_repaid: number;
}

interface Member {
  id: string;
  user_id: string;
  full_name: string;
}

const Loans = () => {
  const { groupMembership, user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showNewLoanDialog, setShowNewLoanDialog] = useState(false);
  const [showRepaymentDialog, setShowRepaymentDialog] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New loan form state
  const [newLoan, setNewLoan] = useState({
    borrower_id: "",
    principal_amount: "",
    interest_rate: "5",
    duration_months: "3",
    start_date: new Date().toISOString().split('T')[0],
    notes: ""
  });

  // Repayment form state
  const [repaymentAmount, setRepaymentAmount] = useState("");
  const [repaymentNotes, setRepaymentNotes] = useState("");

  // Stats
  const [stats, setStats] = useState({
    totalActive: 0,
    totalAmount: 0,
    totalProfit: 0,
    pendingApproval: 0
  });

  // Available funds for lending
  const [availableFunds, setAvailableFunds] = useState(0);

  useEffect(() => {
    if (groupMembership) {
      fetchLoans();
      fetchMembers();
      fetchAvailableFunds();
    }
  }, [groupMembership]);

  const fetchAvailableFunds = async () => {
    if (!groupMembership) return;

    try {
      // Get total paid contributions
      const { data: contributions } = await supabase
        .from('contributions')
        .select('amount, status')
        .eq('group_id', groupMembership.group_id);

      const totalSavings = (contributions || []).reduce((sum, c) => 
        c.status === 'paid' ? sum + Number(c.amount) : sum, 0
      );

      // Get total outstanding loans (active + pending principal)
      const { data: loans } = await supabase
        .from('loans')
        .select('principal_amount, status')
        .eq('group_id', groupMembership.group_id)
        .in('status', ['active', 'pending', 'overdue']);

      const totalOutstandingLoans = (loans || []).reduce((sum, l) => 
        sum + Number(l.principal_amount), 0
      );

      // Get total repayments received
      const { data: loanIds } = await supabase
        .from('loans')
        .select('id')
        .eq('group_id', groupMembership.group_id)
        .in('status', ['active', 'pending', 'overdue']);

      let totalRepaid = 0;
      if (loanIds && loanIds.length > 0) {
        const { data: repayments } = await supabase
          .from('repayments')
          .select('amount')
          .in('loan_id', loanIds.map(l => l.id));

        totalRepaid = (repayments || []).reduce((sum, r) => sum + Number(r.amount), 0);
      }

      // Available = savings - outstanding loans + repayments received
      const available = totalSavings - totalOutstandingLoans + totalRepaid;
      setAvailableFunds(Math.max(0, available));
    } catch (error) {
      console.error('Error fetching available funds:', error);
    }
  };

  const fetchLoans = async () => {
    if (!groupMembership) return;

    try {
      setLoading(true);
      const { data: loansData, error } = await supabase
        .from('loans')
        .select('*')
        .eq('group_id', groupMembership.group_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch borrower profiles
      const borrowerIds = [...new Set((loansData || []).map(l => l.borrower_id))];
      let profilesMap: Record<string, string> = {};
      if (borrowerIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', borrowerIds);
        
        profilesMap = (profiles || []).reduce((acc, p) => {
          acc[p.id] = p.full_name;
          return acc;
        }, {} as Record<string, string>);
      }

      // Fetch repayments
      const loanIds = (loansData || []).map(l => l.id);
      let repaymentsMap: Record<string, number> = {};
      if (loanIds.length > 0) {
        const { data: repayments } = await supabase
          .from('repayments')
          .select('loan_id, amount')
          .in('loan_id', loanIds);

        repaymentsMap = (repayments || []).reduce((acc, r) => {
          acc[r.loan_id] = (acc[r.loan_id] || 0) + Number(r.amount);
          return acc;
        }, {} as Record<string, number>);
      }

      const formattedLoans: Loan[] = (loansData || []).map(loan => ({
        id: loan.id,
        borrower_id: loan.borrower_id,
        borrower_name: profilesMap[loan.borrower_id] || 'Unknown',
        principal_amount: Number(loan.principal_amount),
        interest_rate: Number(loan.interest_rate),
        total_payable: Number(loan.total_payable),
        profit: Number(loan.profit),
        duration_months: loan.duration_months,
        start_date: loan.start_date,
        due_date: loan.due_date,
        status: loan.status,
        notes: loan.notes,
        approved_at: loan.approved_at,
        total_repaid: repaymentsMap[loan.id] || 0
      }));

      setLoans(formattedLoans);

      // Calculate stats
      const activeLoans = formattedLoans.filter(l => l.status === 'active' || l.status === 'overdue');
      setStats({
        totalActive: activeLoans.length,
        totalAmount: activeLoans.reduce((sum, l) => sum + l.total_payable, 0),
        totalProfit: formattedLoans.reduce((sum, l) => sum + l.profit, 0),
        pendingApproval: formattedLoans.filter(l => l.status === 'pending').length
      });
    } catch (error) {
      console.error('Error fetching loans:', error);
      toast({ title: "Failed to load loans", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    if (!groupMembership) return;

    try {
      const { data: membersData } = await supabase
        .from('group_members')
        .select('id, user_id')
        .eq('group_id', groupMembership.group_id)
        .eq('status', 'active');

      const userIds = (membersData || []).map(m => m.user_id);
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);

        setMembers((membersData || []).map(m => ({
          id: m.id,
          user_id: m.user_id,
          full_name: profiles?.find(p => p.id === m.user_id)?.full_name || 'Unknown'
        })));
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const handleCreateLoan = async (approveImmediately: boolean = false) => {
    if (!groupMembership || !user) return;

    const principalAmount = parseFloat(newLoan.principal_amount);

    // Validate loan amount against available funds
    if (principalAmount > availableFunds) {
      toast({ 
        title: "Insufficient funds", 
        description: `The loan amount (RWF ${formatCurrency(principalAmount)}) exceeds available savings (RWF ${formatCurrency(availableFunds)}).`,
        variant: "destructive" 
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const interestRate = parseFloat(newLoan.interest_rate);
      const durationMonths = parseInt(newLoan.duration_months);
      const profit = principalAmount * (interestRate / 100) * (durationMonths / 12);
      const totalPayable = principalAmount + profit;

      const startDate = new Date(newLoan.start_date);
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + durationMonths);

      const loanData: any = {
        group_id: groupMembership.group_id,
        borrower_id: newLoan.borrower_id,
        principal_amount: principalAmount,
        interest_rate: interestRate,
        total_payable: totalPayable,
        profit: profit,
        duration_months: durationMonths,
        start_date: newLoan.start_date,
        due_date: dueDate.toISOString().split('T')[0],
        notes: newLoan.notes || null,
        status: approveImmediately ? 'active' : 'pending'
      };

      if (approveImmediately) {
        loanData.approved_by = user.id;
        loanData.approved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('loans')
        .insert(loanData);

      if (error) throw error;

      toast({ title: approveImmediately ? "Loan created and approved" : "Loan saved for approval" });
      setShowNewLoanDialog(false);
      setNewLoan({
        borrower_id: "",
        principal_amount: "",
        interest_rate: "5",
        duration_months: "3",
        start_date: new Date().toISOString().split('T')[0],
        notes: ""
      });
      fetchLoans();
    } catch (error: any) {
      console.error('Error creating loan:', error);
      toast({ title: "Failed to create loan", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveLoan = async (loan: Loan) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('loans')
        .update({
          status: 'active',
          approved_by: user.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', loan.id);

      if (error) throw error;

      toast({ title: "Loan approved successfully" });
      fetchLoans();
    } catch (error: any) {
      toast({ title: "Failed to approve loan", description: error.message, variant: "destructive" });
    }
  };

  const handleRejectLoan = async (loan: Loan) => {
    try {
      const { error } = await supabase
        .from('loans')
        .delete()
        .eq('id', loan.id);

      if (error) throw error;

      toast({ title: "Loan request rejected" });
      fetchLoans();
    } catch (error: any) {
      toast({ title: "Failed to reject loan", description: error.message, variant: "destructive" });
    }
  };

  const handleRecordRepayment = async () => {
    if (!selectedLoan || !user) return;

    try {
      setIsSubmitting(true);
      const amount = parseFloat(repaymentAmount);

      const { error } = await supabase
        .from('repayments')
        .insert({
          loan_id: selectedLoan.id,
          amount: amount,
          notes: repaymentNotes || null,
          recorded_by: user.id
        });

      if (error) throw error;

      // Check if loan is fully repaid
      const newTotal = selectedLoan.total_repaid + amount;
      if (newTotal >= selectedLoan.total_payable) {
        await supabase
          .from('loans')
          .update({ status: 'completed' })
          .eq('id', selectedLoan.id);
      }

      toast({ title: "Repayment recorded successfully" });
      setShowRepaymentDialog(false);
      setRepaymentAmount("");
      setRepaymentNotes("");
      setSelectedLoan(null);
      fetchLoans();
    } catch (error: any) {
      toast({ title: "Failed to record repayment", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-RW').format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success"><Clock className="w-3 h-3 mr-1" />Active</Badge>;
      case 'pending':
        return <Badge variant="warning"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'completed':
        return <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'overdue':
        return <Badge variant="overdue"><AlertCircle className="w-3 h-3 mr-1" />Overdue</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const filteredLoans = loans.filter(loan => {
    const matchesSearch = loan.borrower_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || loan.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <DashboardLayout role="admin">
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Loans Management</h1>
            <p className="text-muted-foreground">Manage group loans and track repayments</p>
          </div>
          <Button onClick={() => setShowNewLoanDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Loan
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Loans</p>
                  <p className="text-2xl font-bold">{stats.totalActive}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Outstanding</p>
                  <p className="text-2xl font-bold">RWF {formatCurrency(stats.totalAmount)}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Profit</p>
                  <p className="text-2xl font-bold text-success">RWF {formatCurrency(stats.totalProfit)}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Approval</p>
                  <p className="text-2xl font-bold text-warning">{stats.pendingApproval}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by borrower name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Loans List */}
        {filteredLoans.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No loans found"
            description={searchTerm || statusFilter !== "all" 
              ? "Try adjusting your search or filters" 
              : "Create a new loan to get started"}
            action={
              <Button onClick={() => setShowNewLoanDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create New Loan
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            {filteredLoans.map((loan, index) => (
              <motion.div
                key={loan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-semibold text-primary">
                            {loan.borrower_name.split(" ").slice(0, 2).map(n => n[0]).join("")}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-foreground">{loan.borrower_name}</h3>
                            {getStatusBadge(loan.status)}
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              Principal: RWF {formatCurrency(loan.principal_amount)}
                            </span>
                            <span className="flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              {loan.interest_rate}% interest
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Due: {new Date(loan.due_date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        {/* Progress */}
                        <div className="text-right sm:min-w-[140px]">
                          <p className="text-sm font-semibold text-foreground">
                            RWF {formatCurrency(loan.total_repaid)} / {formatCurrency(loan.total_payable)}
                          </p>
                          <div className="w-full h-2 bg-muted rounded-full mt-1">
                            <div 
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${Math.min((loan.total_repaid / loan.total_payable) * 100, 100)}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {((loan.total_repaid / loan.total_payable) * 100).toFixed(1)}% repaid
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          {loan.status === 'pending' && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleRejectLoan(loan)}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                              <Button 
                                size="sm"
                                onClick={() => handleApproveLoan(loan)}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                            </>
                          )}
                          {(loan.status === 'active' || loan.status === 'overdue') && (
                            <Button 
                              size="sm"
                              onClick={() => {
                                setSelectedLoan(loan);
                                setShowRepaymentDialog(true);
                              }}
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Record Payment
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* New Loan Dialog */}
        <Dialog open={showNewLoanDialog} onOpenChange={setShowNewLoanDialog}>
          <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Loan</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Borrower</Label>
                <Select value={newLoan.borrower_id} onValueChange={(v) => setNewLoan({ ...newLoan, borrower_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select member" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((member) => (
                      <SelectItem key={member.user_id} value={member.user_id}>
                        {member.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Principal Amount (RWF)</Label>
                <Input
                  type="number"
                  placeholder="e.g., 100000"
                  value={newLoan.principal_amount}
                  onChange={(e) => setNewLoan({ ...newLoan, principal_amount: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Interest Rate (%)</Label>
                  <Input
                    type="number"
                    value={newLoan.interest_rate}
                    onChange={(e) => setNewLoan({ ...newLoan, interest_rate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duration (Months)</Label>
                  <Input
                    type="number"
                    value={newLoan.duration_months}
                    onChange={(e) => setNewLoan({ ...newLoan, duration_months: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={newLoan.start_date}
                  onChange={(e) => setNewLoan({ ...newLoan, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Textarea
                  placeholder="Any additional notes..."
                  value={newLoan.notes}
                  onChange={(e) => setNewLoan({ ...newLoan, notes: e.target.value })}
                />
              </div>

              {/* Available Funds Info */}
              <div className={`p-3 rounded-lg ${parseFloat(newLoan.principal_amount || "0") > availableFunds ? 'bg-destructive/10 border border-destructive/30' : 'bg-primary/10'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Available Funds:</span>
                  <span className={`font-bold ${parseFloat(newLoan.principal_amount || "0") > availableFunds ? 'text-destructive' : 'text-primary'}`}>
                    RWF {formatCurrency(availableFunds)}
                  </span>
                </div>
                {parseFloat(newLoan.principal_amount || "0") > availableFunds && (
                  <p className="text-xs text-destructive mt-1">
                    Loan amount exceeds available group savings
                  </p>
                )}
              </div>

              {/* Loan Summary */}
              {newLoan.principal_amount && (
                <div className="p-4 rounded-lg bg-muted space-y-2">
                  <h4 className="font-medium text-sm">Loan Summary</h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Principal:</span>
                      <span>RWF {formatCurrency(parseFloat(newLoan.principal_amount) || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Interest:</span>
                      <span>RWF {formatCurrency(
                        (parseFloat(newLoan.principal_amount) || 0) * 
                        (parseFloat(newLoan.interest_rate) / 100) * 
                        (parseInt(newLoan.duration_months) / 12)
                      )}</span>
                    </div>
                    <div className="flex justify-between font-semibold pt-1 border-t">
                      <span>Total Payable:</span>
                      <span>RWF {formatCurrency(
                        (parseFloat(newLoan.principal_amount) || 0) + 
                        (parseFloat(newLoan.principal_amount) || 0) * 
                        (parseFloat(newLoan.interest_rate) / 100) * 
                        (parseInt(newLoan.duration_months) / 12)
                      )}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setShowNewLoanDialog(false)}>Cancel</Button>
              <Button 
                variant="secondary"
                onClick={() => handleCreateLoan(false)} 
                disabled={!newLoan.borrower_id || !newLoan.principal_amount || isSubmitting || parseFloat(newLoan.principal_amount || "0") > availableFunds}
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Clock className="w-4 h-4 mr-2" />}
                Save as Pending
              </Button>
              <Button 
                onClick={() => handleCreateLoan(true)} 
                disabled={!newLoan.borrower_id || !newLoan.principal_amount || isSubmitting || parseFloat(newLoan.principal_amount || "0") > availableFunds}
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                Create & Approve
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Repayment Dialog */}
        <Dialog open={showRepaymentDialog} onOpenChange={setShowRepaymentDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Record Repayment</DialogTitle>
            </DialogHeader>
            {selectedLoan && (
              <div className="space-y-4 py-4">
                <div className="p-4 rounded-lg bg-muted">
                  <p className="font-medium">{selectedLoan.borrower_name}</p>
                  <p className="text-sm text-muted-foreground">
                    Outstanding: RWF {formatCurrency(selectedLoan.total_payable - selectedLoan.total_repaid)}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Payment Amount (RWF)</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 50000"
                    value={repaymentAmount}
                    onChange={(e) => setRepaymentAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notes (Optional)</Label>
                  <Textarea
                    placeholder="Payment notes..."
                    value={repaymentNotes}
                    onChange={(e) => setRepaymentNotes(e.target.value)}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRepaymentDialog(false)}>Cancel</Button>
              <Button 
                onClick={handleRecordRepayment} 
                disabled={!repaymentAmount || isSubmitting}
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Record Payment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Loans;
