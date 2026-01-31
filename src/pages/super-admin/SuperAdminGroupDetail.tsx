import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/EmptyState";
import {
  Wallet,
  Users,
  TrendingUp,
  ArrowUpRight,
  ArrowLeft,
  Loader2,
  HandCoins,
  FileText,
  AlertCircle,
} from "lucide-react";
import { useGroupData } from "@/hooks/useGroupData";
import { usePageSeo } from "@/hooks/usePageSeo";

export default function SuperAdminGroupDetail() {
  const { groupId } = useParams<{ groupId: string }>();
  const {
    loading,
    stats,
    groupInfo,
    recentContributions,
    activeLoans,
    members,
    contributions,
    loans,
  } = useGroupData(groupId ?? null);

  usePageSeo({
    title: groupInfo ? `${groupInfo.name} | Super Admin | eKimina` : "Group | Super Admin | eKimina",
    description: "Super admin view of group analytics, members, contributions and loans.",
    canonicalPath: `/super-admin/groups/${groupId}`,
  });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-RW").format(amount);

  const getInitials = (name: string) =>
    name
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  if (loading) {
    return (
      <DashboardLayout role="super-admin">
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!groupInfo || !groupId) {
    return (
      <DashboardLayout role="super-admin">
        <div className="space-y-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/super-admin/groups" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Groups
            </Link>
          </Button>
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Group not found</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const statCards = [
    {
      title: "Total Savings",
      value: `RWF ${formatCurrency(stats.totalSavings)}`,
      icon: Wallet,
      color: "primary",
    },
    {
      title: "Active Members",
      value: stats.activeMembers.toString(),
      icon: Users,
      color: "accent",
    },
    {
      title: "Active Loans",
      value: stats.activeLoans.toString(),
      subtext:
        stats.totalLoansAmount > 0
          ? `RWF ${formatCurrency(stats.totalLoansAmount)}`
          : undefined,
      icon: TrendingUp,
      color: "secondary",
    },
    {
      title: "Profit Earned",
      value: `RWF ${formatCurrency(stats.profitEarned)}`,
      icon: ArrowUpRight,
      color: "success",
    },
  ];

  return (
    <DashboardLayout role="super-admin" groupNameOverride={groupInfo.name}>
      <main className="space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
              <Link to="/super-admin/groups" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Groups
              </Link>
            </Button>
            <h1 className="text-2xl font-bold text-foreground">{groupInfo.name}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              RWF {formatCurrency(groupInfo.contributionAmount)} •{" "}
              {groupInfo.contributionFrequency} • {groupInfo.interestRate}% interest
            </p>
            <Badge
              variant={groupInfo.status === "active" ? "default" : "secondary"}
              className="mt-2"
            >
              {groupInfo.status}
            </Badge>
          </div>
        </header>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-md">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
            <TabsTrigger value="contributions">
              Contributions ({contributions.length})
            </TabsTrigger>
            <TabsTrigger value="loans">Loans ({loans.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {statCards.map((stat, index) => (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className="h-full">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">
                            {stat.title}
                          </p>
                          <p className="text-lg sm:text-xl font-bold text-foreground truncate">
                            {stat.value}
                          </p>
                          {stat.subtext && (
                            <p className="text-xs text-muted-foreground truncate">
                              {stat.subtext}
                            </p>
                          )}
                        </div>
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            stat.color === "primary"
                              ? "bg-primary/10 text-primary"
                              : stat.color === "accent"
                              ? "bg-accent/10 text-accent"
                              : stat.color === "secondary"
                              ? "bg-secondary/10 text-secondary"
                              : "bg-success/10 text-success"
                          }`}
                        >
                          <stat.icon className="w-5 h-5" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Recent Contributions & Active Loans */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recent Contributions</CardTitle>
                </CardHeader>
                <CardContent>
                  {recentContributions.length === 0 ? (
                    <EmptyState
                      icon={HandCoins}
                      title="No contributions yet"
                      description="No contributions recorded for this group."
                    />
                  ) : (
                    <div className="space-y-3">
                      {recentContributions.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center justify-between py-2 border-b border-border last:border-0"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-semibold text-primary">
                                {getInitials(c.memberName)}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">
                                {c.memberName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {c.date}
                              </p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-semibold">
                              RWF {formatCurrency(c.amount)}
                            </p>
                            <Badge
                              variant={
                                c.status === "paid"
                                  ? "success"
                                  : c.status === "pending"
                                  ? "warning"
                                  : "overdue"
                              }
                              className="text-xs"
                            >
                              {c.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Active Loans</CardTitle>
                </CardHeader>
                <CardContent>
                  {activeLoans.length === 0 ? (
                    <EmptyState
                      icon={FileText}
                      title="No active loans"
                      description="No active or overdue loans for this group."
                    />
                  ) : (
                    <div className="space-y-3">
                      {activeLoans.map((loan) => (
                        <div
                          key={loan.id}
                          className="flex items-center justify-between py-2 border-b border-border last:border-0"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-semibold text-secondary">
                                {getInitials(loan.borrowerName)}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">
                                {loan.borrowerName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Due:{" "}
                                {new Date(loan.dueDate).toLocaleDateString(
                                  "en-US",
                                  { month: "short", day: "numeric", year: "numeric" }
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-semibold">
                              RWF {formatCurrency(loan.remaining)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              of {formatCurrency(loan.totalPayable)}
                            </p>
                            {loan.status === "overdue" && (
                              <Badge variant="overdue" className="mt-1 text-xs">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Overdue
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="members" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Members</CardTitle>
                <p className="text-sm text-muted-foreground">
                  All group members ({members.length})
                </p>
              </CardHeader>
              <CardContent>
                {members.length === 0 ? (
                  <EmptyState
                    icon={Users}
                    title="No members"
                    description="This group has no members yet."
                  />
                ) : (
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Joined</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {members.map((m) => (
                          <TableRow key={m.id}>
                            <TableCell className="font-medium">{m.fullName}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {m.email}
                            </TableCell>
                            <TableCell>
                              {m.isAdmin ? (
                                <Badge variant="default">Admin</Badge>
                              ) : (
                                <span className="text-muted-foreground">Member</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  m.status === "active" ? "success" : "secondary"
                                }
                              >
                                {m.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {m.joinedAt}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contributions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Contributions</CardTitle>
                <p className="text-sm text-muted-foreground">
                  All contributions for this group ({contributions.length})
                </p>
              </CardHeader>
              <CardContent>
                {contributions.length === 0 ? (
                  <EmptyState
                    icon={HandCoins}
                    title="No contributions"
                    description="No contributions recorded for this group."
                  />
                ) : (
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Member</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Paid Date</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contributions.map((c) => (
                          <TableRow key={c.id}>
                            <TableCell className="font-medium">
                              {c.memberName}
                            </TableCell>
                            <TableCell>RWF {formatCurrency(c.amount)}</TableCell>
                            <TableCell>
                              {new Date(c.dueDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {c.paidDate
                                ? new Date(c.paidDate).toLocaleDateString()
                                : "—"}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  c.status === "paid"
                                    ? "success"
                                    : c.status === "pending"
                                    ? "warning"
                                    : "overdue"
                                }
                              >
                                {c.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="loans" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Loans</CardTitle>
                <p className="text-sm text-muted-foreground">
                  All loans for this group ({loans.length})
                </p>
              </CardHeader>
              <CardContent>
                {loans.length === 0 ? (
                  <EmptyState
                    icon={FileText}
                    title="No loans"
                    description="No loans recorded for this group."
                  />
                ) : (
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Borrower</TableHead>
                          <TableHead>Principal</TableHead>
                          <TableHead>Total Payable</TableHead>
                          <TableHead>Remaining</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loans.map((loan) => (
                          <TableRow key={loan.id}>
                            <TableCell className="font-medium">
                              {loan.borrowerName}
                            </TableCell>
                            <TableCell>
                              RWF {formatCurrency(loan.principalAmount)}
                            </TableCell>
                            <TableCell>
                              RWF {formatCurrency(loan.totalPayable)}
                            </TableCell>
                            <TableCell>
                              RWF {formatCurrency(loan.remaining)}
                            </TableCell>
                            <TableCell>
                              {new Date(loan.dueDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  loan.status === "completed"
                                    ? "success"
                                    : loan.status === "overdue"
                                    ? "overdue"
                                    : loan.status === "pending"
                                    ? "warning"
                                    : "default"
                                }
                              >
                                {loan.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </DashboardLayout>
  );
}
