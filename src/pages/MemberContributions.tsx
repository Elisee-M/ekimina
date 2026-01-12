import { useState } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/EmptyState";
import { 
  Wallet, 
  Clock,
  CheckCircle2,
  Loader2,
  HandCoins,
  Search,
  Calendar
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMemberData } from "@/hooks/useMemberData";

const MemberContributions = () => {
  const { profile } = useAuth();
  const { loading, stats, contributions, groupInfo } = useMemberData();
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-RW').format(amount);
  };

  const filteredContributions = contributions.filter(contribution => {
    const matchesSearch = contribution.month.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Date filtering
    let matchesDate = true;
    if (startDate || endDate) {
      const contributionDate = new Date(contribution.date);
      if (startDate) {
        matchesDate = matchesDate && contributionDate >= new Date(startDate);
      }
      if (endDate) {
        matchesDate = matchesDate && contributionDate <= new Date(endDate);
      }
    }
    
    return matchesSearch && matchesDate;
  });

  if (loading) {
    return (
      <DashboardLayout role="member">
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="member">
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">My Contributions</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            View your contribution history
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
                    <p className="text-sm text-muted-foreground">Total Contributed</p>
                    <p className="text-2xl font-bold text-foreground">
                      RWF {formatCurrency(stats.totalContributed)}
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
                    <p className="text-sm text-muted-foreground">Payments Made</p>
                    <p className="text-2xl font-bold text-foreground">{stats.contributionCount}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-success" />
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
                    <p className="text-sm text-muted-foreground">Monthly Amount</p>
                    <p className="text-2xl font-bold text-foreground">
                      RWF {formatCurrency(groupInfo?.contributionAmount || 0)}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-secondary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by month..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full sm:w-auto"
                  placeholder="Start Date"
                />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full sm:w-auto"
                  placeholder="End Date"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contributions List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          {filteredContributions.length === 0 ? (
            <EmptyState
              icon={HandCoins}
              title="No contributions found"
              description={contributions.length === 0 
                ? "Your contribution history will appear here once payments are recorded."
                : "No contributions match your search criteria."
              }
            />
          ) : (
            <Card variant="elevated">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Clock className="w-5 h-5 text-primary" />
                  Contribution History ({filteredContributions.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-2 sm:space-y-3">
                {filteredContributions.map((contribution) => (
                  <div key={contribution.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-border last:border-0 gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{contribution.month}</p>
                      <p className="text-xs text-muted-foreground">{contribution.date}</p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                      <p className="text-sm font-semibold text-foreground">RWF {formatCurrency(contribution.amount)}</p>
                      <Badge 
                        variant={contribution.status === "paid" ? "success" : contribution.status === "pending" ? "warning" : "overdue"}
                        className="w-20 sm:w-24 justify-center text-xs"
                      >
                        {contribution.status === "paid" ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Paid
                          </>
                        ) : contribution.status === "pending" ? (
                          <>
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 mr-1" />
                            {contribution.status}
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
      </div>
    </DashboardLayout>
  );
};

export default MemberContributions;
