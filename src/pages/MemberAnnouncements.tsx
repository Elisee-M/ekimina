import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/EmptyState";
import { 
  Bell,
  Loader2,
  Calendar,
  MessageCircle,
  Send,
  ChevronDown,
  ChevronUp,
  Trash2
} from "lucide-react";
import { useMemberData } from "@/hooks/useMemberData";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface SystemAnnouncement {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  user_name?: string;
}

const MemberAnnouncements = () => {
  const { loading, announcements, groupInfo } = useMemberData();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [expandedAnnouncement, setExpandedAnnouncement] = useState<string | null>(null);
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [systemAnnouncements, setSystemAnnouncements] = useState<SystemAnnouncement[]>([]);

  const fetchSystemAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from("system_announcements")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setSystemAnnouncements((data || []) as SystemAnnouncement[]);
    } catch (error) {
      console.error("Error fetching system announcements:", error);
    }
  };

  useEffect(() => {
    fetchSystemAnnouncements();
  }, []);

  const fetchComments = async (announcementId: string) => {
    try {
      const { data: commentsData, error: commentsError } = await supabase
        .from("announcement_comments")
        .select("*")
        .eq("announcement_id", announcementId)
        .order("created_at", { ascending: true });

      if (commentsError) throw commentsError;

      // Fetch user names for comments
      const userIds = [...new Set(commentsData?.map(c => c.user_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);

      const commentsWithNames = commentsData?.map(comment => ({
        ...comment,
        user_name: profileMap.get(comment.user_id) || "Unknown User"
      })) || [];

      setComments(prev => ({ ...prev, [announcementId]: commentsWithNames }));
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const handleAddComment = async (announcementId: string) => {
    const content = newComment[announcementId]?.trim();
    if (!content || !user?.id) return;

    try {
      const { error } = await supabase
        .from("announcement_comments")
        .insert({
          announcement_id: announcementId,
          user_id: user.id,
          content
        });

      if (error) throw error;

      setNewComment(prev => ({ ...prev, [announcementId]: "" }));
      fetchComments(announcementId);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteComment = async (commentId: string, announcementId: string) => {
    try {
      const { error } = await supabase
        .from("announcement_comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;
      fetchComments(announcementId);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const toggleComments = (announcementId: string) => {
    if (expandedAnnouncement === announcementId) {
      setExpandedAnnouncement(null);
    } else {
      setExpandedAnnouncement(announcementId);
      if (!comments[announcementId]) {
        fetchComments(announcementId);
      }
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="member">
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="member">
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">Announcements</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Important updates from your group admin
            {groupInfo && <span className="ml-1">in <span className="font-medium text-foreground">{groupInfo.name}</span></span>}
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold">System Announcements</h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {systemAnnouncements.length === 0 ? (
              <EmptyState
                icon={Bell}
                title="No system announcements"
                description="Messages from super admin will appear here."
              />
            ) : (
              <div className="space-y-4">
                {systemAnnouncements.map((announcement, index) => (
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
                              <CardTitle className="text-base sm:text-lg">{announcement.title}</CardTitle>
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(announcement.created_at), "MMM d, yyyy 'at' h:mm a")}
                              </p>
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
          </motion.div>
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
              title="No announcements"
              description="Group announcements from your admin will appear here."
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
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <Calendar className="w-3 h-3" />
                              {announcement.date}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {announcement.content}
                      </p>

                      {/* Comments Section */}
                      <div className="border-t border-border pt-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleComments(announcement.id)}
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
                            {/* Comment List */}
                            {comments[announcement.id]?.map(comment => (
                              <div key={comment.id} className="flex items-start gap-3 bg-muted/50 rounded-lg p-3">
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
                                      {comment.user_id === user?.id && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6 text-destructive hover:text-destructive"
                                          onClick={() => handleDeleteComment(comment.id, announcement.id)}
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1">{comment.content}</p>
                                </div>
                              </div>
                            ))}

                            {/* Add Comment */}
                            <div className="flex items-center gap-2">
                              <Input
                                placeholder="Write a comment..."
                                value={newComment[announcement.id] || ""}
                                onChange={(e) => setNewComment(prev => ({ ...prev, [announcement.id]: e.target.value }))}
                                onKeyDown={(e) => e.key === "Enter" && handleAddComment(announcement.id)}
                              />
                              <Button
                                size="icon"
                                onClick={() => handleAddComment(announcement.id)}
                                disabled={!newComment[announcement.id]?.trim()}
                              >
                                <Send className="w-4 h-4" />
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </div>
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

export default MemberAnnouncements;
