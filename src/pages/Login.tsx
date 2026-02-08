import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const Login = () => {
  const { t } = useTranslation();
  
  const loginSchema = z.object({
    email: z.string().trim().email({ message: t('auth.validation.emailRequired') }),
    password: z.string().min(6, { message: t('auth.validation.passwordMin') })
  });

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  
  const { signIn, user, loading, isSuperAdmin, isGroupAdmin, groupMembership, groupMembershipLoaded, rolesLoaded } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && groupMembershipLoaded && rolesLoaded) {
      if (isSuperAdmin) {
        navigate('/super-admin', { replace: true });
        return;
      }
      
      if (!groupMembership) {
        navigate('/onboarding', { replace: true });
      } else if (isGroupAdmin) {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/member', { replace: true });
      }
    }
  }, [user, loading, isSuperAdmin, isGroupAdmin, groupMembership, groupMembershipLoaded, rolesLoaded, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      result.error.errors.forEach(err => {
        if (err.path[0] === 'email') fieldErrors.email = err.message;
        if (err.path[0] === 'password') fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(email, password);
    setIsLoading(false);

    if (!error) {
      // Navigation handled by useEffect
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-subtle flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-48 sm:w-72 h-48 sm:h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-64 sm:w-96 h-64 sm:h-96 bg-secondary/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Back Link and Language Switcher */}
        <div className="flex items-center justify-between mb-6">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('nav.backToHome')}
          </Link>
          <LanguageSwitcher />
        </div>

        <Card variant="elevated" className="border-border">
          <CardHeader className="text-center space-y-2 px-4 sm:px-6">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 justify-center mb-4">
              <div className="w-10 h-10 rounded-lg gradient-hero flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xl">e</span>
              </div>
              <span className="text-2xl font-bold text-foreground">Kimina</span>
            </Link>
            <CardTitle className="text-xl sm:text-2xl">{t('auth.welcomeBack')}</CardTitle>
            <CardDescription>{t('auth.signInDescription')}</CardDescription>
          </CardHeader>

          <CardContent className="px-4 sm:px-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('auth.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12"
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{t('auth.password')}</Label>
                  <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                    {t('auth.forgotPassword')}
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t('auth.passwordPlaceholder')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 pr-12"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>

              <Button 
                type="submit" 
                variant="hero" 
                className="w-full h-12" 
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('auth.signingIn')}
                  </>
                ) : (
                  t('auth.signIn')
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {t('auth.noAccount')}{" "}
                <Link to="/register" className="text-primary font-semibold hover:underline">
                  {t('auth.createOne')}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Trust Indicator */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          {t('auth.securityNote')}
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
