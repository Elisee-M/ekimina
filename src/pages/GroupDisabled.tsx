import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldX, LogOut, Mail } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";

const GroupDisabled = () => {
  const { signOut, groupMembership } = useAuth();
  const { t } = useTranslation();

  const handleSignOut = async () => { await signOut(); };

  return (
    <div className="min-h-screen gradient-subtle flex items-center justify-center p-4">
      <div className="absolute inset-0 opacity-30 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-48 sm:w-72 h-48 sm:h-72 bg-destructive/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-64 sm:w-96 h-64 sm:h-96 bg-muted/20 rounded-full blur-3xl" />
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md relative z-10">
        <Card variant="elevated" className="border-destructive/20">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <ShieldX className="w-10 h-10 text-destructive" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">{t('groupDisabled.title')}</h1>
              <p className="text-muted-foreground" dangerouslySetInnerHTML={{ __html: t('groupDisabled.description', { groupName: groupMembership?.group_name || "your group" }) }} />
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-left space-y-2">
              <p className="text-sm text-muted-foreground"><strong>{t('groupDisabled.whatMeans')}</strong></p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>{t('groupDisabled.noAccess')}</li>
                <li>{t('groupDisabled.paused')}</li>
                <li>{t('groupDisabled.dataSafe')}</li>
              </ul>
            </div>
            <div className="bg-primary/5 rounded-lg p-4 text-sm text-muted-foreground">
              <p className="flex items-center justify-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                {t('groupDisabled.contactAdmin')}
              </p>
            </div>
            <div className="flex flex-col gap-3 pt-2">
              <Button variant="outline" onClick={handleSignOut} className="gap-2">
                <LogOut className="w-4 h-4" />
                {t('common.signOut')}
              </Button>
              <Link to="/" className="text-sm text-primary hover:underline">{t('common.backToHome')}</Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default GroupDisabled;
