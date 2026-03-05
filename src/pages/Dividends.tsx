import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DividendCalculator } from "@/components/dividends/DividendCalculator";
import { usePageSeo } from "@/hooks/usePageSeo";

const Dividends = () => {
  usePageSeo({
    title: "Dividends | eKimina",
    description: "View profit sharing and dividend distribution for your group.",
    canonicalPath: "/dashboard/dividends",
  });

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dividends & Profit Sharing</h1>
          <p className="text-muted-foreground">View how loan profits are distributed among group members</p>
        </div>
        <DividendCalculator />
      </div>
    </DashboardLayout>
  );
};

export default Dividends;
