import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, LogOut, Mail, Phone } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const PendingApproval = () => {
  const { signOut, groupMembership } = useAuth();

  return (
    <div className="min-h-screen gradient-subtle flex items-center justify-center p-4">
      <div className="absolute inset-0 opacity-30 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-48 sm:w-72 h-48 sm:h-72 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-64 sm:w-96 h-64 sm:h-96 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <Card variant="elevated" className="border-amber-500/20">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
              <Clock className="w-10 h-10 text-amber-600" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">Payment Pending</h1>
              <p className="text-muted-foreground">
                Your Growth plan for <strong className="text-foreground">{groupMembership?.group_name || "your group"}</strong> is awaiting payment confirmation.
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 text-left space-y-2">
              <p className="text-sm font-semibold text-foreground">What to do next:</p>
              <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside">
                <li>Send <strong>RWF 25,000</strong> via Mobile Money</li>
                <li>Use the number below for payment</li>
                <li>Include your group name as reference</li>
                <li>Our team will confirm and activate your account</li>
              </ol>
            </div>

            <div className="bg-primary/5 rounded-lg p-4 space-y-3">
              <p className="text-sm font-semibold text-foreground">Payment Details</p>
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
                Sign Out
              </Button>
              <Link to="/" className="text-sm text-primary hover:underline">
                Back to Home
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default PendingApproval;
