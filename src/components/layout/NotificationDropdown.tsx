import { useNavigate } from "react-router-dom";
import { Bell, Megaphone, Mail, ShieldCheck, AlertTriangle, Clock, CheckCheck } from "lucide-react";
import { useNotifications, markAsSeen } from "@/hooks/useNotifications";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NotificationDropdownProps {
  role: "super-admin" | "admin" | "member";
}

export function NotificationDropdown({ role }: NotificationDropdownProps) {
  const navigate = useNavigate();
  const { counts, reminderItems, markReminderRead, markAllRemindersRead } = useNotifications();

  const handleNavigate = (path: string, seenKey: string) => {
    markAsSeen(seenKey);
    navigate(path);
  };

  const getIcon = (type: string) => {
    if (type === "penalty_warning") return <AlertTriangle className="w-4 h-4 text-destructive" />;
    if (type === "contribution_due_today") return <Clock className="w-4 h-4 text-orange-500" />;
    return <Bell className="w-4 h-4 text-primary" />;
  };

  // Strip [ref:...] from display
  const cleanMessage = (msg: string) => msg.replace(/\s*\[ref:[^\]]+\]/, "");

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
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          Notifications
          {counts.reminders > 0 && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                markAllRemindersRead();
              }}
              className="text-xs text-primary hover:underline font-normal flex items-center gap-1"
            >
              <CheckCheck className="w-3 h-3" />
              Mark all read
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* In-app reminder notifications */}
        {reminderItems.length > 0 && (
          <>
            <ScrollArea className="max-h-48">
              {reminderItems.map((item) => (
                <DropdownMenuItem
                  key={item.id}
                  onClick={() => markReminderRead(item.id)}
                  className="flex items-start gap-3 cursor-pointer py-2.5 px-3"
                >
                  <div className="mt-0.5 shrink-0">{getIcon(item.type)}</div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground leading-tight">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{cleanMessage(item.message)}</p>
                  </div>
                </DropdownMenuItem>
              ))}
            </ScrollArea>
            <DropdownMenuSeparator />
          </>
        )}

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
