'use client';

import { TreePine, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageToggle } from './language-toggle';
import { useAppStore } from '@/lib/store';
import { t } from '@/lib/i18n';

interface AppHeaderProps {
  showBack?: boolean;
  onBack?: () => void;
  title?: string;
  rightAction?: React.ReactNode;
}

export function AppHeader({ showBack, onBack, title, rightAction }: AppHeaderProps) {
  const { user, logout, locale, view, setView } = useAppStore();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          {showBack && (
            <Button variant="ghost" size="icon" onClick={onBack || (() => setView('dashboard'))}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </Button>
          )}
          <TreePine className="h-5 w-5 text-primary" />
          <span className="font-bold text-lg">{t('appName', locale)}</span>
          {title && (
            <span className="text-muted-foreground text-sm hidden sm:inline">— {title}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {rightAction}
          <LanguageToggle />
          {user && (
            <div className="flex items-center gap-2 ml-2">
              <span className="text-sm text-muted-foreground hidden sm:inline">{user.name}</span>
              <Button variant="ghost" size="icon" onClick={handleLogout} title={t('signOut', locale)}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
