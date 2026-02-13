import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { 
  Wallet, 
  Users, 
  TrendingUp, 
  ArrowUpRight,
  Plus,
  Calendar,
  AlertCircle,
  Copy,
  CheckCircle,
  Loader2,
  FileText,
  HandCoins
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const { profile } = useAuth();
  const { loading, stats, recentContributions, activeLoans, groupInfo, pendingContributionsCount } = useDashboardData();
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-RW').format(amount);
  };

  const copyGroupCode = () => {
    if (groupInfo?.id) {
      navigator.clipboard.writeText(groupInfo.id);
      setCopied(true);
      toast({ title: "Group code copied!" });
      setTimeout(() => setCopied(false), 2000);
    }
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

  const statCards = [
    {
      title: "Total Savings",
      value: `RWF ${formatCurrency(stats.totalSavings)}`,
      icon: Wallet,
      color: "primary"
    },
    {
      title: "Active Members",
      value: stats.activeMembers.toString(),
      icon: Users,
      color: "accent"
    },
    {
      title: "Active Loans",
      value: stats.activeLoans.toString(),
      subtext: stats.totalLoansAmount > 0 ? `RWF ${formatCurrency(stats.totalLoansAmount)}` : undefined,
      icon: TrendingUp,
      color: "secondary"
    },
    {
      title: "Profit Earned",
      value: `RWF ${formatCurrency(stats.profitEarned)}`,
      icon: ArrowUpRight,
      color: "success"
    }
  ];

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}!
              {groupInfo && <span className="ml-1">Managing <span className="font-medium text-foreground">{groupInfo.name}</span></span>}
            </p>
            {groupInfo && (
              <Badge variant={groupInfo.plan === "growth" ? "gold" : "muted"} className="mt-1 capitalize w-fit">
                {groupInfo.plan} Plan
              </Badge>
            )}
          </div>
          
          {/* Group Code Card */}
          {groupInfo && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">Share this code to invite members:</p>
                <p className="text-sm font-mono font-medium text-foreground break-all">{groupInfo.id}</p>
              </div>
              <Button variant="outline" size="sm" onClick={copyGroupCode} className="flex-shrink-0">
                {copied ? <CheckCircle className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? "Copied!" : "Copy Code"}
              </Button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button variant="outline" size="sm" className="w-full sm:w-auto h-10">
              <Calendar className="w-4 h-4 mr-2" />
              This Month
            </Button>
            <Button variant="default" size="sm" className="w-full sm:w-auto h-10">
              <Plus className="w-4 h-4 mr-2" />
              Add Contribution
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card variant="stat" className="h-full">
                <CardContent className="p-3 sm:p-4 lg:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="space-y-1 sm:space-y-2 min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">{stat.title}</p>
                      <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground truncate">{stat.value}</p>
                      {stat.subtext && (
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">{stat.subtext}</p>
                      )}
                    </div>
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      stat.color === "primary" ? "bg-primary/10 text-primary" :
                      stat.color === "accent" ? "bg-accent/10 text-accent" :
                      stat.color === "secondary" ? "bg-secondary/10 text-secondary" :
                      "bg-success/10 text-success"
                    }`}>
                      <stat.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Recent Contributions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            {recentContributions.length === 0 ? (
              <EmptyState
                icon={HandCoins}
                title="No contributions yet"
                description="Start recording member contributions to see them here."
                action={
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Record First Contribution
                  </Button>
                }
              />
            ) : (
              <Card variant="elevated">
                <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg">Recent Contributions</CardTitle>
                  <Button variant="ghost" size="sm" className="text-primary text-sm">View All</Button>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 space-y-3 sm:space-y-4">
                  {recentContributions.map((contribution) => (
                    <div key={contribution.id} className="flex items-center justify-between py-2 sm:py-3 border-b border-border last:border-0">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs sm:text-sm font-semibold text-primary">
                            {contribution.memberName.split(" ").slice(0, 2).map(n => n[0]).join("")}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{contribution.memberName}</p>
                          <p className="text-xs text-muted-foreground">{contribution.date}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="text-sm font-semibold text-foreground">RWF {formatCurrency(contribution.amount)}</p>
                        <Badge 
                          variant={
                            contribution.status === "paid" ? "success" : 
                            contribution.status === "pending" ? "warning" : 
                            "overdue"
                          }
                          className="text-xs"
                        >
                          {contribution.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </motion.div>

          {/* Active Loans */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            {activeLoans.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No active loans"
                description="When members take loans, they'll appear here for tracking."
                action={
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Loan
                  </Button>
                }
              />
            ) : (
              <Card variant="elevated">
                <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg">Active Loans</CardTitle>
                  <Button variant="ghost" size="sm" className="text-primary text-sm">View All</Button>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 space-y-3 sm:space-y-4">
                  {activeLoans.map((loan) => (
                    <div key={loan.id} className="flex items-center justify-between py-2 sm:py-3 border-b border-border last:border-0">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs sm:text-sm font-semibold text-secondary">
                            {loan.borrowerName.split(" ").slice(0, 2).map(n => n[0]).join("")}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{loan.borrowerName}</p>
                          <p className="text-xs text-muted-foreground">Due: {new Date(loan.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="text-sm font-semibold text-foreground">RWF {formatCurrency(loan.remaining)}</p>
                        <p className="text-xs text-muted-foreground">of {formatCurrency(loan.totalPayable)}</p>
                        {loan.status === "overdue" && (
                          <Badge variant="overdue" className="mt-1 text-xs">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Overdue
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>

        {/* Alert Banner */}
        {pendingContributionsCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.6 }}
          >
            <Card className="border-warning/30 bg-warning/5">
              <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-warning" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {pendingContributionsCount} member{pendingContributionsCount > 1 ? 's have' : ' has'} pending contributions
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Send reminders to ensure timely payments
                  </p>
                </div>
                <Button variant="secondary" size="sm" className="w-full sm:w-auto h-10">
                  Send Reminders
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
