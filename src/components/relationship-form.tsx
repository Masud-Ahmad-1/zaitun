'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import { useToast } from '@/hooks/use-toast';

interface RelationshipFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RELATIONSHIP_TYPES = [
  { value: 'father', labelEn: 'Father', labelBn: 'পিতা' },
  { value: 'mother', labelEn: 'Mother', labelBn: 'মাতা' },
  { value: 'spouse', labelEn: 'Spouse', labelBn: 'স্বামী/স্ত্রী' },
  { value: 'son', labelEn: 'Son', labelBn: 'পুত্র' },
  { value: 'daughter', labelEn: 'Daughter', labelBn: 'কন্যা' },
  { value: 'brother', labelEn: 'Brother', labelBn: 'ভাই' },
  { value: 'sister', labelEn: 'Sister', labelBn: 'বোন' },
];

export function RelationshipForm({ open, onOpenChange }: RelationshipFormProps) {
  const { locale, persons, addRelationship } = useAppStore();
  const { toast } = useToast();

  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [type, setType] = useState('');
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setFromId('');
    setToId('');
    setType('');
  };

  const handleSubmit = async () => {
    if (!fromId || !toId || !type) return;
    setSaving(true);
    try {
      await addRelationship(fromId, toId, type);
      toast({ title: t('relationshipAdded', locale) });
      resetForm();
      onOpenChange(false);
    } catch {
      toast({ title: t('error', locale), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const getPersonLabel = (p: typeof persons[0]) => {
    if (locale === 'bn' && p.nameBn) return p.nameBn;
    return p.name;
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('addRelationship', locale)}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>{t('fromPerson', locale)}</Label>
            <Select value={fromId} onValueChange={setFromId}>
              <SelectTrigger>
                <SelectValue placeholder={t('selectPerson', locale)} />
              </SelectTrigger>
              <SelectContent>
                {persons.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {getPersonLabel(p)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('toPerson', locale)}</Label>
            <Select value={toId} onValueChange={setToId}>
              <SelectTrigger>
                <SelectValue placeholder={t('selectPerson', locale)} />
              </SelectTrigger>
              <SelectContent>
                {persons.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {getPersonLabel(p)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('relationshipType', locale)}</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder={t('relationshipType', locale)} />
              </SelectTrigger>
              <SelectContent>
                {RELATIONSHIP_TYPES.map((rt) => (
                  <SelectItem key={rt.value} value={rt.value}>
                    {locale === 'bn' ? rt.labelBn : rt.labelEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { resetForm(); onOpenChange(false); }}>
            {t('cancel', locale)}
          </Button>
          <Button onClick={handleSubmit} disabled={saving || !fromId || !toId || !type}>
            {saving ? '...' : t('save', locale)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
