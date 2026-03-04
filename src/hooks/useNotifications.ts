import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface NotificationCounts {
  announcements: number;
  systemNotices: number;
  messages: number;
  approvals: number;
  total: number;
}

const STORAGE_KEY = "ekimina_last_seen";

function getLastSeen(key: string): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed[key] || "1970-01-01T00:00:00Z";
    }
  } catch {}
  return "1970-01-01T00:00:00Z";
}

export function markAsSeen(key: string) {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : {};
    parsed[key] = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  } catch {}
}

export function useNotifications() {
  const { user, roles, groupMembership, isSuperAdmin } = useAuth();
  const [counts, setCounts] = useState<NotificationCounts>({
    announcements: 0,
    systemNotices: 0,
    messages: 0,
    approvals: 0,
    total: 0,
  });

  useEffect(() => {
    if (!user) return;

    const fetchCounts = async () => {
      let announcements = 0;
      let systemNotices = 0;
      let messages = 0;
      let approvals = 0;

      if (isSuperAdmin) {
        // Super admin: announcements (system), messages, approvals
        const lastSeenAnn = getLastSeen("sa_announcements");
        const lastSeenMsg = getLastSeen("sa_messages");
        const lastSeenApp = getLastSeen("sa_approvals");

        const [annRes, msgRes, appRes] = await Promise.all([
          supabase
            .from("system_announcements")
            .select("id", { count: "exact", head: true })
            .gt("created_at", lastSeenAnn),
          supabase
            .from("contact_messages")
            .select("id", { count: "exact", head: true })
            .eq("is_read", false),
          supabase
            .from("ikimina_groups")
            .select("id", { count: "exact", head: true })
            .eq("plan", "growth")
            .is("payment_confirmed_at", null),
        ]);

        announcements = annRes.count || 0;
        messages = msgRes.count || 0;
        approvals = appRes.count || 0;
      } else {
        // Group admin or member: group announcements + system notices
        const lastSeenAnn = getLastSeen("announcements");
        const lastSeenSys = getLastSeen("system_notices");

        if (groupMembership) {
          const annRes = await supabase
            .from("announcements")
            .select("id", { count: "exact", head: true })
            .eq("group_id", groupMembership.group_id)
            .gt("created_at", lastSeenAnn);
          announcements = annRes.count || 0;
        }

        const sysRes = await supabase
          .from("system_announcements")
          .select("id", { count: "exact", head: true })
          .gt("created_at", lastSeenSys);
        systemNotices = sysRes.count || 0;
      }

      setCounts({
        announcements,
        systemNotices,
        messages,
        approvals,
        total: announcements + systemNotices + messages + approvals,
      });
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, [user, isSuperAdmin, groupMembership]);

  return counts;
}
