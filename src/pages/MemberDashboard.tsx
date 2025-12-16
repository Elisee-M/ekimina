import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Wallet, 
  TrendingUp, 
  Calendar,
  Bell,
  Clock,
  CheckCircle2
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const memberStats = {
  totalContributed: "600,000",
  currentLoan: "150,000",
  loanRemaining: "75,000",
  nextPayment: "25,000",
  nextPaymentDate: "Dec 20, 2024"
};

const contributionHistory = [
  { month: "December 2024", amount: "50,000", status: "pending", date: "Due Dec 15" },
  { month: "November 2024", amount: "50,000", status: "completed", date: "Nov 12" },
  { month: "October 2024", amount: "50,000", status: "completed", date: "Oct 10" },
  { month: "September 2024", amount: "50,000", status: "completed", date: "Sep 8" },
  { month: "August 2024", amount: "50,000", status: "completed", date: "Aug 15" },
  { month: "July 2024", amount: "50,000", status: "completed", date: "Jul 12" },
];

const announcements = [
  { 
    title: "Monthly Meeting Reminder", 
    content: "Our next group meeting is scheduled for December 20th at 2:00 PM.",
    date: "2 days ago"
  },
  { 
    title: "Interest Rate Update", 
    content: "Starting January, our loan interest rate will be adjusted to 3% per month.",
    date: "1 week ago"
  },
];

const MemberDashboard = () => {
  const { profile } = useAuth();
  const loanProgress = ((150000 - 75000) / 150000) * 100;
  const displayName = profile?.full_name?.split(' ')[0] || 'Member';

  return (
    <DashboardLayout role="member">
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">My Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Welcome back, {displayName}! Here's your account summary.
          </p>
        </div>

        {/* Stats Cards - Stack on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Total Contributions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card variant="stat">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 sm:space-y-2 min-w-0">
                    <p className="text-sm text-muted-foreground">Total Contributed</p>
                    <p className="text-2xl sm:text-3xl font-bold text-foreground">RWF {memberStats.totalContributed}</p>
                    <p className="text-sm text-success flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      12 months active
                    </p>
                  </div>
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Wallet className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Active Loan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card variant="stat">
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <p className="text-sm text-muted-foreground">Active Loan</p>
                      <p className="text-2xl sm:text-3xl font-bold text-foreground">RWF {memberStats.loanRemaining}</p>
                      <p className="text-sm text-muted-foreground">remaining of {memberStats.currentLoan}</p>
                    </div>
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 text-secondary" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Repayment Progress</span>
                      <span className="font-medium text-foreground">{Math.round(loanProgress)}%</span>
                    </div>
                    <Progress value={loanProgress} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Payment Reminder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-12 h-12 rounded-full gradient-hero flex items-center justify-center flex-shrink-0">
                <Calendar className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base sm:text-lg font-semibold text-foreground">
                  Next Payment Due: {memberStats.nextPaymentDate}
                </p>
                <p className="text-sm text-muted-foreground">
                  Loan repayment: RWF {memberStats.nextPayment} + Monthly contribution: RWF 50,000
                </p>
              </div>
              <Button variant="hero" className="w-full sm:w-auto h-11">
                Pay Now
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content Grid - Stack on mobile */}
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Contribution History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="lg:col-span-2"
          >
            <Card variant="elevated">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Clock className="w-5 h-5 text-primary" />
                  Contribution History
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-2 sm:space-y-3">
                {contributionHistory.map((contribution, i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-border last:border-0 gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{contribution.month}</p>
                      <p className="text-xs text-muted-foreground">{contribution.date}</p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                      <p className="text-sm font-semibold text-foreground">RWF {contribution.amount}</p>
                      <Badge 
                        variant={contribution.status === "completed" ? "success" : "warning"}
                        className="w-20 sm:w-24 justify-center text-xs"
                      >
                        {contribution.status === "completed" ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Paid
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </>
                        )}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Announcements */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <Card variant="elevated">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Bell className="w-5 h-5 text-secondary" />
                  Announcements
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-3 sm:space-y-4">
                {announcements.map((announcement, i) => (
                  <div key={i} className="p-3 sm:p-4 rounded-lg bg-muted/50 border border-border">
                    <p className="text-sm font-semibold text-foreground mb-1">{announcement.title}</p>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-3">{announcement.content}</p>
                    <p className="text-xs text-muted-foreground">{announcement.date}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MemberDashboard;
