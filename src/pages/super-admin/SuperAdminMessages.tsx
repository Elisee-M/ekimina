import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Mail, MailOpen, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePageSeo } from "@/hooks/usePageSeo";
import { EmptyState } from "@/components/EmptyState";
import { useTranslation } from "react-i18next";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function SuperAdminMessages() {
  const { t } = useTranslation();
  
  usePageSeo({
    title: "Contact Messages | eKimina",
    description: "View messages from the contact form.",
    canonicalPath: "/super-admin/messages",
  });

  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [selected, setSelected] = useState<ContactMessage | null>(null);

  const fetchMessages = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });
    setMessages((data as ContactMessage[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const markAsRead = async (msg: ContactMessage) => {
    if (!msg.is_read) {
      await supabase.from("contact_messages").update({ is_read: true }).eq("id", msg.id);
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, is_read: true } : m)));
    }
    setSelected({ ...msg, is_read: true });
  };

  const unreadCount = messages.filter((m) => !m.is_read).length;

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
        <header>
          <h1 className="text-2xl font-bold text-foreground">{t('superAdmin.messages.title')}</h1>
          <p className="text-muted-foreground">
            {t('superAdmin.messages.description')}{" "}
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">{unreadCount} {t('superAdmin.messages.unread')}</Badge>
            )}
          </p>
        </header>

        <Card>
          <CardContent className="p-0">
            {messages.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon={Mail}
                  title={t('superAdmin.messages.noMessages')}
                  description={t('superAdmin.messages.noMessagesDesc')}
                />
              </div>
            ) : (
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8"></TableHead>
                      <TableHead>{t('superAdmin.messages.name')}</TableHead>
                      <TableHead>{t('superAdmin.messages.email')}</TableHead>
                      <TableHead>{t('superAdmin.messages.subject')}</TableHead>
                      <TableHead>{t('superAdmin.messages.date')}</TableHead>
                      <TableHead className="text-right">{t('superAdmin.messages.action')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {messages.map((msg) => (
                      <TableRow key={msg.id} className={!msg.is_read ? "bg-primary/5" : ""}>
                        <TableCell>
                          {msg.is_read ? (
                            <MailOpen className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <Mail className="w-4 h-4 text-primary" />
                          )}
                        </TableCell>
                        <TableCell className={`font-medium ${!msg.is_read ? "text-foreground" : "text-muted-foreground"}`}>
                          {msg.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">{msg.email}</TableCell>
                        <TableCell className={!msg.is_read ? "font-medium" : ""}>{msg.subject}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(msg.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" onClick={() => markAsRead(msg)}>
                            <Eye className="w-4 h-4 mr-1" /> {t('superAdmin.messages.view')}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{selected?.subject}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="flex gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">{t('superAdmin.messages.from')}</span>{" "}
                  <span className="font-medium">{selected?.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('superAdmin.messages.email')}:</span>{" "}
                  <a href={`mailto:${selected?.email}`} className="text-primary hover:underline">
                    {selected?.email}
                  </a>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {selected && new Date(selected.created_at).toLocaleString()}
              </div>
              <div className="bg-muted rounded-lg p-4 text-sm whitespace-pre-wrap">{selected?.message}</div>
              <Button variant="outline" asChild>
                <a href={`mailto:${selected?.email}?subject=Re: ${selected?.subject}`}>{t('superAdmin.messages.replyViaEmail')}</a>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </DashboardLayout>
  );
}