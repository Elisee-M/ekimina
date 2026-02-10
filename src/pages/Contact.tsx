import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Mail, Phone, Send, Loader2, CheckCircle } from "lucide-react";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const Contact = () => {
  const { t } = useTranslation();

  const contactSchema = z.object({
    name: z.string().trim().min(2, { message: t('contact.validation.nameMin') }).max(100),
    email: z.string().trim().email({ message: t('contact.validation.emailRequired') }).max(255),
    subject: z.string().trim().min(3, { message: t('contact.validation.subjectMin') }).max(200),
    message: z.string().trim().min(10, { message: t('contact.validation.messageMin') }).max(2000)
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

    const result = contactSchema.safeParse(formData);
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
    
    const { error } = await supabase.from("contact_messages").insert({
      name: result.data.name,
      email: result.data.email,
      subject: result.data.subject,
      message: result.data.message,
    });

    setIsLoading(false);

    if (error) {
      toast({ variant: "destructive", title: t('common.error'), description: error.message });
      return;
    }

    setIsSuccess(true);
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto"
          >
            {/* Page Header */}
            <div className="text-center mb-12">
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                {t('contact.title')}
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {t('contact.description')}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Contact Info Cards */}
              <div className="space-y-4">
                <Card className="border-border">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Mail className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">{t('contact.emailUs')}</h3>
                        <a 
                          href="mailto:mugiranezaelisee0@gmail.com" 
                          className="text-sm text-primary hover:underline break-all"
                        >
                          mugiranezaelisee0@gmail.com
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                        <Phone className="w-5 h-5 text-secondary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">{t('contact.callUs')}</h3>
                        <a 
                          href="tel:+250798809812" 
                          className="text-sm text-muted-foreground hover:text-foreground"
                        >
                          +250 798 809 812
                        </a>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t('contact.mobileMoneyNote')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Contact Form */}
              <div className="md:col-span-2">
                <Card variant="elevated" className="border-border">
                  <CardHeader>
                    <CardTitle>{t('contact.formTitle')}</CardTitle>
                    <CardDescription>{t('contact.formDescription')}</CardDescription>
                  </CardHeader>

                  <CardContent>
                    {isSuccess ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-8"
                      >
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                          <CheckCircle className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">
                          {t('contact.successTitle')}
                        </h3>
                        <p className="text-muted-foreground mb-6">
                          {t('contact.successMessage')}
                        </p>
                        <Button 
                          variant="outline" 
                          onClick={() => setIsSuccess(false)}
                        >
                          {t('contact.sendAnother')}
                        </Button>
                      </motion.div>
                    ) : (
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">{t('contact.name')}</Label>
                            <Input
                              id="name"
                              name="name"
                              type="text"
                              placeholder={t('contact.namePlaceholder')}
                              value={formData.name}
                              onChange={handleChange}
                              required
                              className="h-11"
                              disabled={isLoading}
                            />
                            {errors.name && (
                              <p className="text-sm text-destructive">{errors.name}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="email">{t('contact.email')}</Label>
                            <Input
                              id="email"
                              name="email"
                              type="email"
                              placeholder={t('contact.emailPlaceholder')}
                              value={formData.email}
                              onChange={handleChange}
                              required
                              className="h-11"
                              disabled={isLoading}
                            />
                            {errors.email && (
                              <p className="text-sm text-destructive">{errors.email}</p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="subject">{t('contact.subject')}</Label>
                          <Input
                            id="subject"
                            name="subject"
                            type="text"
                            placeholder={t('contact.subjectPlaceholder')}
                            value={formData.subject}
                            onChange={handleChange}
                            required
                            className="h-11"
                            disabled={isLoading}
                          />
                          {errors.subject && (
                            <p className="text-sm text-destructive">{errors.subject}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="message">{t('contact.message')}</Label>
                          <Textarea
                            id="message"
                            name="message"
                            placeholder={t('contact.messagePlaceholder')}
                            value={formData.message}
                            onChange={handleChange}
                            required
                            className="min-h-[120px] resize-none"
                            disabled={isLoading}
                          />
                          {errors.message && (
                            <p className="text-sm text-destructive">{errors.message}</p>
                          )}
                        </div>

                        <Button 
                          type="submit" 
                          variant="hero" 
                          className="w-full h-11" 
                          size="lg"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              {t('contact.sending')}
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              {t('contact.send')}
                            </>
                          )}
                        </Button>
                      </form>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
      <ChatWidget />
    </div>
  );
};

export default Contact;
