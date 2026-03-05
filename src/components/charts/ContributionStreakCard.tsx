import { Card, CardContent } from "@/components/ui/card";
import { Flame, Award } from "lucide-react";

interface ContributionStreakCardProps {
  contributions: Array<{ status: string; date: string }>;
}

export function ContributionStreakCard({ contributions }: ContributionStreakCardProps) {
  // Sort by date descending and calculate current streak of consecutive 'paid' contributions
  const sorted = [...contributions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // For longest streak, sort ascending
  const asc = [...contributions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  for (const c of asc) {
    if (c.status === 'paid') {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  // Current streak from most recent
  for (const c of sorted) {
    if (c.status === 'paid') {
      currentStreak++;
    } else {
      break;
    }
  }

  return (
    <Card variant="stat">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Payment Streak</p>
            <p className="text-2xl sm:text-3xl font-bold text-foreground">{currentStreak}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Award className="w-3 h-3" /> Best: {longestStreak}
            </p>
          </div>
          <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center ${currentStreak >= 3 ? 'bg-warning/20' : 'bg-muted'}`}>
            <Flame className={`w-6 h-6 sm:w-7 sm:h-7 ${currentStreak >= 3 ? 'text-warning' : 'text-muted-foreground'}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
