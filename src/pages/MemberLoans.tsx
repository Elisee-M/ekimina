import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/EmptyState";
import { 
  TrendingUp, 
  Clock,
  CheckCircle2,
  Loader2,
  Calendar,
  Wallet,
  AlertCircle
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMemberData } from "@/hooks/useMemberData";
import { supabase } from "@/integrations/supabase/client";

interface LoanRecord {
  id: string;
  principal_amount: number;
  total_payable: number;
  interest_rate: number;
  status: string;
  start_date: string;
  due_date: string;
  remaining: number;
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-RW').format(amount);
  };

  useEffect(() => {
    const fetchLoansAndRepayments = async () => {
      if (!user || !groupMembership?.group_id) {
        setLoading(false);
        return;
      }

      try {
        // Fetch member's loans
        const { data: loansData, error: loansError } = await supabase
          .from('loans')
          .select('*')
          .eq('borrower_id', user.id)
          .eq('group_id', groupMembership.group_id)
          .order('created_at', { ascending: false });

        if (loansError) throw loansError;

        // Fetch repayments for these loans
        if (loansData && loansData.length > 0) {
          const loanIds = loansData.map(loan => loan.id);
          
          const { data: repaymentsData, error: repaymentsError } = await supabase
            .from('repayments')
            .select('*')
            .in('loan_id', loanIds)
            .order('payment_date', { ascending: false });

          if (repaymentsError) throw repaymentsError;

          // Calculate remaining for each loan
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

    fetchLoansAndRepayments();
  }, [user, groupMembership?.group_id]);

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
  const completedLoans = loans.filter(l => l.status === 'completed');
  const totalBorrowed = loans.reduce((sum, l) => sum + l.principal_amount, 0);

  return (
    <DashboardLayout role="member">
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">My Loans</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            View your loan history and repayments
            {groupInfo && <span className="ml-1">in <span className="font-medium text-foreground">{groupInfo.name}</span></span>}
          </p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card variant="stat">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Borrowed</p>
                    <p className="text-2xl font-bold text-foreground">
                      RWF {formatCurrency(totalBorrowed)}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card variant="stat">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Balance</p>
                    <p className="text-2xl font-bold text-foreground">
                      RWF {formatCurrency(activeLoan?.remaining || 0)}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-secondary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card variant="stat">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Loans Completed</p>
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

        {/* Active Loan Details */}
        {activeLoan && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <AlertCircle className="w-5 h-5 text-primary" />
                  Active Loan
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Principal</p>
                    <p className="text-lg font-semibold text-foreground">RWF {formatCurrency(activeLoan.principal_amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Payable</p>
                    <p className="text-lg font-semibold text-foreground">RWF {formatCurrency(activeLoan.total_payable)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Interest Rate</p>
                    <p className="text-lg font-semibold text-foreground">{activeLoan.interest_rate}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Due Date</p>
                    <p className="text-lg font-semibold text-foreground">
                      {new Date(activeLoan.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Repayment Progress</span>
                    <span className="font-medium text-foreground">
                      {Math.round(((activeLoan.total_payable - activeLoan.remaining) / activeLoan.total_payable) * 100)}%
                    </span>
                  </div>
                  <Progress 
                    value={((activeLoan.total_payable - activeLoan.remaining) / activeLoan.total_payable) * 100} 
                    className="h-3" 
                  />
                  <p className="text-sm text-muted-foreground">
                    RWF {formatCurrency(activeLoan.total_payable - activeLoan.remaining)} paid • RWF {formatCurrency(activeLoan.remaining)} remaining
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Loan History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          {loans.length === 0 ? (
            <EmptyState
              icon={TrendingUp}
              title="No loans yet"
              description="Your loan history will appear here once you take a loan from the group."
            />
          ) : (
            <Card variant="elevated">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Clock className="w-5 h-5 text-primary" />
                  Loan History ({loans.length})
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
                        variant={loan.status === "completed" ? "success" : loan.status === "active" ? "warning" : "overdue"}
                        className="w-24 justify-center text-xs"
                      >
                        {loan.status === "completed" ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Completed
                          </>
                        ) : loan.status === "active" ? (
                          <>
                            <Clock className="w-3 h-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3 mr-1" />
                            {loan.status}
                          </>
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            <Card variant="elevated">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Calendar className="w-5 h-5 text-success" />
                  Recent Repayments
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-2 sm:space-y-3">
                {repayments.slice(0, 10).map((repayment) => (
                  <div key={repayment.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-border last:border-0 gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        Repayment
                      </p>
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
      </div>
    </DashboardLayout>
  );
};

export default MemberLoans;
