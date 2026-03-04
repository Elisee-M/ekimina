import { useState, useEffect } from "react";
import { Search, Mail, Phone, Shield, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface UserResult {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
  groupName: string | null;
  status: string;
  joinedAt: string;
}

export function UserSearchCommand() {
  const { isSuperAdmin, groupMembership } = useAuth();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(() => fetchUsers(query), 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const fetchUsers = async (search: string) => {
    setLoading(true);
    try {
      if (isSuperAdmin) {
        // Fetch all profiles matching
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email, phone, avatar_url")
          .ilike("full_name", `%${search}%`)
          .limit(20);

        if (!profiles?.length) {
          setResults([]);
          return;
        }

        const userIds = profiles.map((p) => p.id);
        const { data: memberships } = await supabase
          .from("group_members")
          .select("user_id, is_admin, status, joined_at, group_id")
          .in("user_id", userIds);

        const groupIds = [...new Set((memberships || []).map((m) => m.group_id))];
        let groupMap = new Map<string, string>();
        if (groupIds.length > 0) {
          const { data: groups } = await supabase
            .from("ikimina_groups")
            .select("id, name")
            .in("id", groupIds);
          groupMap = new Map((groups || []).map((g) => [g.id, g.name]));
        }

        const memberMap = new Map<string, typeof memberships extends (infer T)[] | null ? T : never>();
        (memberships || []).forEach((m) => {
          if (!memberMap.has(m.user_id) || m.status === "active") {
            memberMap.set(m.user_id, m);
          }
        });

        setResults(
          profiles.map((p) => {
            const m = memberMap.get(p.id);
            return {
              id: p.id,
              fullName: p.full_name,
              email: p.email,
              phone: p.phone,
              avatarUrl: p.avatar_url,
              isAdmin: m?.is_admin || false,
              groupName: m ? groupMap.get(m.group_id) || null : null,
              status: m?.status || "no group",
              joinedAt: m?.joined_at
                ? new Date(m.joined_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                : "",
            };
          })
        );
      } else if (groupMembership) {
        // Group admin: search own members
        const { data: members } = await supabase
          .from("group_members")
          .select("id, user_id, is_admin, status, joined_at")
          .eq("group_id", groupMembership.group_id);

        if (!members?.length) {
          setResults([]);
          return;
        }

        const userIds = members.map((m) => m.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email, phone, avatar_url")
          .in("id", userIds)
          .ilike("full_name", `%${search}%`);

        const memberMap = new Map(members.map((m) => [m.user_id, m]));

        setResults(
          (profiles || []).map((p) => {
            const m = memberMap.get(p.id);
            return {
              id: p.id,
              fullName: p.full_name,
              email: p.email,
              phone: p.phone,
              avatarUrl: p.avatar_url,
              isAdmin: m?.is_admin || false,
              groupName: groupMembership.group_name,
              status: m?.status || "unknown",
              joinedAt: m?.joined_at
                ? new Date(m.joined_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                : "",
            };
          })
        );
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <Search className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Search {isSuperAdmin ? "All Users" : "Members"}
          </DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
            autoFocus
          />
        </div>
        <div className="flex-1 overflow-y-auto space-y-1 min-h-0 max-h-[50vh]">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          )}
          {!loading && query.length >= 2 && results.length === 0 && (
            <p className="text-center text-muted-foreground py-8 text-sm">No users found</p>
          )}
          {!loading &&
            results.map((user) => (
              <div
                key={user.id}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src={user.avatarUrl || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {getInitials(user.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm text-foreground">{user.fullName}</p>
                    {user.isAdmin && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        <Shield className="w-3 h-3 mr-0.5" />
                        Admin
                      </Badge>
                    )}
                    <Badge
                      variant={user.status === "active" ? "default" : "destructive"}
                      className="text-[10px] px-1.5 py-0"
                    >
                      {user.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {user.email}
                    </span>
                    {user.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {user.phone}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    {user.groupName && <span>Group: {user.groupName}</span>}
                    {user.joinedAt && <span>Joined: {user.joinedAt}</span>}
                  </div>
                </div>
              </div>
            ))}
          {!loading && query.length < 2 && (
            <p className="text-center text-muted-foreground py-8 text-sm">
              Type at least 2 characters to search
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
