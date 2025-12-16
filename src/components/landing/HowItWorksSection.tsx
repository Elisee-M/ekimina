import { motion } from "framer-motion";
import { Users, Wallet, BarChart3, Repeat } from "lucide-react";

const steps = [
  {
    icon: Users,
    step: "01",
    title: "Create Your Group",
    description: "Set up your Ikimina in minutes. Add members and define contribution rules."
  },
  {
    icon: Wallet,
    step: "02",
    title: "Collect Contributions",
    description: "Members contribute regularly. Track payments and send automatic reminders."
  },
  {
    icon: Repeat,
    step: "03",
    title: "Manage Loans",
    description: "Lend to members with interest. Track repayments and calculate profits automatically."
  },
  {
    icon: BarChart3,
    step: "04",
    title: "Grow Together",
    description: "Watch your group wealth grow. Access reports and celebrate success together."
  }
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 gradient-subtle">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            How <span className="text-primary">eKimina</span> Works
          </h2>
          <p className="text-lg text-muted-foreground">
            Get your Ikimina group running in just four simple steps
          </p>
        </motion.div>

        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2" />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="relative"
              >
                <div className="bg-card rounded-2xl p-8 shadow-elegant border border-border text-center relative z-10">
                  {/* Step Number */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full gradient-hero flex items-center justify-center">
                    <span className="text-xs font-bold text-primary-foreground">{step.step}</span>
                  </div>

                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6 mt-2">
                    <step.icon className="w-8 h-8 text-primary" />
                  </div>

                  <h3 className="text-xl font-semibold text-foreground mb-3">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
