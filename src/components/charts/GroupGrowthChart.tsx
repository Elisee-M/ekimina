import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import { useTranslation } from "react-i18next";

interface GroupGrowthChartProps {
  groups: Array<{ created_at: string }>;
}

const chartConfig: ChartConfig = {
  groups: { label: "Groups", color: "hsl(var(--primary))" },
};

export function GroupGrowthChart({ groups }: GroupGrowthChartProps) {
  const { t } = useTranslation();

  const data = useMemo(() => {
    const months: Record<string, number> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      months[key] = 0;
    }
    groups.forEach((g) => {
      const date = new Date(g.created_at);
      const key = date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      if (months[key] !== undefined) months[key]++;
    });
    let cumulative = 0;
    const keys = Object.keys(months);
    const windowStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const beforeWindow = groups.filter((g) => new Date(g.created_at) < windowStart).length;
    cumulative = beforeWindow;
    return keys.map((month) => { cumulative += months[month]; return { month, groups: cumulative }; });
  }, [groups]);

  return (
    <Card variant="elevated">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-base sm:text-lg">{t('charts.groupGrowth')}</CardTitle>
        <p className="text-sm text-muted-foreground">{t('charts.totalGroupsOverTime')}</p>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <AreaChart data={data}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <defs>
              <linearGradient id="groupsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-groups)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="var(--color-groups)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="groups" stroke="var(--color-groups)" fill="url(#groupsFill)" strokeWidth={2} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
