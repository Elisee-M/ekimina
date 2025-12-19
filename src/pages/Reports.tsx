import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Users,
  Calendar,
  Download,
  FileText,
  Loader2,
  DollarSign,
  PieChart,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from "recharts";

interface MonthlyData {
  month: string;
  contributions: number;
  loans: number;
  repayments: number;
}

interface ContributionStatus {
  status: string;
  count: number;
  amount: number;
}

interface LoanStatus {
  status: string;
  count: number;
  amount: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))'];

const Reports = () => {
  const { groupMembership } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("6months");

  // Report data
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [contributionsByStatus, setContributionsByStatus] = useState<ContributionStatus[]>([]);
  const [loansByStatus, setLoansByStatus] = useState<LoanStatus[]>([]);
  const [summary, setSummary] = useState({
    totalContributions: 0,
    totalContributionsAmount: 0,
    totalLoans: 0,
    totalLoansAmount: 0,
    totalRepayments: 0,
    totalRepaymentsAmount: 0,
    profitEarned: 0,
    activeMembers: 0,
    collectionRate: 0,
    avgLoanSize: 0
  });

  useEffect(() => {
    if (groupMembership) {
      fetchReportData();
    }
  }, [groupMembership, period]);

  const fetchReportData = async () => {
    if (!groupMembership) return;

    try {
      setLoading(true);
      const groupId = groupMembership.group_id;

      // Calculate date range based on period
      const endDate = new Date();
      const startDate = new Date();
      switch (period) {
        case "1month":
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case "3months":
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case "6months":
          startDate.setMonth(startDate.getMonth() - 6);
          break;
        case "1year":
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate.setMonth(startDate.getMonth() - 6);
      }

      // Fetch contributions
      const { data: contributions } = await supabase
        .from('contributions')
        .select('*')
        .eq('group_id', groupId)
        .gte('created_at', startDate.toISOString());

      // Fetch loans
      const { data: loans } = await supabase
        .from('loans')
        .select('*')
        .eq('group_id', groupId);

      // Fetch repayments
      const loanIds = (loans || []).map(l => l.id);
      let repayments: any[] = [];
      if (loanIds.length > 0) {
        const { data: repData } = await supabase
          .from('repayments')
          .select('*')
          .in('loan_id', loanIds)
          .gte('created_at', startDate.toISOString());
        repayments = repData || [];
      }

      // Fetch active members
      const { count: activeMembers } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', groupId)
        .eq('status', 'active');

      // Process monthly data
      const monthlyMap: Record<string, MonthlyData> = {};
      const months = getMonthsInRange(startDate, endDate);
      months.forEach(month => {
        monthlyMap[month] = { month, contributions: 0, loans: 0, repayments: 0 };
      });

      (contributions || []).forEach(c => {
        if (c.status === 'paid') {
          const month = new Date(c.paid_date || c.created_at).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
          if (monthlyMap[month]) {
            monthlyMap[month].contributions += Number(c.amount);
          }
        }
      });

      (loans || []).forEach(l => {
        const month = new Date(l.created_at).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        if (monthlyMap[month]) {
          monthlyMap[month].loans += Number(l.principal_amount);
        }
      });

      repayments.forEach(r => {
        const month = new Date(r.payment_date || r.created_at).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        if (monthlyMap[month]) {
          monthlyMap[month].repayments += Number(r.amount);
        }
      });

      setMonthlyData(Object.values(monthlyMap));

      // Process contributions by status
      const contribStatusMap: Record<string, ContributionStatus> = {};
      (contributions || []).forEach(c => {
        if (!contribStatusMap[c.status]) {
          contribStatusMap[c.status] = { status: c.status, count: 0, amount: 0 };
        }
        contribStatusMap[c.status].count++;
        contribStatusMap[c.status].amount += Number(c.amount);
      });
      setContributionsByStatus(Object.values(contribStatusMap));

      // Process loans by status
      const loanStatusMap: Record<string, LoanStatus> = {};
      (loans || []).forEach(l => {
        if (!loanStatusMap[l.status]) {
          loanStatusMap[l.status] = { status: l.status, count: 0, amount: 0 };
        }
        loanStatusMap[l.status].count++;
        loanStatusMap[l.status].amount += Number(l.total_payable);
      });
      setLoansByStatus(Object.values(loanStatusMap));

      // Calculate summary
      const totalContributions = (contributions || []).length;
      const paidContributions = (contributions || []).filter(c => c.status === 'paid');
      const totalContributionsAmount = paidContributions.reduce((sum, c) => sum + Number(c.amount), 0);
      const totalLoansAmount = (loans || []).reduce((sum, l) => sum + Number(l.total_payable), 0);
      const totalRepaymentsAmount = repayments.reduce((sum, r) => sum + Number(r.amount), 0);
      const profitEarned = (loans || []).reduce((sum, l) => sum + Number(l.profit), 0);
      const collectionRate = totalContributions > 0 
        ? (paidContributions.length / totalContributions) * 100 
        : 0;
      const avgLoanSize = (loans || []).length > 0 
        ? (loans || []).reduce((sum, l) => sum + Number(l.principal_amount), 0) / loans!.length 
        : 0;

      setSummary({
        totalContributions,
        totalContributionsAmount,
        totalLoans: (loans || []).length,
        totalLoansAmount,
        totalRepayments: repayments.length,
        totalRepaymentsAmount,
        profitEarned,
        activeMembers: activeMembers || 0,
        collectionRate,
        avgLoanSize
      });

    } catch (error) {
      console.error('Error fetching report data:', error);
      toast({ title: "Failed to load report data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const getMonthsInRange = (start: Date, end: Date): string[] => {
    const months: string[] = [];
    const current = new Date(start);
    while (current <= end) {
      months.push(current.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));
      current.setMonth(current.getMonth() + 1);
    }
    return months;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-RW').format(amount);
  };

  const exportReport = () => {
    // Create CSV content
    let csv = "eKimina Financial Report\n\n";
    csv += "Summary\n";
    csv += `Total Contributions,RWF ${formatCurrency(summary.totalContributionsAmount)}\n`;
    csv += `Total Loans,RWF ${formatCurrency(summary.totalLoansAmount)}\n`;
    csv += `Total Repayments,RWF ${formatCurrency(summary.totalRepaymentsAmount)}\n`;
    csv += `Profit Earned,RWF ${formatCurrency(summary.profitEarned)}\n`;
    csv += `Active Members,${summary.activeMembers}\n`;
    csv += `Collection Rate,${summary.collectionRate.toFixed(1)}%\n\n`;

    csv += "Monthly Data\n";
    csv += "Month,Contributions,Loans Disbursed,Repayments\n";
    monthlyData.forEach(m => {
      csv += `${m.month},${m.contributions},${m.loans},${m.repayments}\n`;
    });

    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ekimina-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({ title: "Report exported successfully" });
  };

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
            <h1 className="text-2xl font-bold text-foreground">Financial Reports</h1>
            <p className="text-muted-foreground">View group financial analytics and insights</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-40">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1month">Last Month</SelectItem>
                <SelectItem value="3months">Last 3 Months</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="1year">Last Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportReport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Savings</p>
                    <p className="text-xl font-bold">RWF {formatCurrency(summary.totalContributionsAmount)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{summary.totalContributions} contributions</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Loans</p>
                    <p className="text-xl font-bold">RWF {formatCurrency(summary.totalLoansAmount)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{summary.totalLoans} loans</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-secondary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Profit Earned</p>
                    <p className="text-xl font-bold text-success">RWF {formatCurrency(summary.profitEarned)}</p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center">
                      <ArrowUpRight className="w-3 h-3 text-success mr-1" />
                      From interest
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-success" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Collection Rate</p>
                    <p className="text-xl font-bold">{summary.collectionRate.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground mt-1">{summary.activeMembers} active members</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Monthly Trends */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Monthly Cash Flow
                </CardTitle>
              </CardHeader>
              <CardContent>
                {monthlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        formatter={(value: number) => [`RWF ${formatCurrency(value)}`, '']}
                      />
                      <Legend />
                      <Bar dataKey="contributions" name="Contributions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="repayments" name="Repayments" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="loans" name="Loans" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    <p>No data available for the selected period</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Contribution Status */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-primary" />
                  Contributions by Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {contributionsByStatus.length > 0 ? (
                  <div className="flex items-center gap-4">
                    <ResponsiveContainer width="50%" height={250}>
                      <RechartsPieChart>
                        <Pie
                          data={contributionsByStatus}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="count"
                          nameKey="status"
                        >
                          {contributionsByStatus.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-3">
                      {contributionsByStatus.map((item, index) => (
                        <div key={item.status} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="text-sm capitalize">{item.status}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{item.count}</p>
                            <p className="text-xs text-muted-foreground">RWF {formatCurrency(item.amount)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                    <p>No contribution data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Loan Status */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Loans Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loansByStatus.length > 0 ? (
                  <div className="space-y-4">
                    {loansByStatus.map((item, index) => (
                      <div key={item.status} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium capitalize">{item.status}</span>
                          <span className="text-sm text-muted-foreground">{item.count} loans</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all"
                              style={{ 
                                width: `${(item.amount / summary.totalLoansAmount) * 100}%`,
                                backgroundColor: COLORS[index % COLORS.length]
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium w-32 text-right">
                            RWF {formatCurrency(item.amount)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                    <p>No loan data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Key Metrics */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Key Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Average Loan Size</p>
                        <p className="text-xs text-muted-foreground">Per loan disbursed</p>
                      </div>
                    </div>
                    <p className="text-lg font-bold">RWF {formatCurrency(summary.avgLoanSize)}</p>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-success" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Repayments Collected</p>
                        <p className="text-xs text-muted-foreground">{summary.totalRepayments} payments</p>
                      </div>
                    </div>
                    <p className="text-lg font-bold">RWF {formatCurrency(summary.totalRepaymentsAmount)}</p>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Per Member Savings</p>
                        <p className="text-xs text-muted-foreground">Average contribution</p>
                      </div>
                    </div>
                    <p className="text-lg font-bold">
                      RWF {formatCurrency(summary.activeMembers > 0 ? summary.totalContributionsAmount / summary.activeMembers : 0)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-warning" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Net Position</p>
                        <p className="text-xs text-muted-foreground">Savings - Outstanding Loans</p>
                      </div>
                    </div>
                    <p className={`text-lg font-bold ${summary.totalContributionsAmount - summary.totalLoansAmount >= 0 ? 'text-success' : 'text-destructive'}`}>
                      RWF {formatCurrency(Math.abs(summary.totalContributionsAmount - summary.totalLoansAmount))}
                      {summary.totalContributionsAmount - summary.totalLoansAmount >= 0 ? (
                        <ArrowUpRight className="w-4 h-4 inline ml-1" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 inline ml-1" />
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
