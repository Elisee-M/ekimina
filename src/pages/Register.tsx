import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, ArrowLeft, Check, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import ekiminaLogo from "@/assets/ekimina-logo.png";

const Register = () => {
  const { t } = useTranslation();

  const registerSchema = z.object({
    fullName: z.string().trim().min(2, { message: t('auth.validation.nameMin') }).max(100),
    email: z.string().trim().email({ message: t('auth.validation.emailRequired') }).max(255),
    phone: z.string().optional(),
    password: z.string().min(6, { message: t('auth.validation.passwordMin') }),
    confirmPassword: z.string()
  }).refine((data) => data.password === data.confirmPassword, {
    message: t('auth.validation.passwordsMatch'),
    path: ["confirmPassword"],
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });

  const { signUp, loading } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    if (errors[e.target.name]) {
      setErrors(prev => ({ ...prev, [e.target.name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = registerSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        const field = err.path[0] as string;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    const { error, didSignIn } = await signUp(
      formData.email,
      formData.password,
      formData.fullName,
      formData.phone || undefined
    );
    setIsLoading(false);

    if (!error) {
      navigate(didSignIn ? '/onboarding' : '/login', { replace: true });
    }
  };

  const benefits = [
    t('auth.benefits.free'),
    t('auth.benefits.noCard'),
    t('auth.benefits.quickSetup')
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-subtle flex items-center justify-center p-4 py-8 sm:py-12">
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
              <img src={ekiminaLogo} alt="eKimina" className="h-14 w-auto" />
            </Link>
            <CardTitle className="text-xl sm:text-2xl">{t('auth.createAccount')}</CardTitle>
            <CardDescription>{t('auth.createAccountDescription')}</CardDescription>
          </CardHeader>

          <CardContent className="px-4 sm:px-6">
            {/* Benefits */}
            <div className="bg-primary/5 rounded-lg p-3 sm:p-4 mb-6 space-y-2">
              {benefits.map((benefit, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-foreground">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  {benefit}
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">{t('auth.fullName')}</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder={t('auth.fullNamePlaceholder')}
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="h-12"
                  disabled={isLoading}
                />
                {errors.fullName && (
                  <p className="text-sm text-destructive">{errors.fullName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={t('auth.emailPlaceholder')}
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="h-12"
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t('auth.phone')}</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder={t('auth.phonePlaceholder')}
                  value={formData.phone}
                  onChange={handleChange}
                  className="h-12"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t('auth.createPassword')}
                    value={formData.password}
                    onChange={handleChange}
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder={t('auth.confirmPasswordPlaceholder')}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="h-12"
                  disabled={isLoading}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword}</p>
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
                    {t('auth.creatingAccount')}
                  </>
                ) : (
                  t('auth.createAccountBtn')
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                {t('auth.termsAgree')}{" "}
                <Link to="/terms" className="text-primary hover:underline">{t('auth.terms')}</Link> {t('auth.and')}{" "}
                <Link to="/privacy" className="text-primary hover:underline">{t('auth.privacyPolicy')}</Link>
              </p>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {t('auth.haveAccount')}{" "}
                <Link to="/login" className="text-primary font-semibold hover:underline">
                  {t('auth.signInLink')}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Register;
