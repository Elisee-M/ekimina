import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Wallet, 
  Users, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Plus,
  Calendar,
  AlertCircle
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const stats = [
  {
    title: "Total Savings",
    value: "RWF 2,450,000",
    change: "+12.5%",
    trend: "up",
    icon: Wallet,
    color: "primary"
  },
  {
    title: "Active Members",
    value: "24",
    change: "+2",
    trend: "up",
    icon: Users,
    color: "accent"
  },
  {
    title: "Active Loans",
    value: "8",
    change: "RWF 1.2M",
    trend: "neutral",
    icon: TrendingUp,
    color: "secondary"
  },
  {
    title: "Profit Earned",
    value: "RWF 245,000",
    change: "+8.3%",
    trend: "up",
    icon: TrendingUp,
    color: "success"
  }
];

const recentContributions = [
  { name: "Jean Claude Ndayisaba", amount: "50,000", date: "Today", status: "completed" },
  { name: "Marie Claire Uwimana", amount: "50,000", date: "Today", status: "completed" },
  { name: "Patrick Mugabo", amount: "50,000", date: "Yesterday", status: "completed" },
  { name: "Diane Mutesi", amount: "50,000", date: "Yesterday", status: "pending" },
  { name: "Emmanuel Habimana", amount: "50,000", date: "2 days ago", status: "late" },
];

const activeLoans = [
  { name: "Jean Claude Ndayisaba", amount: "200,000", remaining: "150,000", dueDate: "Dec 25, 2024", status: "active" },
  { name: "Marie Claire Uwimana", amount: "150,000", remaining: "75,000", dueDate: "Jan 15, 2025", status: "active" },
  { name: "Patrick Mugabo", amount: "100,000", remaining: "25,000", dueDate: "Dec 20, 2024", status: "overdue" },
];

const Dashboard = () => {
  const { profile } = useAuth();

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}! Here's your group overview.
            </p>
          </div>
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

        {/* Stats Grid - Mobile: 2 columns, larger screens: 4 columns */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {stats.map((stat, index) => (
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
                      <div className="flex items-center gap-1">
                        {stat.trend === "up" ? (
                          <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 text-success flex-shrink-0" />
                        ) : stat.trend === "down" ? (
                          <ArrowDownRight className="w-3 h-3 sm:w-4 sm:h-4 text-destructive flex-shrink-0" />
                        ) : null}
                        <span className={`text-xs sm:text-sm font-medium truncate ${
                          stat.trend === "up" ? "text-success" : 
                          stat.trend === "down" ? "text-destructive" : 
                          "text-muted-foreground"
                        }`}>
                          {stat.change}
                        </span>
                      </div>
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
          {/* Recent Contributions - Mobile card view */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <Card variant="elevated">
              <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Recent Contributions</CardTitle>
                <Button variant="ghost" size="sm" className="text-primary text-sm">View All</Button>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-3 sm:space-y-4">
                {recentContributions.map((contribution, i) => (
                  <div key={i} className="flex items-center justify-between py-2 sm:py-3 border-b border-border last:border-0">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs sm:text-sm font-semibold text-primary">
                          {contribution.name.split(" ").slice(0, 2).map(n => n[0]).join("")}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{contribution.name}</p>
                        <p className="text-xs text-muted-foreground">{contribution.date}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="text-sm font-semibold text-foreground">RWF {contribution.amount}</p>
                      <Badge 
                        variant={
                          contribution.status === "completed" ? "success" : 
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
          </motion.div>

          {/* Active Loans - Mobile card view */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            <Card variant="elevated">
              <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Active Loans</CardTitle>
                <Button variant="ghost" size="sm" className="text-primary text-sm">View All</Button>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-3 sm:space-y-4">
                {activeLoans.map((loan, i) => (
                  <div key={i} className="flex items-center justify-between py-2 sm:py-3 border-b border-border last:border-0">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs sm:text-sm font-semibold text-secondary">
                          {loan.name.split(" ").slice(0, 2).map(n => n[0]).join("")}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{loan.name}</p>
                        <p className="text-xs text-muted-foreground">Due: {loan.dueDate}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="text-sm font-semibold text-foreground">RWF {loan.remaining}</p>
                      <p className="text-xs text-muted-foreground">of {loan.amount}</p>
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
          </motion.div>
        </div>

        {/* Alert Banner */}
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
                  3 members have pending contributions for this month
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
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
