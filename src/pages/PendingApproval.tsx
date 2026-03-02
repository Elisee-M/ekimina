import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, LogOut, Mail, Phone } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";

const PendingApproval = () => {
  const { signOut, groupMembership } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen gradient-subtle flex items-center justify-center p-4">
      <div className="absolute inset-0 opacity-30 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-48 sm:w-72 h-48 sm:h-72 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-64 sm:w-96 h-64 sm:h-96 bg-primary/10 rounded-full blur-3xl" />
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md relative z-10">
        <Card variant="elevated" className="border-amber-500/20">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
              <Clock className="w-10 h-10 text-amber-600" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">{t('pendingApprovalPage.title')}</h1>
              <p className="text-muted-foreground" dangerouslySetInnerHTML={{ __html: t('pendingApprovalPage.description', { groupName: groupMembership?.group_name || "your group" }) }} />
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-left space-y-2">
              <p className="text-sm font-semibold text-foreground">{t('pendingApprovalPage.whatToDo')}</p>
              <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside">
                <li dangerouslySetInnerHTML={{ __html: t('pendingApprovalPage.step1') }} />
                <li>{t('pendingApprovalPage.step2')}</li>
                <li>{t('pendingApprovalPage.step3')}</li>
                <li>{t('pendingApprovalPage.step4')}</li>
              </ol>
            </div>
            <div className="bg-primary/5 rounded-lg p-4 space-y-3">
              <p className="text-sm font-semibold text-foreground">{t('pendingApprovalPage.paymentDetails')}</p>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Phone className="w-4 h-4 text-primary" />
                <span className="font-medium">+250 798 809 812</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4 text-primary" />
                <span>mugiranezaelisee0@gmail.com</span>
              </div>
            </div>
            <div className="flex flex-col gap-3 pt-2">
              <Button variant="outline" onClick={() => signOut()} className="gap-2">
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

export default PendingApproval;
