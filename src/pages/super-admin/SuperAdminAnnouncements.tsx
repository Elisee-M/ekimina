import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell,
  Loader2,
  Plus,
  Send,
  Users,
  Shield,
  MessageCircle,
  MessageCircleOff,
  Calendar,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePageSeo } from "@/hooks/usePageSeo";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface PlatformAnnouncement {
  id: string;
  title: string;
  content: string;
  target_audience: "admins" | "all_members";
  comments_allowed: boolean;
  created_at: string;
}

export default function SuperAdminAnnouncements() {
  usePageSeo({
    title: "Platform Announcements | Super Admin | eKimina",
    description: "Send platform-wide announcements to admins or all members.",
    canonicalPath: "/super-admin/announcements",
  });

  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<PlatformAnnouncement[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    content: "",
    target_audience: "all_members" as "admins" | "all_members",
    comments_allowed: true,
  });

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("platform_announcements")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAnnouncements((data || []) as PlatformAnnouncement[]);
    } catch (error: unknown) {
      console.error("Error fetching announcements:", error);
      toast({
        title: "Error",
        description: "Failed to load announcements",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreateAnnouncement = async () => {
    if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) return;

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("platform_announcements").insert({
        title: newAnnouncement.title.trim(),
        content: newAnnouncement.content.trim(),
        target_audience: newAnnouncement.target_audience,
        comments_allowed: newAnnouncement.comments_allowed,
        created_by: user?.id ?? null,
      });

      if (error) throw error;

      toast({
        title: "Announcement sent",
        description: `Your announcement has been sent to ${newAnnouncement.target_audience === "admins" ? "all group admins" : "all members"}.`,
      });
      setNewAnnouncement({
        title: "",
        content: "",
        target_audience: "all_members",
        comments_allowed: true,
      });
      setDialogOpen(false);
      fetchAnnouncements();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to send announcement";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
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

  return (
    <DashboardLayout role="super-admin">
      <main className="space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Platform Announcements
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Send announcements to all group admins or all members. Sender shows as eKimina.
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Announcement
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Platform Announcement</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Announcement title"
                    value={newAnnouncement.title}
                    onChange={(e) =>
                      setNewAnnouncement((prev) => ({ ...prev, title: e.target.value }))
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    placeholder="Write your announcement..."
                    rows={5}
                    value={newAnnouncement.content}
                    onChange={(e) =>
                      setNewAnnouncement((prev) => ({ ...prev, content: e.target.value }))
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Send to</Label>
                  <Select
                    value={newAnnouncement.target_audience}
                    onValueChange={(v: "admins" | "all_members") =>
                      setNewAnnouncement((prev) => ({ ...prev, target_audience: v }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admins" className="gap-2">
                        <Shield className="w-4 h-4 mr-2" />
                        Only group admins
                      </SelectItem>
                      <SelectItem value="all_members" className="gap-2">
                        <Users className="w-4 h-4 mr-2" />
                        All members
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-2">
                    {newAnnouncement.comments_allowed ? (
                      <MessageCircle className="w-5 h-5 text-primary" />
                    ) : (
                      <MessageCircleOff className="w-5 h-5 text-muted-foreground" />
                    )}
                    <div>
                      <Label htmlFor="comments">Allow comments</Label>
                      <p className="text-xs text-muted-foreground">
                        Let recipients comment on this announcement
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="comments"
                    checked={newAnnouncement.comments_allowed}
                    onCheckedChange={(checked) =>
                      setNewAnnouncement((prev) => ({ ...prev, comments_allowed: checked }))
                    }
                  />
                </div>
                <Button
                  className="w-full gap-2"
                  onClick={handleCreateAnnouncement}
                  disabled={
                    submitting ||
                    !newAnnouncement.title.trim() ||
                    !newAnnouncement.content.trim()
                  }
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Send as eKimina
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </header>

        {announcements.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No platform announcements yet"
            description="Create your first announcement to notify admins or all members. It will appear as sent by eKimina."
            action={
              <Button onClick={() => setDialogOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                New Announcement
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            {announcements.map((announcement, index) => (
              <motion.div
                key={announcement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card variant="elevated">
                  <CardHeader className="p-4 sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Bell className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base sm:text-lg">
                            {announcement.title}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(
                                new Date(announcement.created_at),
                                "MMM d, yyyy 'at' h:mm a"
                              )}
                            </p>
                            <Badge variant="secondary" className="text-xs">
                              from eKimina
                            </Badge>
                            <Badge
                              variant={
                                announcement.target_audience === "admins"
                                  ? "default"
                                  : "outline"
                              }
                              className="text-xs"
                            >
                              {announcement.target_audience === "admins"
                                ? "Admins only"
                                : "All members"}
                            </Badge>
                            {announcement.comments_allowed ? (
                              <Badge variant="muted" className="text-xs gap-1">
                                <MessageCircle className="w-3 h-3" />
                                Comments on
                              </Badge>
                            ) : (
                              <Badge variant="muted" className="text-xs gap-1">
                                <MessageCircleOff className="w-3 h-3" />
                                No comments
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {announcement.content}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </DashboardLayout>
  );
}
