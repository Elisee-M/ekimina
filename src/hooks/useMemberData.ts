import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface MemberStats {
  totalContributed: number;
  contributionCount: number;
  activeLoan: {
    id: string;
    principalAmount: number;
    totalPayable: number;
    remaining: number;
    dueDate: string;
    nextPaymentAmount: number;
  } | null;
}

interface ContributionRecord {
  id: string;
  month: string;
  amount: number;
  status: 'paid' | 'pending' | 'late' | 'missed';
  date: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
}

interface GroupInfo {
  id: string;
  name: string;
  contributionAmount: number;
  contributionFrequency: string;
  interestRate: number;
}

export function useMemberData() {
  const { user, groupMembership } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<MemberStats>({
    totalContributed: 0,
    contributionCount: 0,
    activeLoan: null
  });
  const [contributions, setContributions] = useState<ContributionRecord[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);

  useEffect(() => {
    if (!user || !groupMembership) {
      setLoading(false);
      return;
    }

    fetchMemberData();
  }, [user, groupMembership]);

  const fetchMemberData = async () => {
    if (!user || !groupMembership) return;

    const groupId = groupMembership.group_id;
    const userId = user.id;

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
          interestRate: groupData.interest_rate
        });
      }

      // Fetch member's contributions
      const { data: contributionsData } = await supabase
        .from('contributions')
        .select('*')
        .eq('group_id', groupId)
        .eq('member_id', userId)
        .order('due_date', { ascending: false });

      const totalContributed = contributionsData?.reduce((sum, c) => 
        c.status === 'paid' ? sum + Number(c.amount) : sum, 0
      ) || 0;

      const paidCount = contributionsData?.filter(c => c.status === 'paid').length || 0;

      const formattedContributions: ContributionRecord[] = (contributionsData || []).map(c => ({
        id: c.id,
        month: formatMonth(c.due_date),
        amount: Number(c.amount),
        status: c.status,
        date: c.status === 'paid' && c.paid_date 
          ? new Date(c.paid_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : `Due ${new Date(c.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
      }));

      // Fetch member's active loan
      const { data: loansData } = await supabase
        .from('loans')
        .select('*')
        .eq('group_id', groupId)
        .eq('borrower_id', userId)
        .in('status', ['active', 'overdue'])
        .order('created_at', { ascending: false })
        .limit(1);

      let activeLoan = null;
      if (loansData && loansData.length > 0) {
        const loan = loansData[0];
        
        // Fetch repayments for this loan
        const { data: repaymentsData } = await supabase
          .from('repayments')
          .select('amount')
          .eq('loan_id', loan.id);

        const totalRepaid = repaymentsData?.reduce((sum, r) => sum + Number(r.amount), 0) || 0;
        const remaining = Number(loan.total_payable) - totalRepaid;
        const monthsLeft = Math.max(1, Math.ceil((new Date(loan.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)));
        
        activeLoan = {
          id: loan.id,
          principalAmount: Number(loan.principal_amount),
          totalPayable: Number(loan.total_payable),
          remaining: remaining,
          dueDate: loan.due_date,
          nextPaymentAmount: Math.ceil(remaining / monthsLeft)
        };
      }

      // Fetch announcements
      const { data: announcementsData } = await supabase
        .from('announcements')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false })
        .limit(5);

      const formattedAnnouncements: Announcement[] = (announcementsData || []).map(a => ({
        id: a.id,
        title: a.title,
        content: a.content,
        date: formatRelativeDate(a.created_at)
      }));

      setStats({
        totalContributed,
        contributionCount: paidCount,
        activeLoan
      });
      setContributions(formattedContributions);
      setAnnouncements(formattedAnnouncements);
    } catch (error) {
      console.error('Error fetching member data:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    stats,
    contributions,
    announcements,
    groupInfo,
    refetch: fetchMemberData
  };
}

function formatMonth(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${diffDays >= 14 ? 's' : ''} ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
