import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";

interface FinancialOverviewChartProps {
  contributions: Array<{ amount: number; created_at: string }>;
  loans: Array<{ principal_amount: number; created_at: string }>;
}

const chartConfig: ChartConfig = {
  contributions: { label: "Contributions", color: "hsl(var(--success))" },
  loans: { label: "Loans", color: "hsl(var(--secondary))" },
};

export function FinancialOverviewChart({ contributions, loans }: FinancialOverviewChartProps) {
  const data = useMemo(() => {
    const months: Record<string, { contributions: number; loans: number }> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      months[key] = { contributions: 0, loans: 0 };
    }

    contributions.forEach((c) => {
      const key = new Date(c.created_at).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      if (months[key]) months[key].contributions += Number(c.amount);
    });

    loans.forEach((l) => {
      const key = new Date(l.created_at).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      if (months[key]) months[key].loans += Number(l.principal_amount);
    });

    return Object.entries(months).map(([month, vals]) => ({ month, ...vals }));
  }, [contributions, loans]);

  return (
    <Card variant="elevated">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-base sm:text-lg">Financial Overview</CardTitle>
        <p className="text-sm text-muted-foreground">Contributions vs Loans (last 6 months)</p>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <LineChart data={data}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line type="monotone" dataKey="contributions" stroke="var(--color-contributions)" strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="loans" stroke="var(--color-loans)" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
