import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowLeft, Users, Wallet, TrendingUp, DollarSign, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePageSeo } from "@/hooks/usePageSeo";

interface GroupInfo {
  id: string;
  name: string;
  description: string | null;
  contribution_amount: number;
  contribution_frequency: string;
  interest_rate: number;
  status: string;
  plan: string;
  created_at: string;
}

interface MemberRow {
  id: string;
  user_id: string;
  is_admin: boolean;
  status: string;
  joined_at: string;
  full_name: string;
  email: string;
  phone: string | null;
}

interface ContributionRow {
  id: string;
  member_id: string;
  amount: number;
  status: string;
  due_date: string;
  paid_date: string | null;
  created_at: string;
  member_name?: string;
}

interface LoanRow {
  id: string;
  borrower_id: string;
  principal_amount: number;
  interest_rate: number;
  total_payable: number;
  profit: number;
  status: string;
  start_date: string;
  due_date: string;
  created_at: string;
  borrower_name?: string;
}

export default function SuperAdminGroupDetail() {
  const { groupId } = useParams<{ groupId: string }>();
  
  usePageSeo({
    title: "Group Details | Super Admin | eKimina",
    description: "View detailed group data including members, contributions, and loans.",
    canonicalPath: `/super-admin/groups/${groupId}`,
  });

  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState<GroupInfo | null>(null);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [contributions, setContributions] = useState<ContributionRow[]>([]);
  const [loans, setLoans] = useState<LoanRow[]>([]);

  useEffect(() => {
    if (!groupId) return;

    const run = async () => {
      try {
        setLoading(true);

        const [{ data: groupData }, { data: memberData }, { data: contribData }, { data: loanData }] = await Promise.all([
          supabase.from("ikimina_groups").select("*").eq("id", groupId).single(),
          supabase.from("group_members").select("id,user_id,is_admin,status,joined_at").eq("group_id", groupId).order("joined_at", { ascending: true }),
          supabase.from("contributions").select("id,member_id,amount,status,due_date,paid_date,created_at").eq("group_id", groupId).order("created_at", { ascending: false }),
          supabase.from("loans").select("id,borrower_id,principal_amount,interest_rate,total_payable,profit,status,start_date,due_date,created_at").eq("group_id", groupId).order("created_at", { ascending: false }),
        ]);

        setGroup(groupData as GroupInfo);

        // Fetch profile names for members
        const memberUserIds = (memberData || []).map((m: any) => m.user_id);
        let profileMap: Record<string, { full_name: string; email: string; phone: string | null }> = {};

        if (memberUserIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id,full_name,email,phone")
            .in("id", memberUserIds);

          (profiles || []).forEach((p: any) => {
            profileMap[p.id] = { full_name: p.full_name, email: p.email, phone: p.phone };
          });
        }

        setMembers(
          (memberData || []).map((m: any) => ({
            ...m,
            full_name: profileMap[m.user_id]?.full_name || "Unknown",
            email: profileMap[m.user_id]?.email || "",
            phone: profileMap[m.user_id]?.phone || null,
          }))
        );

        // Map member names to contributions and loans
        setContributions(
          (contribData || []).map((c: any) => ({
            ...c,
            amount: Number(c.amount),
            member_name: profileMap[c.member_id]?.full_name || "Unknown",
          }))
        );

        setLoans(
          (loanData || []).map((l: any) => ({
            ...l,
            principal_amount: Number(l.principal_amount),
            interest_rate: Number(l.interest_rate),
            total_payable: Number(l.total_payable),
            profit: Number(l.profit),
            borrower_name: profileMap[l.borrower_id]?.full_name || "Unknown",
          }))
        );
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [groupId]);

  const formatCurrency = (amount: number) => `RWF ${new Intl.NumberFormat("en-RW").format(amount)}`;

  const statusVariant = (status: string) => {
    switch (status) {
      case "active":
      case "paid":
      case "completed":
        return "default" as const;
      case "pending":
        return "secondary" as const;
      case "overdue":
      case "late":
      case "missed":
        return "destructive" as const;
      default:
        return "outline" as const;
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="super-admin">
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!group) {
    return (
      <DashboardLayout role="super-admin">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Group not found</p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/super-admin/groups">Back to Groups</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const totalContributions = contributions.reduce((s, c) => s + c.amount, 0);
  const totalLoansAmount = loans.reduce((s, l) => s + l.principal_amount, 0);
  const totalProfit = loans.reduce((s, l) => s + l.profit, 0);
  const activeMembers = members.filter((m) => m.status === "active").length;

  return (
    <DashboardLayout role="super-admin">
      <main className="space-y-6">
        <header className="flex items-start gap-4">
          <Button asChild variant="ghost" size="icon" className="mt-1">
            <Link to="/super-admin/groups">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{group.name}</h1>
              <Badge variant={group.status === "active" ? "default" : "secondary"}>{group.status}</Badge>
              <Badge variant={group.plan === "growth" ? "gold" : "muted"} className="capitalize">{group.plan}</Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              {group.description || "No description"} • {group.contribution_frequency} contributions • Created {new Date(group.created_at).toLocaleDateString()}
            </p>
          </div>
        </header>

        {/* Stats */}
        <section className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Members</p>
              <p className="text-xl font-bold">{activeMembers}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Contributions</p>
              <p className="text-xl font-bold">{formatCurrency(totalContributions)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Loans Issued</p>
              <p className="text-xl font-bold">{formatCurrency(totalLoansAmount)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Loan Profit</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(totalProfit)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Interest Rate</p>
              <p className="text-xl font-bold">{group.interest_rate}%</p>
            </CardContent>
          </Card>
        </section>

        {/* Tabs for raw data */}
        <Tabs defaultValue="members">
          <TabsList>
            <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
            <TabsTrigger value="contributions">Contributions ({contributions.length})</TabsTrigger>
            <TabsTrigger value="loans">Loans ({loans.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="members">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Group Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-border overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {members.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No members</TableCell>
                        </TableRow>
                      ) : (
                        members.map((m) => (
                          <TableRow key={m.id}>
                            <TableCell className="font-medium">{m.full_name}</TableCell>
                            <TableCell className="text-muted-foreground">{m.email}</TableCell>
                            <TableCell className="text-muted-foreground">{m.phone || "—"}</TableCell>
                            <TableCell>
                              <Badge variant={m.is_admin ? "gold" : "muted"}>
                                {m.is_admin ? "Admin" : "Member"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={statusVariant(m.status)}>{m.status}</Badge>
                            </TableCell>
                            <TableCell>{new Date(m.joined_at).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contributions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  All Contributions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-border overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Paid Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contributions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No contributions</TableCell>
                        </TableRow>
                      ) : (
                        contributions.map((c) => (
                          <TableRow key={c.id}>
                            <TableCell className="font-medium">{c.member_name}</TableCell>
                            <TableCell>{formatCurrency(c.amount)}</TableCell>
                            <TableCell>
                              <Badge variant={statusVariant(c.status)}>{c.status}</Badge>
                            </TableCell>
                            <TableCell>{new Date(c.due_date).toLocaleDateString()}</TableCell>
                            <TableCell>{c.paid_date ? new Date(c.paid_date).toLocaleDateString() : "—"}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="loans">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  All Loans
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-border overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Borrower</TableHead>
                        <TableHead>Principal</TableHead>
                        <TableHead>Interest</TableHead>
                        <TableHead>Total Payable</TableHead>
                        <TableHead>Profit</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Start</TableHead>
                        <TableHead>Due</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loans.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground py-8">No loans</TableCell>
                        </TableRow>
                      ) : (
                        loans.map((l) => (
                          <TableRow key={l.id}>
                            <TableCell className="font-medium">{l.borrower_name}</TableCell>
                            <TableCell>{formatCurrency(l.principal_amount)}</TableCell>
                            <TableCell>{l.interest_rate}%</TableCell>
                            <TableCell>{formatCurrency(l.total_payable)}</TableCell>
                            <TableCell className="text-green-600 font-medium">{formatCurrency(l.profit)}</TableCell>
                            <TableCell>
                              <Badge variant={statusVariant(l.status)}>{l.status}</Badge>
                            </TableCell>
                            <TableCell>{new Date(l.start_date).toLocaleDateString()}</TableCell>
                            <TableCell>{new Date(l.due_date).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </DashboardLayout>
  );
}
