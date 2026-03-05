import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DividendCalculator } from "@/components/dividends/DividendCalculator";
import { usePageSeo } from "@/hooks/usePageSeo";

const MemberDividends = () => {
  usePageSeo({
    title: "My Dividends | eKimina",
    description: "View your share of the group's loan profits.",
    canonicalPath: "/member/dividends",
  });

  return (
    <DashboardLayout role="member">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Dividends</h1>
          <p className="text-muted-foreground">Your share of the group's loan profits based on your contributions</p>
        </div>
        <DividendCalculator />
      </div>
    </DashboardLayout>
  );
};

export default MemberDividends;
