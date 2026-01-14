import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, UserPlus, Search, Mail, Phone, MoreVertical, Shield, ShieldOff, UserX, UserCheck, Clock, Check, X } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmptyState } from "@/components/EmptyState";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Member {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
  status: string;
  joinedAt: string;
}

export default function Members() {
  const { groupMembership } = useAuth();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [actionDialog, setActionDialog] = useState<{ type: string; open: boolean }>({ type: "", open: false });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (groupMembership) {
      fetchMembers();
    }
  }, [groupMembership]);

  const fetchMembers = async () => {
    if (!groupMembership) return;

    try {
      // Fetch group members
      const { data: membersData, error: membersError } = await supabase
        .from("group_members")
        .select("id, user_id, is_admin, status, joined_at")
        .eq("group_id", groupMembership.group_id);

      if (membersError) throw membersError;

      // Fetch profiles for all members
      const userIds = membersData?.map((m) => m.user_id) || [];
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, avatar_url")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      const profilesMap = new Map(profilesData?.map((p) => [p.id, p]));

      const formattedMembers: Member[] = (membersData || []).map((m) => {
        const profile = profilesMap.get(m.user_id);
        return {
          id: m.id,
          userId: m.user_id,
          fullName: profile?.full_name || "Unknown",
          email: profile?.email || "",
          phone: profile?.phone || null,
          avatarUrl: profile?.avatar_url || null,
          isAdmin: m.is_admin,
          status: m.status,
          joinedAt: new Date(m.joined_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
        };
      });

      setMembers(formattedMembers);
    } catch (error) {
      console.error("Error fetching members:", error);
      toast.error("Failed to load members");
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter(
    (m) =>
      m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleAdmin = async () => {
    if (!selectedMember) return;
    setActionLoading(true);

    try {
      const { error } = await supabase
        .from("group_members")
        .update({ is_admin: !selectedMember.isAdmin })
        .eq("id", selectedMember.id);

      if (error) throw error;

      toast.success(
        selectedMember.isAdmin
          ? `${selectedMember.fullName} is no longer an admin`
          : `${selectedMember.fullName} is now an admin`
      );
      fetchMembers();
    } catch (error) {
      console.error("Error updating admin status:", error);
      toast.error("Failed to update admin status");
    } finally {
      setActionLoading(false);
      setActionDialog({ type: "", open: false });
      setSelectedMember(null);
    }
  };

  const handleRemoveMember = async () => {
    if (!selectedMember || !groupMembership?.group_id) return;
    setActionLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("No session");

      const response = await supabase.functions.invoke("delete-user", {
        body: { userId: selectedMember.userId, groupId: groupMembership.group_id },
      });

      if (response.error) throw response.error;

      toast.success(`${selectedMember.fullName} has been permanently deleted`);
      fetchMembers();
    } catch (error) {
      console.error("Error deleting member:", error);
      toast.error("Failed to delete member");
    } finally {
      setActionLoading(false);
      setActionDialog({ type: "", open: false });
      setSelectedMember(null);
    }
  };

  const handleApproveRejoin = async (member: Member) => {
    try {
      const { error } = await supabase
        .from("group_members")
        .update({ status: "active" })
        .eq("id", member.id);

      if (error) throw error;

      toast.success(`${member.fullName} has been approved to rejoin the group`);
      fetchMembers();
    } catch (error) {
      console.error("Error approving rejoin:", error);
      toast.error("Failed to approve rejoin request");
    }
  };

  const handleRejectRejoin = async (member: Member) => {
    try {
      const { error } = await supabase
        .from("group_members")
        .update({ status: "removed" })
        .eq("id", member.id);

      if (error) throw error;

      toast.success(`${member.fullName}'s rejoin request has been rejected`);
      fetchMembers();
    } catch (error) {
      console.error("Error rejecting rejoin:", error);
      toast.error("Failed to reject rejoin request");
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const pendingRejoinMembers = members.filter(m => m.status === "pending_rejoin");
  const activeAndOtherMembers = members.filter(m => m.status !== "pending_rejoin");

  if (loading) {
    return (
      <DashboardLayout role="admin">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Members</h1>
            <p className="text-muted-foreground">
              Manage your group members ({members.filter((m) => m.status === "active").length} active)
            </p>
          </div>
          <Button className="gap-2">
            <UserPlus className="w-4 h-4" />
            Invite Member
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Pending Rejoin Requests */}
        {pendingRejoinMembers.length > 0 && (
          <Card className="border-amber-500/50 bg-amber-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                Pending Rejoin Requests
                <Badge variant="secondary" className="ml-2">{pendingRejoinMembers.length}</Badge>
              </CardTitle>
              <CardDescription>Members who have requested to rejoin the group</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {pendingRejoinMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.avatarUrl || undefined} />
                        <AvatarFallback className="bg-amber-500/10 text-amber-600">
                          {getInitials(member.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">{member.fullName}</p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {member.email}
                          </span>
                          {member.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {member.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => handleRejectRejoin(member)}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApproveRejoin(member)}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Members List */}
        {activeAndOtherMembers.filter(
          (m) =>
            m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.email.toLowerCase().includes(searchQuery.toLowerCase())
        ).length === 0 ? (
          <EmptyState
            icon={Users}
            title="No members found"
            description={searchQuery ? "Try a different search term" : "Invite members to join your group"}
          />
        ) : (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Group Members
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {activeAndOtherMembers.filter(
                  (m) =>
                    m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    m.email.toLowerCase().includes(searchQuery.toLowerCase())
                ).map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.avatarUrl || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(member.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">{member.fullName}</p>
                          {member.isAdmin && (
                            <Badge variant="secondary" className="text-xs">
                              <Shield className="w-3 h-3 mr-1" />
                              Admin
                            </Badge>
                          )}
                          {member.status === "pending_rejoin" && (
                            <Badge variant="default" className="text-xs bg-amber-500">
                              <Clock className="w-3 h-3 mr-1" />
                              Pending Rejoin
                            </Badge>
                          )}
                          {member.status !== "active" && member.status !== "pending_rejoin" && (
                            <Badge variant="destructive" className="text-xs">
                              {member.status === "removed" ? "Removed" : "Inactive"}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {member.email}
                          </span>
                          {member.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {member.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <p className="text-xs text-muted-foreground hidden sm:block">
                        Joined {member.joinedAt}
                      </p>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedMember(member);
                              setActionDialog({ type: "admin", open: true });
                            }}
                          >
                            {member.isAdmin ? (
                              <>
                                <ShieldOff className="w-4 h-4 mr-2" />
                                Remove Admin
                              </>
                            ) : (
                              <>
                                <Shield className="w-4 h-4 mr-2" />
                                Make Admin
                              </>
                            )}
                          </DropdownMenuItem>
                          {member.status === "active" && (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setSelectedMember(member);
                                setActionDialog({ type: "remove", open: true });
                              }}
                            >
                              <UserX className="w-4 h-4 mr-2" />
                              Remove Member
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Admin Toggle Dialog */}
        <Dialog
          open={actionDialog.type === "admin" && actionDialog.open}
          onOpenChange={(open) => setActionDialog({ type: "", open })}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedMember?.isAdmin ? "Remove Admin Privileges" : "Grant Admin Privileges"}
              </DialogTitle>
              <DialogDescription>
                {selectedMember?.isAdmin
                  ? `Are you sure you want to remove admin privileges from ${selectedMember?.fullName}?`
                  : `Are you sure you want to make ${selectedMember?.fullName} an admin? They will be able to manage members, contributions, and loans.`}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setActionDialog({ type: "", open: false })}>
                Cancel
              </Button>
              <Button onClick={handleToggleAdmin} disabled={actionLoading}>
                {actionLoading ? "Processing..." : "Confirm"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Remove Member Dialog */}
        <Dialog
          open={actionDialog.type === "remove" && actionDialog.open}
          onOpenChange={(open) => setActionDialog({ type: "", open })}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove Member</DialogTitle>
              <DialogDescription>
                Are you sure you want to remove {selectedMember?.fullName} from the group? They will no
                longer be able to access group data.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setActionDialog({ type: "", open: false })}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleRemoveMember} disabled={actionLoading}>
                {actionLoading ? "Removing..." : "Remove Member"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </DashboardLayout>
  );
}
