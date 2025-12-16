import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Wallet, 
  Users, 
  TrendingUp, 
  Shield, 
  FileText, 
  Bell,
  BarChart3,
  Lock
} from "lucide-react";

const features = [
  {
    icon: Wallet,
    title: "Contribution Tracking",
    description: "Track monthly or weekly contributions with automatic reminders and late payment indicators.",
    color: "primary"
  },
  {
    icon: TrendingUp,
    title: "Smart Loans",
    description: "Manage loans with configurable interest rates, automatic profit calculation, and repayment schedules.",
    color: "secondary"
  },
  {
    icon: Users,
    title: "Member Management",
    description: "Easy member onboarding, role assignment, and individual contribution history tracking.",
    color: "accent"
  },
  {
    icon: Shield,
    title: "Group Isolation",
    description: "Complete data privacy between Ikimina groups. Each group only sees their own data.",
    color: "primary"
  },
  {
    icon: BarChart3,
    title: "Reports & Analytics",
    description: "Real-time dashboards showing total savings, active loans, profit earned, and member performance.",
    color: "secondary"
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    description: "Automatic reminders for contribution due dates, loan repayments, and important updates.",
    color: "accent"
  },
  {
    icon: FileText,
    title: "Export Reports",
    description: "Download detailed reports in PDF or CSV format for record-keeping and audits.",
    color: "primary"
  },
  {
    icon: Lock,
    title: "Secure Authentication",
    description: "Bank-level security with role-based access control for Admins, Leaders, and Members.",
    color: "secondary"
  }
];

const colorClasses = {
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary/10 text-secondary",
  accent: "bg-accent/10 text-accent"
};

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Everything Your <span className="text-primary">Ikimina</span> Needs
          </h2>
          <p className="text-lg text-muted-foreground">
            Powerful features designed specifically for Rwandan savings groups. 
            Simple to use, secure by design.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card variant="feature" className="h-full group">
                <CardContent className="p-6 space-y-4">
                  <div className={`w-12 h-12 rounded-xl ${colorClasses[feature.color as keyof typeof colorClasses]} flex items-center justify-center transition-transform group-hover:scale-110`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
