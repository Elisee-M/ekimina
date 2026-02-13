import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface DashboardStats {
  totalSavings: number;
  activeMembers: number;
  activeLoans: number;
  totalLoansAmount: number;
  profitEarned: number;
}

interface RecentContribution {
  id: string;
  memberName: string;
  amount: number;
  date: string;
  status: 'paid' | 'pending' | 'late' | 'missed';
}

interface ActiveLoan {
  id: string;
  borrowerName: string;
  principalAmount: number;
  totalPayable: number;
  remaining: number;
  dueDate: string;
  status: 'pending' | 'active' | 'completed' | 'overdue';
}

interface GroupInfo {
  id: string;
  name: string;
  contributionAmount: number;
  contributionFrequency: string;
  interestRate: number;
  groupCode: string;
  plan: string;
}

export function useDashboardData() {
  const { user, groupMembership } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalSavings: 0,
    activeMembers: 0,
    activeLoans: 0,
    totalLoansAmount: 0,
    profitEarned: 0
  });
  const [recentContributions, setRecentContributions] = useState<RecentContribution[]>([]);
  const [activeLoans, setActiveLoans] = useState<ActiveLoan[]>([]);
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [pendingContributionsCount, setPendingContributionsCount] = useState(0);

  useEffect(() => {
    if (!user || !groupMembership) {
      setLoading(false);
      return;
    }

    fetchDashboardData();
  }, [user, groupMembership]);

  const fetchDashboardData = async () => {
    if (!groupMembership) return;

    const groupId = groupMembership.group_id;

    try {
      // Fetch group info
      const { data: groupData } = await supabase
        .from('ikimina_groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (groupData) {
        setGroupInfo({
          id: groupData.id,
          name: groupData.name,
          contributionAmount: groupData.contribution_amount,
          contributionFrequency: groupData.contribution_frequency,
          interestRate: groupData.interest_rate,
          groupCode: groupData.id.slice(0, 8).toUpperCase(),
          plan: groupData.plan || 'starter'
        });
      }

      // Fetch active members count
      const { count: membersCount } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', groupId)
        .eq('status', 'active');

      // Fetch total contributions (paid)
      const { data: contributionsData } = await supabase
        .from('contributions')
        .select('amount, status')
        .eq('group_id', groupId);

      const totalSavings = contributionsData?.reduce((sum, c) => 
        c.status === 'paid' ? sum + Number(c.amount) : sum, 0
      ) || 0;

      // Fetch loans data (without join, profiles fetched separately if needed)
      const { data: loansData } = await supabase
        .from('loans')
        .select('*')
        .eq('group_id', groupId);

      const activeLoansData = loansData?.filter(l => l.status === 'active' || l.status === 'overdue') || [];
      const totalLoansAmount = activeLoansData.reduce((sum, l) => sum + Number(l.total_payable), 0);
      const profitEarned = loansData?.reduce((sum, l) => sum + Number(l.profit), 0) || 0;

      // Fetch repayments for remaining calculation (skip if no loans)
      let repaymentsByLoan: Record<string, number> = {};
      const loanIds = activeLoansData.map(l => l.id);
      if (loanIds.length > 0) {
        const { data: repaymentsData } = await supabase
          .from('repayments')
          .select('loan_id, amount')
          .in('loan_id', loanIds);

        repaymentsByLoan = repaymentsData?.reduce((acc, r) => {
          acc[r.loan_id] = (acc[r.loan_id] || 0) + Number(r.amount);
          return acc;
        }, {} as Record<string, number>) || {};
      }

      // Fetch borrower profiles for loans
      const borrowerIds = [...new Set(activeLoansData.map(l => l.borrower_id))];
      let profilesMap: Record<string, string> = {};
      if (borrowerIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', borrowerIds);
        
        profilesMap = profilesData?.reduce((acc, p) => {
          acc[p.id] = p.full_name;
          return acc;
        }, {} as Record<string, string>) || {};
      }

      // Format active loans
      const formattedLoans: ActiveLoan[] = activeLoansData.slice(0, 5).map(loan => ({
        id: loan.id,
        borrowerName: profilesMap[loan.borrower_id] || 'Unknown',
        principalAmount: Number(loan.principal_amount),
        totalPayable: Number(loan.total_payable),
        remaining: Number(loan.total_payable) - (repaymentsByLoan[loan.id] || 0),
        dueDate: loan.due_date,
        status: loan.status
      }));

      // Fetch recent contributions (without join)
      const { data: recentContribData } = await supabase
        .from('contributions')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch member profiles for contributions
      const memberIds = [...new Set((recentContribData || []).map(c => c.member_id))];
      let memberProfilesMap: Record<string, string> = {};
      if (memberIds.length > 0) {
        const { data: memberProfiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', memberIds);
        
        memberProfilesMap = memberProfiles?.reduce((acc, p) => {
          acc[p.id] = p.full_name;
          return acc;
        }, {} as Record<string, string>) || {};
      }

      const formattedContributions: RecentContribution[] = (recentContribData || []).map(c => ({
        id: c.id,
        memberName: memberProfilesMap[c.member_id] || 'Unknown',
        amount: Number(c.amount),
        date: formatRelativeDate(c.paid_date || c.due_date),
        status: c.status
      }));

      // Count pending contributions
      const pendingCount = contributionsData?.filter(c => c.status === 'pending').length || 0;

      setStats({
        totalSavings,
        activeMembers: membersCount || 0,
        activeLoans: activeLoansData.length,
        totalLoansAmount,
        profitEarned
      });
      setActiveLoans(formattedLoans);
      setRecentContributions(formattedContributions);
      setPendingContributionsCount(pendingCount);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    stats,
    recentContributions,
    activeLoans,
    groupInfo,
    pendingContributionsCount,
    refetch: fetchDashboardData
  };
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
