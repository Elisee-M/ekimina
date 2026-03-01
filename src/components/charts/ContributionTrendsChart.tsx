import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

interface ContributionTrendsChartProps {
  contributions: Array<{
    amount: number;
    status: string;
    paid_date?: string | null;
    due_date: string;
    created_at: string;
  }>;
}

const chartConfig: ChartConfig = {
  paid: { label: "Paid", color: "hsl(var(--success))" },
  pending: { label: "Pending", color: "hsl(var(--warning))" },
};

export function ContributionTrendsChart({ contributions }: ContributionTrendsChartProps) {
  const data = useMemo(() => {
    const months: Record<string, { paid: number; pending: number }> = {};

    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      months[key] = { paid: 0, pending: 0 };
    }

    contributions.forEach((c) => {
      const date = new Date(c.paid_date || c.due_date || c.created_at);
      const key = date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      if (months[key]) {
        if (c.status === "paid") months[key].paid += Number(c.amount);
        else months[key].pending += Number(c.amount);
      }
    });

    return Object.entries(months).map(([month, vals]) => ({ month, ...vals }));
  }, [contributions]);

  return (
    <Card variant="elevated">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-base sm:text-lg">Contribution Trends</CardTitle>
        <p className="text-sm text-muted-foreground">Last 6 months overview</p>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <BarChart data={data} barGap={4}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="paid" fill="var(--color-paid)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="pending" fill="var(--color-pending)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
