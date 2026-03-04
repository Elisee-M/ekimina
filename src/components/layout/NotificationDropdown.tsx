import { useNavigate } from "react-router-dom";
import { Bell, Megaphone, Mail, ShieldCheck } from "lucide-react";
import { useNotifications, markAsSeen } from "@/hooks/useNotifications";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface NotificationDropdownProps {
  role: "super-admin" | "admin" | "member";
}

export function NotificationDropdown({ role }: NotificationDropdownProps) {
  const navigate = useNavigate();
  const counts = useNotifications();

  const handleNavigate = (path: string, seenKey: string) => {
    markAsSeen(seenKey);
    navigate(path);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors touch-manipulation">
          <Bell className="w-5 h-5" />
          {counts.total > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1">
              {counts.total > 99 ? "99+" : counts.total}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {role === "super-admin" ? (
          <>
            <DropdownMenuItem
              onClick={() => handleNavigate("/super-admin/announcements", "sa_announcements")}
              className="flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Megaphone className="w-4 h-4" />
                Announcements
              </span>
              {counts.announcements > 0 && (
                <span className="min-w-[20px] h-5 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-bold px-1.5">
                  {counts.announcements}
                </span>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleNavigate("/super-admin/messages", "sa_messages")}
              className="flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Messages
              </span>
              {counts.messages > 0 && (
                <span className="min-w-[20px] h-5 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-bold px-1.5">
                  {counts.messages}
                </span>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleNavigate("/super-admin/approvals", "sa_approvals")}
              className="flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Approvals
              </span>
              {counts.approvals > 0 && (
                <span className="min-w-[20px] h-5 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-bold px-1.5">
                  {counts.approvals}
                </span>
              )}
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem
              onClick={() =>
                handleNavigate(
                  role === "admin" ? "/dashboard/announcements" : "/member/announcements",
                  "announcements"
                )
              }
              className="flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Announcements
              </span>
              {counts.announcements > 0 && (
                <span className="min-w-[20px] h-5 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-bold px-1.5">
                  {counts.announcements}
                </span>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleNavigate("/system-notices", "system_notices")}
              className="flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Megaphone className="w-4 h-4" />
                System Notices
              </span>
              {counts.systemNotices > 0 && (
                <span className="min-w-[20px] h-5 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-bold px-1.5">
                  {counts.systemNotices}
                </span>
              )}
            </DropdownMenuItem>
          </>
        )}

        {counts.total === 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-3 text-center text-sm text-muted-foreground">
              No new notifications
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
