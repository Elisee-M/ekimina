import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";

interface MemberSavingsChartProps {
  contributions: Array<{ amount: number; status: string; date: string }>;
}

export function MemberSavingsChart({ contributions }: MemberSavingsChartProps) {
  // Sort by date and compute cumulative savings
  const sorted = [...contributions]
    .filter(c => c.status === 'paid')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let cumulative = 0;
  const data = sorted.map(c => {
    cumulative += c.amount;
    const d = new Date(c.date);
    return {
      month: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      savings: cumulative,
    };
  });

  if (data.length === 0) return null;

  return (
    <Card variant="elevated">
      <CardHeader className="p-4 sm:p-6 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="w-5 h-5 text-primary" />
          Savings Growth
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value: number) => [`RWF ${new Intl.NumberFormat('en-RW').format(value)}`, 'Total Savings']} />
              <Area type="monotone" dataKey="savings" className="fill-primary/20 stroke-primary" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
