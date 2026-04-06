import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { usePageSeo } from "@/hooks/usePageSeo";
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
  Calendar,
  Plus,
  Trash2,
  Users,
  Shield,
  MessageSquare,
  MessageSquareOff
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { markAsSeen } from "@/hooks/useNotifications";
import { useTranslation } from "react-i18next";

interface SystemAnnouncement {
  id: string;
  title: string;
  content: string;
  audience: "all" | "admins_only";
  comments_enabled: boolean;
  created_at: string;
  created_by: string | null;
}

const SuperAdminAnnouncements = () => {
  usePageSeo({ title: "Announcements | Super Admin | eKimina", description: "Create and manage platform-wide announcements." });
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<SystemAnnouncement[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({ 
    title: "", 
    content: "",
    audience: "all" as "all" | "admins_only",
    comments_enabled: true,
  });

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from("system_announcements")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAnnouncements((data || []) as SystemAnnouncement[]);
    } catch (error) {
      console.error("Error fetching system announcements:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    markAsSeen("sa_announcements");
    fetchAnnouncements();
  }, []);

  const handleCreateAnnouncement = async () => {
    if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("system_announcements")
        .insert({
          title: newAnnouncement.title.trim(),
          content: newAnnouncement.content.trim(),
          audience: newAnnouncement.audience,
          comments_enabled: newAnnouncement.comments_enabled,
          created_by: user?.id
        } as any);

      if (error) throw error;

      toast({ 
        title: t('superAdmin.announcements.announcementSent'), 
        description: newAnnouncement.audience === 'all' 
          ? t('superAdmin.announcements.sentToAll') 
          : t('superAdmin.announcements.sentToAdmins')
      });
      setNewAnnouncement({ title: "", content: "", audience: "all", comments_enabled: true });
      setDialogOpen(false);
      fetchAnnouncements();
    } catch (error: any) {
      toast({ title: t('common.error'), description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      const { error } = await supabase
        .from("system_announcements")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({ title: t('superAdmin.announcements.announcementDeleted') });
      fetchAnnouncements();
    } catch (error: any) {
      toast({ title: t('common.error'), description: error.message, variant: "destructive" });
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
      <div className="space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">{t('superAdmin.announcements.title')}</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {t('superAdmin.announcements.description')}
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                {t('superAdmin.announcements.newAnnouncement')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{t('superAdmin.announcements.createTitle')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Input
                    placeholder={t('superAdmin.announcements.titlePlaceholder')}
                    value={newAnnouncement.title}
                    onChange={(e) => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div>
                  <Textarea
                    placeholder={t('superAdmin.announcements.contentPlaceholder')}
                    rows={5}
                    value={newAnnouncement.content}
                    onChange={(e) => setNewAnnouncement(prev => ({ ...prev, content: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">{t('superAdmin.announcements.audience')}</label>
                  <Select 
                    value={newAnnouncement.audience} 
                    onValueChange={(value: "all" | "admins_only") => 
                      setNewAnnouncement(prev => ({ ...prev, audience: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          {t('superAdmin.announcements.allUsers')}
                        </div>
                      </SelectItem>
                      <SelectItem value="admins_only">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          {t('superAdmin.announcements.adminsOnly')}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="space-y-0.5">
                    <Label htmlFor="comments-toggle" className="text-sm font-medium">{t('superAdmin.announcements.allowComments')}</Label>
                    <p className="text-xs text-muted-foreground">{t('superAdmin.announcements.allowCommentsDesc')}</p>
                  </div>
                  <Switch
                    id="comments-toggle"
                    checked={newAnnouncement.comments_enabled}
                    onCheckedChange={(checked) => 
                      setNewAnnouncement(prev => ({ ...prev, comments_enabled: checked }))
                    }
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleCreateAnnouncement}
                  disabled={submitting || !newAnnouncement.title.trim() || !newAnnouncement.content.trim()}
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {t('superAdmin.announcements.sendAnnouncement')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {announcements.length === 0 ? (
            <EmptyState
              icon={Bell}
              title={t('superAdmin.announcements.noAnnouncements')}
              description={t('superAdmin.announcements.noAnnouncementsDesc')}
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
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Bell className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <CardTitle className="text-base sm:text-lg">{announcement.title}</CardTitle>
                              <Badge variant={announcement.audience === "all" ? "default" : "secondary"}>
                                {announcement.audience === "all" ? (
                                  <><Users className="w-3 h-3 mr-1" /> {t('superAdmin.announcements.allUsers')}</>
                                ) : (
                                  <><Shield className="w-3 h-3 mr-1" /> {t('superAdmin.announcements.adminsOnly')}</>
                                )}
                              </Badge>
                              {announcement.comments_enabled ? (
                                <Badge variant="muted" className="gap-1">
                                  <MessageSquare className="w-3 h-3" /> {t('superAdmin.announcements.commentsOn')}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="gap-1">
                                  <MessageSquareOff className="w-3 h-3" /> {t('superAdmin.announcements.commentsOff')}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(announcement.created_at), "MMM d, yyyy 'at' h:mm a")}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteAnnouncement(announcement.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
    </DashboardLayout>
  );
};

export default SuperAdminAnnouncements;