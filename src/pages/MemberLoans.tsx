import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/EmptyState";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  TrendingUp, 
  Clock,
  CheckCircle2,
  Loader2,
  Calendar,
  Wallet,
  AlertCircle,
  Plus,
  Send
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMemberData } from "@/hooks/useMemberData";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

interface LoanRecord {
  id: string;
  principal_amount: number;
  total_payable: number;
  interest_rate: number;
  status: string;
  start_date: string;
  due_date: string;
  remaining: number;
  duration_months: number;
  notes: string | null;
}

interface RepaymentRecord {
  id: string;
  amount: number;
  payment_date: string;
  notes: string | null;
}

const MemberLoans = () => {
  const { user, groupMembership } = useAuth();
  const { loading: memberLoading, stats, groupInfo } = useMemberData();
  const [loans, setLoans] = useState<LoanRecord[]>([]);
  const [repayments, setRepayments] = useState<RepaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  const [loanRequest, setLoanRequest] = useState({
    principal_amount: "",
    duration_months: "3",
    notes: ""
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-RW').format(amount);
  };

  const fetchLoansAndRepayments = async () => {
    if (!user || !groupMembership?.group_id) {
      setLoading(false);
      return;
    }

    try {
      const { data: loansData, error: loansError } = await supabase
        .from('loans')
        .select('*')
        .eq('borrower_id', user.id)
        .eq('group_id', groupMembership.group_id)
        .order('created_at', { ascending: false });

      if (loansError) throw loansError;

      if (loansData && loansData.length > 0) {
        const loanIds = loansData.map(loan => loan.id);
        
        const { data: repaymentsData, error: repaymentsError } = await supabase
          .from('repayments')
          .select('*')
          .in('loan_id', loanIds)
          .order('payment_date', { ascending: false });

        if (repaymentsError) throw repaymentsError;

        const loansWithRemaining = loansData.map(loan => {
          const loanRepayments = repaymentsData?.filter(r => r.loan_id === loan.id) || [];
          const totalRepaid = loanRepayments.reduce((sum, r) => sum + r.amount, 0);
          return {
            ...loan,
            remaining: loan.total_payable - totalRepaid
          };
        });

        setLoans(loansWithRemaining);
        setRepayments(repaymentsData || []);
      } else {
        setLoans([]);
        setRepayments([]);
      }
    } catch (error) {
      console.error('Error fetching loans:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoansAndRepayments();
  }, [user, groupMembership?.group_id]);

  const handleRequestLoan = async () => {
    if (!user || !groupMembership?.group_id || !groupInfo) return;

    const principalAmount = parseFloat(loanRequest.principal_amount);
    if (!principalAmount || principalAmount <= 0) {
      toast({ title: t('memberLoans.invalidAmount'), variant: "destructive" });
      return;
    }

    try {
      setIsSubmitting(true);

      const interestRate = groupInfo.interestRate;
      const durationMonths = parseInt(loanRequest.duration_months);
      const profit = principalAmount * (interestRate / 100) * (durationMonths / 12);
      const totalPayable = principalAmount + profit;

      const startDate = new Date();
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + durationMonths);

      const { error } = await supabase
        .from('loans')
        .insert({
          group_id: groupMembership.group_id,
          borrower_id: user.id,
          principal_amount: principalAmount,
          interest_rate: interestRate,
          total_payable: totalPayable,
          profit: profit,
          duration_months: durationMonths,
          start_date: startDate.toISOString().split('T')[0],
          due_date: dueDate.toISOString().split('T')[0],
          notes: loanRequest.notes || null,
          status: 'pending' as const
        });

      if (error) throw error;

      toast({ title: t('memberLoans.requestSent'), description: t('memberLoans.requestSentDesc') });
      setShowRequestDialog(false);
      setLoanRequest({ principal_amount: "", duration_months: "3", notes: "" });
      fetchLoansAndRepayments();
    } catch (error: any) {
      console.error('Error requesting loan:', error);
      toast({ title: t('memberLoans.requestFailed'), description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || memberLoading) {
    return (
      <DashboardLayout role="member">
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const activeLoan = loans.find(l => l.status === 'active');
  const pendingLoans = loans.filter(l => l.status === 'pending');
  const completedLoans = loans.filter(l => l.status === 'completed');
  const totalBorrowed = loans.reduce((sum, l) => sum + l.principal_amount, 0);
  const hasPendingOrActive = loans.some(l => l.status === 'pending' || l.status === 'active' || l.status === 'overdue');

  return (
    <DashboardLayout role="member">
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">{t('memberLoans.title')}</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {t('memberLoans.description')}
              {groupInfo && <span className="ml-1">{t('dashboard.memberOf')} <span className="font-medium text-foreground">{groupInfo.name}</span></span>}
            </p>
          </div>
          {!hasPendingOrActive && (
            <Button onClick={() => setShowRequestDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              {t('memberLoans.requestLoan')}
            </Button>
          )}
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card variant="stat">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('memberLoans.totalBorrowed')}</p>
                    <p className="text-2xl font-bold text-foreground">RWF {formatCurrency(totalBorrowed)}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
            <Card variant="stat">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('memberLoans.activeBalance')}</p>
                    <p className="text-2xl font-bold text-foreground">RWF {formatCurrency(activeLoan?.remaining || 0)}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-secondary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
            <Card variant="stat">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('memberLoans.loansCompleted')}</p>
                    <p className="text-2xl font-bold text-foreground">{completedLoans.length}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-success" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Pending Loan Requests */}
        {pendingLoans.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.25 }}>
            <Card className="border-warning/30 bg-warning/5">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Clock className="w-5 h-5 text-warning" />
                  {t('memberLoans.pendingRequests')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-3">
                {pendingLoans.map((loan) => (
                  <div key={loan.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-border last:border-0 gap-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        RWF {formatCurrency(loan.principal_amount)} - {loan.duration_months} {t('memberLoans.months')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t('memberLoans.totalPayable')}: RWF {formatCurrency(loan.total_payable)} ({loan.interest_rate}% {t('loansPage.interest')})
                      </p>
                      {loan.notes && <p className="text-xs text-muted-foreground mt-1">{loan.notes}</p>}
                    </div>
                    <Badge variant="warning" className="w-fit">
                      <Clock className="w-3 h-3 mr-1" />
                      {t('memberLoans.awaitingApproval')}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Active Loan Details */}
        {activeLoan && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 }}>
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <AlertCircle className="w-5 h-5 text-primary" />
                  {t('memberLoans.activeLoan')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('memberLoans.principal')}</p>
                    <p className="text-lg font-semibold text-foreground">RWF {formatCurrency(activeLoan.principal_amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('memberLoans.totalPayable')}</p>
                    <p className="text-lg font-semibold text-foreground">RWF {formatCurrency(activeLoan.total_payable)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('memberLoans.interestRate')}</p>
                    <p className="text-lg font-semibold text-foreground">{activeLoan.interest_rate}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('memberLoans.dueDate')}</p>
                    <p className="text-lg font-semibold text-foreground">
                      {new Date(activeLoan.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('memberLoans.repaymentProgress')}</span>
                    <span className="font-medium text-foreground">
                      {Math.round(((activeLoan.total_payable - activeLoan.remaining) / activeLoan.total_payable) * 100)}%
                    </span>
                  </div>
                  <Progress 
                    value={((activeLoan.total_payable - activeLoan.remaining) / activeLoan.total_payable) * 100} 
                    className="h-3" 
                  />
                  <p className="text-sm text-muted-foreground">
                    RWF {formatCurrency(activeLoan.total_payable - activeLoan.remaining)} {t('common.paid')} • RWF {formatCurrency(activeLoan.remaining)} {t('dashboard.remaining')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Loan History */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.4 }}>
          {loans.length === 0 ? (
            <EmptyState
              icon={TrendingUp}
              title={t('memberLoans.noLoans')}
              description={t('memberLoans.noLoansDesc')}
              action={
                <Button onClick={() => setShowRequestDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t('memberLoans.requestLoan')}
                </Button>
              }
            />
          ) : (
            <Card variant="elevated">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Clock className="w-5 h-5 text-primary" />
                  {t('memberLoans.loanHistory')} ({loans.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-2 sm:space-y-3">
                {loans.map((loan) => (
                  <div key={loan.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-border last:border-0 gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        RWF {formatCurrency(loan.principal_amount)} at {loan.interest_rate}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(loan.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} → {new Date(loan.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                      <p className="text-sm font-semibold text-foreground">RWF {formatCurrency(loan.total_payable)}</p>
                      <Badge 
                        variant={loan.status === "completed" ? "success" : loan.status === "active" ? "warning" : loan.status === "pending" ? "secondary" : "overdue"}
                        className="w-24 justify-center text-xs"
                      >
                        {loan.status === "completed" ? (
                          <><CheckCircle2 className="w-3 h-3 mr-1" />{t('common.completed')}</>
                        ) : loan.status === "active" ? (
                          <><Clock className="w-3 h-3 mr-1" />{t('common.active')}</>
                        ) : loan.status === "pending" ? (
                          <><Clock className="w-3 h-3 mr-1" />{t('common.pending')}</>
                        ) : (
                          <><AlertCircle className="w-3 h-3 mr-1" />{loan.status}</>
                        )}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Recent Repayments */}
        {repayments.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.5 }}>
            <Card variant="elevated">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Calendar className="w-5 h-5 text-success" />
                  {t('memberLoans.recentRepayments')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-2 sm:space-y-3">
                {repayments.slice(0, 10).map((repayment) => (
                  <div key={repayment.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-border last:border-0 gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{t('memberLoans.repayment')}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(repayment.payment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-success">RWF {formatCurrency(repayment.amount)}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Request Loan Dialog */}
        <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
          <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('memberLoans.requestLoanTitle')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{t('memberLoans.amountLabel')}</Label>
                <Input
                  type="number"
                  placeholder={t('memberLoans.amountPlaceholder')}
                  value={loanRequest.principal_amount}
                  onChange={(e) => setLoanRequest({ ...loanRequest, principal_amount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('memberLoans.durationLabel')}</Label>
                <Input
                  type="number"
                  min="1"
                  max="24"
                  value={loanRequest.duration_months}
                  onChange={(e) => setLoanRequest({ ...loanRequest, duration_months: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('memberLoans.reasonLabel')}</Label>
                <Textarea
                  placeholder={t('memberLoans.reasonPlaceholder')}
                  value={loanRequest.notes}
                  onChange={(e) => setLoanRequest({ ...loanRequest, notes: e.target.value })}
                />
              </div>

              {/* Loan Summary */}
              {loanRequest.principal_amount && groupInfo && (
                <div className="p-4 rounded-lg bg-muted space-y-2">
                  <h4 className="font-medium text-sm">{t('memberLoans.loanSummary')}</h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('memberLoans.principal')}:</span>
                      <span>RWF {formatCurrency(parseFloat(loanRequest.principal_amount) || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('memberLoans.interestRate')}:</span>
                      <span>{groupInfo.interestRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('loansPage.interest')}:</span>
                      <span>RWF {formatCurrency(
                        (parseFloat(loanRequest.principal_amount) || 0) * 
                        (groupInfo.interestRate / 100) * 
                        (parseInt(loanRequest.duration_months) / 12)
                      )}</span>
                    </div>
                    <div className="flex justify-between font-semibold pt-1 border-t">
                      <span>{t('memberLoans.totalPayable')}:</span>
                      <span>RWF {formatCurrency(
                        (parseFloat(loanRequest.principal_amount) || 0) + 
                        (parseFloat(loanRequest.principal_amount) || 0) * 
                        (groupInfo.interestRate / 100) * 
                        (parseInt(loanRequest.duration_months) / 12)
                      )}</span>
                    </div>
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                {t('memberLoans.requestNote')}
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRequestDialog(false)}>{t('common.cancel')}</Button>
              <Button 
                onClick={handleRequestLoan} 
                disabled={!loanRequest.principal_amount || isSubmitting}
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                {t('memberLoans.submitRequest')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default MemberLoans;