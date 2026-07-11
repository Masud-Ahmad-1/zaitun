'use client';

import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { t } from '@/lib/i18n';

export function LanguageToggle() {
  const { locale, setLocale } = useAppStore();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setLocale(locale === 'en' ? 'bn' : 'en')}
      className="gap-1.5 font-medium"
    >
      <Globe className="h-4 w-4" />
      {locale === 'en' ? 'বাং' : 'EN'}
    </Button>
  );
}
