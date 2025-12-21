import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, TrendingUp, Shield, Wallet, PieChart, 
  CheckCircle, ArrowRight, Play, Pause, RotateCcw,
  UserPlus, CreditCard, BarChart3, Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface DemoStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

export function DemoWalkthrough() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);

  const steps: DemoStep[] = [
    {
      id: 1,
      title: "Create Your Group",
      description: "Set up your Ikimina group in seconds with custom rules",
      icon: <Users className="w-6 h-6" />,
      content: (
        <div className="space-y-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-6 shadow-lg"
          >
            <h4 className="font-semibold text-foreground mb-4">New Group Setup</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="h-3 bg-muted rounded w-32 mb-1" />
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="h-2 bg-primary/30 rounded w-full"
                  >
                    <span className="text-xs text-muted-foreground">Umuganda Savings</span>
                  </motion.div>
                </div>
              </div>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="grid grid-cols-2 gap-3 text-sm"
              >
                <div className="bg-muted/50 rounded-lg p-3">
                  <span className="text-muted-foreground">Contribution</span>
                  <p className="font-semibold text-foreground">50,000 RWF/month</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <span className="text-muted-foreground">Interest Rate</span>
                  <p className="font-semibold text-foreground">5%</p>
                </div>
              </motion.div>
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.8, type: "spring" }}
                className="flex items-center gap-2 text-primary"
              >
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Group Created Successfully!</span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      ),
    },
    {
      id: 2,
      title: "Invite Members",
      description: "Add members to your group and assign roles",
      icon: <UserPlus className="w-6 h-6" />,
      content: (
        <div className="space-y-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-6 shadow-lg"
          >
            <h4 className="font-semibold text-foreground mb-4">Group Members</h4>
            <div className="space-y-2">
              {["Jean Baptiste", "Marie Claire", "Patrick K.", "Diane N."].map((name, i) => (
                <motion.div
                  key={name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.2 }}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
                      {name.charAt(0)}
                    </div>
                    <span className="text-foreground">{name}</span>
                  </div>
                  <motion.span 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.2 + 0.3 }}
                    className={`text-xs px-2 py-1 rounded-full ${i === 0 ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}
                  >
                    {i === 0 ? 'Admin' : 'Member'}
                  </motion.span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      ),
    },
    {
      id: 3,
      title: "Track Contributions",
      description: "Monitor payments and manage member contributions",
      icon: <CreditCard className="w-6 h-6" />,
      content: (
        <div className="space-y-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-6 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-foreground">Monthly Contributions</h4>
              <span className="text-sm text-muted-foreground">December 2024</span>
            </div>
            <div className="space-y-3">
              {[
                { name: "Jean Baptiste", status: "paid", amount: "50,000" },
                { name: "Marie Claire", status: "paid", amount: "50,000" },
                { name: "Patrick K.", status: "pending", amount: "50,000" },
                { name: "Diane N.", status: "paid", amount: "50,000" },
              ].map((item, i) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.15 }}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <span className="text-foreground">{item.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">{item.amount} RWF</span>
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.15 + 0.2, type: "spring" }}
                      className={`text-xs px-2 py-1 rounded-full ${
                        item.status === 'paid' 
                          ? 'bg-green-500/20 text-green-600' 
                          : 'bg-yellow-500/20 text-yellow-600'
                      }`}
                    >
                      {item.status}
                    </motion.span>
                  </div>
                </motion.div>
              ))}
            </div>
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mt-4 p-3 bg-primary/10 rounded-lg flex items-center justify-between"
            >
              <span className="text-sm font-medium text-foreground">Total Collected</span>
              <span className="font-bold text-primary">150,000 RWF</span>
            </motion.div>
          </motion.div>
        </div>
      ),
    },
    {
      id: 4,
      title: "Manage Loans",
      description: "Approve loan requests and track repayments",
      icon: <Wallet className="w-6 h-6" />,
      content: (
        <div className="space-y-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-6 shadow-lg"
          >
            <h4 className="font-semibold text-foreground mb-4">Loan Request</h4>
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                    P
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Patrick K.</p>
                    <p className="text-sm text-muted-foreground">Requested 200,000 RWF</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="text-center p-2 bg-background rounded">
                  <p className="text-muted-foreground">Duration</p>
                  <p className="font-semibold text-foreground">6 months</p>
                </div>
                <div className="text-center p-2 bg-background rounded">
                  <p className="text-muted-foreground">Interest</p>
                  <p className="font-semibold text-foreground">5%</p>
                </div>
                <div className="text-center p-2 bg-background rounded">
                  <p className="text-muted-foreground">Total</p>
                  <p className="font-semibold text-foreground">210,000 RWF</p>
                </div>
              </div>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex gap-2"
              >
                <motion.div 
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.7, type: "spring" }}
                  className="flex-1 bg-green-500 text-white text-center py-2 rounded-lg font-medium"
                >
                  ✓ Approved
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      ),
    },
    {
      id: 5,
      title: "View Reports",
      description: "Analyze group performance with detailed insights",
      icon: <BarChart3 className="w-6 h-6" />,
      content: (
        <div className="space-y-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-6 shadow-lg"
          >
            <h4 className="font-semibold text-foreground mb-4">Financial Overview</h4>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: "Total Savings", value: "1,200,000", color: "text-primary" },
                { label: "Active Loans", value: "400,000", color: "text-yellow-600" },
                { label: "Total Profit", value: "60,000", color: "text-green-600" },
                { label: "Members", value: "12", color: "text-blue-600" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-muted/50 rounded-lg p-3 text-center"
                >
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className={`font-bold ${stat.color}`}>{stat.value} {stat.label !== "Members" && "RWF"}</p>
                </motion.div>
              ))}
            </div>
            <motion.div 
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="origin-left"
            >
              <p className="text-sm text-muted-foreground mb-2">Collection Rate</p>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "92%" }}
                  transition={{ delay: 0.7, duration: 0.8 }}
                  className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full"
                />
              </div>
              <p className="text-right text-sm font-medium text-primary mt-1">92%</p>
            </motion.div>
          </motion.div>
        </div>
      ),
    },
  ];

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying) return;

    const stepDuration = 4000; // 4 seconds per step
    const progressInterval = 50; // Update progress every 50ms
    const progressIncrement = (progressInterval / stepDuration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setCurrentStep((prevStep) => (prevStep + 1) % steps.length);
          return 0;
        }
        return prev + progressIncrement;
      });
    }, progressInterval);

    return () => clearInterval(timer);
  }, [isPlaying, steps.length]);

  const handleStepClick = (index: number) => {
    setCurrentStep(index);
    setProgress(0);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const restart = () => {
    setCurrentStep(0);
    setProgress(0);
    setIsPlaying(true);
  };

  return (
    <div className="space-y-6">
      {/* Main Demo Area */}
      <div className="aspect-video bg-gradient-to-br from-muted/50 to-muted rounded-xl overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.1),transparent_50%)]" />
        
        <div className="relative h-full p-6 flex flex-col">
          {/* Step Header */}
          <motion.div 
            key={currentStep}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-4"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
              {steps[currentStep].icon}
            </div>
            <div>
              <h3 className="font-bold text-lg text-foreground">{steps[currentStep].title}</h3>
              <p className="text-sm text-muted-foreground">{steps[currentStep].description}</p>
            </div>
          </motion.div>

          {/* Step Content */}
          <div className="flex-1 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-md"
              >
                {steps[currentStep].content}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <Progress value={progress} className="h-1" />
      </div>

      {/* Controls and Step Indicators */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={togglePlayPause}
            className="w-10 h-10"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={restart}
            className="w-10 h-10"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        {/* Step Dots */}
        <div className="flex items-center gap-2">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => handleStepClick(index)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                index === currentStep
                  ? 'bg-primary w-8'
                  : index < currentStep
                  ? 'bg-primary/60'
                  : 'bg-muted-foreground/30'
              }`}
              aria-label={`Go to step ${index + 1}: ${step.title}`}
            />
          ))}
        </div>

        {/* Step Counter */}
        <span className="text-sm text-muted-foreground">
          {currentStep + 1} / {steps.length}
        </span>
      </div>

      {/* Step Navigation */}
      <div className="grid grid-cols-5 gap-2">
        {steps.map((step, index) => (
          <button
            key={step.id}
            onClick={() => handleStepClick(index)}
            className={`p-3 rounded-lg text-center transition-all duration-200 ${
              index === currentStep
                ? 'bg-primary/20 border-2 border-primary'
                : 'bg-muted/50 hover:bg-muted border-2 border-transparent'
            }`}
          >
            <div className={`w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center ${
              index === currentStep ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`}>
              {step.icon}
            </div>
            <p className={`text-xs font-medium truncate ${
              index === currentStep ? 'text-primary' : 'text-muted-foreground'
            }`}>
              {step.title}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
