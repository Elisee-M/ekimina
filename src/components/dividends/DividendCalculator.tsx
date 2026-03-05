import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, PieChart, Coins } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface MemberDividend {
  userId: string;
  name: string;
  totalContributed: number;
  contributionRatio: number;
  dividendShare: number;
}

export function DividendCalculator() {
  const { groupMembership } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dividends, setDividends] = useState<MemberDividend[]>([]);
  const [totalProfit, setTotalProfit] = useState(0);
  const [totalContributions, setTotalContributions] = useState(0);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-RW').format(amount);

  useEffect(() => {
    if (groupMembership?.group_id) fetchDividends();
  }, [groupMembership?.group_id]);

  const fetchDividends = async () => {
    if (!groupMembership?.group_id) return;
    try {
      setLoading(true);
      const groupId = groupMembership.group_id;

      const [{ data: contributions }, { data: loans }, { data: members }] = await Promise.all([
        supabase.from('contributions').select('member_id, amount, status').eq('group_id', groupId),
        supabase.from('loans').select('profit, status').eq('group_id', groupId),
        supabase.from('group_members').select('user_id').eq('group_id', groupId).eq('status', 'active'),
      ]);

      // Calculate total profit from completed/active loans
      const profit = (loans || []).reduce((sum, l) => sum + Number(l.profit || 0), 0);
      setTotalProfit(profit);

      // Calculate each member's paid contributions
      const memberContributions: Record<string, number> = {};
      (contributions || []).forEach(c => {
        if (c.status === 'paid') {
          memberContributions[c.member_id] = (memberContributions[c.member_id] || 0) + Number(c.amount);
        }
      });

      const totalPaid = Object.values(memberContributions).reduce((sum, v) => sum + v, 0);
      setTotalContributions(totalPaid);

      // Fetch member names
      const memberIds = (members || []).map(m => m.user_id);
      let profilesMap: Record<string, string> = {};
      if (memberIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', memberIds);
        profilesMap = (profiles || []).reduce((acc, p) => { acc[p.id] = p.full_name; return acc; }, {} as Record<string, string>);
      }

      const dividendData: MemberDividend[] = memberIds.map(userId => {
        const contributed = memberContributions[userId] || 0;
        const ratio = totalPaid > 0 ? contributed / totalPaid : 0;
        return {
          userId,
          name: profilesMap[userId] || 'Unknown',
          totalContributed: contributed,
          contributionRatio: ratio,
          dividendShare: profit * ratio,
        };
      }).sort((a, b) => b.dividendShare - a.dividendShare);

      setDividends(dividendData);
    } catch (error) {
      console.error('Error calculating dividends:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="elevated">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2">
          <PieChart className="w-5 h-5 text-primary" />
          Profit Sharing / Dividends
        </CardTitle>
        <CardDescription>
          Each member's share of loan profits based on their contribution ratio
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-sm text-muted-foreground">Total Loan Profit</p>
            <p className="text-xl font-bold text-foreground">RWF {formatCurrency(totalProfit)}</p>
          </div>
          <div className="p-3 rounded-lg bg-success/5 border border-success/20">
            <p className="text-sm text-muted-foreground">Total Contributions</p>
            <p className="text-xl font-bold text-foreground">RWF {formatCurrency(totalContributions)}</p>
          </div>
        </div>

        {dividends.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No members or contributions to calculate dividends.</p>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead className="text-right">Contributed</TableHead>
                  <TableHead className="text-right">Share %</TableHead>
                  <TableHead className="text-right">Dividend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dividends.map((d) => (
                  <TableRow key={d.userId}>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell className="text-right">RWF {formatCurrency(d.totalContributed)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{(d.contributionRatio * 100).toFixed(1)}%</Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-primary">
                      RWF {formatCurrency(Math.round(d.dividendShare))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
