import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { AlertTriangle, CheckCircle2, Clock, Ban, Loader2, DollarSign } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { usePageSeo } from "@/hooks/usePageSeo";
import { useTranslation } from "react-i18next";

interface Penalty {
  id: string;
  amount: number;
  reason: string;
  status: string;
  createdAt: string;
  contributionDueDate?: string;
}

export default function MemberPenalties() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [penalties, setPenalties] = useState<Penalty[]>([]);

  usePageSeo({
    title: "My Penalties | eKimina",
    description: "View your penalty history.",
    canonicalPath: "/member/penalties",
  });

  useEffect(() => {
    if (user) fetchPenalties();
  }, [user]);

  const fetchPenalties = async () => {
    try {
      const { data, error } = await supabase
        .from("penalties")
        .select("*, contributions(due_date)")
        .eq("member_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setPenalties(
        (data || []).map((p: any) => ({
          id: p.id,
          amount: Number(p.amount),
          reason: p.reason,
          status: p.status,
          createdAt: p.created_at,
          contributionDueDate: p.contributions?.due_date,
        }))
      );
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalPending = penalties.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0);
  const formatCurrency = (n: number) => new Intl.NumberFormat("en-RW").format(n);
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('memberPenalties.title')}</h1>
          <p className="text-muted-foreground">{t('memberPenalties.description')}</p>
        </div>

        {totalPending > 0 && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{t('memberPenalties.outstandingPenalties')}</p>
                <p className="text-xl font-bold text-destructive">RWF {formatCurrency(totalPending)}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {penalties.length === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            title={t('memberPenalties.noPenalties')}
            description={t('memberPenalties.noPenaltiesDesc')}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                {t('memberPenalties.penaltyHistory')} ({penalties.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {penalties.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {p.reason === "late_contribution" ? t('penalties.lateContribution') : p.reason}
                    </p>
                    {p.contributionDueDate && (
                      <p className="text-xs text-muted-foreground">{t('penalties.contributionDue')} {formatDate(p.contributionDueDate)}</p>
                    )}
                    <p className="text-xs text-muted-foreground">{t('penalties.applied')} {formatDate(p.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-semibold text-foreground">RWF {formatCurrency(p.amount)}</p>
                    <Badge
                      variant={p.status === "paid" ? "success" : p.status === "waived" ? "secondary" : "destructive"}
                      className="gap-1"
                    >
                      {p.status === "paid" && <CheckCircle2 className="w-3 h-3" />}
                      {p.status === "pending" && <Clock className="w-3 h-3" />}
                      {p.status === "waived" && <Ban className="w-3 h-3" />}
                      {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </motion.div>
    </DashboardLayout>
  );
}
