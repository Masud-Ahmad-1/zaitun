'use client';

import { TreePine, Users, Shield, Globe, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LanguageToggle } from './language-toggle';
import { useAppStore } from '@/lib/store';
import { t } from '@/lib/i18n';

export function Landing() {
  const { locale, setView } = useAppStore();

  const features = [
    {
      icon: TreePine,
      title: t('featureFamilyTree', locale),
      desc: t('featureFamilyTreeDesc', locale),
    },
    {
      icon: Shield,
      title: t('featurePrivacy', locale),
      desc: t('featurePrivacyDesc', locale),
    },
    {
      icon: Globe,
      title: t('featureBilingual', locale),
      desc: t('featureBilingualDesc', locale),
    },
    {
      icon: Users,
      title: t('featureShare', locale),
      desc: t('featureShareDesc', locale),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Nav */}
      <nav className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <TreePine className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl tracking-tight">{t('appName', locale)}</span>
          </div>
          <LanguageToggle />
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1">
        <section className="container mx-auto px-4 py-16 md:py-24 lg:py-32">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <TreePine className="h-9 w-9 text-primary" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl mb-4">
              <span className="text-primary">{t('appName', locale)}</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-xl">
              {t('tagline', locale)}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                className="gap-2 text-base px-8"
                onClick={() => setView('register')}
              >
                {t('getStarted', locale)}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="text-base px-8"
                onClick={() => setView('login')}
              >
                {t('signIn', locale)}
              </Button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="container mx-auto px-4 pb-16 md:pb-24">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {features.map((feature, idx) => (
              <Card
                key={idx}
                className="group hover:shadow-md transition-shadow border-border/50"
              >
                <CardContent className="p-6 text-center">
                  <div className="mb-3 mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1.5">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          {t('footer', locale)}
        </div>
      </footer>
    </div>
  );
}
