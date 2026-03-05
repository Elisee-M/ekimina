import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ThumbsUp, ThumbsDown, Users, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface LoanVotingProps {
  loanId: string;
  borrowerId: string;
  borrowerName: string;
  principalAmount: number;
  groupId: string;
  threshold: number;
  onVoteComplete?: () => void;
}

interface Vote {
  id: string;
  voter_id: string;
  vote: string;
  voter_name?: string;
}

export function LoanVoting({ loanId, borrowerId, borrowerName, principalAmount, groupId, threshold, onVoteComplete }: LoanVotingProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [votes, setVotes] = useState<Vote[]>([]);
  const [totalMembers, setTotalMembers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-RW').format(amount);

  useEffect(() => {
    fetchVotes();
  }, [loanId]);

  const fetchVotes = async () => {
    try {
      const [{ data: votesData }, { count: membersCount }] = await Promise.all([
        supabase.from('loan_votes').select('*').eq('loan_id', loanId),
        supabase.from('group_members').select('*', { count: 'exact', head: true }).eq('group_id', groupId).eq('status', 'active'),
      ]);

      // Fetch voter names
      const voterIds = (votesData || []).map(v => v.voter_id);
      let profilesMap: Record<string, string> = {};
      if (voterIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', voterIds);
        profilesMap = (profiles || []).reduce((acc, p) => { acc[p.id] = p.full_name; return acc; }, {} as Record<string, string>);
      }

      setVotes((votesData || []).map(v => ({ ...v, voter_name: profilesMap[v.voter_id] || 'Unknown' })));
      // Exclude the borrower from eligible voters
      setTotalMembers(Math.max(0, (membersCount || 0) - 1));
    } catch (error) {
      console.error('Error fetching votes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (vote: 'approve' | 'reject') => {
    if (!user) return;
    try {
      setVoting(true);
      const { error } = await supabase.from('loan_votes').insert({
        loan_id: loanId,
        voter_id: user.id,
        vote,
      });
      if (error) throw error;
      toast({ title: `Vote recorded: ${vote === 'approve' ? 'Approved' : 'Rejected'}` });
      fetchVotes();
      onVoteComplete?.();
    } catch (error: any) {
      if (error.code === '23505') {
        toast({ title: "You have already voted on this loan", variant: "destructive" });
      } else {
        toast({ title: "Failed to vote", description: error.message, variant: "destructive" });
      }
    } finally {
      setVoting(false);
    }
  };

  if (loading) return <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" />;

  const approveCount = votes.filter(v => v.vote === 'approve').length;
  const rejectCount = votes.filter(v => v.vote === 'reject').length;
  const totalVotes = votes.length;
  const approvalPercentage = totalMembers > 0 ? Math.round((approveCount / totalMembers) * 100) : 0;
  const hasVoted = votes.some(v => v.voter_id === user?.id);
  const isBorrower = user?.id === borrowerId;
  const thresholdMet = approvalPercentage >= threshold;

  return (
    <Card className="border-primary/20">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          Member Voting — RWF {formatCurrency(principalAmount)} for {borrowerName}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">{totalVotes}/{totalMembers} voted</span>
          <Badge variant={thresholdMet ? "success" : "warning"}>
            {approvalPercentage}% approval ({threshold}% needed)
          </Badge>
        </div>
        <Progress value={approvalPercentage} className="h-2" />

        <div className="flex gap-4 text-sm">
          <span className="flex items-center gap-1 text-success">
            <ThumbsUp className="w-3 h-3" /> {approveCount} approve
          </span>
          <span className="flex items-center gap-1 text-destructive">
            <ThumbsDown className="w-3 h-3" /> {rejectCount} reject
          </span>
        </div>

        {!hasVoted && !isBorrower && (
          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={() => handleVote('approve')} disabled={voting} className="flex-1">
              <ThumbsUp className="w-4 h-4 mr-1" /> Approve
            </Button>
            <Button size="sm" variant="destructive" onClick={() => handleVote('reject')} disabled={voting} className="flex-1">
              <ThumbsDown className="w-4 h-4 mr-1" /> Reject
            </Button>
          </div>
        )}
        {hasVoted && <p className="text-xs text-muted-foreground">You have already voted.</p>}
        {isBorrower && <p className="text-xs text-muted-foreground">You cannot vote on your own loan request.</p>}
      </CardContent>
    </Card>
  );
}
