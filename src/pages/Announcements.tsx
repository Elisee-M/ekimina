import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Bell,
  Loader2,
  Calendar,
  Plus,
  Trash2,
  MessageCircle,
  MessageCircleOff,
  Send,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  created_by?: string | null;
  source: "group" | "platform";
  commentsAllowed: boolean;
  senderName?: string;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  user_name?: string;
}

const Announcements = () => {
  const { groupMembership, user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [expandedAnnouncement, setExpandedAnnouncement] = useState<string | null>(null);
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: "", content: "" });

  const groupId = groupMembership?.group_id;

  const fetchAnnouncements = async () => {
    if (!groupId) return;

    try {
      const [groupRes, platformRes] = await Promise.all([
        supabase
          .from("announcements")
          .select("*")
          .eq("group_id", groupId)
          .order("created_at", { ascending: false }),
        supabase
          .from("platform_announcements")
          .select("*")
          .eq("target_audience", "admins")
          .order("created_at", { ascending: false }),
      ]);

      if (groupRes.error) throw groupRes.error;

      const groupAnnouncements: Announcement[] = (groupRes.data || []).map((a) => ({
        id: a.id,
        title: a.title,
        content: a.content,
        created_at: a.created_at,
        created_by: a.created_by,
        source: "group" as const,
        commentsAllowed: true,
      }));

      const platformAnnouncements: Announcement[] = (platformRes.data || []).map((a) => ({
        id: a.id,
        title: a.title,
        content: a.content,
        created_at: a.created_at,
        source: "platform" as const,
        commentsAllowed: a.comments_allowed,
        senderName: "eKimina",
      }));

      const merged = [...groupAnnouncements, ...platformAnnouncements].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setAnnouncements(merged);
    } catch (error) {
      console.error("Error fetching announcements:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (announcementId: string, isPlatform: boolean) => {
    try {
      const table = isPlatform ? "platform_announcement_comments" : "announcement_comments";
      const idCol = isPlatform ? "platform_announcement_id" : "announcement_id";

      const { data: commentsData, error: commentsError } = await supabase
        .from(table)
        .select("*")
        .eq(idCol, announcementId)
        .order("created_at", { ascending: true });

      if (commentsError) throw commentsError;

      const userIds = [...new Set(commentsData?.map((c) => c.user_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p.full_name]) || []);

      const commentsWithNames =
        commentsData?.map((comment) => ({
          ...comment,
          user_name: profileMap.get(comment.user_id) || "Unknown User",
        })) || [];

      setComments((prev) => ({ ...prev, [announcementId]: commentsWithNames }));
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [groupId]);

  const handleCreateAnnouncement = async () => {
    if (!groupId || !newAnnouncement.title.trim() || !newAnnouncement.content.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("announcements")
        .insert({
          group_id: groupId,
          title: newAnnouncement.title.trim(),
          content: newAnnouncement.content.trim(),
          created_by: user?.id
        });

      if (error) throw error;

      toast({ title: "Announcement created", description: "Your announcement has been posted." });
      setNewAnnouncement({ title: "", content: "" });
      setDialogOpen(false);
      fetchAnnouncements();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string, source: "group" | "platform") => {
    if (source === "platform") return; // Admins cannot delete platform announcements
    try {
      const { error } = await supabase.from("announcements").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Announcement deleted" });
      fetchAnnouncements();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to delete";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };

  const handleAddComment = async (announcementId: string, isPlatform: boolean) => {
    const content = newComment[announcementId]?.trim();
    if (!content || !user?.id) return;

    try {
      if (isPlatform) {
        const { error } = await supabase.from("platform_announcement_comments").insert({
          platform_announcement_id: announcementId,
          user_id: user.id,
          content,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("announcement_comments").insert({
          announcement_id: announcementId,
          user_id: user.id,
          content,
        });
        if (error) throw error;
      }
      setNewComment((prev) => ({ ...prev, [announcementId]: "" }));
      fetchComments(announcementId, isPlatform);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to add comment";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };

  const handleDeleteComment = async (
    commentId: string,
    announcementId: string,
    isPlatform: boolean
  ) => {
    try {
      const table = isPlatform ? "platform_announcement_comments" : "announcement_comments";
      const { error } = await supabase.from(table).delete().eq("id", commentId);
      if (error) throw error;
      fetchComments(announcementId, isPlatform);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to delete comment";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };

  const toggleComments = (announcementId: string, isPlatform: boolean) => {
    if (expandedAnnouncement === announcementId) {
      setExpandedAnnouncement(null);
    } else {
      setExpandedAnnouncement(announcementId);
      if (!comments[announcementId]) {
        fetchComments(announcementId, isPlatform);
      }
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="admin">
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">Announcements</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Create and manage announcements for your group members
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
                <DialogTitle>Create Announcement</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Input
                    placeholder="Announcement title"
                    value={newAnnouncement.title}
                    onChange={(e) => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div>
                  <Textarea
                    placeholder="Write your announcement..."
                    rows={5}
                    value={newAnnouncement.content}
                    onChange={(e) => setNewAnnouncement(prev => ({ ...prev, content: e.target.value }))}
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleCreateAnnouncement}
                  disabled={submitting || !newAnnouncement.title.trim() || !newAnnouncement.content.trim()}
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Post Announcement
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Announcements List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {announcements.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="No announcements yet"
              description="Create your first announcement to notify your group members."
            />
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement, index) => (
                <motion.div
                  key={announcement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card variant="elevated">
                    <CardHeader className="p-4 sm:p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                            <Bell className="w-5 h-5 text-secondary" />
                          </div>
                          <div>
                            <CardTitle className="text-base sm:text-lg">{announcement.title}</CardTitle>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(announcement.created_at), "MMM d, yyyy 'at' h:mm a")}
                              </p>
                              {announcement.senderName && (
                                <Badge variant="secondary" className="text-xs">
                                  from {announcement.senderName}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        {announcement.source === "group" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteAnnouncement(announcement.id, announcement.source)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {announcement.content}
                      </p>

                      {/* Comments Section */}
                      {announcement.commentsAllowed ? (
                        <div className="border-t border-border pt-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              toggleComments(announcement.id, announcement.source === "platform")
                            }
                            className="gap-2 text-muted-foreground"
                          >
                            <MessageCircle className="w-4 h-4" />
                            Comments ({comments[announcement.id]?.length || 0})
                            {expandedAnnouncement === announcement.id ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Button>

                          {expandedAnnouncement === announcement.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-4 space-y-3"
                            >
                              {comments[announcement.id]?.map((comment) => (
                                <div
                                  key={comment.id}
                                  className="flex items-start gap-3 bg-muted/50 rounded-lg p-3"
                                >
                                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <span className="text-xs font-semibold text-primary">
                                      {comment.user_name?.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="text-sm font-medium">{comment.user_name}</p>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">
                                          {format(new Date(comment.created_at), "MMM d, h:mm a")}
                                        </span>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6 text-destructive hover:text-destructive"
                                          onClick={() =>
                                            handleDeleteComment(
                                              comment.id,
                                              announcement.id,
                                              announcement.source === "platform"
                                            )
                                          }
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">{comment.content}</p>
                                  </div>
                                </div>
                              ))}

                              <div className="flex items-center gap-2">
                                <Input
                                  placeholder="Write a comment..."
                                  value={newComment[announcement.id] || ""}
                                  onChange={(e) =>
                                    setNewComment((prev) => ({ ...prev, [announcement.id]: e.target.value }))
                                  }
                                  onKeyDown={(e) =>
                                    e.key === "Enter" &&
                                    handleAddComment(announcement.id, announcement.source === "platform")
                                  }
                                />
                                <Button
                                  size="icon"
                                  onClick={() =>
                                    handleAddComment(announcement.id, announcement.source === "platform")
                                  }
                                  disabled={!newComment[announcement.id]?.trim()}
                                >
                                  <Send className="w-4 h-4" />
                                </Button>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      ) : (
                        announcement.source === "platform" && (
                          <div className="border-t border-border pt-4 flex items-center gap-2 text-xs text-muted-foreground">
                            <MessageCircleOff className="w-4 h-4" />
                            Comments disabled for this announcement
                          </div>
                        )
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Announcements;