import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, CheckCircle2, Clock, Users, Calendar } from "lucide-react";
import { format } from "date-fns";

interface PendingGroup {
  id: string;
  name: string;
  description: string | null;
  contribution_amount: number;
  contribution_frequency: string;
  created_at: string;
  created_by: string | null;
  creator_name?: string;
  creator_email?: string;
  member_count?: number;
}

const SuperAdminApprovals = () => {
  const [pendingGroups, setPendingGroups] = useState<PendingGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchPendingGroups = async () => {
    setLoading(true);
    try {
      const { data: groups, error } = await supabase
        .from('ikimina_groups')
        .select('*')
        .eq('plan', 'growth')
        .eq('status', 'pending_approval')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch creator profiles for each group
      const enriched: PendingGroup[] = [];
      for (const g of groups || []) {
        let creator_name = 'Unknown';
        let creator_email = '';
        let member_count = 0;

        if (g.created_by) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', g.created_by)
            .maybeSingle();
          if (profile) {
            creator_name = profile.full_name;
            creator_email = profile.email;
          }
        }

        const { count } = await supabase
          .from('group_members')
          .select('id', { count: 'exact', head: true })
          .eq('group_id', g.id);
        member_count = count || 0;

        enriched.push({ ...g, creator_name, creator_email, member_count });
      }

      setPendingGroups(enriched);
    } catch (err: any) {
      toast({ title: "Error loading pending groups", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPendingGroups(); }, []);

  const handleApprove = async (groupId: string, groupName: string) => {
    setApproving(groupId);
    try {
      const { error } = await supabase
        .from('ikimina_groups')
        .update({
          status: 'active',
          payment_confirmed_at: new Date().toISOString(),
          payment_confirmed_by: user?.id,
        })
        .eq('id', groupId);

      if (error) throw error;

      toast({ title: "Group Approved!", description: `"${groupName}" is now active.` });
      setPendingGroups(prev => prev.filter(g => g.id !== groupId));
    } catch (err: any) {
      toast({ title: "Approval failed", description: err.message, variant: "destructive" });
    } finally {
      setApproving(null);
    }
  };

  return (
    <DashboardLayout role="super-admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pending Approvals</h1>
          <p className="text-muted-foreground">Growth plan groups awaiting payment confirmation</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : pendingGroups.length === 0 ? (
          <Card variant="elevated">
            <CardContent className="p-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-primary/40 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground">All caught up!</h3>
              <p className="text-muted-foreground mt-1">No groups pending approval right now.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {pendingGroups.map((group) => (
              <Card key={group.id} variant="elevated" className="border-amber-500/20">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-foreground">{group.name}</h3>
                        <Badge variant="secondary" className="gap-1">
                          <Clock className="w-3 h-3" />
                          Pending
                        </Badge>
                      </div>
                      {group.description && (
                        <p className="text-sm text-muted-foreground">{group.description}</p>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {group.member_count} member(s)
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(group.created_at), 'MMM d, yyyy')}
                        </span>
                        <span>
                          RWF {group.contribution_amount.toLocaleString()} / {group.contribution_frequency}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Created by: <strong className="text-foreground">{group.creator_name}</strong>
                        {group.creator_email && ` (${group.creator_email})`}
                      </p>
                    </div>

                    <Button
                      variant="hero"
                      className="shrink-0"
                      disabled={approving === group.id}
                      onClick={() => handleApprove(group.id, group.name)}
                    >
                      {approving === group.id ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Approving...</>
                      ) : (
                        <><CheckCircle2 className="w-4 h-4 mr-2" /> Confirm Payment</>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SuperAdminApprovals;
