import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface GroupDashboardStats {
  totalSavings: number;
  activeMembers: number;
  activeLoans: number;
  totalLoansAmount: number;
  profitEarned: number;
}

export interface RecentContribution {
  id: string;
  memberName: string;
  amount: number;
  date: string;
  status: 'paid' | 'pending' | 'late' | 'missed';
}

export interface ActiveLoan {
  id: string;
  borrowerName: string;
  principalAmount: number;
  totalPayable: number;
  remaining: number;
  dueDate: string;
  status: 'pending' | 'active' | 'completed' | 'overdue';
}

export interface GroupInfo {
  id: string;
  name: string;
  contributionAmount: number;
  contributionFrequency: string;
  interestRate: number;
  groupCode: string;
  status: string;
}

export interface GroupMember {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
  status: string;
  joinedAt: string;
}

export interface GroupContribution {
  id: string;
  memberId: string;
  memberName: string;
  amount: number;
  status: string;
  dueDate: string;
  paidDate: string | null;
}

export interface GroupLoan {
  id: string;
  borrowerId: string;
  borrowerName: string;
  principalAmount: number;
  totalPayable: number;
  remaining: number;
  dueDate: string;
  status: string;
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

export function useGroupData(groupId: string | null) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<GroupDashboardStats>({
    totalSavings: 0,
    activeMembers: 0,
    activeLoans: 0,
    totalLoansAmount: 0,
    profitEarned: 0
  });
  const [recentContributions, setRecentContributions] = useState<RecentContribution[]>([]);
  const [activeLoans, setActiveLoans] = useState<ActiveLoan[]>([]);
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [contributions, setContributions] = useState<GroupContribution[]>([]);
  const [loans, setLoans] = useState<GroupLoan[]>([]);

  useEffect(() => {
    if (!groupId) {
      setLoading(false);
      return;
    }
    fetchAllData();
  }, [groupId]);

  const fetchAllData = async () => {
    if (!groupId) return;

    try {
      setLoading(true);

      // 1. Group info
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
          status: groupData.status || 'active'
        });
      }

      // 2. Members count & list
      const { data: membersData } = await supabase
        .from('group_members')
        .select('id, user_id, is_admin, status, joined_at')
        .eq('group_id', groupId);

      const userIds = [...new Set((membersData || []).map(m => m.user_id))];
      let profilesMap: Record<string, { full_name: string; email: string; phone: string | null; avatar_url: string | null }> = {};
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, email, phone, avatar_url')
          .in('id', userIds);
        profilesMap = (profilesData || []).reduce((acc, p) => {
          acc[p.id] = { full_name: p.full_name, email: p.email, phone: p.phone, avatar_url: p.avatar_url };
          return acc;
        }, {} as Record<string, { full_name: string; email: string; phone: string | null; avatar_url: string | null }>);
      }

      const formattedMembers: GroupMember[] = (membersData || []).map(m => {
        const profile = profilesMap[m.user_id];
        return {
          id: m.id,
          userId: m.user_id,
          fullName: profile?.full_name || 'Unknown',
          email: profile?.email || '',
          phone: profile?.phone || null,
          avatarUrl: profile?.avatar_url || null,
          isAdmin: m.is_admin,
          status: m.status,
          joinedAt: new Date(m.joined_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        };
      });
      setMembers(formattedMembers);

      const activeMembersCount = (membersData || []).filter(m => m.status === 'active').length;

      // 3. Contributions
      const { data: contributionsData } = await supabase
        .from('contributions')
        .select('*')
        .eq('group_id', groupId)
        .order('due_date', { ascending: false });

      const totalSavings = (contributionsData || []).reduce((sum, c) =>
        c.status === 'paid' ? sum + Number(c.amount) : sum, 0
      );

      const formattedContributions: GroupContribution[] = (contributionsData || []).map(c => ({
        id: c.id,
        memberId: c.member_id,
        memberName: profilesMap[c.member_id]?.full_name || 'Unknown',
        amount: Number(c.amount),
        status: c.status,
        dueDate: c.due_date,
        paidDate: c.paid_date
      }));
      setContributions(formattedContributions);

      const recentContribData = (contributionsData || []).slice(0, 10);
      const recentContribFormatted: RecentContribution[] = recentContribData.map(c => ({
        id: c.id,
        memberName: profilesMap[c.member_id]?.full_name || 'Unknown',
        amount: Number(c.amount),
        date: formatRelativeDate(c.paid_date || c.due_date),
        status: c.status
      }));
      setRecentContributions(recentContribFormatted);

      // 4. Loans
      const { data: loansData } = await supabase
        .from('loans')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });

      const activeLoansData = (loansData || []).filter(l => l.status === 'active' || l.status === 'overdue');
      const totalLoansAmount = activeLoansData.reduce((sum, l) => sum + Number(l.total_payable), 0);
      const profitEarned = (loansData || []).reduce((sum, l) => sum + Number(l.profit || 0), 0);

      const loanIds = activeLoansData.map(l => l.id);
      let repaymentsByLoan: Record<string, number> = {};
      if (loanIds.length > 0) {
        const { data: repaymentsData } = await supabase
          .from('repayments')
          .select('loan_id, amount')
          .in('loan_id', loanIds);
        repaymentsByLoan = (repaymentsData || []).reduce((acc, r) => {
          acc[r.loan_id] = (acc[r.loan_id] || 0) + Number(r.amount);
          return acc;
        }, {} as Record<string, number>);
      }

      const formattedActiveLoans: ActiveLoan[] = activeLoansData.slice(0, 10).map(loan => ({
        id: loan.id,
        borrowerName: profilesMap[loan.borrower_id]?.full_name || 'Unknown',
        principalAmount: Number(loan.principal_amount),
        totalPayable: Number(loan.total_payable),
        remaining: Number(loan.total_payable) - (repaymentsByLoan[loan.id] || 0),
        dueDate: loan.due_date,
        status: loan.status
      }));
      setActiveLoans(formattedActiveLoans);

      const allLoansFormatted: GroupLoan[] = (loansData || []).map(loan => ({
        id: loan.id,
        borrowerId: loan.borrower_id,
        borrowerName: profilesMap[loan.borrower_id]?.full_name || 'Unknown',
        principalAmount: Number(loan.principal_amount),
        totalPayable: Number(loan.total_payable),
        remaining: Number(loan.total_payable) - (repaymentsByLoan[loan.id] || 0),
        dueDate: loan.due_date,
        status: loan.status
      }));
      setLoans(allLoansFormatted);

      setStats({
        totalSavings,
        activeMembers: activeMembersCount,
        activeLoans: activeLoansData.length,
        totalLoansAmount,
        profitEarned
      });
    } catch (error) {
      console.error('Error fetching group data:', error);
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
    members,
    contributions,
    loans,
    refetch: fetchAllData
  };
}
