import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/EmptyState";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  History as HistoryIcon,
  Wallet,
  TrendingUp,
  CreditCard,
  Calendar,
  Filter,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface ActivityRecord {
  id: string;
  type: 'contribution' | 'loan' | 'repayment';
  description: string;
  amount: number;
  date: string;
  status?: string;
  memberName?: string;
}

export default function History() {
  const { user, groupMembership, isSuperAdmin, isGroupAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const isAdmin = isSuperAdmin || isGroupAdmin;
  const dashboardRole = isAdmin ? 'admin' : 'member';

  useEffect(() => {
    if (groupMembership) {
      fetchActivities();
    }
  }, [groupMembership]);

  const fetchActivities = async () => {
    if (!groupMembership || !user) return;

    try {
      setLoading(true);
      const groupId = groupMembership.group_id;
      const allActivities: ActivityRecord[] = [];

      // Build profile map for admin view
      let profilesMap: Record<string, string> = {};
      if (isAdmin) {
        const { data: members } = await supabase
          .from('group_members')
          .select('user_id')
          .eq('group_id', groupId)
          .eq('status', 'active');

        const userIds = members?.map(m => m.user_id) || [];
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', userIds);

          profilesMap = (profiles || []).reduce((acc, p) => {
            acc[p.id] = p.full_name;
            return acc;
          }, {} as Record<string, string>);
        }
      }

      // Fetch contributions
      let contributionsQuery = supabase
        .from('contributions')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });

      if (!isAdmin) {
        contributionsQuery = contributionsQuery.eq('member_id', user.id);
      }

      const { data: contributions } = await contributionsQuery;

      (contributions || []).forEach(c => {
        allActivities.push({
          id: `contrib-${c.id}`,
          type: 'contribution',
          description: isAdmin 
            ? `${profilesMap[c.member_id] || 'Member'} contribution`
            : 'Monthly contribution',
          amount: Number(c.amount),
          date: c.status === 'paid' && c.paid_date ? c.paid_date : c.due_date,
          status: c.status,
          memberName: profilesMap[c.member_id],
        });
      });

      // Fetch loans
      let loansQuery = supabase
        .from('loans')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });

      if (!isAdmin) {
        loansQuery = loansQuery.eq('borrower_id', user.id);
      }

      const { data: loans } = await loansQuery;

      // Build borrower name map
      if (isAdmin && loans && loans.length > 0) {
        const borrowerIds = [...new Set(loans.map(l => l.borrower_id))];
        const { data: borrowerProfiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', borrowerIds);

        (borrowerProfiles || []).forEach(p => {
          profilesMap[p.id] = p.full_name;
        });
      }

      (loans || []).forEach(l => {
        allActivities.push({
          id: `loan-${l.id}`,
          type: 'loan',
          description: isAdmin 
            ? `Loan to ${profilesMap[l.borrower_id] || 'Member'}`
            : 'Loan received',
          amount: Number(l.principal_amount),
          date: l.start_date,
          status: l.status,
          memberName: profilesMap[l.borrower_id],
        });
      });

      // Fetch repayments
      const loanIds = (loans || []).map(l => l.id);
      if (loanIds.length > 0) {
        const { data: repayments } = await supabase
          .from('repayments')
          .select('*')
          .in('loan_id', loanIds)
          .order('created_at', { ascending: false });

        const loanBorrowerMap = (loans || []).reduce((acc, l) => {
          acc[l.id] = l.borrower_id;
          return acc;
        }, {} as Record<string, string>);

        (repayments || []).forEach(r => {
          const borrowerId = loanBorrowerMap[r.loan_id];
          allActivities.push({
            id: `repay-${r.id}`,
            type: 'repayment',
            description: isAdmin 
              ? `Repayment from ${profilesMap[borrowerId] || 'Member'}`
              : 'Loan repayment',
            amount: Number(r.amount),
            date: r.payment_date,
            memberName: profilesMap[borrowerId],
          });
        });
      }

      // Sort by date descending
      allActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setActivities(allActivities);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredActivities = activities.filter(activity => {
    const matchesType = typeFilter === 'all' || activity.type === typeFilter;
    const activityDate = new Date(activity.date);
    const matchesStartDate = !startDate || activityDate >= new Date(startDate);
    const matchesEndDate = !endDate || activityDate <= new Date(endDate);
    return matchesType && matchesStartDate && matchesEndDate;
  });

  // Group by date
  const groupedActivities = filteredActivities.reduce((groups, activity) => {
    const date = new Date(activity.date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(activity);
    return groups;
  }, {} as Record<string, ActivityRecord[]>);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-RW').format(amount);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'contribution':
        return <Wallet className="w-4 h-4" />;
      case 'loan':
        return <TrendingUp className="w-4 h-4" />;
      case 'repayment':
        return <CreditCard className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'paid':
      case 'completed':
        return (
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="w-3 h-3" />
            {status === 'paid' ? 'Paid' : 'Completed'}
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="warning" className="gap-1">
            <Clock className="w-3 h-3" />
            Pending
          </Badge>
        );
      case 'active':
        return (
          <Badge variant="default" className="gap-1">
            <Clock className="w-3 h-3" />
            Active
          </Badge>
        );
      case 'overdue':
        return (
          <Badge variant="overdue" className="gap-1">
            <AlertCircle className="w-3 h-3" />
            Overdue
          </Badge>
        );
      default:
        return null;
    }
  };

  const clearFilters = () => {
    setTypeFilter("all");
    setStartDate("");
    setEndDate("");
  };

  if (loading) {
    return (
      <DashboardLayout role={dashboardRole}>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role={dashboardRole}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Activity History</h1>
          <p className="text-muted-foreground">
            {isAdmin ? 'View all group activities by date' : 'View your activity history'}
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Type</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="contribution">Contributions</SelectItem>
                    <SelectItem value="loan">Loans</SelectItem>
                    <SelectItem value="repayment">Repayments</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium text-muted-foreground">From Date</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium text-muted-foreground">To Date</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <Button variant="outline" onClick={clearFilters}>
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Activities Timeline */}
        {Object.keys(groupedActivities).length === 0 ? (
          <EmptyState
            icon={HistoryIcon}
            title="No activities found"
            description={
              startDate || endDate || typeFilter !== 'all'
                ? "Try adjusting your filters"
                : "Your activity history will appear here"
            }
          />
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedActivities).map(([date, dayActivities]) => (
              <div key={date}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">{date}</h2>
                  <Badge variant="secondary">{dayActivities.length} activities</Badge>
                </div>
                <Card>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border">
                      {dayActivities.map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              activity.type === 'contribution' 
                                ? 'bg-green-500/10 text-green-500'
                                : activity.type === 'loan'
                                ? 'bg-blue-500/10 text-blue-500'
                                : 'bg-purple-500/10 text-purple-500'
                            }`}>
                              {getActivityIcon(activity.type)}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{activity.description}</p>
                              <p className="text-sm text-muted-foreground capitalize">{activity.type}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <p className={`font-semibold ${
                              activity.type === 'contribution' || activity.type === 'repayment'
                                ? 'text-green-600'
                                : 'text-foreground'
                            }`}>
                              {activity.type === 'contribution' || activity.type === 'repayment' ? '+' : ''}
                              RWF {formatCurrency(activity.amount)}
                            </p>
                            {getStatusBadge(activity.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
}
