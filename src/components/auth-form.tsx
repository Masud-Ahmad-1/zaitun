'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LanguageToggle } from './language-toggle';
import { useAppStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import { TreePine } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function AuthForm() {
  const { view, setView, locale, login, register } = useAppStore();
  const { toast } = useToast();
  const isLogin = view === 'login';

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        if (!email || !password) {
          setError(t('emailRequired', locale));
          setLoading(false);
          return;
        }
        await login(email, password);
        setView('dashboard');
      } else {
        if (!email || !name || !password) {
          setError(t('nameRequired', locale));
          setLoading(false);
          return;
        }
        await register(email, name, password, locale);
        toast({
          title: t('registrationSuccess', locale),
          variant: 'default',
        });
        setView('login');
      }
    } catch (err) {
      setError(isLogin ? t('invalidCredentials', locale) : t('error', locale));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <nav className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <TreePine className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl tracking-tight">{t('appName', locale)}</span>
          </div>
          <LanguageToggle />
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl">
              {isLogin ? t('welcomeBack', locale) : t('createAccount', locale)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name">{t('name', locale)}</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('name', locale)}
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">{t('email', locale)}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('password', locale)}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? '...' : isLogin ? t('signIn', locale) : t('register', locale)}
              </Button>

              <div className="text-center text-sm text-muted-foreground pt-2">
                {isLogin ? (
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => { setView('register'); setError(''); }}
                  >
                    {t('noAccount', locale)}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => { setView('login'); setError(''); }}
                  >
                    {t('hasAccount', locale)}
                  </button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </main>

      <footer className="border-t py-6 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          {t('footer', locale)}
        </div>
      </footer>
    </div>
  );
}
