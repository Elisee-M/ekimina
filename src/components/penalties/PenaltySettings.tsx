import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export function PenaltySettings() {
  const { groupMembership } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    penalty_type: "percentage",
    penalty_value: "5",
    grace_period_days: "7",
    enabled: false,
  });

  useEffect(() => {
    if (groupMembership?.group_id) fetchRules();
  }, [groupMembership?.group_id]);

  const fetchRules = async () => {
    if (!groupMembership?.group_id) return;
    try {
      const { data } = await supabase
        .from('penalty_rules')
        .select('*')
        .eq('group_id', groupMembership.group_id)
        .maybeSingle();

      if (data) {
        setForm({
          penalty_type: data.penalty_type,
          penalty_value: String(data.penalty_value),
          grace_period_days: String(data.grace_period_days),
          enabled: data.enabled,
        });
      }
    } catch (error) {
      console.error('Error fetching penalty rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!groupMembership?.group_id) return;
    try {
      setSaving(true);
      const payload = {
        group_id: groupMembership.group_id,
        penalty_type: form.penalty_type,
        penalty_value: parseFloat(form.penalty_value) || 0,
        grace_period_days: parseInt(form.grace_period_days) || 7,
        enabled: form.enabled,
      };

      const { error } = await supabase
        .from('penalty_rules')
        .upsert(payload, { onConflict: 'group_id' });

      if (error) throw error;
      toast({ title: "Penalty settings saved" });
    } catch (error: any) {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Card><CardContent className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-warning" />
          Penalty Rules
        </CardTitle>
        <CardDescription>Configure automatic penalties for late or missed contributions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>Enable Automatic Penalties</Label>
            <p className="text-xs text-muted-foreground">Apply penalties to late contributions automatically</p>
          </div>
          <Switch checked={form.enabled} onCheckedChange={(v) => setForm({ ...form, enabled: v })} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Penalty Type</Label>
            <Select value={form.penalty_type} onValueChange={(v) => setForm({ ...form, penalty_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Percentage of contribution</SelectItem>
                <SelectItem value="fixed">Fixed amount (RWF)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Penalty Value {form.penalty_type === 'percentage' ? '(%)' : '(RWF)'}</Label>
            <Input type="number" value={form.penalty_value} onChange={(e) => setForm({ ...form, penalty_value: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Grace Period (days)</Label>
            <Input type="number" value={form.grace_period_days} onChange={(e) => setForm({ ...form, grace_period_days: e.target.value })} />
            <p className="text-xs text-muted-foreground">Days after due date before penalty applies</p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Penalty Rules
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
